---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the rest of the dialog family: `AlertDialog`,
`ConfirmDialog`, `PromptDialog`, `SheetDialog` and `SearchDialog`, with the
markup, classes and behaviour of the other adapters. Each one runs on
`useDialog`, works controlled and uncontrolled (ADR 0011), takes its default
labels from the catalog, and holds the status area on its ref (ADR 0016),
typed `DialogHandle`.

Two hooks render the same behaviour in markup of your own: `useSheetDialog`
(edge anchoring and the drag-to-dismiss gesture) and `useSearchDialog` (a
combobox inside a modal dialog, with groups, suggestions and a custom
`filter`). `useDialog` gains `returnFocusTo`, for a dialog opened without a
trigger of its own.

`styles.css` now includes the sheets for these dialogs, and the Kbd and
Loading sheets the search dialog uses.
