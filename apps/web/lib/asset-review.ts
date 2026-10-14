import type { Asset, Campaign } from "./api";

export function replaceCampaignAsset(campaign: Campaign | undefined, asset: Asset) {
  if (!campaign || asset.campaign_id !== campaign.id) return campaign;
  return { ...campaign, assets: campaign.assets.map((item) => item.id === asset.id ? asset : item) };
}

export function reviewState(asset: Asset, textDirty: boolean, mediaDirty: boolean) {
  const version = asset.versions.find((item) => item.version === asset.current_version);
  const dirty = textDirty || mediaDirty;
  const current = asset.evaluation_current === true;
  return { dirty, current, passing: !!version?.evaluation.passed && current && !dirty };
}
