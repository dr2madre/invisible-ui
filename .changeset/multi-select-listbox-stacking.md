---
"@invisible-ui/elements": patch
"@invisible-ui/react": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
---

The multi select's open list now has a stacking order again, in every adapter.

Its `z-index` was being handed `--ds-elevation-overlay`, which is a box-shadow: the value is not a stacking order, so the browser dropped the whole declaration and the list had none at all. Anything painted after it in the page, a following form for instance, could sit on top of the open list and take the clicks meant for its options. It now uses `--ds-select-z-index` with a default of 50, the same one the combobox next door has always used.
