---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Components stay inside the page at narrow viewports (WCAG 1.4.10, 320px):
fields and the combobox cap at their container; pagination, toolbar and
the navigation menu wrap; tab lists and the segmented control scroll
inside themselves; calendar day tracks and the combobox grid stop growing
with their content; the segmented control's hidden radio is anchored so
it cannot widen the page; the carousel gallery viewport, a real scroller,
becomes keyboard focusable with a visible focus ring.
