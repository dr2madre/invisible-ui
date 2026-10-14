---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

A disabled tab is no longer a tab stop: the core gives it `tabindex="-1"`
instead of leaving a native button to be tabbed to. The Toolbar leaves keys to
a control that needs them: in a text input the caret keys, Left and Right
(Up and Down in a vertical toolbar) and Home and End, stay with the input, and
a multi-line field keeps every arrow. The core's `toolbar.nextIndex` takes a
`control` kind, and `toolbar.controlKind` tells what an element is.
