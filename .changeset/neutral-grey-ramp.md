---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

The interface neutrals move from the Warm Grey ramp to the palette's neutral
Grey ramp, so every text, surface and border colour changes. `--ds-neutral-0`
stays white; 50 to 950 become `#f5f5f5`, `#e0e0e0`, `#bdbdbd`, `#9e9e9e`,
`#757575`, `#616161`, `#515151`, `#414141`, `#323232`, `#272727` and
`#1b1b1b`. The warm ramp made the dark theme look brown, and a neutral grey
suits any product. Warm Grey stays in the palette as a hue of its own.

Every role mixed with a neutral is recomputed, and so is every literal
fallback in the component sheets. The light dialog overlay becomes
`rgb(27 27 27 / 0.5)`. All contrast pairs keep their thresholds: body text
14.94:1 on the light page and 13.70:1 on the dark one, secondary text 6.01:1
and 5.43:1 on a surface, the control boundary 3.49:1 and 3.81:1 on a surface,
the focus ring 3.03:1 and 3.39:1 on a surface, the solid warning label 4.71:1
in both themes. The dark navigation bar indicator mixes 74% of the secondary
instead of 75% (`#9a7cd7`), to keep 3:1 against the darker grey surface.
