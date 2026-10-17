---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Add `grid` to the core, the headless logic of the editable data grid: the key
table of the navigation and editing modes (`gridKeyCommand`, mirrored under
right to left, Tab while editing to the next editable cell and out of the grid
after the last one), `nextEditable`, `initialActive`, `acceptsCharacter` and
`matchesShortcut`, the active cell across data changes (`clampActive`,
`resolveActive`), the derived totals (`sumValues`, `gridTotals`) and the
spoken text (`cellLabel`, `detailsLabel`, `errorAnnouncement`). The message
catalog gains `dataGrid.total`, `dataGrid.empty`, `dataGrid.edit`,
`dataGrid.details`, `dataGrid.cell`, `dataGrid.rowHeader`,
`dataGrid.columnTotal`, `dataGrid.rowTotal`, `dataGrid.grandTotal`,
`dataGrid.separator`, `dataGrid.error`, `dataGrid.detailsLabel`,
`dataGrid.detailsShortcut` and `dataGrid.announcement`.
