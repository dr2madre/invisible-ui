---
"@design-system/core": minor
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Toggle Button is a native `<button type="button">` with `aria-pressed` in
every web adapter, no longer a checkbox styled as a button. Its accessible
name never changes with the state, and Enter and Space toggle it. With `name`,
a hidden input still submits `value` while the button is pressed, so forms
receive the same data; this form participation is provisional. A form reset
still restores the default pressed value. Styles target `.toggle` (the button)
and `[aria-pressed="true"]`; `.toggle__input` and `.toggle--disabled` are
gone, and in Elements the host holds the `button.toggle` instead of being it.
