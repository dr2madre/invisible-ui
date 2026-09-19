---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
"@design-system/core": patch
---

Combobox's clear button now answers the keyboard, in every adapter.

`clearProps` carried only `onMouseDown`, so the button announced a name and did nothing for Enter, Space, or a screen reader's own activation. With `searchable={false}` the input is read-only, so there was no keyboard way at all to empty the control. It now also answers Enter and Space, is in the tab sequence only while there is something to clear, and hands DOM focus back to the input once pressed, since the button it was on stops existing the moment the text is gone.

`core`'s `combobox.ConnectOptions` gains an optional `focusInput`, which every adapter now passes; nothing else about the public contract changes.
