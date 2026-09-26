---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

New `<ds-tooltip>`, ported from the Vue adapter with identical classes: a
descriptive label on hover or focus of the control it wraps, linked with
`aria-describedby`, hoverable and dismissed with Escape, toggled by a tap on
touch, positioned with Floating UI. The tooltip tokens now ship in Elements as
well as in Svelte and Vue.
