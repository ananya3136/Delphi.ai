from copy import deepcopy

from test_workflow import client, generated, post
from app.services.evaluation_snapshot import content_snapshot, evaluate_snapshot, evaluation_current
from app.services.generation import DeterministicRouter
from app.models.database import Record
from app.services.publishing import publication_parts, approved


def test_approve_uses_saved_snapshot_without_second_model_call(client, monkeypatch):
    c, a = generated(client)
    def unexpected(*args, **kwargs):
        raise AssertionError("Approval must not call the stochastic evaluator")
    monkeypatch.setattr(DeterministicRouter, "evaluate", unexpected)
    result = post(client, f"/assets/{a['id']}/approve", {"version": 1})
    assert result["evaluation_current"] is True
    assert result["status"] == "approved"


def test_guardrail_refresh_failure_history_and_stale_guards(client):
    c, a = generated(client)
    prefix = f"/assets/{a['id']}"
    approved = post(client, prefix + "/approve", {"version": 1})
    original = deepcopy(approved["versions"])
    assert client.patch(f"/brands/{c['brand_id']}", json={"forbidden_phrases": [original[-1]["hook"]]}).status_code == 200
    refreshed = client.get(f"/campaigns/{c['id']}").json()["assets"][0]
    assert refreshed["evaluation_current"] is False
    rejection = client.post(prefix + "/approve", json={"version": 1})
    assert rejection.status_code == 409
    assert "outdated" in rejection.json()["detail"]
    failed = post(client, prefix + "/evaluate", {"version": 1})
    assert failed["status"] == "failed" and failed["evaluation_current"] is True
    assert failed["versions"][:-1] == original
    assert failed["approvals"] == approved["approvals"]
    assert "forbidden" in client.post(prefix + "/approve", json={"version": 2}).json()["detail"]
    assert client.post(prefix + "/evaluate", json={"version": 1}).status_code == 409
    assert client.patch(prefix, json={"version": 1, "hook": "New", "body": "New", "cta": "Read"}).status_code == 409
    assert client.post(prefix + "/regenerate", json={"version": 1}).status_code == 409
    assert len(client.get(f"/campaigns/{c['id']}").json()["assets"][0]["versions"]) == 2


def test_media_retained_on_edit_regeneration_and_reevaluation_legacy(client):
    c, a = generated(client)
    db = client.app.state.repository.open("demo")
    record = db.get(Record, a["id"])
    data = deepcopy(record.data)
    media = {"id": "image-test", "kind": "image", "mime_type": "image/png", "key": "private-image"}
    data["versions"][-1]["media"] = media
    data["versions"][-1]["media_items"] = [media]
    data["versions"][-1]["evaluation"].pop("snapshot", None)
    record.data = data
    db.commit()
    db.session.close()
    prefix = f"/assets/{a['id']}"
    assert client.post(prefix + "/approve", json={"version": 1, "media_reviewed": True}).status_code == 409
    fresh = post(client, prefix + "/evaluate", {"version": 1})
    assert fresh["versions"][0] == data["versions"][0]
    assert fresh["versions"][-1]["media_items"] == [media]
    latest = fresh["versions"][-1]
    edited = client.patch(prefix, json={"version": 2, **{k: latest[k] for k in ("hook", "body", "cta")}}).json()
    regenerated = post(client, prefix + "/regenerate", {"version": 3, "section": "cta"})
    for result in (edited, regenerated):
        assert result["evaluation_current"] is True
        assert result["versions"][-1]["media_items"] == [media]
        assert result["versions"][-1]["media"] == media
    assert client.post(prefix + "/approve", json={"version": 4}).status_code == 409
    final = post(client, prefix + "/approve", {"version": 4, "media_reviewed": True})
    assert approved(final, 4)
    parts, attached = publication_parts(final)
    assert parts and attached == [media]


def test_attached_narration_is_evaluated_and_snapshot_binds_media():
    brand = {"name": "Brand", "description": "Product", "voice": "Clear", "approved_claims": [], "forbidden_phrases": [], "sources": [{"id": "s", "text": "Product exists", "source_type": "product_document"}]}
    content = {"hook": "Hello", "body": "Product exists", "cta": "Read", "caption": "", "source_refs": ["s"], "media_items": [{"kind": "voiceover", "script": "Guaranteed 10x revenue", "narration_history": []}]}
    asset = {"platform": "linkedin", "asset_type": "post", "current_version": 1}
    evaluation = evaluate_snapshot(DeterministicRouter(), content, brand, asset, {}, 1)
    assert evaluation["passed"] is False
    assert evaluation["checks"]["media_0_narration_safety"] is False
    asset["versions"] = [{**content, "version": 1, "evaluation": evaluation}]
    assert evaluation_current(asset, brand, {})
    asset["versions"][-1]["media_items"][0]["script"] = "Changed"
    assert not evaluation_current(asset, brand, {})


def test_connected_publishing_rejects_stale_snapshot_before_account_or_remote_calls(client):
    from types import SimpleNamespace
    from datetime import datetime, timezone
    import pytest
    from app.services.publishing import SocialPublisher
    from app.services.social import SocialError
    c, a = generated(client)
    a = post(client, f"/assets/{a['id']}/approve", {"version": 1})
    brand = client.get("/brands").json()[0]
    brand["forbidden_phrases"].append(a["versions"][-1]["hook"])
    publisher = SocialPublisher(SimpleNamespace(mongo=True), None, None, None)
    with pytest.raises(SocialError, match="outdated"):
        publisher.schedule(None, SimpleNamespace(data=a), SimpleNamespace(data=c), brand, 1, "connection", datetime.now(timezone.utc))


def test_legacy_dropped_static_restored_only_into_new_reviewable_version(client):
    c, a = generated(client)
    db = client.app.state.repository.open("demo")
    record = db.get(Record, a["id"])
    data = deepcopy(record.data)
    media = {"id": "historic-static", "kind": "image", "mime_type": "image/png", "key": "static"}
    data["versions"][0]["media"] = media
    data["versions"][0]["media_items"] = [media]
    dropped = deepcopy(a["versions"][0])
    dropped["version"] = 2
    dropped["evaluation"].pop("snapshot", None)
    data["versions"].append(dropped)
    data["current_version"] = 2
    data["approvals"] = [{"version": 2, "decision": "approved", "media_reviewed": False}]
    data["status"] = "approved"
    original = deepcopy(data)
    record.data = data
    db.commit()
    db.session.close()
    prefix = f"/assets/{a['id']}"
    restored = post(client, prefix + "/evaluate", {"version": 2})
    assert restored["current_version"] == 3
    assert restored["versions"][:-1] == original["versions"]
    assert restored["approvals"] == original["approvals"]
    assert restored["versions"][-1]["media_items"] == [media]
    assert restored["evaluation_current"] and restored["status"] == "needs_review"
    assert client.post(prefix + "/publish", json={"version": 3}).status_code == 409
    assert client.post(prefix + "/approve", json={"version": 3}).status_code == 409
    reviewed = post(client, prefix + "/approve", {"version": 3, "media_reviewed": True})
    assert publication_parts(reviewed)[1] == [media]
    campaign = client.get(f"/campaigns/{c['id']}").json()
    assert any(t["event_type"] == "historical_media_restored" for t in campaign["trace"])
