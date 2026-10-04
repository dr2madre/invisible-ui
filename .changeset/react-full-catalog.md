---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now carries the whole catalog. It adds `Textarea`, `Table`,
`TableSet`, `Toolbar`, `Carousel`, `LoginForm` and `UploadDropArea`, with the
`useTable`, `useCarousel` and `useDropArea` hooks, and the markup, classes and
behaviour of the other adapters. Default labels come from the catalog.

`TableSet` follows the data-table specification: the sort, hidden columns,
selected rows, page, view and active tab are controllable mirrors that never
report a reflected prop, the selection is never pruned, and the filter inputs
reset the page and tell an empty dataset from no results. A page the
component moves itself is reported once, after that render commits. Cell
values render as text.

In React, the slots of the other adapters are props: `renderCell`,
`renderSelectionCell` and `selectionHeader` on the tables, `toolbar` on
`TableSet`, `renderItem` on `Carousel`, `logo` and `renderProviderIcon` on
`LoginForm`, `children` and `icon` on `UploadDropArea`. `Carousel` takes
`index` with `onIndexChange`. `LoginForm` reads the credentials from the form
on submit. A drop on `UploadDropArea` keeps only the files its `accept` names.

`styles.css` now includes the textarea, table, table set, toolbar, carousel,
login form and upload drop area sheets. They are the same files the Vue and
custom element packages ship, now held byte for byte to the React copies.
