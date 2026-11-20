# @nozcadesign/invisible-ui-svelte

## 0.1.0-alpha.1

### Minor Changes

- 240ad9e: The Svelte adapter now keeps the conventions in ADR 0011 for every prop a
  consumer can control.
  
  **Reflection reaches the control.** A changed `value` reflects into the
  switch, radio group, checkbox group, slider, pin input, rating group,
  segmented control, time field, text field, textarea, accordion and tree,
  and a changed `open`, `current` or `selected` into the dialogs, the
  popover, the collapsible, the stepper and the tree. Several of these
  could not be driven from the outside at all before.
  
  **Reflection reports nothing.** Opening a dialog or a popover from the
  outside used to call `onOpenChange`, and pressing a toggle button's prop
  used to call `onPressedChange`: a parent was told about a change it had
  made itself.
  
  **A swapped callback is honoured.** Every one of these components
  captured its callback at mount, so a consumer that replaced it kept
  hearing from the old one.
  
  Two related repairs found while proving the above: the stepper's step
  status is now recomputed when the step changes, and the time field takes
  a value the consumer echoes back as the committed one, so Escape cannot
  revert past it.
  
  Additive public surface on the headless factories: `syncChecked`,
  `syncDisabled`, `syncValue`, `syncPressed`, `syncOpen`, `syncStep`,
  `syncExpanded`, `syncSelected`, `syncFocus`, `syncView`.
- 198b953: Calendar, Date Picker and Date Range Picker start the week on the locale's
  first day by default, from `weekStart.weekStartsOn(locale)` in core (CLDR,
  language and region), with the locale read from the i18n provider so server
  and client agree. Svelte, Vue and React defaulted to Monday; Elements used
  `Intl` and now uses the same core table. `weekStartsOn` still overrides it.
- 7dd0b61: Define `--ds-code-block-background` in `tokens.css`, from the
  `code-block-background` component token of each theme in the design source.
  Every code block sheet reads it for its background. The light theme takes `neutral-50`, `#f5f5f5`, in place
  of `color-surface`; the dark theme takes `neutral-950`, `#1b1b1b`, the darkest
  grey short of black, in place of `neutral-700`. The code block also drops the
  line between its header and its code: spacing alone sets the header apart,
  and the card keeps its outer border.
- ade01ac: Add a component tier of background tokens, so each kind of component can
  change its background without touching the others. `tokens.css` defines
  `--ds-page-background`, `--ds-card-background`,
  `--ds-card-secondary-background`, `--ds-dialog-background`,
  `--ds-popover-background`, `--ds-menu-background`,
  `--ds-sidebar-background` and `--ds-code-block-background`, each pointing at
  a role or a palette colour. Cards, dialogs (Dialog, Sheet, Alert, Confirm,
  Prompt, Search), popovers (Popover, Hover Card, date picker popups,
  Navigation Menu panel), menus and listboxes (Dropdown Menu, Context Menu,
  Menubar menus, Combobox, Multi Select), the Sidebar and the Code Block read
  them.
  
  The palette gains Black, `--ds-black`, `#121212`, a near black beside White,
  and `--ds-brand-black` now points at it. In the dark theme the page and the
  sidebar take Black; cards, dialogs, popovers, menus and code blocks take
  Grey 950; the secondary card takes Grey 900. `--ds-color-background` stays
  Grey 900 in the dark theme for fields, buttons and the other controls.
  
  The light theme keeps its look, except the Multi Select listbox, which now
  takes White like the other listboxes instead of `--ds-color-surface`.
  
  Breaking: `--ds-card-bg`, `--ds-card-secondary-bg`, `--ds-sidebar-bg` and
  `--ds-code-block-surface` are renamed to `--ds-card-background`,
  `--ds-card-secondary-background`, `--ds-sidebar-background` and
  `--ds-code-block-background`. In Flutter, `InvisibleColors.codeBlockSurface`
  is renamed to `codeBlockBackground`, and `InvisibleColors` gains
  `pageBackground`, `cardBackground`, `cardSecondaryBackground`,
  `dialogBackground`, `popoverBackground`, `menuBackground` and
  `sidebarBackground`.
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
- aa4ecd1: Every dialog in the family now shares one header: an optional feedback icon,
  an optional leading ghost button, the title with optional context and
  subtitle, optional actions and a close button, all centered against the title.
  `closeButton` turns the close button on or off: on by default for `Dialog` and
  `SheetDialog`, off by default for `AlertDialog`, `ConfirmDialog`,
  `PromptDialog` and `SearchDialog`. `SearchDialog` can show its title with
  `hideTitle={false}`. The `SheetDialog` description is now the subtitle inside
  the header. The header classes are now `dialog-header__*`.
- 198b953: Define `--ds-dialog-overlay` in `tokens.css`, from the `dialog-overlay` role
  of each theme in the design source. Every dialog sheet already reads it for its `::backdrop`. The
  light value is the darkest neutral at half opacity, `rgb(27 27 27 / 0.5)`.
  The dark theme gets its own, `rgb(0 0 0 / 0.6)`: the dialog surface now
  measures 1.27:1 against the dimmed page instead of 1.07:1. That separation is
  a theme choice, not an accessibility requirement.
- c0eb336: A disabled control no longer submits its value. Every family that
  carries its value in a hidden input (combobox, multi-select, pin input,
  time field, date picker, date range picker) left that input enabled, so
  a form sent the value of a control the user could not touch. Native
  controls have never done that.
  
  **If you relied on the old behaviour**, the platform's way to keep a
  control frozen but still submitted is `readOnly`, and only MultiSelect
  offers it today: for the other families, render your own hidden input
  alongside a disabled control until they do.
- 6bc41ab: Add `ds-card`, `ds-tag`, and `ds-separator` with light-DOM composition,
  reactive attributes, native semantics, and the existing adapter styles.
  
  Add the `secondary` Card surface hierarchy to Svelte, Vue, and Elements. It is
  controlled by `surface="secondary"` and resolves through
  `--ds-card-secondary-background`, while the default remains
  `--ds-card-background`.
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
- b2fd59d: Define `--ds-grid-cell-secondary-surface` in `tokens.css`, from the
  `grid-cell-secondary-surface` role of each theme in the design source: the
  surface of a data grid cell with the secondary emphasis, allowed but outside
  the usual schedule. The light value is neutral 50, `#f5f5f5`; the dark value
  is neutral 800, `#323232`. The text, the secondary text and the danger text
  keep 4.5:1 on both.
- 7e549f4: `hideLabel` now works on every field component. Svelte and Vue add it to
  `Switch`, `Textarea` and `Combobox` (`Checkbox` already had it); React adds it
  to `Checkbox`, `Switch` and `Combobox`. The label leaves the screen and stays
  the control's accessible name.
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
- 49db2e6: Add `navigationBar` to the core: the landmark, list and destination props,
  the arrow keys (mirrored under right to left, no wrap), `select` with one
  report per activation and none for an unavailable destination, the spoken
  name with badge, position and current marker, and the badge announcements
  held while a modal dialog is open. The message catalog gains
  `navigationBar.label` ("Main"), `navigationBar.position` ("Tab {index} of
  {count}"), `navigationBar.current` ("current page") and
  `navigationBar.announcement` ("{label}: {badge}").
- 49db2e6: Define `--ds-navigation-bar-current-indicator` in `tokens.css`, from the
  `navigation-bar-current-indicator` role of each theme in the design source:
  the shape behind the current destination's icon in a Navigation Bar. The
  light value is the secondary mixed 90% with white, `#8763d1`; the dark value
  is the secondary mixed 74% with neutral 50, `#9a7cd7`. Both reach 3:1
  against the surface and against the text drawn on them (WCAG 1.4.11).
- 49db2e6: Add `NavigationBar` (`@nozcadesign/invisible-ui-svelte/NavigationBar.svelte`): primary
  navigation between a few sections, a `<nav>` around a list of links (`href`)
  or buttons (`onSelect`), `aria-current="page"` on the application's `value`,
  unavailable destinations kept focusable with their reason, and badges whose
  text is part of the name and whose changes are announced politely, held
  while a modal dialog is open.
- 198b953: Navigation Menu: hover opens a panel while the pointer stays, the first click
  keeps it open even when hover opened it, and a second click closes it; a
  pending hover delay never reopens a panel a click, Escape or an outside press
  closed. Activating a link closes the panel before the browser follows it and
  leaves focus where the page puts it, falling back to the trigger only when
  focus would be lost. Links accept `current`: the current link gets
  `aria-current="page"` and a visible mark that does not rely on colour alone,
  and its trigger is marked on screen only. In core, the state gains `kept` and
  `setValue` receives it.
- 7dd0b61: The interface neutrals move from the Warm Grey ramp to the palette's neutral
  Grey ramp, so every text, surface and border colour changes. `--ds-neutral-0`
  stays white; 50 to 950 become `#f5f5f5`, `#e0e0e0`, `#bdbdbd`, `#9e9e9e`,
  `#757575`, `#616161`, `#515151`, `#414141`, `#323232`, `#272727` and
  `#1b1b1b`. The warm ramp made the dark theme look brown, and a neutral grey
  suits any product. Warm Grey stays in the palette as a hue of its own.
  
  Every role mixed with a neutral is recomputed, and so is every literal
  fallback in the component sheets. The light dialog overlay becomes
  `rgb(27 27 27 / 0.5)`. All contrast pairs keep their thresholds: body text
  14.94:1 on the light page and 13.70:1 on the dark one, secondary text 6.01:1
  and 5.43:1 on a surface, the control boundary 3.49:1 and 3.81:1 on a surface,
  the focus ring 3.03:1 and 3.39:1 on a surface, the solid warning label 4.71:1
  in both themes. The dark navigation bar indicator mixes 74% of the secondary
  instead of 75% (`#9a7cd7`), to keep 3:1 against the darker grey surface.
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
- 3704648: `SearchField` can drop its submit button for a filter that applies as you
  type: `submitButton={false}`, or `submit-button="false"` on `<ds-search-field>`. The search
  glyph then sits at the start of the field as a decorative mark, and the clear
  button stays. In Elements, the clear button no longer stays on screen while the
  field is empty.
- 297baed: Add a Search Field composition with a native search input, a conditional clear
  button, and a submit button inside one visual control. The four adapters share
  the same accessible names, controlled value behavior, focus restoration, and
  form semantics.
- 036656d: `SheetDialog` can leave its trigger to the page.
  
  `renderTrigger={false}` renders no button of its own, so an application whose hamburger belongs in its header can drive `open` directly; `returnFocusTo` names the element focus goes back to when the panel closes. Without that name focus returns to whatever held it when the panel opened, which is right when a button opened it and wrong when anything else did.
  
  The default is unchanged: every dialog still renders its own trigger and still returns focus to it. This is the one variant that can be driven entirely from outside, because a navigation drawer's button lives outside the navigation (ADR 0013).
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
- 71ede6a: Messages while a dialog is open follow ADR 0016 in the Svelte adapter.
  
  **Status area.** `Dialog`, `SheetDialog` and the alert, confirm, prompt and
  search dialogs have a status area between the body and the footer (after the
  results in `SearchDialog`) for messages about their own task. The component
  instance (`bind:this`) has `notify({ status, title, description, action,
  dismissible })`, which adds a notice styled as an Inline Notification and
  returns its id, and `dismissNotice(id)` and `clearNotices()`. `createDialog`,
  `createSheetDialog` and `createSearchDialog` return the same functions with
  the `notices` and `announcement` stores. Each notice is announced once through
  a polite live region, never takes focus, and keeps its action and close
  buttons in the dialog's tab order. Notices belong to one opening: `notify()`
  on a closed dialog returns an empty string, and closing the dialog clears
  them. The new `DialogNoticeOptions`, `DialogNoticeAction`, `DialogNotice`,
  `DialogNoticeStatus` and `DialogAnnouncement` types describe them.
  `InlineNotification` accepts `role="group"` for a notice announced elsewhere.
  
  **Copy confirmation.** `copy` on `Button` copies its text on press and shows
  "Copied" (or `copiedLabel`) beside the button for two seconds, announced
  through a polite live region. `CodeBlock` shares the same logic, takes its
  copy texts from the catalog, and no longer announces a copy when the page has
  no clipboard.
  
  **Notification region.** `NotificationRegion` holds new notifications while
  any modal dialog is open in the document and shows them, in order, when the
  last one closes; their auto-dismiss countdowns start then. Notifications
  already shown keep their place, with their countdowns held, and a change to
  one of them shows after the dialog closes. The region always mounts in
  `<body>`: it no longer moves into an open dialog around it.
  
  **Dialogs on top.** Closing a dialog, sheet or preset returns focus to the
  element that had it when the dialog opened, so a dialog opened from inside
  another hands focus back there; the trigger is the fallback, and
  `returnFocusTo` still comes first. A `close` event from an element inside the
  panel no longer closes the dialog.
- 0c336bd: Breaking: named slots are now snippet props, and forwarded events are now callback props. The last 34 components moved to the runes syntax: AlertDialog, Blockquote, Button, Calendar, Card, Carousel, Collapsible, Combobox, ConfirmDialog, Dialog, EmptyState, ErrorState, Field, InlineNotification, Link, LoadingGenerationArea, LoginForm, Notification, Popover, PromptDialog, RangeSlider, SearchDialog, SearchField, SheetDialog, Sidebar, Slider, Table, TableSet, TableView, Tabs, Tag, TextField, TreeView and UploadDropArea. Every component of the package now runs in runes mode. Behaviour, props and callbacks are unchanged; only the way content and events are passed changes (ADR 0015).
  
  A snippet keeps the name of the slot it replaces, and slot props become one object parameter with the same names.
  
  | Before | After |
  | --- | --- |
  | `<span slot="trigger">Open</span>` | `{#snippet trigger()}<span>Open</span>{/snippet}` |
  | `<svelte:fragment slot="footer">…</svelte:fragment>` | `{#snippet footer()}…{/snippet}` |
  | `<Icon slot="left">…</Icon>` (Button, TextField) | `{#snippet left()}<Icon>…</Icon>{/snippet}` |
  | Table, TableSet `slot="cell" let:row let:column let:value let:rowIndex` | `{#snippet cell({ row, column, value, rowIndex })}` |
  | Table `slot="selectionCell" let:row let:rowId let:rowIndex` | `{#snippet selectionCell({ row, rowId, rowIndex })}` |
  | Tabs `slot="panel" let:item` | `{#snippet panel({ item })}` |
  | Calendar `slot="day" let:date let:selected …` | `{#snippet day({ date, inMonth, selected, events, price })}` |
  | TreeView `slot="icon" let:node` | `{#snippet icon({ node })}` |
  | Field `let:controlProps let:controlId` | `{#snippet children({ controlProps, controlId })}` |
  | Carousel `let:item let:index let:active` | `{#snippet children({ item, index, active })}` |
  | `<Link on:click={track}>` | `<Link onclick={track}>` |
  | InlineNotification `on:mouseenter`, `on:mouseleave`, `on:focusin`, `on:focusout` | `onmouseenter`, `onmouseleave`, `onfocusin`, `onfocusout` |
  
  Three slots take a new name, because a snippet prop shares one namespace with the other props and must be an identifier:
  
  | Before | After |
  | --- | --- |
  | Popover `slot="trigger"` (the `trigger` prop is the opening mode) | `{#snippet triggerContent()}` |
  | TreeView `slot="label" let:node` (the `label` prop names the tree) | `{#snippet labelContent({ node })}` |
  | LoginForm `slot="provider-icon" let:provider` | `{#snippet providerIcon({ provider })}` |
  
  Where a slot and a prop filled the same place, they are one prop that takes either form, and the snippet keeps the name: `Card.title`, `Card.description` and `Blockquote.cite` take a string or a snippet; `actions` on EmptyState, ErrorState and InlineNotification takes the action list or a snippet that replaces the area.
  
  `bind:` keeps working, through `$bindable()`, on each controllable prop: `open` on the dialogs, Popover and Collapsible, and `value` on Tabs, TextField, SearchField, Slider, RangeSlider, Combobox and Calendar, among others. Binding a variable that holds `undefined` to one of these props now throws; give the variable an initial value.
- 09ca888: The styled table's vocabulary becomes importable the way it already is in the
  Vue adapter: `TableColumnDef` and `TableRow` move to a plain module,
  re-exported from `Table.svelte` for existing subpath imports and now exported
  from the package barrel too. `TableView.svelte`, shipped inside the package
  but unreachable through the export map, gains its subpath. Additive only.
- 55c6e2a: Tabs gains an actions area for commands such as "add": the `actions` snippet
  in Svelte, the `actions` slot in Vue, the `actions` prop in React, and children
  marked `slot="actions"` in Elements. It sits right after the tab list, on the
  same row, outside `role="tablist"`, and wraps below the tab list on a narrow
  row. Its controls are ordinary buttons: Tab reaches them after the selected
  tab, the arrow keys never do, and they never become tabs. Under a coarse
  pointer they keep the 44 by 44 touch target. The Tabs demo now adds a view
  with an "Add view" button in the actions area instead of a tab.
- dc60759: Text fields can hide their visible labels without removing the real label or
  the input's accessible name. Use `hideLabel` in Svelte, Vue and React, and
  `hide-label` on `ds-text-field`.
  
  The React adapter now includes TextField with the same field semantics, native
  form participation and styling as the other adapters.
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
- f294333: Replace canonical token names with colors, metrics, typography and components
  groups. Include the complete named palette and preserve existing Light/Dark
  values. This alpha release removes old canonical CSS names without aliases;
  use packages/tokens/migration-v2.json to migrate overrides.
- 198b953: Add `--ds-min-target-size-touch` (44px), from `density.touch.min-target-size`.
  Under `@media (pointer: coarse)`, dropdown menu items, context menu items and
  menubar items and triggers read it for both their block and inline minimum
  size, so each keeps a 44 by 44 hit area. The Svelte menus gain the same
  coarse-pointer rules, which they lacked. Visual density never reduces the
  touch target.
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
- 198b953: Slider, Range Slider, PIN Input, Rating Group and Toggle Button take an
  `error` message (the `error` attribute on `<ds-slider>`, `<ds-range-slider>`,
  `<ds-rating-group>` and `<ds-toggle-button>`; `<ds-pin-input>` already had
  it). A non-empty message shows after the control as an alert with the hazard
  glyph, the `field__error field__message` markup the text field uses, and
  every focusable control names it in `aria-describedby`: the slider input,
  both range thumbs, each PIN cell, each star and the toggle button. The slider
  inputs and the PIN cells also take `aria-invalid`; the stars, the groups and
  the toggle button do not. On the PIN input, the error also gives the cells
  the invalid look of `invalid`.
  
  The app owns the message: it passes it and clears it, and a form reset
  leaves it in place. There is no validation hook.
  
  In Vue, PIN Input and Toggle Button render the message beside their root
  element, so their attributes now go on the group and the label by hand.
- 198b953: Add `--ds-color-warning-label-surface`, the fill behind a text label with the
  warning status. The solid warning Tag and the warning Count paint it under
  `--ds-color-on-warning`: 4.71:1 in both themes, where the warning colour gave
  that text 3.8:1, below the 4.5:1 that WCAG 1.4.3 asks of text. The fill is the
  warning colour mixed 85% with white (`#d17b43`). The warning colour itself is
  unchanged for glyphs, dots and meter fills.

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
- 6769c36: The avatar initials move to the core as `avatar.initialsOf`, with shared
  test vectors in `core/src/avatar/__vectors__` that the Flutter adapter reads
  too. The `initialsOf` each adapter exports keeps its name and result and now
  calls the core one, in place of four copies of the same logic.
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
- 4fb7dd6: In a range calendar, every day of the range is a selected cell for assistive
  technology in Svelte and Vue, the two ends and the days between, as in React
  and the custom elements. The ends add "range start" and "range end" to the
  day's name.
- 4fb7dd6: Coverflow neighbours are scaled and turned but no longer faded, so their text
  keeps its contrast; slides more than two places away stay hidden. The overlay
  under a slide's title ends at 55% black instead of transparent, so white text
  keeps at least 4.5:1 over any image (4.76:1 over white), and the description is
  no longer dimmed. The slide track and the gallery scroll no longer animate
  under `prefers-reduced-motion`.
- 5b04a4f: The Carousel track moves the other way in right-to-left text, as it does in
  React and Elements, so the slide that comes next is the one in view.
- 4fb7dd6: Svelte and Vue take the texts they wrote in English from the message catalog,
  so a provider override reaches them: the Avatar Group's "N more", the Code
  Block's names and copy texts, the Carousel's roles, slide names and indicator
  names, the Table Set's view switch, the Calendar's event count and range ends,
  and the Login Form's labels, placeholder, divider and provider buttons. The
  keys already existed and are used by React and the custom elements.
- fe34556: Two new custom properties: `--ds-components-button-foreground-ghost-default` sets the text color of a
  ghost button, and `--ds-toggle-border-width` sets the border width of a toggle
  button. The inline notification and the segmented toggle group now style
  their buttons and icons through these and the existing feedback icon
  properties, instead of overriding the child's rules. They look the same as
  before.
- 67efa44: The CodeBlock scroller becomes a focusable, named region: wide samples
  scroll horizontally, and a keyboard user could never reach them. The
  `pre` now carries `tabindex="0"`, `role="region"` and an `aria-label`
  ("Code sample, {language}", or "Code sample"), distinct from the figure
  label and matching the docs site, with an inset focus ring since the
  figure clips outer shadows.
- 91f0e45: The CodeBlock scroller is a named group instead of a named landmark. It
  stays focusable and announced, but several code blocks on one page no
  longer fill the landmark list with identical entries.
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
- a7475c7: The component-token tier gets its official mapping and its first defect
  sweep. The registry now extracts every `var(--ds-*)` reference the theme
  layer does not define — 408 knobs across 78 components — with the component,
  the properties controlled, the adapters, every site, the shipped fallback and
  the semantic role it follows; five gates hold the surface together (one knob
  one value family, adapters must agree on defaults, colour knobs must reach a
  role or carry a reviewed reason, prefixes cannot mint phantoms, notes cannot
  outlive their token).
  
  Confirmed defects fixed: the modal scrim was another design system's slate in
  14 files and is now the project's darkest neutral at the same alpha; the
  calendar range band was Tailwind blue and now follows the selection tint like
  every other selected fill; the calendar price diverged between adapters in
  dark; five knobs gained the missing role chain (calendar selected text,
  feedback icon on solid, time-field focus text, meter optimal and poor fills —
  poor moves from a foreign coral to the danger role); five internal runtime
  variables that were never knobs move to the private `--_` prefix
  (`--ds-slider-pct`, `--ds-tree-level`, `--ds-aspect-ratio`, and Vue's two
  notice-motion timings, all of which the components always set inline, so an
  external override could never win).
- 5b04a4f: The coverflow carousel follows the reading direction: in right-to-left text
  the next slide sits on the left and the neighbours turn the other way.
- 72477c9: The message catalog gains `pagination.current` and `breadcrumb.current`
  ("current page"), read with the current page of a pagination or a
  breadcrumb trail where a platform has no semantic property for it.
- 198b953: The dark theme's focus ring is the `color-focus-ring` role of that theme,
  `role.dark.color-focus-ring` in the design source: `#a286db`, the secondary
  mixed 70% with white. The design source now holds that value and its mix
  itself, so consumers that cannot mix colours, such as the Flutter apps, read
  the same ring as the stylesheet. It reaches 5.1:1 on the dark panel, above
  the 3:1 that WCAG 1.4.11 and 2.4.13 require. Nothing changes on screen, and
  no variable is added: the stylesheet still exposes the ring as
  `--ds-color-focus-ring` in both themes. Token names say the role, never how
  a colour looks (ADR 0002).
- 4fb7dd6: The Date Picker and the Date Range Picker open from the keyboard: Enter, Space
  or ArrowDown on the field, as in React and the custom elements. Focus goes to
  the selected day, or the day the calendar would focus, not to the Today button.
  A pick, or a finished range, returns focus to the field, and the clear button
  leaves focus on the field when it removes itself. The popover options of both
  adapters gain `initialFocus`, a selector of what takes focus when it opens.
- 5fe230a: Default buttons use the same hover background as Ghost buttons in both themes:
  `components.button.background.hover` aliases
  `components.general.background.hover`.
- 0ba8b01: The design source moves to `packages/tokens/tokens.json` and now holds the
  colour roles for the light and dark themes, the focus ring sizes, the type
  scale and a density tier (compact, regular, touch) with the minimum target
  size. 69 stylesheet tokens are now design owned in the token registry. No
  `--ds-*` value changes: `tokens.css` is the same file, and the parity test
  checks every value in the source against it.
- 52c5f68: Keep focus on the dialog trigger after a backdrop press closes a modal. Dialogs
  used as drawers now also have browser coverage proving that presses on their
  content, empty body space and inner padding do not dismiss them.
- fc6e6f8: Keep native dialog panels out of the rendered page until they are open. The
  dialog grid layout now applies only after `showModal()` sets the native `open`
  attribute, so an Elements dialog no longer appears behind controls that follow
  it and framework dialogs cannot flash in document flow before entering the top
  layer.
- 4c7e277: The dialog family shares one header in Vue, React and Elements, as in Svelte:
  an optional feedback icon, an optional leading ghost button, the title with
  optional context and subtitle, optional actions and a close button, all
  centered against the title. `closeButton` (`close-button="false"` in Elements)
  turns the close button off: on by default for `Dialog` and `SheetDialog`, off
  by default for `AlertDialog`, `ConfirmDialog`, `PromptDialog` and
  `SearchDialog`. `SearchDialog` can show its title with `hideTitle: false`. The
  `SheetDialog` description is now the subtitle inside the header. The header
  classes are now `dialog-header__*`, in a new `dialog-header.css` sheet.
  The dialog header tokens now ship in every adapter, Svelte included.
- 5b04a4f: Directional glyphs mirror in right-to-left text through the sheets, not
  through each component: the tree twistie, the accordion chevron, the carousel
  and calendar arrows, the sidebar group chevron and rail toggle, and the submenu
  chevrons (which no longer depend on a `dir` attribute on the popup). The open
  accordion and sidebar chevrons still point down. React and Elements Calendar no
  longer swap their arrow glyphs in script.
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
- 445b463: Add `<ds-accordion>` with `<ds-accordion-item>`, `<ds-collapsible>`, `<ds-aspect-ratio>`, `<ds-blockquote>`, `<ds-skeleton>` and `<ds-meter>`, ported from the Svelte adapter with the same classes, roles and stylesheets. Accordion items are written as markup, each one holding its panel content, or assigned through `items`. The Vue accordion sheet sets its root and items to `display: block`, so custom-element hosts lay out like the other adapters' elements.
- 60ac3cb: Add `<ds-breadcrumb>`, `<ds-progress>`, `<ds-scroll-area>` and `<ds-avatar-group>`, ported from the Svelte adapter with the same classes, roles and stylesheets.
  The tokens of these components now ship in Elements as well as in Svelte and
  Vue.
- 21ec92c: Add `<ds-code>`, `<ds-code-block>`, `<ds-feedback-icon>` and `<ds-carousel>`,
  ported from the Svelte adapter with identical classes and stylesheets.
  
  **`<ds-code>`** wraps its children in a `<code>` element for inline code.
  
  **`<ds-code-block>`** shows a preformatted sample from the `code` attribute or
  property, always inserted as text. The block and its focusable scroller are
  named groups, so several blocks stay off the landmark list. The copy button
  copies the source and announces the copy through a polite status; set
  `copyable="false"` to remove it and `copy-label` to rename it. Element children
  render in place of the plain source for highlighted markup.
  
  **`<ds-feedback-icon>`** draws the status glyph in a tinted, transparent or
  solid box (`status`, `box`, `shape`). It is decorative until `label` names it.
  
  **`<ds-carousel>`** follows the WAI-ARIA carousel pattern through the headless
  core: "N of M" slides, previous and next buttons, slide-picker dots, `loop`,
  and arrow keys along the `orientation`. It supports the `slide`, `gallery` and
  `coverflow` layouts. Element children become the slides; without them the
  `items` property draws built-in slides. A slide out of view is hidden and
  inert. `change` reports `detail.index` after a user action. When the focused
  arrow turns disabled at an end, the other arrow takes the focus.
  
  Every default string comes from the shared catalog, and the label attributes
  still win. New catalog keys in the core: `codeBlock.copyText`,
  `codeBlock.copiedText`, `codeBlock.copied`, `codeBlock.label`,
  `codeBlock.labelLanguage`, `codeBlock.sample`, `codeBlock.sampleLanguage`,
  `carousel.slide`, `carousel.goTo`, `carousel.roleDescription` and
  `carousel.slideRoleDescription`.
  
  The Svelte, Vue and React adapters re-export the catalog as `en`, so they carry the
  new keys too; their components are unchanged.
  The carousel track no longer slides under reduced motion; the slide changes at
  once.
- a2b1815: Add `<ds-calendar>`, `<ds-date-picker>`, `<ds-date-range-picker>` and `<ds-time-field>`, ported from the Svelte adapter with the same classes, roles and stylesheets. Month and weekday names, date formats, the first day of the week and the hour cycle follow the element's locale, and every label comes from the message catalog.
- f214c08: Elements gains the rest of the dialog family: `<ds-alert-dialog>`,
  `<ds-confirm-dialog>`, `<ds-prompt-dialog>` and `<ds-search-dialog>`, on the
  native `<dialog>` element with the header the family shares. The close button
  is off by default (`close-button` shows it). Confirm and Prompt take `urgent`
  for `role="alertdialog"`. Search takes its results through the `items` and
  `suggestions` properties, keeps its title visually hidden unless
  `hide-title="false"`, and emits `select`. The four stylesheets ship in
  `styles.css`.
- 3909f09: The login form no longer overflows a narrow container: its width now leaves
  room for its padding and border. In `<ds-navigation-menu>`, ArrowDown on a
  trigger opens the panel and moves focus into it in every browser.
- fe6b182: Add the autonomous `ds-empty-state` for empty lists and sections, with native
  status semantics, light-DOM composition, a generated action, and the existing
  styled-adapter tokens.
- 8a7b240: Add the autonomous `ds-error-state` for failures that replace page or section
  content, with native alert semantics, light-DOM composition, a generated
  recovery action, and the existing styled-adapter tokens.
- ede179d: Add `ds-inline-notification` with configurable live-region urgency, status
  presentation, light-DOM composition, and keyboard-operable dismissal.
- 70d54b1: Add `<ds-kbd>`, `<ds-link>`, `<ds-icon>` and `<ds-button-group>`, with the same markup, class names and stylesheets as the other adapters' Kbd, Link, Icon and ButtonGroup.
- 1741939: Add the Loading Generation Area component to the Elements adapter.
- 9e3a5c2: Add `ds-loading` with five visual variants, determinate progress semantics,
  live status updates, overlay presentation, and a cancellable no-flash delay.
- e309607: New `<ds-dropdown-menu>`, ported from the Vue adapter with identical classes: a
  menu button whose `items` property takes actions, checkable items, separators
  and named groups. Arrow keys, Home, End and typeahead move focus through the
  items, Escape and an outside press close the menu and focus returns to the
  trigger. A `select` event carries `detail.value` after the menu closes. The
  menu tokens now ship in Elements as well as in Svelte and Vue.
- 80bd550: New `<ds-navigation-menu>`, ported from the Vue adapter with identical classes:
  a site navigation bar where some items reveal a panel of links, with hover
  opening, immediate switching between open panels, Floating UI positioning,
  dismissal on an outside press, ArrowDown into the panel and Escape back to its
  trigger. The navigation menu tokens now ship in Elements as well as in Svelte
  and Vue.
- 3d31aff: New `<ds-sidebar>` and `<ds-avatar>`, ported from the Svelte adapter with
  identical classes. The sidebar renders a named navigation landmark with a logo,
  labelled sections, collapsible groups, a footer and an optional rail of icons;
  items are links or buttons, the current destination carries
  `aria-current="page"`, and `select`, `navigate`, `collapsed-change` and
  `open-groups-change` report what happened. The avatar shows an image or falls
  back to initials, as one named image.
  The sidebar and avatar tokens now ship in Elements as well as in Svelte and
  Vue.
- 051c5f7: Add `<ds-notification>`, `<ds-notification-region>` and `<ds-stepper>`.
  
  The region owns the notification queue: `show()` and the status shorthands
  return an id for `update()` and `dismiss()`, and `promise()` turns a loading
  notification into its outcome. Each notification is a polite or assertive
  live region; the countdown holds while the stack is hovered or holds focus,
  and motion is off under reduced motion. The stepper marks the current step
  with `aria-current="step"`, reads a completed step as "label, status,
  description", and wraps its labels instead of cutting them. Every default
  label comes from the locale catalog, and a label attribute wins over it.
- d0459c4: Add `<ds-number-field>` and `<ds-pin-input>`, ported from the Svelte adapter with the same classes,
  roles and stylesheets. The number field parses and formats in the element's locale and submits the
  canonical ASCII value; the PIN input submits the combined code through a hidden input under `name`.
- d8ab10f: Add the controlled Pagination component to the Elements adapter and record its
  existing shared component-token contract across the styled adapters.
- 6651b6a: New `<ds-popover>`, `<ds-context-menu>` and `<ds-menubar>`, ported from the Vue
  adapter with identical classes. The popover opens a non-modal card on click, or
  previews one on hover and focus with `trigger="hover"`. The context menu opens
  at the pointer on right-click, on the keyboard menu key or on a long press. The
  menubar moves between its menus with the arrow keys and switches them on hover.
  The three elements take their default labels from the catalog, and
  `ds-dropdown-menu` now shares its menu rendering, keyboard and typeahead code
  with them.
- a2282a8: Add `<ds-radio>`, `<ds-segmented-control>`, `<ds-toggle-button>` and `<ds-toggle-group>`.
  Radio, Segmented Control and Toggle Button render native inputs, so they submit with their form
  and a form reset puts them back to their defaults.
- f273544: `<ds-table-set>` and `<ds-table-view>` take their heading from `heading` and
  `heading-level` instead of `title` and `title-level`, so the heading no longer
  shows as a browser tooltip over the whole table.
  
  Fixes in the Elements adapter:
  
  - `<ds-pin-input>` keeps each character in its cell when a middle cell is
    cleared or a later cell is filled first.
  - `<ds-tooltip>` adds and removes only its own id in the trigger's
    `aria-describedby`.
  - The tooltip, the table's column settings and the notification region mount
    inside an open modal dialog around them, so they show above it and take
    input.
  - `<ds-notification-region>` queues notifications shown before it is
    connected.
  - The table set's view tabs no longer submit a form.
  - The calendar's view switcher and `<ds-segmented-control>` keep focus when
    the same items are assigned again.
  - `<ds-radio-group>`, `<ds-rating-group>` and `<ds-segmented-control>`
    without a `name` submit nothing with the form.
  - `<ds-sidebar>` keeps its logo and footer content in place across renders.
  - `<ds-dialog>`, `<ds-sheet-dialog>` and the dialog presets opened while out
    of the page open when connected.
  - `<ds-sheet-dialog>` snaps back when a drag is cancelled and clears the drag
    state when it closes mid-drag.
  - `<ds-time-field>` reports `validation-change` only for edits, and follows a
    disabled fieldset.
  - `<ds-tree-view>` reads `disabled="false"` as enabled.
  - `<ds-carousel>` moves its slides the right way in right-to-left text, and
    `<ds-menubar>` mirrors the left and right arrows there.
  - `<ds-popover>` moves focus into the card only when the user opens it, and
    follows a placement change while open.
  - `<ds-upload-drop-area>` registers the spinner it shows.
  
  The avatar tint set through `--ds-avatar-bg` now feeds `background-color`, in
  every adapter, so a value such as `url(…)` loads nothing.
- 1bc63e9: Add the Sheet Dialog component to the Elements adapter.
- c4ad002: Add `<ds-slider>`, `<ds-range-slider>` and `<ds-rating-group>`, ported from the Svelte adapter with the same classes, roles and stylesheets. They are built on native range inputs and native radios, so they submit with their form and come back to their default on a form reset. The range slider's value text and the rating's star names come from the locale catalog.
- 7f1c687: Add Table Set and Table View to the Elements adapter as `<ds-table-set>` and
  `<ds-table-view>`: tabs over distinct views, sorting, column visibility, a
  table or cards layout, pagination or infinite scroll, row selection and the
  filtering no-results state. `<ds-checkbox>` gains `hide-label`, and a focused
  sort button in `<ds-table>` keeps focus when the table renders again.
- 8b43c29: Add the controlled native Table to the Elements adapter. Add a local
  `--ds-table-header-background` override to Table in Elements, Svelte and Vue,
  with a transparent default.
- f809e5c: Add Tabs with count support and the standalone Count component to the Elements
  adapter. Record their existing shared component-token contract across the styled
  adapters.
- 8f3aa2a: Add `<ds-toolbar>`, `<ds-upload-drop-area>` and `<ds-login-form>`. The toolbar keeps one tab stop across added, removed and disabled controls, the drop area keeps a native file input, and the login form is a real form with named inputs that reports a cancelable `submit` event.
- c79487d: New `<ds-tooltip>`, ported from the Vue adapter with identical classes: a
  descriptive label on hover or focus of the control it wraps, linked with
  `aria-describedby`, hoverable and dismissed with Escape, toggled by a tap on
  touch, positioned with Floating UI. The tooltip tokens now ship in Elements as
  well as in Svelte and Vue.
- 3800443: Add Tree View to the Elements adapter with controlled expansion and selection.
- 3d596c4: Two controls that were drawn only with a fill stay visible in forced
  colors, where fills flatten away: a carousel dot gets a border and the
  selected one is filled with the platform's highlight, and the slider's
  track and thumb take borders as well, so the control does not disappear
  into the page.
- 44e9939: Focus stays visible in forced colors (Windows High Contrast). The theme
  draws its focus ring with a shadow, which that mode drops, so the ring
  simply vanished. `tokens.css` now forces a real outline in the
  platform's `Highlight` colour on anything focused, drawn inside the
  control so a scrolling container cannot clip it, and the controls whose
  focus lives on a visually hidden input (checkbox, radio, switch,
  segmented control, rating, toggle button, upload area) carry the same
  outline on their visible part.
- e7d6925: The ghost button now takes the text colour of the design system, like every
  other variant. It used to inherit its colour from wherever it was placed, so
  inside a native `<dialog>` it turned pure black. The inline notification close
  button keeps following its surface.
- 08b57ac: Use the interaction-state hover overlay for Search Field actions. Document when
  to use a complete surface hover fill and when to layer an interaction state over
  the current fill.
- 7fed5af: Lighten the boundary of the default button. It is now the control boundary
  mixed with the page behind it, so it reads less heavy while still standing out
  from the page, and it follows the theme. The new `--ds-components-button-border-default` token
  overrides it.
- a4d6ab7: The loading indicator's no-flash timer goes when the indicator goes. A
  component taken away before its delay elapsed left the timer running,
  so it kept a closure alive and fired into a component the page no longer
  had. The cleanup sits inside the browser branch: a server render has no
  teardown to hook.
- 4fb7dd6: The Login Form's email field names its purpose as `autocomplete="username"` and
  the password field as `autocomplete="current-password"`, for autofill and
  assistive technology (WCAG 2.2 1.3.5). The custom element already did.
- fb2df52: Every prop row in the generated manifests says where its description came from: `source` for the code's own JSDoc, `curated` for a committed text that differs from the source, `mdx` for the docs table, `none` when there is none. The generator prints the counts. No prop, type, default or requirement changes; the curated texts stay as they are, and their drift from the source is visible instead of silent.
- 9d2d3c6: The prop manifests no longer corrupt multi-line declarations. The generator
  cut every `export let` at its first newline, so a function type, a long
  union or a multi-line default shipped truncated: LoginForm's `onSubmit` was
  published as required with a broken type, NotificationRegion's `placement`
  as `unknown` and required instead of a six-value union defaulting to
  `"top-end"`, and Calendar's `onRangeChange` with an empty-string default.
  The declaration body now runs to the statement's own semicolon. Types,
  defaults and required flags of five components' manifests are corrected; no
  runtime behaviour changes.
- 22fe40b: The message catalog gains `menu.submenu` ("submenu"), the hint that marks a
  menu item opening a submenu where a platform has no semantic property for it.
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
- fe34556: A disabled menu trigger now carries `data-disabled` from the core, next to
  `aria-disabled`. The dropdown menu and menubar triggers in Svelte and Vue now
  show the disabled look their stylesheets already defined. The web components
  no longer set the attribute themselves.
- 18bfbfa: The Meter's documentation named knobs that do not exist
  (`--ds-meter-fill-medium|high`); the real ones are
  `--ds-meter-fill-suboptimal|optimal`. No behaviour changes: the knobs
  themselves were always spelled correctly in the styles.
- 4919b74: `tokens.css` gains `--ds-min-target-size: 24px`, the side of the smallest
  square hit area a control keeps, from `density.regular.min-target-size`.
  It covers the regular density only; components keep their own sizes, so
  nothing renders differently.
  
  In the design source, every colour that `tokens.css` mixes with
  `color-mix()` now carries its recipe under
  `$extensions["com.invisible-ui.mix"]` (colour space, the two colours as
  token references, the share of the first) next to the resolved `$value`.
  A platform without `color-mix()` can recompute a tint after overriding a
  brand or feedback colour. No resolved value changes; the parity test
  recomputes each recipe and checks it against the source and the stylesheet.
- 3a72a48: The message catalog gains `multiSelect.added` ("{name} added") and
  `multiSelect.removed` ("{name} removed"), announced politely after a value is
  added to or removed from a multi select on a platform with no live tag list.
- 03ff032: The multi select's open list now has a stacking order again, in every adapter.
  
  Its `z-index` was being handed `--ds-elevation-overlay`, which is a box-shadow: the value is not a stacking order, so the browser dropped the whole declaration and the list had none at all. Anything painted after it in the page, a following form for instance, could sit on top of the open list and take the clicks meant for its options. It now uses `--ds-select-z-index` with a default of 50, the same one the combobox next door has always used.
- bb57122: Components stay inside the page at narrow viewports (WCAG 1.4.10, 320px):
  fields and the combobox cap at their container; pagination, toolbar and
  the navigation menu wrap; tab lists and the segmented control scroll
  inside themselves; calendar day tracks and the combobox grid stop growing
  with their content; the segmented control's hidden radio is anchored so
  it cannot widen the page; the carousel gallery viewport, a real scroller,
  becomes keyboard focusable with a visible focus ring.
- fe34556: A navigation menu panel closed by a click no longer opens again on its own. A
  pointer click also hovers the trigger, which starts the open delay; the delay
  still pending now stops when the panel closes, as in the Vue adapter.
- fe34556: The notification region now follows the reduced motion setting when it
  changes while the page is open. The Svelte region also reads the setting after
  mount, so the server and the first client render match.
- b8cf4a3: Every package exposes `./package.json` through its export map: build tools
  and component analyzers probe it, and the strict maps refused it. Additive
  only.
- dedbed0: The packed Svelte package becomes usable for what it advertises: the tarball
  shipped the 79 component subpaths without the sibling modules they import
  (124 unresolvable relative imports — the factories, the i18n helpers, the
  internal utilities), so any bundling consumer of a `.svelte` subpath failed
  to resolve. The package now ships the whole `src/lib` source tree, with a
  nested `.npmignore` stripping tests and fixtures. The packed smoke gains a
  resolve-all check that walks every shipped component's relative imports, and
  the parity test files stop shipping in the Vue, React and Elements tarballs.
- 5b04a4f: Without a locale provider, a component now reads the page direction from
  `<body dir>` as well as from the document element, and follows a runtime
  change of either. Before, a page that set `dir="rtl"` on the body only got
  popups forced to left to right.
- 665ceea: The styled Pagination now honours the state and callback conventions the
  other components follow (ADR 0011): a handler swapped after mount is the one
  that fires, instead of the value captured at creation, and later `pageCount`,
  `siblingCount`, `boundaryCount` and `disabled` props are reflected silently,
  re-clamping the current page when the count shrinks. The headless
  `createPagination` gains an additive `syncConfig` for the same reflection.
  No markup or naming changes.
- 5b04a4f: A portalled popup takes the direction of the control that opens it, so a
  `dir` on a plain wrapper around the control counts, with or without a locale
  provider. Svelte and React read it each time the popup opens, Vue on each
  render of the overlay; the custom elements keep their popups inside the
  element, which already inherit it. The core adds `i18n.elementDirection`.
- 2d0ed68: Prepare the five web packages for their first public alpha release: publish
  them under the `alpha` dist-tag, add registry metadata and document the secure
  bootstrap and trusted-publishing workflow.
- 5b04a4f: In right-to-left text the Sidebar rail tooltip sits at the inline end, on the
  left, and the Context Menu opens toward the inline end of the pointer, on the
  left; from the keyboard it opens at the region's top right corner. A
  `placement` given to the Svelte or Vue Context Menu still wins.
- 48e3e33: The React adapter now ships the date and time family: `Calendar`,
  `DatePicker`, `DateRangePicker` and `TimeField`, with the markup, classes and
  behaviour of the other adapters. The calendar renders the month, two-month,
  week, three-day, day and year views, events and prices, single and range
  selection, and the WAI-ARIA date grid keys; in right-to-left text ArrowLeft
  and ArrowRight follow the visual direction. In a range every day is a selected
  cell and the endpoints say so in their names. The pickers open the calendar in
  a dialog popup with focus on the focused day, and render it inside the dialog
  they sit in. TimeField follows the provider locale's hour cycle, reports a
  structural error only when an edit changes it, and is disabled inside a
  disabled fieldset.
  
  Each value works controlled and uncontrolled (ADR 0011). The pickers and
  TimeField submit with their form, and a form reset puts them back to the
  current default without reporting (ADR 0012). Labels come from the catalog.
  All four render on the server and hydrate without mismatches.
  
  Two hooks render the same behaviour in markup of your own: `useCalendar` and
  `useTimeField`. `usePopover` takes an `initialFocus` selector, like the dialogs, and a trigger of
  any element type.
  
  `styles.css` now includes the calendar, date picker, date range picker and
  time field sheets. They are the same files the Vue and custom element
  packages ship, now held byte for byte to the React copies.
- 466b110: The React adapter now ships the rest of the dialog family: `AlertDialog`,
  `ConfirmDialog`, `PromptDialog`, `SheetDialog` and `SearchDialog`, with the
  markup, classes and behaviour of the other adapters. Each one runs on
  `useDialog`, works controlled and uncontrolled (ADR 0011), takes its default
  labels from the catalog, and holds the status area on its ref (ADR 0016),
  typed `DialogHandle`.
  
  Two hooks render the same behaviour in markup of your own: `useSheetDialog`
  (edge anchoring and the drag-to-dismiss gesture) and `useSearchDialog` (a
  combobox inside a modal dialog, with groups, suggestions and a custom
  `filter`). `useDialog` gains `returnFocusTo`, for a dialog opened without a
  trigger of its own.
  
  `styles.css` now includes the sheets for these dialogs, and the Kbd and
  Loading sheets the search dialog uses.
- da23e6c: Messages while a dialog is open follow ADR 0016 in the React adapter.
  
  **Status area.** `Dialog` has a status area between the body and the footer
  for messages about its own task. A ref on `Dialog` (the new `DialogHandle`
  type) holds `notify({ status, title, description, action, dismissible })`,
  which adds a notice styled as an inline notification and returns its id,
  `dismissNotice(id)` and `clearNotices()`. `useDialog()` returns the same three
  functions with the `notices` and the `announcement` to render. Each notice is
  announced once through a polite live region, never takes focus, and keeps its
  action and close buttons in the dialog's tab order. Notices belong to one
  opening: `notify()` on a closed dialog returns an empty string, and closing
  the dialog clears them. The new `DialogNoticeOptions`, `DialogNoticeAction`,
  `DialogNoticeStatus`, `DialogNotice` and `DialogNotices` types describe them,
  and `dialog-status.css` places the area. The stylesheet gains
  `inline-notification.css` and `feedback-icon.css`, identical to the other
  adapters' copies, so notices have the Inline Notification look.
  
  **Copy confirmation.** `copy` on `Button` copies its text on press and shows
  "Copied" (or `copiedLabel`) beside the button for two seconds, announced
  through a polite live region. The button keeps its name and focus. A refused
  clipboard shows nothing.
  
  **Dialogs on top.** Closing a dialog returns focus to the element that had it
  when the dialog opened, so a dialog opened from inside another hands focus
  back there; the trigger is the fallback. A `close` event from an element
  inside the panel no longer closes the dialog.
- 623904b: The React adapter now ships the feedback components: `Loading`,
  `LoadingGenerationArea`, `FeedbackIcon`, `EmptyState`, `ErrorState`,
  `InlineNotification`, `Notification` and `NotificationRegion`, with
  `createNotifier`, and the markup, classes and behaviour of the other
  adapters. Default labels come from the catalog: the loading name, the
  notification's close button and link, the region's landmark name.
  
  `NotificationRegion` holds new notifications while a modal dialog is open,
  then shows them in order and starts their countdowns (ADR 0016, case 2). It
  counts the dialogs of the family, which now register their panels, and any
  native `<dialog>` opened with `showModal()`. It mounts in `<body>` through a
  portal, renders nothing on the server, and enters, leaves and reflows with
  the shared motion, none under reduced motion. Hovering or focusing the stack
  pauses every countdown, and a notification can be swiped away.
  
  In React, `createNotifier()` returns an external store: `subscribe` and
  `getSnapshot` read the queue with `useSyncExternalStore`. The slots of the
  other adapters are props that take markup (`icon`, `link`, `actions`,
  `illustration`, `indicator`, `children`), and `InlineNotification` takes
  `open` with `onOpenChange`. The dialog status area now draws its icon with
  `FeedbackIcon`, and SearchDialog its loading dots with `Loading`.
  
  `styles.css` now includes the notification region, empty state, error state
  and loading generation area sheets. They are the same files the Vue and
  custom element packages ship, now held byte for byte to the React copies.
- e32e67c: The React adapter now carries the whole catalog. It adds `Textarea`, `Table`,
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
- 04a9d7b: The React adapter now ships navigation and structure: `Tabs`, `Accordion`,
  `Collapsible`, `Breadcrumb`, `Pagination`, `Stepper`, `Sidebar`, `TreeView`,
  `ButtonGroup` and `Separator`, with the markup, classes and behaviour of the
  other adapters. Tabs, Pagination and TreeView follow the writing direction
  of the element a key is pressed on, so in right-to-left text the arrows
  follow the visual order. A tab's count is read as part of its name. The
  accordion headers are headings at `headingLevel`, 3 by default. When a press
  disables Previous or Next, focus moves to the page that is now current. The
  Sidebar rail toggle keeps one name and reports its state through
  `aria-pressed`; the open sections follow ADR 0013, and `mode="drawer"`
  renders the navigation inside a SheetDialog. TreeView requests unloaded
  children without fetching them (ADR 0014) and announces loading and failure
  through one live region that stays in the page.
  
  Each stateful prop works controlled and uncontrolled (ADR 0011). Labels come
  from the catalog. All ten render on the server and hydrate without
  mismatches.
  
  Six hooks render the same behaviour in markup of your own: `useTabs`,
  `useAccordion`, `useCollapsible`, `usePagination`, `useStepper` and
  `useTreeView`. With `useTabs` the tab strip can sit apart from its panels.
  
  `styles.css` now includes the tabs, accordion, collapsible, breadcrumb,
  pagination, stepper, sidebar, tree view, button group and separator sheets.
  They are the same files the Vue and custom element packages ship, now held
  byte for byte to the React copies.
- 2547561: The React adapter now ships the overlays and menus: `Popover` (with
  `trigger="hover"` for the hover preview), `Tooltip`, `DropdownMenu`,
  `ContextMenu`, `Menubar` and `NavigationMenu`, with the markup, classes and
  behaviour of the other adapters. Each one takes its default labels from the
  catalog, renders inside the dialog its trigger sits in (ADR 0016), and
  renders on the server and hydrates without mismatches. `Popover` `open` and
  `NavigationMenu` `value` work controlled and uncontrolled (ADR 0011).
  
  **Submenus.** The React menus are the first to render the submenus of
  `docs/menu-submenu-spec.md`: a `{ type: "submenu", value, label, items }`
  entry opens by Enter, Space, the arrow toward the inline end, a press or a
  100 ms hover; a grace area keeps it open while the pointer travels to it;
  it flips side or overlaps its parent when there is no room; the arrows
  follow right-to-left text; and in Menubar the arrows move between top menus
  on a plain item. `ContextMenu` and `Menubar` take groups, separators,
  checkable items and submenus, like `DropdownMenu`. A menu closes and returns
  focus before `onSelect` runs.
  
  Four hooks render the same behaviour in markup of your own: `usePopover`,
  `useHoverPreview`, `useTooltip` and `useNavigationMenu`.
  
  `styles.css` now includes the popover, tooltip, menu and navigation menu
  sheets. The shared Dropdown Menu, Context Menu and Menubar sheets, in the
  React, Vue and custom element packages, gain the submenu rules (the chevron,
  the open trigger, a 44 by 44 target under a coarse pointer, an outline in
  forced colors), and the Context Menu and Menubar sheets gain the group,
  separator and check column rules. The Svelte, Vue and custom element menus
  render no submenus yet.
- 56b8611: The React adapter now ships the presentational components: `Avatar`,
  `AvatarGroup`, `Count`, `Tag`, `Kbd`, `Code`, `CodeBlock`, `Blockquote`,
  `Skeleton`, `AspectRatio`, `ScrollArea`, `Progress`, `Meter`, `Link`,
  `Label`, `Field` and `Card`, with the markup, classes and behaviour of the
  other adapters. Labels come from the catalog: the "+N" chip of an avatar
  group, the code block's names and its copy button, the tag's remove button.
  CodeBlock copies through the same logic as Button's `copy` (ADR 0016). A
  link that opens a new tab gets `rel="noopener noreferrer"`, also when the
  target comes in as a plain attribute. An avatar colour that could add
  declarations of its own is dropped. All seventeen render on the server and
  hydrate without mismatches.
  
  Five hooks render the same behaviour in markup of your own: `useProgress`,
  `useMeter`, `useLabel`, `useField` and `useScrollArea`. In React, Label
  names its control with `htmlFor`, and Field takes its control from a
  function child that receives `controlProps` and `controlId`. MultiSelect now
  renders its values with `Tag`, and SearchDialog its shortcuts with `Kbd`.
  
  `styles.css` now includes the field, label, progress, skeleton, count, card,
  avatar, avatar group, meter, link, blockquote, aspect ratio, code, code block
  and scroll area sheets. They are the same files the Vue and custom element
  packages ship, now held byte for byte to the React copies.
- def0fb6: The React adapter now ships the value controls: `Radio`, `RadioGroup`,
  `CheckboxGroup`, `SegmentedControl`, `ToggleButton`, `ToggleGroup`, `Slider`,
  `RangeSlider`, `NumberField`, `PinInput` and `RatingGroup`, with the markup,
  classes and behaviour of the other adapters. Each value works controlled and
  uncontrolled (ADR 0011): a changed prop reports nothing, a user action reports
  once, and a parent echoing the value back changes nothing. Each control
  submits with its form, and a form reset puts it back to the current default
  without reporting (ADR 0012). The default labels (the stars, the PIN cells, the
  spin buttons, the range thumbs' value text and the number messages) come from
  the catalog. All of them render on the server and hydrate without mismatches.
  
  Eight hooks render the same behaviour in markup of your own: `useRadioGroup`,
  `useCheckboxGroup`, `useToggleButton`, `useSlider`, `useRangeSlider`,
  `useNumberField`, `usePinInput` and `useRatingGroup`.
  
  `styles.css` now includes the eleven sheets. They are the same files the Vue
  and custom element packages ship, now held byte for byte to the React copies.
  
  A bundle that imports one component no longer carries the others: the
  `TextField`-only bundle drops from 9.99 kB to 6.04 kB. A text input or a range
  also keeps its DOM default after the edit that changed it, where React had
  written the edited value over it.
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
- 5b04a4f: The Scroll Area horizontal thumb follows a right-to-left viewport, whose
  `scrollLeft` is zero or negative: it starts at the right, moves as the content
  scrolls, and a drag moves the content the way the thumb goes.
  `scrollArea.scrollByThumbDrag` takes the viewport's direction as a third
  argument, `"ltr"` by default.
- 67c720e: Two overlays open at once no longer leave the page unable to scroll.
  Each modal saved whatever it found on the body and restored that, so a
  second overlay saved the first one's lock and handed it back on close.
  Closing the first one let the page scroll behind a modal that was still
  open, and closing them in the other order left `overflow: hidden` for
  good. Locks are counted now: the last one to let go restores exactly
  what was there before the first took hold, and the scrollbar is
  compensated once rather than once per overlay.
- 3a72a48: The message catalog gains `sidebar.current` ("current page"), read with a
  sidebar's current destination where a platform has no semantic property for
  it.
- 3a72a48: The message catalog gains `stepper.current` ("current step"), read with the
  current step of a stepper where a platform has no semantic property for it.
- fe34556: The English default that components use without a `LocaleProvider` can no
  longer be changed. Calling `set` on it did change the locale for every
  component on the page, and on the server for every request. It now does
  nothing; use a `LocaleProvider` to change the locale.
- fe34556: Item actions such as `tabAction`, `optionAction`, `itemAction` and
  `pageAction` now follow a parameter that changes on the same element. Before,
  the element kept the attributes and handlers of the item it was first given.
  The navigation menu's trigger and content actions, and the scroll area's thumb
  action, follow a changed parameter too.
- c4f0d20: Each notifier now numbers its notification ids on its own, so two notifiers (one per server request, for example) no longer share a sequence. A new test also checks that the meter's band, colour and announced range follow its `min`, `max`, `low`, `high` and `optimum` props after mount.
- ecd955f: Svelte components now follow props changed after mount, instead of keeping
  the values they were first rendered with.
  
  - **Slider**: a slider rendered disabled can be moved once it is enabled,
    and the filled track follows a new `min`, `max` or `step`.
  - **DropdownMenu, ContextMenu, Menubar**: arrow keys and typeahead walk the
    items shown now, a menubar shows the menus it is given now, and a
    replaced `onSelect` is the one that runs. `disabled` follows too.
  - **Accordion**: `items`, `type`, `collapsible` and `disabled` follow.
  - **Calendar**: `min`, `max` and `weekStartsOn` follow.
  - **RatingGroup**: the number of stars follows `max`.
  - **Collapsible** (`disabled`), **Progress** (`min`, `max`) and **Tooltip**
    (`placement`, `openDelay`, `closeDelay`) follow as well.
  
  Calendar and AvatarGroup no longer fail to render when two events on one
  day, or two people, share a label or a name.
  
  Headless factories gain `syncConfig` (slider, accordion, calendar),
  `syncItems` and `syncDisabled` (dropdown and context menu), `syncMenus`
  (menubar), `syncMax` (rating group), `syncDisabled` (collapsible),
  `syncRange` (progress) and `syncOptions` (tooltip). `createMenubar().menus`
  and `createRatingGroup().items` / `.max` are now stores.
- e3cafdc: Twenty-seven presentational components now use the runes syntax internally:
  AspectRatio, Avatar, AvatarGroup, Breadcrumb, ButtonGroup, Code, CodeBlock,
  ContextMenu, Count, DropdownMenu, FeedbackIcon, Icon, Kbd, Label, Loading,
  LocaleProvider, Menubar, Meter, NavigationMenu, NotificationRegion, Progress,
  ScrollArea, Separator, Skeleton, ToggleGroup, Toolbar and Tooltip. Their props,
  content and callbacks work as before. Props that take a component (a segment
  or sidebar icon, a notification body) now also accept components written in
  runes.
- 0043fec: Nineteen controllable components now use the runes syntax internally:
  Accordion, Checkbox, CheckboxGroup, DatePicker, DateRangePicker, MultiSelect,
  NumberField, Pagination, PinInput, Radio, RadioGroup, RatingGroup,
  SegmentedControl, Select, Stepper, Switch, Textarea, TimeField and
  ToggleButton. Their props, content and callbacks work as before, controlled
  and uncontrolled, and `bind:` keeps working on each controllable prop. A form
  reset restores the same defaults as before. One edge changes: binding a
  variable that holds `undefined` to one of these props now throws; give the
  variable an initial value.
  
  `Label` now follows a `for` prop changed after mount; it kept the first value
  before. `createLabel` gains a `sync` function that updates the association.
- f477a37: Internal cleanup of the Svelte adapters around shared positioning, dismissal and prop actions, with no change in behaviour.
- 3ab2373: Consumer data can no longer add style declarations: a Carousel slide image is
  set as one quoted URL, and an Avatar Group colour that would close its
  declaration is dropped. A Link that opens a new tab through a plain `target`
  attribute now gets `rel="noopener noreferrer"` too.
- 456552e: Make the switch readable when it is off. The track was filled with the control
  boundary colour and the ON/OFF text was written on it in the secondary text
  colour: two greys on top of each other, 1.72:1 in the light theme and 1.42:1 in
  the dark one, against the 4.5:1 that text needs.
  
  The track now carries a boundary in both states and is filled with a surface
  when off, so the text takes the ordinary text colour: 11.75:1 and 9.77:1. The
  boundary is what makes the control visible against the page, which also lifts
  the on state in the dark theme from 2.87:1 to 6.07:1. It is drawn inside the
  track, so nothing about the size changes. The thumb keeps a rim in the boundary
  colour, which separates it from the lighter track.
- 5b04a4f: The Switch thumb moves along the inline axis instead of by a physical
  translate, so in right-to-left text it stays on the track and sits at the end
  edge, the left one, when on.
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
- 8986b57: Components let go of what they started. The Svelte upload area kept a
  window focus listener for every picker it opened if it went away while
  the dialog was still up; the notification region remembered every
  notification it had ever shown, so its paint order drifted lower with
  the count; a pending hover no longer opens a Vue tooltip, popover or
  navigation panel that has already gone; the Svelte navigation menu drops
  its hover timers when its last trigger does; the Vue loading indicator
  drops its reveal timer on teardown (the Svelte one renders nothing until
  it fires, so it has no element to hang a cleanup on); the copy
  confirmation in the Svelte code block is cleared with the block; and a
  swipe interrupted mid-animation stops animating without dropping the
  dismissal the user already asked for.
- 198b953: The toggle group's keyboard behaviour moves to the core as
  `toggleGroup.manage(root, { orientation, selector })`, which returns its
  teardown. It applies the shared rule to a group element in the page: one tab
  stop with arrow keys and Home/End from three toggles, mirrored in
  right-to-left text, nothing added inside a toolbar, and toggles that are
  added, removed or disabled later followed, with focus handed to the toggle at
  the removed one's place. It sets no style. Svelte, Vue, React and Elements
  now call it in place of four copies of the same logic; what users see and
  press does not change.
- 3a72a48: The message catalog gains `tree.expand` ("Expand"), `tree.collapse`
  ("Collapse") and `tree.retry` ("Retry"), the actions a tree branch offers
  where a platform has no expanded-state actions, and `navigationMenu.current`
  ("current page"), read with the navigation menu's current link where a
  platform has no semantic property for it.
- b34d106: A dropped file joins the form the way a picked one does. It only reached
  the onFiles callback before, so the form never submitted it and a reset
  had nothing to clear; it now becomes the input's file list, verified
  against a native input's own behaviour in three engines. A single file
  input keeps the first file of a multi-file drop, because that is all it
  could ever hold.
- Updated dependencies [285daae]
- Updated dependencies [5b04a4f]
- Updated dependencies [6769c36]
- Updated dependencies [0035d7a]
- Updated dependencies [ddcb5bf]
- Updated dependencies [21d9b60]
- Updated dependencies [198b953]
- Updated dependencies [3a72a48]
- Updated dependencies [33d6707]
- Updated dependencies [a682e61]
- Updated dependencies [72477c9]
- Updated dependencies [b2fd59d]
- Updated dependencies [507cdc0]
- Updated dependencies [e47db9b]
- Updated dependencies [0db43e6]
- Updated dependencies [4b80589]
- Updated dependencies [7393fd6]
- Updated dependencies [198b953]
- Updated dependencies [31edd44]
- Updated dependencies [22fe40b]
- Updated dependencies [a65e431]
- Updated dependencies [fe34556]
- Updated dependencies [3a72a48]
- Updated dependencies [49db2e6]
- Updated dependencies [198b953]
- Updated dependencies [b8cf4a3]
- Updated dependencies [5b04a4f]
- Updated dependencies [5b04a4f]
- Updated dependencies [2d0ed68]
- Updated dependencies [49122de]
- Updated dependencies [b5ceb49]
- Updated dependencies [0ae4309]
- Updated dependencies [5b04a4f]
- Updated dependencies [297baed]
- Updated dependencies [5b04a4f]
- Updated dependencies [ae10a17]
- Updated dependencies [3a72a48]
- Updated dependencies [036656d]
- Updated dependencies [3a72a48]
- Updated dependencies [4fb7dd6]
- Updated dependencies [4fb7dd6]
- Updated dependencies [3a72a48]
- Updated dependencies [4fb7dd6]
- Updated dependencies [198b953]
- Updated dependencies [198b953]
- Updated dependencies [198b953]
- Updated dependencies [3a72a48]
- Updated dependencies [5789966]
- Updated dependencies [198b953]
- Updated dependencies [198b953]
  - @nozcadesign/invisible-ui-core@0.1.0-alpha.1
