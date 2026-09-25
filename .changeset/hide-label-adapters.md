---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
---

`hideLabel` now works on every field component. Svelte and Vue add it to
`Switch`, `Textarea` and `Combobox` (`Checkbox` already had it); React adds it
to `Checkbox`, `Switch` and `Combobox`. The label leaves the screen and stays
the control's accessible name.
