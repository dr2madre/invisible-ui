---
"@design-system/elements": minor
"@design-system/svelte": patch
---

Elements gains the rest of the dialog family: `<ds-alert-dialog>`,
`<ds-confirm-dialog>`, `<ds-prompt-dialog>` and `<ds-search-dialog>`, on the
native `<dialog>` element with the header the family shares. The close button
is off by default (`close-button` shows it). Confirm and Prompt take `urgent`
for `role="alertdialog"`. Search takes its results through the `items` and
`suggestions` properties, keeps its title visually hidden unless
`hide-title="false"`, and emits `select`. The four stylesheets ship in
`styles.css`.
