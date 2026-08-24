---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Two overlays open at once no longer leave the page unable to scroll.
Each modal saved whatever it found on the body and restored that, so a
second overlay saved the first one's lock and handed it back on close.
Closing the first one let the page scroll behind a modal that was still
open, and closing them in the other order left `overflow: hidden` for
good. Locks are counted now: the last one to let go restores exactly
what was there before the first took hold, and the scrollbar is
compensated once rather than once per overlay.
