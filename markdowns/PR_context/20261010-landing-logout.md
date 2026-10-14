# Landing page and logout navigation

## Scope and architecture
- Introduce a public landing page at `/` using the existing charcoal/teal palette and Noto Sans/Inter font variables.
- Keep the existing campaign workspace behind AccountGate at `/dashboard` and preserve campaign, brand, profile, and integration URLs.
- About, Help, and Contact header links target landing sections; Launch Delph.ai opens `/dashboard`, which presents the dashboard or account gate according to session state.
- Limit landing styles to a CSS module so existing workspace styles remain isolated.
- Split work between independently owned landing and authentication subagents; parent integrates routes and workspace navigation.

## Authentication changes
- Wait for server logout success, cancel queries, clear private cached data, then replace the route with `/logout`.
- Explicit auth routes render the account gate rather than workspace content. Active real sessions redirect to the dashboard; demo mode is explicitly identified.
- Successful login rebuilds the session query before opening the dashboard.
- Logout failures retain the current session and show the error.

## Verification
- Frontend tests: 17 passed, including logout ordering, failure behavior, cancellation of late private queries, and signed-out/demo/active-session rendering.
- Backend session test: `test_accounts_profile_logout_and_expiry` passed (1 passed, 5 deselected).
- `npm run typecheck` and `npm run build` passed after integration.
- Production HTTP checks: `/`, `/dashboard`, `/login`, and `/logout` returned 200. Public-root HTML verified the hero, header navigation order, section anchors, `/dashboard` CTA, illustrative-data label, and successful CSS responses. These checks do not execute client authentication or verify pixel layout.
- `git diff --check` passed. Test/build workers required elevated process-spawn permission after sandbox `EPERM` failures.

## Limitations and next steps
- Browser automation could not initialize because its tool returned a missing `sandboxPolicy` error; no live browser visual or click-through verification is claimed.
- No production deployment or Git commit requested or performed.
- Contact information must remain grounded in existing project details; no fabricated support address.
- Existing publication approval/version rules and simulated metric labeling remain required.
