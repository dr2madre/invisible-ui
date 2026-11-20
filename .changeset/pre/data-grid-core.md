---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-svelte": minor
"@nozcadesign/invisible-ui-vue": minor
"@nozcadesign/invisible-ui-react": minor
"@nozcadesign/invisible-ui-elements": minor
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
