---
"@design-system/svelte": patch
"@design-system/react": patch
"@design-system/vue": patch
"@design-system/elements": patch
---

Make the switch readable when it is off. The track was filled with the control
boundary colour and the ON/OFF text was written on it in the secondary text
colour: two greys on top of each other, 1.72:1 in the light theme and 1.42:1 in
the dark one, against the 4.5:1 that text needs.

The track now carries a boundary in both states and is filled with a surface
when off, so the text takes the ordinary text colour: 11.75:1 and 9.77:1. The
boundary is what makes the control visible against the page, which also lifts
the on state in the dark theme from 2.87:1 to 6.07:1. It is drawn inside the
track, so nothing about the size changes. The thumb keeps a rim in the boundary
colour, which separates it from the lighter track.
