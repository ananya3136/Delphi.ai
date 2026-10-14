# Focused review: approval and LinkedIn media consistency

This is a focused change review, not an exhaustive security audit.

## Findings, evidence, and mitigations
- **High, addressed: displayed checks and approval disagreed.** Approval previously called `router.evaluate` again instead of using the displayed result. Persisted snapshots now bind passing evaluation to exact version/content/media and current brand/campaign inputs. Stale metadata or changed sources/guardrails block approval and publication with an actionable reason.
- **High, addressed: text revisions dropped reviewed statics.** The previous PATCH payload omitted media and regeneration copied only written fields. Final payload merging retains media and reevaluates narration. Regression tests cover copy edit/regeneration/reevaluation and publication media selection.
- **Medium, addressed: evaluation preceded media attachment.** Media is attached before final evaluation and fingerprinting. New media invalidates approval through a new version; approval requires `media_reviewed` for that version.
- **Medium, addressed: stale UI/version requests.** Expected-version PATCH/regenerate guards reject stale edits. Cache replacement and awaited refetch connect canvas/approval. Error refetch updates outdated indicators. Unsaved text/media blocks approval/publication.
- **Medium, addressed: image processing readiness.** LinkedIn adapter checks image identity and `AVAILABLE` before post creation, including cached identities. Pending processing is retryable; tests confirm failed upload/status checks never send a text-only fallback.
- **Low, managed: historical-media recovery.** Reevaluation can restore an older attachment where legacy copy edits dropped it. Recovery creates a new revision and trace, preserves historical data, and requires fresh explicit visual review and approval; it never publishes automatically.
- **Low, remaining: visual media verification.** Image pixels are not certified by automated copy checks. UI states this limitation and requires human media review.
- **Low, remaining: added evaluation latency/model cost.** Final merged evaluation adds model calls; provider failures keep the mutation from being committed and remain actionable to the user.

## Verification and tests not run
- Frontend: 22 regression tests passed; typecheck and production build passed.
- Focused backend: 19 tests passed before historical recovery test was added. First full run: 148 passed; two assertions expecting media removal and generation-status overrides were updated to verify the requested media retention and saved failure status, with approval still blocked. Final full backend suite: **150 passed**. Final whitespace checks passed.
- Official LinkedIn API reference: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2026-09
- No real LinkedIn publication, live production account workflow, or browser click-through performed. Network payload behavior is covered by offline provider mocks.

## Remaining work
- Existing assets need reevaluation to acquire freshness metadata; previously lost static media should be reviewed after recovery.
- Run live visual/account integration QA in an environment with working browser tools, using explicit authorization before any real publication.
