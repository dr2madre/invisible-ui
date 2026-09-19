---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
"@design-system/core": patch
---

Combobox's clear button now answers the keyboard, in every adapter.

`clearProps` carried only `onMouseDown`, so the button announced a name and did nothing for Enter, Space, or a screen reader's own activation. With `searchable={false}` the input is read-only, so there was no keyboard way at all to empty the control.

The clear now happens on the button's own `click`, which the browser generates for a pointer press, for Enter and Space, and for a direct activation alike; `onMouseDown` only keeps focus on the input, so a pointer press clears exactly once. The button is in the tab sequence, and in the accessibility tree, only while there is something to clear and the control is enabled, from one rule in core that every adapter now mirrors. DOM focus lands on the input after every route, a pointer press included, since the button it was on stops existing the moment the text is gone.

`core`'s `combobox.ConnectOptions` gains an optional `focusInput`, which every adapter now passes; nothing else about the public contract changes.
