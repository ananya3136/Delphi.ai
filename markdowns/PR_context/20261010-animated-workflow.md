# Animated landing workflow

## Scope and changes
- Add a six-stage workflow diagram between the hero ribbon and About section; the hero's Explore the workflow link now targets this section.
- Connect a shared campaign-context node to brief/brand, strategy, creation, evaluation, approval, and learning stages.
- Advance the highlighted stage every five seconds and animate a progress line, context connector, and illustrative detail cards.
- Provide pause/play and individual stage selection. Selecting a stage pauses autoplay for deliberate exploration.
- Retain the charcoal/teal palette and existing font variables with styles isolated in a CSS module. No new dependencies.
- Preserve the existing Lenis scroll integration and allow native anchor navigation when its instance is unavailable.

## Architectural decisions
- Local React state drives a presentation-only preview; it performs no API requests, approval actions, or publication.
- IntersectionObserver suspends cycling off-screen; hidden documents do not advance stages. Timers and observers are cleaned up on unmount.
- Reduced-motion preference disables autoplay and CSS entrance/travel animations; stage buttons remain usable.
- Responsive diagram switches from six columns to two rows of three stages and stacks the description/preview on smaller screens.
- Example content is explicitly illustrative. Approval explains current-version evaluation and explicit human approval; learning distinguishes simulated data from real results.

## Verification and limitations
- Typecheck and whitespace checks passed.
- Production build passed on retry. Initial build failed collecting a generated API-route module despite successful compilation; the unchanged retry completed successfully.
- Production HTTP check passed: six selectable stage buttons, one active state, pause control, illustrative-data label, workflow anchor, launch CTA, served animation CSS, and reduced-motion rules verified. These checks do not execute client animation or interactions.
- Browser automation failed to initialize with missing `sandboxPolicy`; live animation, screenshots, mobile appearance, and keyboard click-through were not verified in a browser.
- Existing account, routing, package, and loading-style changes from prior/user work were preserved. No commit or publication performed.

## Next steps
- Perform visual browser QA when browser tooling is available.
