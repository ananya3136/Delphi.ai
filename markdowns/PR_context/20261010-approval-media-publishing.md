# Consistent evaluation, asset revisions, and LinkedIn statics

## Scope and root causes
- Approval displayed a saved passing evaluation but invoked the stochastic evaluator again at approval time. Its different failure was not persisted for the UI.
- Text edits/regeneration dropped existing media; media generation evaluated copy before attaching the new static/narration.
- The editor's dirty state tracked text only. Media-only instructions did not enable a save/evaluation action, and there was no explicit reevaluation action for saved assets.
- Asset mutation responses previously only invalidated the campaign cache; approval could briefly retain an older version.
- LinkedIn posts used an uploaded image identity without checking whether processing was complete.

## Implemented behavior
- Every saved revision evaluates its final merged copy/media payload and stores a version-bound fingerprint of the content, sources, brand guardrails, and campaign context.
- Approval and immediate/scheduled publication require passing stored checks and matching current context; they do not invoke a second stochastic model call. Changed context makes the evaluation outdated.
- `POST /assets/{id}/evaluate {version}` creates an immutable freshly evaluated revision, preserves history, clears approval by version, and returns its full saved result, including failures.
- Existing versions without freshness metadata need explicit reevaluation. If old revisions dropped media, reevaluation restores the latest historical media into a new version, records a trace, and requires explicit new media review and approval.
- PATCH and regeneration support expected-version guards. Text edits/regeneration preserve media. New statics and retained narration are included before evaluation; narration receives separate safety checks.
- Canvas/approval sections share updated cached assets immediately, cancel competing campaign fetches, await campaign refresh, and refresh after errors or tab changes.
- Editor controls distinguish unsaved text/media, stale evaluations, and current checks. Both sections expose reevaluation; text changes offer save/evaluate, and changed media instructions offer generation/evaluation. Approval blocks unsaved changes and outdated results.
- LinkedIn image posts check readiness before sending `content.media.id`; processing produces a retryable result, failed upload/readiness stops publication, and saved image identities are reused on retries. No text-only fallback is introduced.

## Architecture and verification
- Two focused backend subagents owned evaluation/routes and LinkedIn adapter/tests; parent integrated frontend and verification.
- No new external dependencies. Server-side authorization, immutable approval history, and explicit media review remain enforced.
- Frontend: 22 tests passed; typecheck and production build passed. Tests cover stale results, text/media-only edits, current-version cache replacement, and prior auth/proxy flows.
- Initial focused backend run: 19 tests passed. First full run: 148 passed and two old-behavior assertions failed; export tests now assert retained attachments/fresh media review, and exhausted-generation tests assert the final failed evaluation controls saved status. Final full backend suite: **150 passed**. Final whitespace checks passed.
- LinkedIn contract verified with mocked requests using [official Images API documentation](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2026-09).

## Limitations and next steps
- Final merged evaluation adds AI calls and can take longer than the prior save flow.
- Automated checks evaluate written content and narration scripts; image pixels still require human visual review.
- Browser tools previously failed initialization with missing `sandboxPolicy`; no live browser click-through, MongoDB production workflow, or real LinkedIn post was performed.
- Review any recovered historical static before approving its new version. No commits or deployments performed; prior/user changes remain in the working tree.
