import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = await readFile(new URL("../lib/asset-review.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { reviewState, replaceCampaignAsset } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const version = { version: 4, hook: "Current hook", body: "Current body", cta: "Explore", caption: "", source_refs: [], created_at: "2026-10-10T00:00:00Z", evaluation: { passed: true, checks: { brand_fit: true }, issues: [] } };
const asset = { id: "asset", campaign_id: "campaign", current_version: 4, evaluation_current: true, platform: "linkedin", asset_type: "post", status: "needs_review", versions: [version], approvals: [], timeline_snapshot: { id: "day1", day: 1, stage: "launch", objective: "Introduce", platform: "linkedin", asset_type: "post" } };

test("passing checks cannot approve stale context or unsaved text/media", () => {
  assert.equal(reviewState(asset, false, false).passing, true);
  assert.equal(reviewState({ ...asset, evaluation_current: false }, false, false).passing, false);
  assert.equal(reviewState({ ...asset, evaluation_current: undefined }, false, false).passing, false);
  assert.equal(reviewState(asset, true, false).passing, false);
  assert.equal(reviewState(asset, false, true).passing, false);
});

test("asset response replaces both canvas and approval cache version without mutating history", () => {
  const campaign = { id: "campaign", assets: [asset, { ...asset, id: "other" }] };
  const latest = { ...asset, current_version: 5, versions: [...asset.versions, { ...version, version: 5, body: "Latest body" }] };
  const updated = replaceCampaignAsset(campaign, latest);
  assert.equal(updated.assets[0], latest);
  assert.equal(updated.assets[1], campaign.assets[1]);
  assert.equal(campaign.assets[0].current_version, 4);
  assert.equal(replaceCampaignAsset(campaign, { ...latest, campaign_id: "different" }), campaign);
});

const editorSource = await readFile(new URL("../components/canvas/asset-editor.tsx", import.meta.url), "utf8");
const editorCode = ts.transpileModule(editorSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const require = createRequire(import.meta.url);
function editorHtml(currentAsset, stateOverrides = {}, approvalsOnly = false) {
  let stateIndex = 0;
  const exports = {};
  const mocks = {
    react: { ...React, useState: (initial) => { const index = stateIndex++; return [Object.hasOwn(stateOverrides, index) ? stateOverrides[index] : typeof initial === "function" ? initial() : initial, () => {}]; } },
    "@/lib/api": { currentVersion: (a) => a.versions.find((v) => v.version === a.current_version), title: (s) => s },
    "@/lib/asset-review": { reviewState },
    "@/components/ui": { Badge: ({ children }) => React.createElement("span", null, children), Status: () => null, ErrorNotice: () => null, Sources: () => null },
    "./publishing-controls": { PublishingControls: () => null },
    "@/components/delete-control": { DeleteControl: () => null },
  };
  new Function("require", "exports", editorCode)((name) => mocks[name] ?? require(name), exports);
  return renderToStaticMarkup(React.createElement(exports.AssetEditor, { asset: currentAsset, action() {}, busy: false, approvalsOnly }));
}

test("media-only image instructions enable generate-and-evaluate without text edits", () => {
  const html = editorHtml(asset, { 0: "image", 6: "New static composition" });
  assert.match(html, /UNSAVED CHANGES/);
  assert.match(html, /<button[^>]*type="button"(?![^>]*disabled)[^>]*>.*?Generate media and evaluate<\/button>/);
});

test("clean image version still offers reevaluation and stale evaluation is never ALL PASS", () => {
  const html = editorHtml({ ...asset, evaluation_current: false }, { 0: "image" }, true);
  assert.match(html, /OUTDATED/);
  assert.match(html, /Re-evaluate current version/);
  assert.doesNotMatch(html, /ALL PASS/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>.*?Approve version 4<\/button>/);
});

test("approval text edits offer save-and-evaluate and block approval of saved checks", () => {
  const html = editorHtml(asset, { 2: "Revised text" }, true);
  assert.match(html, /Save changes and evaluate/);
  assert.match(html, /UNSAVED CHANGES/);
  assert.doesNotMatch(html, /ALL PASS/);
});

test("canvas primary evaluation action is enabled for unchanged and outdated saved text", () => {
  for (const currentAsset of [asset, { ...asset, evaluation_current: false }]) {
    const html = editorHtml(currentAsset);
    const primary = html.match(/<button\b[^>]*type="submit"[^>]*>[\s\S]*?<\/button>/)?.[0];
    assert.ok(primary);
    assert.doesNotMatch(primary, /disabled=/);
    assert.match(primary, /Re-evaluate current version/);
  }
});

test("canvas primary evaluation action handles media-only instructions from the text tab", () => {
  const html = editorHtml(asset, { 6: "New static composition" });
  const primary = html.match(/<button\b[^>]*type="submit"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(primary);
  assert.doesNotMatch(primary, /disabled=/);
  assert.match(primary, /Generate media and evaluate/);
});

test("canvas primary evaluation action stays disabled while publication is locked", () => {
  const html = editorHtml({ ...asset, status: "publishing" });
  const primary = html.match(/<button\b[^>]*type="submit"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(primary);
  assert.match(primary, /disabled=""/);
});
