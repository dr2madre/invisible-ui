---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

A disabled combobox is closed, and answers nothing. Turning a control off
left its list open over an input that takes no key, so a keyboard user had
no way to dismiss it; every adapter now closes the list. The core refuses
every key while disabled and cancels none, so a still-focusable input keeps
its caret keys, and it no longer clears its value or moves its highlight
for a pointer. The custom element, whose visible input is not natively
disabled, no longer opens or filters when typed into or when the chevron
is pressed, and it shows the disabled look every other adapter shows.
