---
"@design-system/elements": minor
---

New `<ds-popover>`, `<ds-context-menu>` and `<ds-menubar>`, ported from the Vue
adapter with identical classes. The popover opens a non-modal card on click, or
previews one on hover and focus with `trigger="hover"`. The context menu opens
at the pointer on right-click, on the keyboard menu key or on a long press. The
menubar moves between its menus with the arrow keys and switches them on hover.
The three elements take their default labels from the catalog, and
`ds-dropdown-menu` now shares its menu rendering, keyboard and typeahead code
with them.
