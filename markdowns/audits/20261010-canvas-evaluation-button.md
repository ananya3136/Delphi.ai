# Focused review: canvas primary evaluation action

This is a focused review, not an exhaustive security audit.

- **Medium, addressed: primary control blocked saved-asset evaluation.** Evidence: text-panel button was disabled whenever textDirty was false. Canvas and inspector now share the same evaluation dispatch and prerequisites. Rendering tests verify enabled controls for unchanged/outdated assets and media-only changes.
- **Low, mitigated: duplicate/ineligible mutation dispatch.** Busy/publication states still disable both controls and form submission checks the shared disabled condition. Regression test verifies publishing lock.
- **Low, existing limitation: media generation prerequisites.** Media cannot be generated from unsaved/failed copy or an unmapped timeline asset; stale evaluations first support reevaluation.
- Verification: 25 frontend tests passed, typecheck passed, whitespace checks passed. No backend suite, production build, live publication, or browser interaction test rerun for this focused frontend fix.
- Remaining work: browser click-through when tooling is available. No changes to approval enforcement, immutable version history, or publication authorization.
