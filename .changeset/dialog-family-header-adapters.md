---
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

The dialog family shares one header in Vue, React and Elements, as in Svelte:
an optional feedback icon, an optional leading ghost button, the title with
optional context and subtitle, optional actions and a close button, all
centered against the title. `closeButton` (`close-button="false"` in Elements)
turns the close button off: on by default for `Dialog` and `SheetDialog`, off
by default for `AlertDialog`, `ConfirmDialog`, `PromptDialog` and
`SearchDialog`. `SearchDialog` can show its title with `hideTitle: false`. The
`SheetDialog` description is now the subtitle inside the header. The header
classes are now `dialog-header__*`, in a new `dialog-header.css` sheet.
