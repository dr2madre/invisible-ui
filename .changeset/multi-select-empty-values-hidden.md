---
"@nozcadesign/invisible-ui-elements": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-vue": patch
---

`<ds-multi-select>` no longer shows an empty "Selected values" list to screen
readers when nothing is selected: the stylesheet's `display` on the list
overrode its `hidden` attribute. The rule is added to the shared
`multi-select.css`, so the React and Vue stylesheets change too; their
components already left the empty list out of the page.
