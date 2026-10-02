---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

`tokens.css` gains `--ds-min-target-size: 24px`, the side of the smallest
square hit area a control keeps, from `density.regular.min-target-size`.
It covers the regular density only; components keep their own sizes, so
nothing renders differently.

In the design source, every colour that `tokens.css` mixes with
`color-mix()` now carries its recipe under
`$extensions["com.invisible-ui.mix"]` (colour space, the two colours as
token references, the share of the first) next to the resolved `$value`.
A platform without `color-mix()` can recompute a tint after overriding a
brand or feedback colour. No resolved value changes; the parity test
recomputes each recipe and checks it against the source and the stylesheet.
