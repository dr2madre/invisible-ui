# Dropdown Menu parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/menu` `core/src/internal/submenu-geometry.ts` `packages/svelte/src/lib/dropdown-menu` `docs/menu-submenu-spec.md`

The Flutter `DropdownMenu` checked against the Svelte `DropdownMenu`
(`packages/svelte/src/lib/dropdown-menu`), the headless menu in
`core/src/menu` and the submenu spec in
[`docs/menu-submenu-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/menu-submenu-spec.md), which
follow the
[WAI-ARIA menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
and [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) patterns. The
web adapters do not render submenus yet; for submenus the reference is the
spec and the `core/` keyboard map, which the shared vectors hold.
Docs page: [Dropdown Menu](https://dr2madre.github.io/invisible-ui/components/data-layout/dropdown-menu/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the test that holds it, in
`test/dropdown_menu_test.dart` unless it says `vectors:` for
`test/menu_vectors_test.dart`, which runs the files in
`core/src/menu/__vectors__` that `core/src/menu/vectors.test.ts` runs too.

## Names

| Flutter | Svelte and core | ADR 0011 meaning |
| --- | --- | --- |
| `DropdownMenu<T>` | `DropdownMenu` | values are any type `T`; the vectors use strings |
| `label` | `label` | the trigger text and the menu's name |
| `items: List<MenuEntry<T>>` | `items: MenuEntry[]` | items, groups, separators, submenus |
| `MenuItem(value:, label:, disabled:, kind:, checked:)` | `MenuItem` | `kind` is `MenuItemKind.action`, `.checkbox` or `.radio` |
| `MenuSubmenu`, `MenuGroup`, `MenuSeparator` | `MenuSubmenu`, `MenuGroup`, `MenuSeparator` | the same kinds, as a sealed class |
| `onSelected` | `onSelect` | reports the chosen value once, after every level closes |
| `enabled: false` | `disabled` | `enabled` is the Flutter name |
| Submenu open state | internal | internal too (spec decision 1) |

## Data model

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A `submenu` entry beside items, groups and separators | matched | vectors: `menu keyboard vectors` |
| A submenu trigger is a stop of its own level; its items belong to the next | matched | vectors: typeahead `A submenu item is not found from the root` |
| Values unique across the tree | matched | `MenuTree` asserts in debug builds, as `checkItems` throws in development |
| A disabled trigger and an empty submenu behave as disabled | matched | vectors: `ArrowDown skips a disabled trigger and an empty submenu`, `An empty submenu behaves as disabled` |
| Depth warning beyond two levels | out of scope | development console warning; Flutter has no equivalent channel the package uses |
| Groups, separators, checkbox and radio items inside submenus | matched | `roles and states of the menu and its items` (Beta in a submenu) |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Trigger: Down, Enter, Space open on the first item; Up on the last | matched | `ArrowDown opens the menu…`, `Enter…`, `Space…`, `ArrowUp opens the menu on its last item` |
| Up and Down move within the level, wrapping, skipping disabled stops | matched | `up and down move within the level, wrapping and skipping disabled items`; vectors |
| Home and End | matched | same test; vectors: `Home moves…`, `End moves…` |
| Typeahead per level, case-insensitive, reset after 500 ms and on a level change | matched | `typeahead finds an item of the focused level only`; vectors: `menu typeahead vectors` |
| Typeahead never opens a submenu | matched | vectors: `Matches a submenu trigger by its label` |
| Enter and Space on a trigger open the submenu on its first item | matched | `Enter and Space open a submenu on its first item`; vectors |
| The arrow toward the inline-end opens a submenu; on a plain item it is left unhandled | matched | `ltr: the arrow toward the inline-end…`, `rtl: …`; vectors: `ArrowRight on a plain item is left unhandled` |
| The arrow toward the inline-start closes one level, focusing the parent item; in the root it is left unhandled | matched | same tests; vectors |
| Right to left swaps the two arrows | matched | `rtl: the arrow toward the inline-end opens a submenu…`; vectors: `RTL: …` cases |
| Moving within a level closes the submenus open below it | matched | vectors: `Moving within a level closes the submenu open below it` |
| Escape closes one level; in the root it closes the menu and focus returns to the trigger | matched | `Escape closes one level, then the menu, and focus returns to the trigger`; vectors |
| Escape with a hovered submenu below the focus closes that submenu only | matched | vectors: `Escape with a hovered submenu open below the focus closes that submenu only` |
| Tab and Shift+Tab close every level and move on from the trigger | adapted | `Tab closes every level and moves on from the trigger`. The web leaves Tab to the browser; Flutter's traversal would stay in the overlay, so the menu returns focus to the trigger and moves next or previous from there |
| A key no level uses reaches the handlers above | matched | each key is a `RovingKeyIntent` whose action is disabled when `MenuTree.key` leaves it unhandled; a Dropdown Menu keeps the unused side arrows from the rest of the app, as nothing above it takes them |
| Enter and a press activate a checkable item: every level closes, then it reports | matched | `Enter on a checkable item closes the menu, then reports`; vectors |
| Space on a checkbox or radio item reports it and keeps every level open | matched | `Space on a checkable item reports it and keeps the menu open`; vectors |
| A disabled trigger opens by no key | matched | `keys skip a disabled submenu, so no key opens it`; vectors: `A disabled trigger opens by no key: Enter` |
| A disabled menu trigger stays focusable and opens by nothing | matched | `a disabled trigger stays focusable and opens by nothing` |

## Pointer and touch

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press on the trigger toggles the menu | matched | `a press opens the menu; a second press closes it` |
| A press on an item closes every level, returns focus, then reports | matched | `a press on an item closes the menu and reports it` |
| Hover opens a submenu after 100 ms; focus stays on the trigger | matched | `hover opens a submenu after 100 ms; a sibling closes it after 100 ms` |
| Hover on a sibling closes the open submenu after 100 ms | matched | same test |
| Grace area: crossing items on the way to the submenu keeps it open; 300 ms of rest ends it | matched | `the grace area keeps the submenu open on the way to it`; vectors: `menu grace area vectors` |
| A press opens a closed submenu; touch and pen close an open one on a second tap; a mouse press keeps it open | matched | `a tap with a finger opens a submenu; a second tap closes it`, `a mouse press on an open submenu trigger keeps it open` |
| A disabled trigger opens by no hover or press | matched | `a disabled submenu opens by no hover or press` |
| An outside press closes every level; focus is not moved back | adapted | `a press outside closes every level and leaves focus`. Flutter would move focus from the removed item back to the trigger (focus scope history); the menu sends it to the focus scope instead, the equivalent of a press on an empty page |
| Leaving every level with the pointer closes nothing | matched | `moving the pointer out of every level closes nothing` |

## Activation, state and close order

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `onSelected` once per activation, after every level closed and focus returned (ADR 0011, ADR 0016) | matched | `Enter inside a submenu closes every level, returns focus, then reports once` |
| A submenu trigger never reports | matched | vectors: no submenu case reports |
| The callback is read at the activation | matched | `the callback is read when the item is chosen` |
| Items that lose a value on the open path cut it silently | matched | `items that drop the open submenu cut the path silently`; vectors: `An open path through a disabled submenu is cut` |
| One submenu open per level | matched | `hover opens a submenu after 100 ms; a sibling closes it after 100 ms`; vectors: `Moving within a level closes the submenu open below it` |
| Close order the same before and after Flutter 3.44 | matched | the session keeps the open path itself, closes the deepest controller first, ignores anchor `onClose` calls for levels it already closed, and reports in a post-frame callback; every test here runs on Flutter 3.32.8 and on the current stable release |
| `onOpenChange` | out of scope | the Svelte `DropdownMenu` component does not expose it |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Trigger `aria-haspopup="menu"`, `aria-expanded` | adapted | `button` with `expanded`; Flutter has no popup property: `the trigger says whether the menu is open` |
| Menu `role="menu"` named by the trigger | matched | `roles and states of the menu and its items` (`SemanticsRole.menu`, label `File`) |
| Items `menuitem`, `menuitemcheckbox`, `menuitemradio` with `checked` | matched | same test (`SemanticsRole.menuItem`, `.menuItemCheckbox`, `.menuItemRadio`, checked state, radio in a mutually exclusive group) |
| Submenu trigger: `menuitem`, `aria-expanded`, `aria-disabled` | matched | same test |
| Submenu trigger `aria-haspopup` | adapted | a localized "submenu" hint from the theme messages (catalog key `menu.submenu`, spec decision 6): same test and `the submenu hint comes from the theme messages` |
| Submenu `role="menu"` labelled by its trigger | matched | each level is a `MenuPanel` with `SemanticsRole.menu` and the trigger's label |
| Group `role="group"` named by its label | adapted | Flutter has no group role: a semantics container named by the group label |
| Separator `role="separator"` | adapted | no Flutter role: the line has no semantics |
| Disabled items | matched | same test (`Share` is not enabled) |
| No live region; focus announces the new level | matched | the panel focuses the first item of a level opened by key |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Placement, layout and tokens

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Root menu below the trigger, at least as wide, flipping above and shifting inside with 8 px padding | matched | the shared `AnchoredLayout`; `text scale 2.0 on a narrow screen keeps every level inside` |
| Submenu at the inline-end, top aligned with its trigger | matched | `a submenu opens at the inline-end in both directions`; vectors: `menu placement vectors` |
| Flip to the inline-start; overlap the parent when neither side has room | matched | `near the edge the submenu flips to the inline-start`, `text scale 2.0 on a narrow screen keeps every level inside`; vectors |
| Maximum height is the viewport minus the padding; the level scrolls; the focused item stays in view | matched | `a tall level scrolls inside the screen; the focused item stays in view` |
| Chevron at the inline-end, mirrored in right to left, hidden from assistive technology | matched | the tile draws `GlyphShape.chevronEnd`, mirrored under `TextDirection.rtl`, inside excluded semantics |
| Item hit area 24 by 24, 44 by 44 under touch | matched | `every item is at least 24 by 24, and 44 by 44 under touch` |
| Hover and focus tint `state-hover`; inset focus ring for keyboard focus | matched | the ring shows in traditional highlight mode, inside the item, never moving the label |
| Forced colours: outline on the focused item and the open trigger | adapted | Flutter has no forced-colours mode; the open trigger keeps its tint and the keyboard ring stays |
| Colours `background`, `border`, `text`, `text-disabled`, `text-secondary`, `control-border`; radii `radius.control` and `radius.surface` | matched | the reference sets them in its stylesheet; same roles |
| Elevation `--ds-elevation-overlay` | adapted | the role lives in `tokens.css` only; the Flutter values copy its numbers until it moves into `tokens.json` |
| Reduced motion: no chevron turn; submenus open at once; the 100 ms delay and grace area stay | matched | `no motion under reduced motion` |
