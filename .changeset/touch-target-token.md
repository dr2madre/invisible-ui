---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Add `--ds-min-target-size-touch` (44px), from `density.touch.min-target-size`.
Under `@media (pointer: coarse)`, dropdown menu items, context menu items and
menubar items and triggers read it for both their block and inline minimum
size, so each keeps a 44 by 44 hit area. The Svelte menus gain the same
coarse-pointer rules, which they lacked. Visual density never reduces the
touch target.
