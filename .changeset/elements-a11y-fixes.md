---
"@design-system/elements": minor
"@design-system/core": minor
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
---

Accessibility fixes across the web components, with the shared stylesheets
and core behavior they rely on.

- Core: the tabs, carousel, tree view and pagination connects take a
  `direction` option (`"ltr"` by default). In right-to-left text the left and
  right arrows swap, as the toolbar already does. The elements read the
  computed direction; Svelte, Vue and React keep the default.
- Calendar range mode selects every day of the range (`aria-selected`) and
  names its first and last day ("range start", "range end"). Lines in the
  selection colour close the in-range band, and forced colors mark selected
  days and the current page with system colours. Year view days keep a 24px
  target.
- Menus, the combobox, the multi-select and the search dialog draw a focus
  ring on the focused or active item, the selected combobox option included.
  The search dialog shows focus on its input row.
- Transitions on the switch, accordion, collapsible, dropdown menu, tabs,
  segmented control and combobox stop under reduced motion.
- Focus stays in place: pagination moves it to the current page when
  Previous or Next turns disabled, Load more stays focusable while loading
  and hands focus to the first new row at the end, a popover closed by the
  page returns focus to its trigger, and the navigation menu closes when Tab
  leaves it.
- Announcements go through persistent live regions: the notification region
  (toasts are now named groups), Loading, Count (its label is text, not
  `aria-label`), the tree view, and a new result count in the table view
  after filtering ("N results", `table.results`). Error State and Empty State
  take a `live` attribute; without it they carry no live role and they update
  in place.
- `description` and `error` attributes on checkbox, switch, checkbox group,
  radio group, search field, combobox, multi-select, date picker and pin
  input, wired through `aria-describedby` and `aria-invalid`. Number field
  describes its input by its built-in validation message.
- Tabs read their count as part of the name. The sidebar rail toggle keeps
  one label with `aria-pressed`; `expand-label` is gone. Accordion and its
  items take `heading-level`. Tabs, tree view, menubar, navigation menu,
  slider, range slider and pin input write no empty `aria-label` and warn
  once when the label is missing.
