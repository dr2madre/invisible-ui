---
"@design-system/core": patch
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
---

The message catalog gains `table.sortedAscending` ("sorted ascending") and
`table.sortedDescending` ("sorted descending"), read with a sorted column's
header where a platform has no aria-sort, and five Upload Drop Area messages:
`uploadDropArea.browse` ("Browse files"), `uploadDropArea.rejectedType` and
`uploadDropArea.rejectedCount`, shown and announced for each file the accept
filter or the one-file limit leaves out, `uploadDropArea.files` ("Selected
files") and `uploadDropArea.remove` ("Remove {name}"). The table, carousel and
locale direction logic gains shared test vectors.
