---
"@design-system/svelte": patch
"@design-system/vue": patch
---

The CodeBlock scroller becomes a focusable, named region: wide samples
scroll horizontally, and a keyboard user could never reach them. The
`pre` now carries `tabindex="0"`, `role="region"` and an `aria-label`
("Code sample, {language}", or "Code sample"), distinct from the figure
label and matching the docs site, with an inset focus ring since the
figure clips outer shadows.
