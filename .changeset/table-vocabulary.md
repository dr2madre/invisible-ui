---
"@design-system/svelte": patch
---

The styled table's vocabulary becomes importable the way it already is in the
Vue adapter: `TableColumnDef` and `TableRow` move to a plain module,
re-exported from `Table.svelte` for existing subpath imports and now exported
from the package barrel too. `TableView.svelte`, shipped inside the package
but unreachable through the export map, gains its subpath. Additive only.
