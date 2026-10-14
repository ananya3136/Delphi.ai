"""Offline LinkedIn image publication contract; never publishes live content."""
import json

import httpx
import pytest

from app.services.social import SocialAccounts, SocialError


IMAGE = "urn:li:image:C4E10AQfixture"
CONNECTION = {"platform": "linkedin", "provider_account_id": "urn:li:person:fixture"}
RAW = b"\x89PNG\r\n\x1a\nfixture"
TEXT = "Exact approved text.\n\nA second paragraph #launch"


def adapter(handler):
    return SocialAccounts(None, client=httpx.Client(transport=httpx.MockTransport(handler)))


def test_static_upload_readiness_and_image_post(monkeypatch):
    monkeypatch.setenv("LINKEDIN_API_VERSION", "202609")
    calls = []

    def handler(request):
        calls.append(request)
        assert request.headers["authorization"] == "Bearer fixture-token"
        if request.method != "PUT":
            assert request.headers["linkedin-version"] == "202609"
            assert request.headers["x-restli-protocol-version"] == "2.0.0"
        if request.method == "POST" and request.url.path == "/rest/images":
            assert request.url.params["action"] == "initializeUpload"
            assert json.loads(request.content) == {"initializeUploadRequest": {"owner": CONNECTION["provider_account_id"]}}
            return httpx.Response(200, json={"value": {"image": IMAGE, "uploadUrl": "https://www.linkedin.com/dms-uploads/fixture"}})
        if request.method == "PUT":
            assert request.content == RAW
            assert request.headers["content-type"] == "image/png"
            return httpx.Response(201)
        if request.method == "GET":
            assert str(request.url).endswith("urn%3Ali%3Aimage%3AC4E10AQfixture")
            return httpx.Response(200, json={"id": IMAGE, "status": "AVAILABLE"})
        assert request.url.path == "/rest/posts"
        payload = json.loads(request.content)
        assert payload["commentary"] == TEXT
        assert payload["author"] == CONNECTION["provider_account_id"]
        assert payload["content"] == {"media": {"id": IMAGE, "altText": "Approved bottle static"}}
        assert payload["lifecycleState"] == "PUBLISHED"
        return httpx.Response(201, headers={"x-restli-id": "urn:li:share:123"})

    accounts = adapter(handler)
    image_id = accounts.upload_image(CONNECTION, "fixture-token", RAW, "image/png")
    assert accounts.post(CONNECTION, "fixture-token", TEXT, image_id=image_id, alt_text="Approved bottle static") == "urn:li:share:123"
    assert [request.method for request in calls] == ["POST", "PUT", "GET", "POST"]


@pytest.mark.parametrize("status,retry", [("PROCESSING", 10), ("WAITING_UPLOAD", 10), ("PROCESSING_FAILED", 0), (None, 0)])
def test_unready_image_never_posts_text_fallback(status, retry):
    calls = []

    def handler(request):
        calls.append(request.method)
        return httpx.Response(200, json={"id": IMAGE, "status": status})

    with pytest.raises(SocialError) as error:
        adapter(handler).post(CONNECTION, "fixture-token", TEXT, image_id=IMAGE)
    assert error.value.retry_after == retry
    assert not error.value.uncertain
    assert calls == ["GET"]


def test_member_write_only_permission_uses_documented_legacy_status_read():
    calls = []

    def handler(request):
        calls.append(request)
        if request.method == "GET":
            if "linkedin-version" in request.headers:
                return httpx.Response(403)
            assert request.headers["authorization"] == "Bearer fixture-token"
            assert request.headers["x-restli-protocol-version"] == "2.0.0"
            return httpx.Response(200, json={"id": IMAGE, "status": "AVAILABLE"})
        assert json.loads(request.content)["content"]["media"]["id"] == IMAGE
        return httpx.Response(201, headers={"x-restli-id": "urn:li:share:123"})

    assert adapter(handler).post(CONNECTION, "fixture-token", TEXT, image_id=IMAGE) == "urn:li:share:123"
    assert [request.method for request in calls] == ["GET", "GET", "POST"]


@pytest.mark.parametrize("stage", ["initialize", "upload", "readiness"])
def test_provider_failure_never_falls_back_to_text(stage):
    calls = []

    def handler(request):
        calls.append(request)
        if request.method == "POST":
            assert request.url.path == "/rest/images"
            if stage == "initialize":
                return httpx.Response(400)
            return httpx.Response(200, json={"value": {"image": IMAGE, "uploadUrl": "https://www.linkedin.com/dms-uploads/fixture"}})
        if request.method == "PUT":
            return httpx.Response(400 if stage == "upload" else 201)
        return httpx.Response(401)

    accounts = adapter(handler)
    with pytest.raises(SocialError):
        image_id = accounts.upload_image(CONNECTION, "fixture-token", RAW, "image/png")
        accounts.post(CONNECTION, "fixture-token", TEXT, image_id=image_id)
    assert all(request.url.path != "/rest/posts" for request in calls)


@pytest.mark.parametrize("image_id", ["", "urn:li:image:", "urn:li:share:123", "urn:li:image:bad/path"])
def test_invalid_requested_image_is_not_silently_dropped(image_id):
    def handler(request):
        pytest.fail("Invalid image must be rejected before contacting LinkedIn")

    with pytest.raises(SocialError, match="identity is invalid"):
        adapter(handler).post(CONNECTION, "fixture-token", TEXT, image_id=image_id)


def test_mismatched_readiness_image_stops_publication():
    def handler(request):
        assert request.method == "GET"
        return httpx.Response(200, json={"id": "urn:li:image:other", "status": "AVAILABLE"})

    with pytest.raises(SocialError, match="different image"):
        adapter(handler).post(CONNECTION, "fixture-token", TEXT, image_id=IMAGE)
