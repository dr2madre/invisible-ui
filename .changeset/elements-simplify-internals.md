---
"@design-system/elements": patch
---

Simpler internals for the web components, with one fix.

- Fix: `open-delay=""` and `close-delay=""` on the tooltip, the popover and
  the navigation menu fall back to the default delay. An empty value used to
  count as zero, so the overlay opened at once.
- The dialog, the sheet dialog and the dialog presets open through one shared
  modal sequence. The combobox, multi-select, table view settings and context
  menu position through the shared floating helper. Outside-press dismissal,
  numeric attributes, hover delays, list filtering, ISO dates and the small
  glyphs each live in one place.
- The tree view updates its rows in place instead of rebuilding the tree on
  every change, and the multi-select reuses its hidden form inputs.
