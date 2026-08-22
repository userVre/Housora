# Housora UI research brief

## Context

- Product: AI-assisted interior design web app with marketing, tools, auth, pricing, and a signed-in workspace.
- Direction: refined editorial minimalism for marketing and compact creative-product navigation for the workspace.
- Constraints: preserve Housora content and existing Kotlin/Ktor + static browser architecture; support desktop, mobile, light, dark, keyboard, and touch use.

## Inspiration

- MeltFlex pricing (`meltflexai.com`, plus the supplied screenshot): plan-first cards, immediate price/allowance hierarchy, restrained best-value treatment, and compact billing controls.
- ChatGPT workspace/profile patterns (supplied screenshots and OpenAI Help Center): persistent library navigation, one bottom account trigger, progressive disclosure for settings, billing, and sign-out.
- Recraft Canvas documentation (`recraft.ai/docs/recraft-studio/work-area/canvas`): creation begins in the work area, with generation controls close to the uploaded content rather than behind a promotional landing step.
- Canva editor/help patterns (`canva.com/help/editing-designing`): separate projects, generated media, and creation tools by user intent.

## Patterns adopted

- Layout: direct-to-task AI tools; launcher-first Home; compact persistent sidebar; profile actions disclosed from one account menu.
- Typography: locally hosted Inter variable font across marketing and workspace surfaces.
- Color: warm neutral foundation with a restrained deep-teal action accent; semantic light/dark surfaces.
- Components: 44px minimum controls, visible focus rings, segmented billing toggle, bordered pricing cards, clear upload and generation states.
- Responsive behavior: cards collapse to one column, auth artwork stacks above the form, tool progress remains horizontally scannable, and the workspace sidebar stays drawer-friendly.

## Housora differentiation

- A project-specific before/after interior image anchors authentication.
- Home asks what the user wants to change, then routes into focused room tools.
- My Images represents generated results, Projects represents user-organized work, and My Likes represents saved inspiration.
