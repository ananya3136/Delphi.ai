"""Bind saved evaluation to immutable copy/media and current policy inputs."""
from copy import deepcopy
import hashlib
import json

CONTENT_FIELDS = ("hook", "body", "cta", "caption", "source_refs", "media", "media_items")
CONTEXT_FIELDS = ("goal", "audience", "strategy", "selected_direction")

def content_snapshot(version):
    return {k: deepcopy(version[k]) for k in CONTENT_FIELDS if k in version}

def fingerprint(content, brand, asset, campaign):
    payload = {"schema": 1, "content": content_snapshot(content),
               "brand": {k: brand.get(k) for k in ("name", "description", "voice", "approved_claims", "forbidden_phrases", "sources")},
               "asset": {k: asset.get(k) for k in ("platform", "asset_type", "timeline_item_id", "timeline_snapshot")},
               "campaign": {k: campaign.get(k) for k in CONTEXT_FIELDS}}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()

def evaluation_current(asset, brand, campaign):
    if not asset.get("versions"):
        return False
    version = asset["versions"][-1]
    snapshot = version.get("evaluation", {}).get("snapshot", {})
    return (snapshot.get("version") == asset["current_version"] == version.get("version")
            and snapshot.get("fingerprint") == fingerprint(version, brand, asset, campaign))

def evaluate_snapshot(router, content, brand, asset, campaign, version):
    context = {**asset, "campaign_context": {k: campaign.get(k) for k in CONTEXT_FIELDS}}
    result = deepcopy(router.evaluate(content, brand, context))
    media = content.get("media_items") or ([content["media"]] if content.get("media") else [])
    for index, item in enumerate(media):
        if item.get("kind") != "voiceover":
            continue
        narration = {"hook": "", "body": item.get("script", ""), "cta": "", "caption": "",
                     "source_refs": (item.get("narration_history") or [{}])[-1].get("source_refs", content.get("source_refs", []))}
        checked = router.evaluate(narration, brand, {**context, "narration_only": True})
        result["checks"][f"media_{index}_narration_safety"] = bool(checked["passed"])
        result["issues"].extend(f"Voiceover: {issue}" for issue in checked["issues"])
    result["passed"] = bool(result["passed"] and result["checks"] and all(result["checks"].values()) and not result["issues"])
    result["snapshot"] = {"schema": 1, "version": version, "fingerprint": fingerprint(content, brand, asset, campaign)}
    return result
