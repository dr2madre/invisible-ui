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

The off track is now a surface with the boundary drawn inside it, so the control
is still visible against the page, and the text takes the ordinary text colour:
11.75:1 and 9.77:1. The thumb keeps a rim in the boundary colour, which is what
separates it from the lighter track. The on state is unchanged.
