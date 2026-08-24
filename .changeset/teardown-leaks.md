---
"@design-system/svelte": patch
"@design-system/vue": patch
---

Components let go of what they started. The Svelte upload area kept a
window focus listener for every picker it opened if it went away while
the dialog was still up; the notification region remembered every
notification it had ever shown, so its paint order drifted lower with
the count; a pending hover no longer opens a Vue tooltip, popover or
navigation panel that has already gone; the Svelte navigation menu drops
its hover timers when its trigger does; the copy confirmation in the
Svelte code block is cleared with the block; and a swipe interrupted by
teardown no longer calls back into what is no longer there.
