# Content canvas primary evaluation action

## Scope and root cause
The text-panel submit button used `disabled={!textDirty}` even though the inspector could reevaluate saved assets. This left the primary control greyed out for unchanged or media-only changes and prevented evaluation from the expected location.

## Changes and decisions
- Use the same action label, prerequisites, and evaluation handler for the primary canvas and inspector buttons.
- Changed text saves and evaluates; pending media instructions generate and evaluate where prerequisites permit; unchanged/outdated assets reevaluate the current version.
- Form submission checks disabled prerequisites before dispatching. Active operations and publication locks still block mutations.
- Backend immutable-version and approval behavior remains unchanged.

## Verification
- Typecheck passed.
- Frontend regression suite: 25 passed, including unchanged/outdated saved text, media-only instructions from the text tab, and publication locks.
- Whitespace check passed.

## Limitations and next steps
- No browser click-through or production build rerun for this focused control fix. Prior browser tooling remains unavailable.
- No backend tests rerun because backend behavior was not modified. No commit or publication performed.
