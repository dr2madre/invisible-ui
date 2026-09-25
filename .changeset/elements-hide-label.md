---
"@design-system/elements": minor
"@design-system/react": patch
"@design-system/vue": patch
---

`hide-label` now works on every field element: `<ds-checkbox>`, `<ds-switch>`,
`<ds-textarea>` and `<ds-combobox>` join `<ds-text-field>`, `<ds-select>` and
`<ds-search-field>`. The label leaves the screen and stays the control's
accessible name, so a checkbox that selects every row no longer needs its
internal label class styled from outside. The shared combobox and textarea
stylesheets carry the matching hidden-label rule.
