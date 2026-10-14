# Focused review: landing page and logout navigation

This is a focused change review, not an exhaustive security audit.

## Findings and mitigations
- **Medium, addressed: stale dashboard after logout.** Previous logout cleared queries and refetched the profile without explicit navigation. Successful logout now cancels active queries, clears private cache, and replaces the route with `/logout`. Regression tests verify sequencing and reject late query results after cancellation.
- **Medium, addressed: private workspace rendered on auth routes.** `/login` and `/logout` are explicitly handled by AccountGate; rendering tests confirm no workspace children for signed-out and demo sessions, and active real sessions wait for redirect.
- **Low, addressed: root route now has a different purpose.** Workspace Overview and fallback navigation use `/dashboard`; the public root bypasses AccountGate.
- **Low, verification limitation: browser tooling unavailable.** Missing `sandboxPolicy` prevented browser initialization. Mobile layout and interactive sign-in/sign-out should receive browser QA when the tool works.
- **Low, existing limitation: local demo is unauthenticated.** Demo messaging explicitly distinguishes local mode from production authentication; accounts still require the existing backend configuration.

## Checks and tests not run
- Frontend: 17 regression tests passed.
- Backend: targeted account/profile/logout/expiry test passed.
- No exhaustive backend suite, live MongoDB account workflow, production deployment, or browser screenshot verification performed.
- Typecheck, production build, and whitespace checks passed. HTTP checks passed for all four public/workspace/auth routes, including landing link order, anchors, CTA, illustration labeling, and CSS responses. HTTP checks do not execute client authentication or verify pixel layout.

## Remaining work
- Review landing appearance and authenticated click-through flows in a functioning browser environment.
- Configure a verified contact destination if a dedicated support channel is introduced.
- No server auth or publication enforcement was changed by this work.
