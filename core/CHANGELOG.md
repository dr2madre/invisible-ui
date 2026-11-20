# @nozcadesign/invisible-ui-core

## 0.1.0-alpha.1

### Minor Changes

- 6769c36: The avatar initials move to the core as `avatar.initialsOf`, with shared
  test vectors in `core/src/avatar/__vectors__` that the Flutter adapter reads
  too. The `initialsOf` each adapter exports keeps its name and result and now
  calls the core one, in place of four copies of the same logic.
- 198b953: Calendar, Date Picker and Date Range Picker start the week on the locale's
  first day by default, from `weekStart.weekStartsOn(locale)` in core (CLDR,
  language and region), with the locale read from the i18n provider so server
  and client agree. Svelte, Vue and React defaulted to Monday; Elements used
  `Intl` and now uses the same core table. `weekStartsOn` still overrides it.
- b2fd59d: Add `grid` to the core, the headless logic of the editable data grid: the key
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
- 507cdc0: Without a locale from the app, components follow the page's language, then
  international conventions. The order is: a component's `locale`, the Locale
  Provider's, the page's `lang` (the closest ancestor in Elements, `<html lang>`
  in Svelte, Vue and React), then `DEFAULT_LOCALE`, now `en-001-u-hc-h23`
  instead of `en`: English messages with the ISO 8601 and CLDR world (001)
  conventions. Weeks start on Monday, time fields use 24 hours, and a short
  numeric date reads `2026-01-05`. Without a provider, the direction is the
  page's `dir`, else `ltr`. A Locale Provider without `locale` takes the locale
  around it.
  
  Core adds `resolveLocale`, `pageLocale`, `subscribePageLocale` and
  `hourCycleOf`; Time Field in Svelte and Vue now follows the locale's hour
  cycle unless `hourCycle` is set, as React and Elements did. The server renders
  with the default unless the provider gets `locale`; the browser renders its
  first pass the same way, so hydration matches, then applies the page's `lang`.
- e47db9b: Accessibility fixes across the web components, with the shared stylesheets
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
- 0db43e6: The custom elements are localized through the shared message catalog.
  
  **`<ds-locale-provider>`** sets the locale (`locale`), the writing direction
  (`dir`) and message overrides (the `messages` property) for every element
  inside it, and writes `lang` and `dir` on itself. The closest provider wins.
  Without one, an element reads the closest `lang` attribute, then English.
  Changing `locale`, `dir` or `messages` renders the labels again.
  
  Every default label now comes from the catalog: dialog close buttons and
  triggers, the search field, the search dialog and its results count, the
  sidebar, pagination, combobox, multi select, select, switch, tag, tree view,
  table set, breadcrumb, loading, inline notification, upload drop area,
  avatar group and login form. Labels that could not be changed before (the
  login form's field labels, its divider and provider buttons, the avatar
  group's overflow name, the table's view switch, the combobox's options
  button and the multi select's selected values list) can now be translated.
  A label attribute on an element still wins over the catalog.
  
  New catalog keys in the core: `avatarGroup.more` (a plural message),
  `loginForm.email`, `loginForm.emailPlaceholder`, `loginForm.password`,
  `loginForm.divider`, `loginForm.provider`, `table.view`, `table.viewTable` and
  `table.viewCards`.
  
  The Svelte, Vue and React adapters re-export the catalog as `en`, so they
  carry the new keys too; their components are unchanged.
- 4b80589: Form reset restores the current default, silently (ADR 0012). Every
  Svelte control that submits a value now tracks a default that follows its
  value prop (except a give-back of what the control itself reported): the
  native ones carry it as a real DOM default, the composite ones carry the
  payload in their hidden inputs, and each puts its own state back when its
  owner's reset event arrives: after every listener, after the native restore, and not at all
  when a listener cancelled the event. The composite families restore the
  payload their hidden inputs carry; the combobox restores its committed
  text too, so an Escape after a reset settles on the restored label. The
  core gains formReset.onFormReset, the shared listener that resolves the
  owner at event time, so a moved or re-associated control follows its
  real form. NumberField's target is no longer frozen at mount.
- 7393fd6: Initial public release (0.1.0): the framework-agnostic headless core and the
  Svelte adapter, with the full component set (Phases 1–6), design tokens
  (light/dark), and `vitest`/`vitest-axe` coverage.
- 198b953: The PIN input arrows follow the reading direction: in a right-to-left layout,
  ArrowLeft moves to the next cell and ArrowRight to the previous one. The core
  keydown handler reads the cell's computed direction on each press, or takes
  the new `direction` option of `pinInput.connect`; the new `pinInput.keyTarget`
  answers which cell a key moves to. Every adapter follows, with no change to
  its props.
  
  The number field, the PIN input and the time field accept Arabic-Indic
  (U+0660–0669) and Persian (U+06F0–06F9) digits in every locale, typed, from a
  soft keyboard or pasted. The value they report keeps ASCII digits. The public
  `i18n.foldDigits` is unchanged: it still folds only the locale's own digits.
  
  A locale that groups thousands with an apostrophe, such as `de-CH`, takes both
  the typographic `’` it displays and the straight `'` keyboards type. No other
  locale takes an apostrophe, and a malformed number stays invalid.
  
  The time field takes a paste: a whole time, such as `09:30`, sets every
  segment, and other text types its characters from the focused segment, as
  the keys would. Before, the segments refused every paste.
  
  The rules are held by the shared vectors the Flutter adapter reads too.
- 31edd44: The packages move from the `@design-system/*` scope to `@nozcadesign/invisible-ui-*`, the name of the project. Import from `@nozcadesign/invisible-ui-core`, `@nozcadesign/invisible-ui-svelte`, `@nozcadesign/invisible-ui-vue`, `@nozcadesign/invisible-ui-react` and `@nozcadesign/invisible-ui-elements`, with the same subpaths as before. Nothing was published under the old scope, so no alias is kept.
- a65e431: The headless menu supports submenus, as `docs/menu-submenu-spec.md`
  describes.
  
  **Submenus in the data.** A `MenuEntry` can be a `submenu`
  (`{ type: "submenu", value, label, disabled?, items }`), at any depth, in a
  group too. Existing items, groups and separators stay valid. A value used
  twice anywhere in the tree throws in development, and a submenu more than
  two levels below the root warns. A submenu with no enabled item behaves as
  disabled.
  
  **Submenus in `menu.connect`.** The state gains `openPath`, and the options
  gain `setOpenPath` and `direction`. The API gains `openPath`,
  `openSubmenu`, `closeSubmenu`, `getSubmenuTriggerProps`, `getSubmenuProps`,
  `entriesAt`, `levelOf` and `findEntry`; the module gains `isSubmenu`,
  `isStopDisabled`, `findEntry`, `entriesAt` and `submenuId`. Enter, Space and
  the arrow toward inline-end open a submenu and focus its first item; the
  arrow toward inline-start and Escape close one level; Tab closes every
  level; arrows, Home, End and typeahead stay within one level. The arrows
  follow right-to-left text. Activation closes every level, then reports
  once; a submenu trigger never reports, and `onOpenChange` reports the root
  menu only.
  
  **Menubar coordination in `core`.** A new `menubar` module owns the roving
  tab stop across the top menus, one open menu at a time, and the left and
  right arrows between top menus. It acts on an arrow only when the open
  menu left it unhandled, so the arrow opens or closes a submenu first, and
  it mirrors the arrows in right-to-left text.
  
  **Submenu geometry.** `menu.isInGraceArea` and `menu.placeSubmenu` give the
  grace area and the side a submenu opens on, as pure functions. Shared test
  vectors in `core/src/menu/__vectors__/` hold the expected results for every
  platform.
  
  **Space on a checkable item keeps the menu open.** In every menu, Space on
  a checkbox or radio item now reports it and leaves the menu open, so
  several options can be set in a row. Enter and a press still close the
  menu before reporting. This reaches the Svelte, Vue and custom element
  menus through `core`.
- 49db2e6: Add `navigationBar` to the core: the landmark, list and destination props,
  the arrow keys (mirrored under right to left, no wrap), `select` with one
  report per activation and none for an unavailable destination, the spoken
  name with badge, position and current marker, and the badge announcements
  held while a modal dialog is open. The message catalog gains
  `navigationBar.label` ("Main"), `navigationBar.position` ("Tab {index} of
  {count}"), `navigationBar.current` ("current page") and
  `navigationBar.announcement` ("{label}: {badge}").
- 198b953: Navigation Menu: hover opens a panel while the pointer stays, the first click
  keeps it open even when hover opened it, and a second click closes it; a
  pending hover delay never reopens a panel a click, Escape or an outside press
  closed. Activating a link closes the panel before the browser follows it and
  leaves focus where the page puts it, falling back to the trigger only when
  focus would be lost. Links accept `current`: the current link gets
  `aria-current="page"` and a visible mark that does not rely on colour alone,
  and its trigger is marked on screen only. In core, the state gains `kept` and
  `setValue` receives it.
- 5b04a4f: A portalled popup takes the direction of the control that opens it, so a
  `dir` on a plain wrapper around the control counts, with or without a locale
  provider. Svelte and React read it each time the popup opens, Vue on each
  render of the overlay; the custom elements keep their popups inside the
  element, which already inherit it. The core adds `i18n.elementDirection`.
- 49122de: Range Slider: a two-thumb slider on two real range inputs, in core and both adapters.
  
  `RangeSlider` is its own component, never a mode on `Slider`. The value is an ordered pair and everything about it — the clamp, the bound each thumb reports, the change it announces — works on the pair as a whole. Two native `<input type="range">` elements share one track, so each thumb keeps the browser's own slider role, keyboard map, pointer drag, focus and form participation.
  
  **Both thumbs keep the slider's global `min` and `max`, always.** Giving a thumb the narrower bounds its sibling allows was measured moving it on screen while its value stood still, because a native thumb renders at `(value - min) / (max - min)` of the track. The bound a thumb may not cross travels instead as an explicit `aria-valuemin` / `aria-valuemax` override, and as `aria-valuetext`, which says in words why the arrows stop there. ARIA-in-HTML discourages that override on a native range input, so the text is not a nicety: `aria-valuetext` is permitted there, and does not depend on the override being honoured.
  
  **The thumbs never cross and never trade places.** A thumb driven past its sibling stops at the sibling's value, less `minDistance` when one is given; the sibling does not move, and neither thumb becomes the other. `minDistance` is rounded *up* to the step grid, never down, and capped at the widest distance the grid can hold between `min` and `max`: the pair is never closer than was asked, and a distance wider than the track leaves exactly one legal pair, `[min, max]`. A pair with no room above for the distance slides down instead of staying invalid. DOM order, tab order and thumb identity hold even when both values are equal.
  
  One action reports the complete pair exactly once, through `onValueChange`. Reflecting a controlled `value` reports nothing, and neither does a native form reset, which restores the current default pair — normalized the same way a drag would be, so a reset with no script running can never leave an invalid pair on screen. Both thumbs submit under one `name`, in order: `FormData.getAll(name)` reads `["20", "80"]`.
  
  **Constraints may change after mount.** `min`, `max`, `step`, `minDistance`, `orientation` and `disabled` reach the machine, the DOM, the fill and the dependent bounds without a remount, in both adapters, and report nothing. A pair the new constraints no longer allow is normalized silently, and the form-reset default with it.
  
  **Only the thumbs take a press.** That gives up the native click-to-jump on bare track and buys a press that lands on the thumb the user aimed at. The nearer thumb is raised as the pointer moves, along the logical axis: horizontal LTR, horizontal RTL (where a native range paints `min` on the right) and vertical (where it paints `min` at the bottom) alike, and never while a drag is in flight. Stacked thumbs stay operable without a hover: a pointer to one side of the stack reaches the thumb that would move that way, and with no pointer over the track at all, as for a touch, the upper thumb is on top unless the pair is stacked at `max`, where only the lower one can move. How touch assistive technology reaches a stacked pair is not verified before the manual accessibility session.
  
  Props are `value`, `min`, `max`, `step`, `minDistance`, `orientation`, `disabled`, `label` for the group, `thumbLabels` for the two thumbs, `name`, `format`, `showValue`, `showRange` and `ticks`. Vue also binds with `v-model`. New tokens are `--ds-range-slider-length`, `--ds-range-slider-vertical-length`, `--ds-range-slider-track-size` and `--ds-range-slider-thumb-size`, whose default is 24px, the smallest pointer target WCAG 2.2 accepts. Core gains the `rangeSlider.lowerText` and `rangeSlider.upperText` messages.
- b5ceb49: Breaking: every deprecated name is removed. The packages are unpublished and have no consumers yet, so the old names go now instead of before 1.0. The catalog is 80 components.
  
  **`Menu` is removed; use `Sidebar`** (ADR 0013). Same props, slots and behaviour.
  
  - Svelte: `import Menu from "@nozcadesign/invisible-ui-svelte/Menu.svelte"` becomes `import Sidebar from "@nozcadesign/invisible-ui-svelte/Sidebar.svelte"`. The `MenuItem` and `MenuSection` types become `SidebarItem` and `SidebarSection`.
  - Vue: `Menu`, `MenuProps`, `MenuEntry` and `MenuSection` become `Sidebar`, `SidebarProps`, `SidebarItem` and `SidebarSection`.
  - The sidebar no longer reads its former theme names. Rename each one: `--ds-menu-gap` to `--ds-sidebar-gap`, `--ds-menu-width` to `--ds-sidebar-width`, `--ds-menu-bg` to `--ds-sidebar-background`, `--ds-menu-border` to `--ds-sidebar-border`, `--ds-menu-item-text` to `--ds-sidebar-item-text`. `--ds-menu-padding` and `--ds-menu-radius` stay: the ARIA menus use them.
  
  **The `-soft` color tokens are removed; use the role names.**
  
  - `--ds-color-primary-soft` becomes `--ds-color-secondary-surface`.
  - `--ds-color-on-primary-soft` becomes `--ds-color-on-secondary-surface`.
  - `--ds-color-danger-soft` becomes `--ds-color-destructive-surface`.
  - `--ds-color-on-danger-soft` becomes `--ds-color-on-destructive-surface`.
  
  **Former message keys are removed from core's catalog, and an override of them no longer answers for the new key.**
  
  - `menu.label` becomes `sidebar.label`.
  - `searchDialog.resultOne` and `searchDialog.resultMany` become one plural message, `searchDialog.results`: `{ one: "{count} result available", other: "{count} results available" }`.
  - `rating.star` (with `rating.stars` as its plural pair) becomes one plural message, `rating.stars`: `{ one: "{count} star", other: "{count} stars" }`.
- 0ae4309: **Breaking for a consumer of a menu, encoded as a minor while the package is
  0.x.** A menu now reports `onOpenChange(false)` before `onSelect(value)`,
  where it used to report them the other way round. A handler that read the
  menu's open state from inside `onSelect`, or that reopened the menu from
  there, sees the opposite of what it saw before. Migration: a handler that
  wants the menu to stay open calls `openMenu()` from `onSelect`, which now
  works; one that relied on reading `open` as `true` there reads `false`.
  
  ADR 0011 gains the rule this follows: a component writes its state before it
  reports the change. The rule was not written down, which is how eight
  components came to break it.
  
  Eight fixes to what a consumer sees.
  
  Every callback a Svelte factory reports is now reported after that factory's own state is written, not during. A handler reading the control's store saw the value from before the change, and a handler writing to it lost that write without a word; both were silent, and both are gone. "Every" is a check rather than a claim: a test reads the factory sources and lists every callback it can find them reporting, whether they call it, hand it to core, pull it out of the options or reach it through a string, and fails until each one is either asserted or named with the reason it cannot be.
  
  A menu says which item was chosen after it has closed, in the two adapters that ship one, because core decides that order. A handler that read the menu saw it still open, and one that reopened it was closed again straight afterwards. The notification list empties before it tells each notification it is gone, so a handler that shows a replacement keeps it.
  
  The Pin Input announces a completion only for a value its state still holds. A page that cleared the field from its own change handler was told the pin was complete, with the cleared cells already in the state. Svelte and Vue answer the same way.
  
  The Svelte Carousel follows a changed slide list. Five slides, moved to the fifth, then given three: no slide was active and Next was disabled, with no way back. The count, the loop and the orientation now follow the props, and the current slide is clamped into the new count without reporting a change, because the page did not choose it.
  
  Both styled Carousels tell core which way they run, so a vertical carousel moves with Up and Down instead of Left and Right.
  
  The Vue Number Field hears the reset of a form it names with the `form` attribute from outside it. The attribute reached only the hidden input that submits the value, so the field kept the edit while every other adapter put it back.
  
  The React Combobox and Multi Select put their list inside the dialog they are in, as the other adapters do. A list in the page body shows through the dialog's layer and cannot be clicked.
- 297baed: Add a Search Field composition with a native search input, a conditional clear
  button, and a submit button inside one visual control. The four adapters share
  the same accessible names, controlled value behavior, focus restoration, and
  form semantics.
- 5b04a4f: Sheet Dialog takes the logical sides `start` and `end`, and `end` is the new
  default. The physical names `left` and `right` are removed: they placed the
  panel by the reading direction anyway, so `left` becomes `start` and `right`
  becomes `end`. Nothing was published, so no alias is kept. In
  right-to-left text the panel now slides in from the edge it sits on and is
  dragged closed toward it; before, the slide-in came from inside the screen
  and the drag could not close it. A released drag no longer animates its snap
  back under `prefers-reduced-motion`. The drag distance reaches the sheet
  through the `--_sheet-drag` custom property instead of an inline `transform`.
  The drawer of Sidebar now asks for `start` or `end`, so its edge is right in
  right-to-left text too. Core exports the shared rules as the `sheetDialog` namespace:
  `edge`, `outward` and `shouldDismiss`, and `SheetSide` holds only `top`,
  `bottom`, `start` and `end`.
- ae10a17: Sidebar takes the Navigation Bar's destinations as they are, badges and
  unavailable destinations included. A `badge` shows a count or a dot, after the
  label or on the icon in the rail; its text is part of the item's name, and a
  badge that appears or changes is announced politely once (`announce: false`
  silences it), held while a modal dialog outside the sidebar is open (ADR 0016).
  An `unavailable` item stays visible and focusable with its reason shown and
  read as its description, and activating it does nothing. The rail marks the
  current item with a bar at the inline start, so it never relies on colour.
  
  The core's `navigationBar` gains `destinationProps`, the state and activation
  of one destination that the bar and the Sidebar share, and
  `createBadgeAnnouncer`, the badge comparison and the hold behind a modal that
  every adapter's live region uses. The message catalog gains
  `sidebar.unavailableTooltip` ("{label}: {reason}"), the rail's tooltip on an
  unavailable item. The badge reads `--ds-sidebar-badge-surface` and
  `--ds-sidebar-badge-text`.
- 036656d: Sidebar: the application's side navigation under its own name, with collapsible sections, a rail and a drawer.
  
  The component that carried this pattern shipped as `Menu`, a name the WAI-ARIA menu family already owns and which it never used: `core/menu` is the menu-button pattern behind Dropdown Menu, Context Menu and Menubar, while this renders a `<nav>` of links. It is `Sidebar` now (ADR 0013).
  
  `Sidebar` takes the same props (`sections`, `value`, `label`, `onSelect`), the same `logo` and `footer` slots, the same landmark and `aria-current="page"`. The `Menu` name itself is removed in this release (see the changeset on deprecated names).
  
  New in the component: sections that collapse (`collapsible: true`, each with its own `id`, which is the name it answers to in `openGroups`), a rail that hides labels from sight while leaving every name in the accessibility tree, and `mode="drawer"`, which puts the same navigation inside a Sheet Dialog. The routing, the current destination and the breakpoint policy stay with the application.
  
  Two rules are worth knowing before you reach for them. The rail is offered only when every destination carries an `icon`: collapsing hides the labels, and a destination with nothing to show would be a control with a name and no face, so without icons no toggle is rendered and `collapsed` keeps the labels. And a collapsible section needs an `id`: sharing a label is fine, sharing a name would mean sharing an open state.
  
  New tokens are `--ds-sidebar-*`. Padding and radius fall back to `--ds-menu-padding` and `--ds-menu-radius`, which stay canonical for the ARIA menus that share them.
  
  Core gains the `sidebar.label`, `sidebar.collapse`, `sidebar.expand` and `sidebar.open` messages.
- 198b953: Toggle Button is a native `<button type="button">` with `aria-pressed` in
  every web adapter, no longer a checkbox styled as a button. Its accessible
  name never changes with the state, and Enter and Space toggle it. With `name`,
  a hidden input still submits `value` while the button is pressed, so forms
  receive the same data; this form participation is provisional. A form reset
  still restores the default pressed value. Styles target `.toggle` (the button)
  and `[aria-pressed="true"]`; `.toggle__input` and `.toggle--disabled` are
  gone, and in Elements the host holds the `button.toggle` instead of being it.
- 198b953: Toggle Group adds the shared keyboard rule from `toggleGroup` in core: with
  three or more toggles the group is one Tab stop, the arrow keys move focus
  between the enabled toggles (mirrored in right-to-left text, Up and Down in a
  vertical group) and Home and End jump to the ends; with one or two toggles
  each keeps its own Tab stop; inside a Toolbar the toolbar's keys apply.
  Moving focus never changes a toggle, and adding or removing toggles never
  loses focus. The container stays `role="group"` with an optional name.
- 198b953: The toggle group's keyboard behaviour moves to the core as
  `toggleGroup.manage(root, { orientation, selector })`, which returns its
  teardown. It applies the shared rule to a group element in the page: one tab
  stop with arrow keys and Home/End from three toggles, mirrored in
  right-to-left text, nothing added inside a toolbar, and toggles that are
  added, removed or disabled later followed, with focus handed to the toggle at
  the removed one's place. It sets no style. Svelte, Vue, React and Elements
  now call it in place of four copies of the same logic; what users see and
  press does not change.
- 5789966: Add controlled asynchronous child loading to Tree View. Unloaded parents can
  request children without giving the design system network access; loading,
  failure, retry, concurrent requests and response ordering are explicit parts of
  the public contract.
- 198b953: Tree View gains typeahead: a character, or a quick sequence of them, moves
  focus to the next visible node whose label starts with it, never the
  selection. Select, menu and tree share one matcher in core. The disclosure
  arrow always expands and collapses its node, also after a failed load; Right
  Arrow still retries. Svelte and Vue now mirror the arrow keys in
  right-to-left text, as the spec and the other adapters do.
- 198b953: The core gains `uploadDropArea.acceptsFile(file, accept)` and
  `uploadDropArea.splitFiles(files, { accept, multiple })`: the `accept`
  attribute's format (extensions, media types and type families, without
  case), and the split into the files an upload area takes and the ones it
  leaves out, with the reason, `type` or `count`. The Flutter adapter answers
  the same shared vectors.
  
  Every Upload Drop Area filters picked and dropped files the same way. The
  files it leaves out never reach `onFiles` (the `files` event in Elements) and
  never join the form; they are reported to the new `onRejected` callback (the
  `reject` event, with `detail.rejected`, in Elements) and named in an alert
  under the area, with the hazard glyph, that the file input points at through
  `aria-describedby`. A single-file area takes the first file that passes and
  names the others. Dropped files the area takes still become the input's
  files, so they submit and a form reset clears them. The filter is a
  convenience: the app still validates what it receives.
  
  React's drop filter, which dropped rejected files silently, gives way to the
  core one, and React no longer has a local `acceptsFile`. In Vue the area
  renders the message beside its label, so its attributes now go on the label
  by hand.

### Patch Changes

- 285daae: The public API report shows the declaration behind every namespace alias. The declaration bundle re-exports each machine's types as `type ns_Name = Name;`, and the report recorded that line, which says nothing about the type: a member added to or removed from a public interface left the report unchanged. The report now records what the alias points at, so such a change is a diff, and the gate fails on it. No package's API changes; the committed reports change once.
- 5b04a4f: Arrow keys follow the reading direction in Tabs, Pagination, Calendar,
  Carousel and Menubar in Svelte and Vue, as they already did in React and
  Elements. The core connections of those five read the computed direction of
  the focused control on each key press when no `direction` is given, so a `dir`
  set anywhere above counts, with or without a locale provider; React and
  Elements Calendar use it instead of their own swap. In Svelte and Vue the
  Menubar now routes its keys through the core menubar, and an arrow onto a
  disabled menu moves DOM focus to that trigger together with the tab stop.
- 0035d7a: The shared catalog gains `button.copied` ("Copied"), the confirmation shown
  beside a button after it copied its value (ADR 0016). The Svelte, Vue and
  React adapters re-export the catalog as `en`, so they carry the new key too;
  their components are unchanged.
- ddcb5bf: The message catalog gains `calendar.current` ("today"), appended to today's
  accessible name in a calendar where a platform has no semantic property for
  the current date.
- 21d9b60: The calendar shows the right weekday and month names in every time zone.
  The names came from dates at UTC midnight, which fall on the previous day
  west of UTC: in Los Angeles a week starting on Sunday showed Saturday first,
  the two-month view showed May and June for June and July, and the year view
  started with December. The core now builds the dates for the formatters at
  local midnight (`localDate`, `weekdayDate`, `monthDate`), and the Svelte,
  Vue and custom element calendars use them.
- 3a72a48: `weekStart.forLocale(locale)` returns the first day of the week a
  locale uses (1 = Monday … 7 = Sunday), from CLDR's week data and likely
  regions, with no dependency on the runtime's `Intl` support. The table and its
  test cases are shared with the Flutter adapter in
  `core/src/calendar/__vectors__/week-start.json`. The adapters' calendar
  defaults are unchanged.
- 33d6707: Combobox's clear button now answers the keyboard, in every adapter.
  
  `clearProps` carried only `onMouseDown`, so the button announced a name and did nothing for Enter, Space, or a screen reader's own activation. With `searchable={false}` the input is read-only, so there was no keyboard way at all to empty the control.
  
  The clear now happens on the button's own `click`, which the browser generates for a pointer press, for Enter and Space, and for a direct activation alike; `onMouseDown` only keeps focus on the input, so a pointer press clears exactly once. The button is in the tab sequence, and in the accessibility tree, only while there is something to clear and the control is enabled, from one rule in core that every adapter now mirrors. DOM focus lands on the input after every route, a pointer press included, since the button it was on stops existing the moment the text is gone.
  
  `core`'s `combobox.ConnectOptions` gains an optional `focusInput`, which every adapter now passes; nothing else about the public contract changes.
- a682e61: A disabled combobox is closed, and answers nothing. Turning a control off
  left its list open over an input that takes no key, so a keyboard user had
  no way to dismiss it; every adapter now closes the list. The core refuses
  every key while disabled and cancels none, so a still-focusable input keeps
  its caret keys, and it no longer clears its value or moves its highlight
  for a pointer. The custom element, whose visible input is not natively
  disabled, no longer opens or filters when typed into or when the chevron
  is pressed, and it shows the disabled look every other adapter shows.
- 72477c9: The message catalog gains `pagination.current` and `breadcrumb.current`
  ("current page"), read with the current page of a pagination or a
  breadcrumb trail where a platform has no semantic property for it.
- 22fe40b: The message catalog gains `menu.submenu` ("submenu"), the hint that marks a
  menu item opening a submenu where a platform has no semantic property for it.
- fe34556: A disabled menu trigger now carries `data-disabled` from the core, next to
  `aria-disabled`. The dropdown menu and menubar triggers in Svelte and Vue now
  show the disabled look their stylesheets already defined. The web components
  no longer set the attribute themselves.
- 3a72a48: The message catalog gains `multiSelect.added` ("{name} added") and
  `multiSelect.removed` ("{name} removed"), announced politely after a value is
  added to or removed from a multi select on a platform with no live tag list.
- b8cf4a3: Every package exposes `./package.json` through its export map: build tools
  and component analyzers probe it, and the strict maps refused it. Additive
  only.
- 5b04a4f: Without a locale provider, a component now reads the page direction from
  `<body dir>` as well as from the document element, and follows a runtime
  change of either. Before, a page that set `dir="rtl"` on the body only got
  popups forced to left to right.
- 2d0ed68: Prepare the five web packages for their first public alpha release: publish
  them under the `alpha` dist-tag, add registry metadata and document the secure
  bootstrap and trusted-publishing workflow.
- 5b04a4f: The Scroll Area horizontal thumb follows a right-to-left viewport, whose
  `scrollLeft` is zero or negative: it starts at the right, moves as the content
  scrolls, and a drag moves the content the way the thumb goes.
  `scrollArea.scrollByThumbDrag` takes the viewport's direction as a third
  argument, `"ltr"` by default.
- 3a72a48: The message catalog gains `sidebar.current` ("current page"), read with a
  sidebar's current destination where a platform has no semantic property for
  it.
- 3a72a48: The message catalog gains `stepper.current` ("current step"), read with the
  current step of a stepper where a platform has no semantic property for it.
- 4fb7dd6: A filtered table announces its result count politely when filtering changes
  it, in Svelte, Vue and React as in the custom elements: a live region outside
  the table says "3 results", and stays silent on the first render, on an
  unchanged count and on rows that arrive with no filtering behind them. The
  no-results state is announced once, by its status. The decision is
  `table.tableResultsUpdate` in core, which the custom element now uses too.
- 4fb7dd6: A table wider than its Table Set card scrolls inside the card instead of being
  cut off. The card becomes a named region with `tabindex="0"` only while it
  overflows, so the keyboard can scroll it and a table that fits adds no tab stop
  (WCAG 2.2 1.4.10, 2.1.1). Core gains `scrollArea.observeInlineOverflow`, which
  reports when a container's content becomes wider than the container.
- 3a72a48: The message catalog gains `table.sortedAscending` ("sorted ascending") and
  `table.sortedDescending` ("sorted descending"), read with a sorted column's
  header where a platform has no aria-sort, and five Upload Drop Area messages:
  `uploadDropArea.browse` ("Browse files"), `uploadDropArea.rejectedType` and
  `uploadDropArea.rejectedCount`, shown and announced for each file the accept
  filter or the one-file limit leaves out, `uploadDropArea.files` ("Selected
  files") and `uploadDropArea.remove` ("Remove {name}"). The table, carousel and
  locale direction logic gains shared test vectors.
- 4fb7dd6: A disabled tab is no longer a tab stop: the core gives it `tabindex="-1"`
  instead of leaving a native button to be tabbed to. The Toolbar leaves keys to
  a control that needs them: in a text input the caret keys, Left and Right
  (Up and Down in a vertical toolbar) and Home and End, stay with the input, and
  a multi-line field keeps every arrow. The core's `toolbar.nextIndex` takes a
  `control` kind, and `toolbar.controlKind` tells what an element is.
- 3a72a48: The message catalog gains `tree.expand` ("Expand"), `tree.collapse`
  ("Collapse") and `tree.retry` ("Retry"), the actions a tree branch offers
  where a platform has no expanded-state actions, and `navigationMenu.current`
  ("current page"), read with the navigation menu's current link where a
  platform has no semantic property for it.
