---
"@design-system/svelte": minor
---

Every dialog in the family now shares one header: an optional feedback icon,
an optional leading ghost button, the title with optional context and
subtitle, optional actions and a close button, all centered against the title.
`closeButton` turns the close button on or off: on by default for `Dialog` and
`SheetDialog`, off by default for `AlertDialog`, `ConfirmDialog`,
`PromptDialog` and `SearchDialog`. `SearchDialog` can show its title with
`hideTitle={false}`. The `SheetDialog` description is now the subtitle inside
the header. The header classes are now `dialog-header__*`.
