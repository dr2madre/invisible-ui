# Menu submenus

A submenu is a menu item that opens another menu beside it. This file is the
behaviour spec for submenus in Dropdown Menu, Context Menu and Menubar, for
every platform: `core/` and the web adapters (Svelte, Vue, custom elements,
React when its menus arrive) and the Flutter adapter. It is the shared
groundwork named in [ADR 0017](./adr/0017-flutter-adapter.md) §6: Wireframe's
Flutter app needs menus with submenus, and the web menus gain them from the
same spec.

Status: decided (see [Decisions taken](#decisions-taken)). The `core/`
part is implemented: the `submenu` entry, the open path and the keyboard map
in `core/src/menu`, the Menubar coordination in `core/src/menubar`, and the
grace-area and placement functions in `core/src/internal`. The web adapters
and the Flutter adapter do not render submenus yet.

## Pattern

- [WAI-ARIA APG Menu and Menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/):
  roles, states and the keyboard map for submenus.
- [WAI-ARIA APG Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/):
  the trigger of Dropdown Menu, already implemented.
- [ADR 0011](./adr/0011-state-and-callback-conventions.md): a menu is closed
  before it reports the chosen item; one action, one call.
- [ADR 0016](./adr/0016-feedback-while-a-dialog-is-open.md): focus return when
  a menu item opens a dialog.
- [ADR 0005](./adr/0005-native-dialog-and-urgency.md): item labels name
  outcomes, the same guideline as buttons.

## Prior art

Read on 2026-10-02.

| Decision | Observed | Who | Ours |
| --- | --- | --- | --- |
| How a submenu is written | Compound parts: `Sub`, `SubTrigger`, `SubContent` | [Radix DropdownMenu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) (shadcn/ui), [Bits UI DropdownMenu](https://bits-ui.com/docs/components/dropdown-menu) | A `submenu` entry in the items data, like `group` and `separator` today |
| | A `Menu` passed as the children of a `MenuItem` | [Carbon React MenuItem](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Menu/MenuItem.tsx) | |
| Open state of a submenu | `open`, `defaultOpen`, `onOpenChange` on `Sub` | Radix, Bits UI | Internal only in v1 (decision 1) |
| Keys that open and close | Enter, Space and ArrowRight open; ArrowLeft closes; swapped in RTL | [Radix menu source](https://github.com/radix-ui/primitives/blob/main/packages/react/menu/src/menu.tsx) | The APG map, mirrored in RTL |
| Escape inside a submenu | Closes every level | Radix | Closes one level (APG) |
| Hover open delay | 100 ms | Radix, Carbon | 100 ms |
| Diagonal pointer path | A polygon from the pointer to the submenu keeps it open for up to 300 ms | Radix | Adopted as the grace area |
| A press on the trigger | Opens it, never closes it | Radix | Opens; closes only on touch and pen (decision 2) |
| Disabled trigger | `disabled` on `SubTrigger` | Radix, Bits UI | Supported: never opens |
| | `disabled` is ignored on an item that holds a submenu | Carbon | |
| Depth | "Avoid multiple levels of nesting" | [Carbon menu usage](https://carbondesignsystem.com/components/menu/usage/) | Any depth in the model, one level recommended |
| Placement | `right-start`, `left-start` under RTL | Carbon | Inline-end, flipping to inline-start |

## Data model

### The `submenu` entry

A submenu is one more `MenuEntry` kind, beside `MenuItem`, `MenuSeparator`
and `MenuGroup`:

```ts
/** An item that opens a nested menu. It never reports through `onSelect`. */
export interface MenuSubmenu {
  type: "submenu";
  /** Identity: the item's id, its place in the open path, the typeahead target. */
  value: string;
  /** Visible label; used for typeahead. */
  label: string;
  disabled?: boolean;
  /** Items, separators, groups and further submenus, in the order shown. */
  items: MenuEntry[];
}

export interface MenuGroup {
  type: "group";
  label: string;
  items: (MenuItem | MenuSubmenu)[];
}

export type MenuEntry = MenuItem | MenuSeparator | MenuGroup | MenuSubmenu;
```

- **Existing data stays valid.** A plain list of `MenuItem` is unchanged, and
  so is every `group` and `separator`.
- **Values are unique across the whole tree.** `onSelect` reports a value, and
  element ids are built from values, so an item value appears once in the
  root menu and all its submenus together. A repeated value throws in
  development, as Sidebar section ids do.
- **A submenu trigger is a stop at its own level.** `itemsOf(entries)` returns
  the submenu trigger as a stop and leaves its children out: arrow keys,
  Home, End and typeahead move within one level.
- **Inside a submenu.** Groups, separators, checkbox items and radio items
  work as in the root menu. A `checked` item inside a submenu reports through
  the same `onSelect`, and the application owns the new state.
- **Disabled trigger.** A disabled submenu trigger is skipped by arrow keys
  and typeahead, like a disabled item today, carries `aria-disabled`, and
  opens by no key, hover or press. A submenu with no enabled item behaves as
  disabled, so no key opens an empty level.
- **Depth.** The model and the behaviour accept any depth, because every level
  uses the same rules. The docs recommend one level of submenu. A
  development warning names a submenu nested more than two levels below the
  root.
- **Labels.** The visible label is the accessible name. Item labels name
  outcomes (ADR 0005). Words repeated by every item of a submenu move into
  the submenu label.

### State

The menu state gains one field:

| Field | Meaning |
| --- | --- |
| `openPath: string[]` | Values of the open submenu triggers, from the root menu outward. `[]` while only the root menu is open. |
| `activeValue` (existing) | The focused item, at the deepest open level. |

One submenu is open per level, so a path describes the whole open state. When
the items change and a value on the path disappears, the path is cut at that
value, silently, as `activeValue` is today.

## Behaviour

Terms: the **root menu** is the menu a Dropdown Menu trigger, a Context Menu
region or a Menubar trigger opens. A **level** is one open menu: the root
menu or a submenu. The **parent item** of a submenu is the trigger that
opened it. **Inline-end** is the right side in left-to-right text and the
left side in right-to-left text; **inline-start** is the opposite.

### Keyboard map inside any open level

| Key | Focus on an item | Focus on a submenu trigger |
| --- | --- | --- |
| ArrowDown, ArrowUp | Next or previous enabled item of this level, wrapping (existing) | Same |
| Home, End | First or last enabled item of this level (existing) | Same |
| Printable characters | Typeahead over this level only | Same |
| Enter | Activate the item: close every level, then report (existing) | Open the submenu, focus its first enabled item |
| Space | Activate the item and close every level; on a checkbox or radio item, change its state and keep the menu open (decision 3) | Open the submenu, focus its first enabled item |
| Arrow toward inline-end | Nothing in Dropdown and Context Menu; in Menubar, see below | Open the submenu, focus its first enabled item |
| Arrow toward inline-start | In a submenu: close this level, focus the parent item. In the root menu: nothing in Dropdown and Context Menu; in Menubar, see below | Same |
| Escape | Close this level only. Focus returns to the parent item, or from the root menu to the trigger (Dropdown, Menubar) or to the element focused before opening (Context Menu) | Same |
| Tab, Shift+Tab | Close every level; focus moves to the next or previous element in the tab order after the trigger | Same |

- **Opening by key focuses the first item.** Enter, Space and the arrow toward
  inline-end open the submenu and move focus to its first enabled item.
- **Typeahead is scoped to the open level.** The buffer resets when focus
  changes level. It never opens a submenu: it lands on the trigger, and the
  person opens it with a key.
- **RTL.** The arrows follow the direction of the menu, read from the
  platform (`dir` and computed `direction` on the web, `Directionality` in
  Flutter). In right-to-left text ArrowLeft opens and ArrowRight closes.
- **Checkable items.** Enter and a press activate a checkbox or radio item
  the same way as an action: every level closes, then `onSelect` reports.
  Space changes the item's state and keeps the menu open, as the APG allows,
  so several options can be set in a row; `onSelect` reports each change
  once. This applies in submenus and in the root menu, in every adapter.

### Menubar

In a Menubar the left and right arrows also move between the top menus. The
rule is APG's: the arrow goes into a submenu when the focused item has one,
and to the next top menu otherwise.

| Key | Focus | Result |
| --- | --- | --- |
| Arrow toward inline-end | On a submenu trigger | Open the submenu, focus its first item |
| Arrow toward inline-end | On any other item, at any level | Close every level of this menu, open the next top menu, focus its first item |
| Arrow toward inline-start | In a submenu | Close this level, focus the parent item |
| Arrow toward inline-start | In the root menu of a top menu | Close it, open the previous top menu, focus its first item |
| Escape | In a submenu | Close this level, focus the parent item |
| Escape | In the root menu | Close it, focus its Menubar trigger (existing) |

Wrapping across the top menus and Home and End on the bar stay as they are.

### Pointer and outside presses

- **Outside press closes every level.** A press inside any open level, or on
  the trigger, is inside.
- **Activation closes every level** and then reports, by pointer or by key.
- **One submenu per level.** Opening a submenu closes any other open submenu
  of the same level, with its descendants.
- **In a Menubar,** opening another top menu, by key or by hovering while a
  menu is open, closes every level of the previous one (existing for the root
  menus).

### Activation reporting

- `onSelect(value)` runs once per activation, after every level is closed and
  focus has returned (ADR 0011). Menubar keeps `onSelect(menuValue,
  itemValue)`, where `menuValue` is the top menu.
- A submenu trigger never reports through `onSelect`. Opening and closing a
  submenu reports nothing: submenu state is internal (decision 1).
- `onOpenChange` keeps reporting the root menu only: `true` when it opens,
  `false` when the last level closes.
- `onSelect` reports the item value only. Values are unique in the tree, and
  `findEntry(value)` gives the path when an application needs it
  (decision 5).
- An item that opens a dialog: the menu has closed and returned focus to its
  trigger before `onSelect` runs, so the dialog returns focus to that trigger
  when it closes (ADR 0016).

### Focus return

| Closed by | Focus goes to |
| --- | --- |
| Escape or the arrow toward inline-start in a submenu | The parent item |
| Escape in the root menu | The trigger; for Context Menu, the element focused before opening |
| Activation | The trigger; for Context Menu, the element focused before opening |
| Tab | The next element in the tab order |
| Outside press | Where the press put it; focus is not moved back |

## Pointer and touch

- **Hover opens after a delay.** The pointer resting on a submenu trigger for
  100 ms opens its submenu. Focus stays on the trigger, so the person can
  keep moving with the pointer or press the arrow toward inline-end.
- **Hover on a sibling closes after the same delay**, unless the pointer is
  in the grace area.
- **Grace area.** When the pointer leaves a submenu trigger toward its open
  submenu, the area between the exit point and the near edge of the submenu
  (a polygon from the pointer to the submenu's two near corners, a few pixels
  wider than the trigger) keeps the submenu open. Items crossed inside that
  area do not take focus or open their own submenus. The grace ends when the
  pointer enters the submenu, leaves the area, or rests for 300 ms. This is
  what lets a person move diagonally to the submenu without closing it.
- **Press on a trigger.** A press opens a closed submenu. On touch and pen a
  press on an open submenu's trigger closes it. A mouse press on an open
  trigger keeps it open, because hover has usually opened it a moment
  before (decision 2).
- **Touch has no hover.** A tap opens the submenu, and only a tap. Context
  Menu keeps its long press (500 ms, 10 px tolerance) to open the root menu.
- **Leaving the menus.** Moving the pointer out of all levels closes nothing;
  an outside press, Escape or Tab does.
- **Close order.** Every level closes from the deepest outward, and the
  adapter reports and returns focus only after the root menu is closed. On
  Flutter this is a platform difference to handle, see
  [Flutter](#flutter).

## Positioning

- **Placement.** A submenu opens at the inline-end of its parent item, top
  aligned: its first item lines up with the trigger. Floating UI's placement
  is `right-start` in left-to-right and `left-start` in right-to-left, with
  an offset that cancels the menu padding.
- **Flip.** When the inline-end side has no room, the submenu opens at the
  inline-start side. When neither side has room (a narrow phone screen), it
  overlaps its parent menu, shifted to stay inside the viewport with 8 px
  padding, as the root menu does today.
- **Vertical room.** The submenu shifts up to stay in the viewport. Its
  maximum height is the available height minus the padding, and the level
  scrolls inside; the focused item scrolls into view (`block: "nearest"`).
- **Collision with the parent.** A submenu never covers its own parent item
  while it has room on either side.
- **Stacking.** Every level uses the menu z-index (`--ds-menu-z-index`), and a
  deeper level stacks above its parent. On the web a submenu popup stays a
  DOM descendant of the root menu's container, so keyboard events bubble to
  the Menubar and outside-press checks see one tree.
- **Indicator.** A submenu trigger shows a chevron at inline-end, hidden from
  assistive technology, mirrored under right-to-left.

## Accessibility

### Roles and states

| Part | Web | Flutter |
| --- | --- | --- |
| Submenu trigger | `role="menuitem"`, `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` while open, `aria-disabled` when disabled | `SemanticsRole.menuItem`, `expanded`, `enabled`, a localized "submenu" hint from the message catalog when no popup property exists (decision 6) |
| Submenu | `role="menu"`, `aria-labelledby` the trigger's id, `tabindex="-1"` | `SemanticsRole.menu`, labelled by the trigger's label |
| Items inside | `menuitem`, `menuitemcheckbox`, `menuitemradio`, `group`, `separator` (existing) | `menuItem`, `menuItemCheckbox`, `menuItemRadio`, `checked` |
| Data hooks | `data-state="open" \| "closed"` and `data-kind="submenu"` on the trigger, `data-level` on each menu | Not applicable |

### Announcements

No live region. Screen readers announce the submenu from the roles and
states: the trigger reads as a menu item with a submenu and its expanded
state, and opening moves focus to the first item, which is announced with
its position in the new menu. Screen reader output on each platform is a
manual check, written as not yet verified until a dated session exists
([evidence register](./evidence-register.md)).

### Target size and density

- **Web.** Every item, submenu triggers included, is at least 24 by 24 CSS
  pixels ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
  Under `@media (pointer: coarse)` the minimum grows to 44 by 44, the touch
  target Invisible UI specifies in `density.touch.min-target-size`. It is a
  minimum size, not extra padding (decision 8).
  `e2e/target-size.spec.ts` already checks `menuitem` roles on every component
  page, and covers submenu triggers on a demo that shows them open.
- **Flutter.** The hit area follows `minTargetSize` from ADR 0017: 24 by 24
  under `compact` and `regular` density, 44 by 44 under `touch` and under
  Timelog's explicit setting.

### Forced colors and reduced motion

- **Forced colors.** The focused item is marked today with an inset
  `box-shadow`, which forced colors remove. Under `forced-colors: active` the
  focused item and the open submenu trigger each draw an outline in a system
  colour (`Highlight`), so focus and the open path stay visible. The chevron
  uses `currentColor`.
- **Reduced motion.** Submenus open and close at once under
  `prefers-reduced-motion: reduce` and `MediaQuery.disableAnimationsOf`. The
  100 ms hover delay and the grace area stay: they are timing, not motion.

## Mapping per platform

### `core/`

The rules live once in `core/src/menu`; the web adapters stay thin.

- **Types.** `MenuSubmenu` and the widened `MenuGroup` and `MenuEntry` above;
  `isSubmenu(entry)`; `itemsOf` keeps submenu triggers and leaves out their
  children; `findEntry(entries, value)` returns the entry and its path.
- **State.** `MenuState.openPath: string[]`, default `[]`. The field is
  optional, so a state object written before submenus stays valid.
- **`ConnectOptions`.** `setOpenPath(path)` beside `setOpen` and
  `setActiveValue`, and `direction?: "ltr" | "rtl"`, as Tabs has.
  `setOpenPath` is optional: without it no submenu opens.
- **`MenuApi`.**
  - `openSubmenu(value, focus: "first" | "none")`: opens the submenu and its
    path; `"first"` for keys, `"none"` for hover.
  - `closeSubmenu()`: closes the deepest level and makes its parent item
    active.
  - `getSubmenuTriggerProps(value)` and `getSubmenuProps(value)`, with the
    roles and states above.
  - `entriesAt(path)` and `levelOf(value)`, so an adapter renders each level
    and scopes typeahead to it (`matchItem(entriesAt(path), …)`).
  - `closeMenu()` closes every level; `select(value)` closes every level, then
    calls `onSelect`.
- **Keys.** `onMenuKeyDown` handles the map above for the level that has
  focus. The arrow toward inline-end on a plain item and the arrow toward
  inline-start in the root menu are left unhandled (`preventDefault` not
  called), so a Menubar acts on them only when `event.defaultPrevented` is
  false.
- **Menubar.** A new `core/src/menubar` module owns the coordination between
  top menus: which top menu is open, the arrow rule between top menus and
  submenus, and RTL mirroring. The adapters' `createMenubar`, `useMenubar`
  and `ds-menubar` become thin over it (decision 7).
- **Timing and geometry stay in the adapters.** The hover delay, the grace
  area and positioning are DOM concerns, as the tooltip delays are today. The
  grace-area test (a point in a polygon) and the placement choice are pure
  functions, so they are written once in `core/src/internal` and covered by
  the shared test vectors below. The `menu` namespace re-exports them as
  `isInGraceArea`, `graceArea`, `pointInPolygon` and `placeSubmenu`.

### Svelte (reference)

- `createDropdownMenu`, `createContextMenu` and `createMenubar` gain a
  `submenuTriggerAction` and a `submenuAction` per level, built on the
  `core` props above, with the hover delay and grace area.
- `ContextMenu.svelte` and `Menubar.svelte` take `MenuItem[]` today. They
  widen to `MenuEntry[]`, which brings groups and separators to both,
  matching Dropdown Menu.
- `createMenubar` mirrors its arrows under right-to-left, as `ds-menubar`
  already does, and skips a key the open menu already handled.

### Vue

The same changes in `useDropdownMenu`, `useContextMenu` and `useMenubar`,
and in the shared `internal/menu.ts`. `ContextMenu` and `Menubar` widen to
`MenuEntry[]`; `useMenubar` mirrors its arrows under right-to-left.

### Custom elements

`internal/menu.ts` renders submenus recursively in `renderMenuEntries`, with
one popup per level inside the element. `MenuButton` keeps the open path,
uses `HoverDelay` for the 100 ms delay and `attachFloating` for each level,
and passes every open popup to `onOutside`. `ContextMenuItem` and the
`items` of `ds-menubar` widen to `MenuEntry[]`; the renderer already handles
groups and separators.

### React

React has no menus today. Its Dropdown Menu, Context Menu and Menubar
(roadmap item 14) follow this spec on the same `core` API.

### Flutter

- **Anchors.** Each level is a `RawMenuAnchor` with its own `MenuController`.
  A submenu anchor sits inside its parent's `overlayBuilder`, the nesting
  the `RawMenuAnchor` documentation shows. Menubar is a `RawMenuAnchorGroup`.
  The trigger's `FocusNode` is the anchor's `childFocusNode`.
- **Keyboard.** One shared menu keyboard layer (ADR 0017 §4) maps the keys
  with `Shortcuts` to menu intents (next, previous, first, last, open
  submenu, close level, activate, dismiss) and resolves left and right from
  `Directionality.of(context)`. An action that does not apply (the arrow
  toward inline-end on a plain item) is disabled, so the key reaches the
  Menubar's own `Actions`, the Dart equivalent of the unprevented DOM event.
- **Typeahead and focus.** The level's items share a `FocusTraversalGroup`;
  typeahead runs the Dart port of `matchItem` on the open level only.
- **Pointer.** `MouseRegion` with a 100 ms `Timer` opens on hover; the grace
  area runs the Dart port of the polygon test. A tap opens; touch and pen
  close an open trigger on a second tap (decision 2).
- **Placement.** The `overlayBuilder` receives the anchor rectangle and the
  overlay size; a layout delegate applies the placement, flip and shift rules
  above, with `AlignmentDirectional` so they mirror under right-to-left.
- **Semantics.** As in the roles table.
- **Close order and the SDK range.** The package declares `sdk: ^3.8.0`
  (Flutter 3.32). Flutter 3.44 changed how nested anchors close: since 3.44
  closing an anchor closes its descendants first, calls `onCloseRequested`
  from the parent down and `onClose` from the deepest child up; before 3.44
  each `onCloseRequested` had to call `closeChildren()` and the parent's
  `onClose` could run before its children's
  ([breaking change notes](https://docs.flutter.dev/release/breaking-changes/raw-menu-anchor-close-order)).
  The adapter depends on neither order: it closes the deepest level first
  itself (`closeChildren()` on the root controller, then `close()`), tracks
  the open path in its own state, and reports `onSelect` and returns focus
  after the root is closed, in a post-frame callback. The widget tests run on
  Flutter 3.32 and on the current stable release (3.44 or later).

## Test plan

### Shared test vectors

Language-neutral JSON files, read by the `core/` tests and the Flutter tests
(ADR 0017 §1). They live in `core/src/menu/__vectors__/`; the Flutter tests
read them from that path in the repository, and `core/src/menu/vectors.test.ts`
runs every case against `core/`. The keyboard and typeahead files share the
tree in `menu-tree.json`.

- `menu-keyboard.json`: for a tree, a starting focus, an open path and a
  direction, each key gives the resulting focus, open path and report.
- `menu-typeahead.json`: `matchItem` per level, with disabled items and
  submenu triggers.
- `menu-grace-area.json`: polygon and point cases with the expected inside or
  outside result.
- `menu-placement.json`: anchor rectangle, menu size and viewport, with the
  expected side, flip and shift.

### Unit tests (`core/`)

- Model: `itemsOf` keeps triggers and drops children; duplicate values throw
  in development; the depth warning; an empty submenu behaves as disabled.
- Keys: every row of both keyboard tables, in both directions; the two
  unhandled cases leave `preventDefault` uncalled.
- Props: `aria-haspopup`, `aria-expanded`, `aria-controls` only while open,
  `aria-disabled`, `aria-labelledby` on the submenu.
- State: one open submenu per level; the path is cut when items lose a value
  on it; `select` closes every level before `onSelect`, and `onSelect` runs
  once; a submenu trigger never reports.

### Adapter interaction tests (Svelte, Vue, custom elements, then React)

- Enter, Space and the arrow toward inline-end open and focus the first
  item; Escape and the arrow toward inline-start close one level and focus
  the parent item; Tab and an outside press close every level.
- Typeahead stays in the open level.
- Activation inside a submenu: every level closed, focus on the trigger,
  then one `onSelect`; Context Menu returns focus to the element focused
  before opening.
- Hover opens after 100 ms (fake timers); a sibling closes it after 100 ms;
  a move inside the grace area keeps it open, and 300 ms of rest ends it.
- A disabled trigger opens by no key, hover or press.
- Menubar: the arrow on a plain item moves to the next top menu; on a
  trigger it opens the submenu; both mirrored under right-to-left.
- Controlled `items` that drop an open submenu cut the open path without a
  report.

### End-to-end scenarios (Playwright, three engines)

- Keyboard path through Dropdown Menu, Context Menu and Menubar with a
  two-level submenu, in left-to-right and right-to-left pages.
- Diagonal pointer move from a trigger to its submenu across a sibling item.
- Flip to inline-start near the viewport edge; overlap at 320 px width;
  scroll inside a tall submenu.
- Space on a checkbox or radio item, in a submenu and in the root menu, changes its state, keeps the menu open and reports once.
- Under an emulated coarse pointer, every menu item and submenu trigger measures at least 44 by 44.
- Touch emulation: tap opens, second tap closes, long press opens Context
  Menu.
- Target size and forced colors with a submenu open.

### Flutter widget tests

- The shared vectors.
- Keyboard paths with `sendKeyEvent` under `TextDirection.ltr` and `rtl`.
- Semantics with `matchesSemantics`: role, expanded, enabled, checked.
- `meetsGuideline` with a 24 by 24 and a 44 by 44 `MinimumTapTargetGuideline`
  per density; `labeledTapTargetGuideline`; text scale 2.0.
- Close order: activation inside a submenu closes every level, returns focus
  and reports once, on Flutter 3.32 and on 3.44 or later.

### Parity checklist lines

For `packages/flutter/parity/dropdown-menu.md`, `context-menu.md` and
`menubar.md`: the `submenu` entry; disabled trigger; each row of both
keyboard tables; RTL mirroring; typeahead per level; one open submenu per
level; Escape, Tab and outside press; focus return per row of its table;
`onSelect` once after closing; hover delay; grace area; tap and second tap;
placement, flip and overlap; maximum height and scroll; each semantics
mapping; target size per density; reduced motion; close order on both sides
of 3.44.

## Decisions taken

Recorded by the maintainer on 2026-10-03:

1. **Submenu state is internal.** No `open` or `onOpenChange` per submenu in
   v1; `onOpenChange` reports the root menu only. A controlled open path can
   be added later without a breaking change.
2. **A press on an open trigger.** A mouse press keeps the submenu open;
   touch and pen close it on a second tap.
3. **Checkable items.** Space changes a checkbox or radio item's state and
   keeps the menu open, in submenus and in the root menu. Enter and a press
   still close every level. This changes today's behaviour in every adapter.
4. **Narrow screens.** No drill-in layout: the submenu flips side, or
   overlaps its parent when neither side has room. Phones are expected to use
   one level. Revisited if a consumer needs it.
5. **Reported value.** `onSelect` reports the item value only; the path comes
   from `findEntry`.
6. **Flutter popup semantics.** Where Flutter has no property for "opens a
   submenu", the trigger carries a localized "submenu" hint from the message
   catalog.
7. **Menubar in `core/`.** The Menubar coordination moves into a
   `core/src/menubar` module together with the submenu work, so the arrow
   rules, RTL mirroring included, exist once for every web adapter.
8. **Web touch sizing.** Under `pointer: coarse`, menu items, submenu
   triggers included, have a 44 by 44 minimum target, from
   `density.touch.min-target-size`.
