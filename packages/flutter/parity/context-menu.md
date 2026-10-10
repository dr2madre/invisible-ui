# Context Menu parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/menu` `core/src/internal/submenu-geometry.ts` `packages/svelte/src/lib/context-menu` `docs/menu-submenu-spec.md`

The Flutter `ContextMenu` checked against the Svelte `ContextMenu`
(`packages/svelte/src/lib/context-menu`), the headless menu in
`core/src/menu` and the submenu spec in
[`docs/menu-submenu-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/menu-submenu-spec.md), which
follow the [WAI-ARIA menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
The Svelte component takes a flat list of items today; the spec widens
Context Menu to the whole `MenuEntry` model (groups, separators, checkable
items and submenus), as the React adapter does, and the Flutter widget
follows the spec. The menu itself is the shared menu layer of Dropdown
Menu, so every line about keys, hover, submenus, semantics and placement of
the levels that [`dropdown-menu.md`](dropdown-menu.md) marks applies here
too; this file lists what Context Menu adds or changes.
Docs page: [Context Menu](https://dr2madre.github.io/invisible-ui/components/data-layout/context-menu/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the test that holds it, in
`test/context_menu_test.dart`.

## Names

| Flutter | Svelte and core | ADR 0011 meaning |
| --- | --- | --- |
| `ContextMenu<T>` | `ContextMenu` | values are any type `T` |
| `child` | `children` | the region the menu opens on |
| `items: List<MenuEntry<T>>` | `items: MenuItem[]`, `MenuEntry[]` in the spec | items, groups, separators, submenus |
| `onSelected` | `onSelect` | reports the chosen value once, after every level closes |
| `enabled: false` | `disabled` | `enabled` is the Flutter name |
| `label` | `label` | the menu's name, `contextMenu.label` by default |
| `onOpenChange` | `onOpenChange` on `createContextMenu` | out of scope: the component does not expose it |

## Opening

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A secondary click opens the menu at the pointer, focusing the first enabled item | matched | `a secondary click opens the menu at the pointer, on its first item` |
| Placement `right-start`, 2 px from the point, flipping and shifting with 8 px padding | adapted | the menu opens toward the inline-end of the point and flips toward the inline-start, through the submenu placement rule (`placeSubmenu`, held by the shared placement vectors): `a secondary click opens…`, `rtl: the menu opens toward the inline-end of the pointer`, `near the edge the menu flips toward the inline-start`. The web placement stays on the right in right-to-left pages; the Flutter one mirrors, as the submenus do |
| Opening again while open moves the menu to the new point and focuses the first item | matched | `opening again moves the menu to the new point` |
| Touch: a long press of 500 ms opens at the press; a move of more than 10 px or an early lift cancels it | matched | `a long press with a finger opens the menu at the press`, `a finger that moves more than 10 px or lifts early opens nothing` |
| The keyboard menu key and Shift+F10 open the menu at the region's top-left corner | adapted | `<direction>: Shift+F10 opens…`, `<direction>: the context menu key opens…`. The browser fires `contextmenu` for both keys; Flutter maps them with `Shortcuts`. The corner is the inline-start one, so the top-right corner in right to left |
| The region is focusable (`tabindex="0"`) and shows a focus ring for keyboard focus | matched | `the region shows a focus ring for keyboard focus` |
| A disabled menu opens by nothing | matched | `a disabled region opens by nothing` |
| Scrolling the page under an open menu closes it | matched | `RawMenuAnchor` closes its root when an enclosing `Scrollable` scrolls, and the session closes with it (`rootClosed`); not a separate test |

## Keys, focus return and activation

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Arrows, Home, End and typeahead within a level; disabled items skipped | matched | `arrows skip disabled items and submenus open by the arrow toward the inline-end`, `typeahead finds an item of the focused level` |
| Submenus open and close by the arrows, and the arrow toward the inline-start does nothing in the root menu | matched | same test |
| Escape closes one level; in the root it closes the menu and focus returns to the element focused before opening | matched | `Escape closes the menu and returns focus to the control that had it before` |
| With nothing focused before opening, focus returns there | adapted | the web returns focus to the page body; Flutter gives it to the region, so keyboard users keep their place: `with nothing focused before, focus returns to the region` |
| Activation closes every level, returns focus to the element focused before, then reports once (ADR 0011, ADR 0016) | matched | `activation closes every level, returns focus, then reports once` |
| Space on a checkable item reports it and keeps the menu open | matched | `Space on a checkable item reports it and keeps the menu open` |
| A press on an item reports it | matched | `a press on an item reports it` |
| The callback is read at the activation | matched | `the callback is read when the item is chosen` |
| Tab closes the menu; focus moves on in the tab order | adapted | `Tab closes the menu and moves on from the region`. Flutter's traversal would stay in the overlay, so the menu moves on from the region, as Dropdown Menu does from its trigger |
| An outside press closes the menu without moving focus back | adapted | `a press outside closes the menu and leaves focus`; the reason in `dropdown-menu.md` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Menu `role="menu"` named by `aria-label`, from `contextMenu.label` | matched | `a menu named from the catalog, or by its label` (`SemanticsRole.menu`; the theme messages and the `label` override) |
| Trigger `aria-haspopup="menu"` on the region | adapted | Flutter has no popup property; the region carries a long-press action that opens the menu at its corner, the touch gesture for it: `assistive technology opens it with a long press` |
| Items, submenu triggers and their hint | matched | as in `dropdown-menu.md`; `a menu named from the catalog, or by its label` checks the submenu hint |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Targets, layout and tokens

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Item hit area 24 by 24, 44 by 44 under touch | matched | `every item is at least 24 by 24, and 44 by 44 under touch` |
| The menu stays inside a narrow screen at text scale 2.0 | matched | `text scale 2.0 on a narrow screen keeps the menu inside` |
| Colours, radii and elevation of the shared menu tokens | matched | the shared `MenuPanel`; see `dropdown-menu.md` |
| Region focus ring radius `radius.control` | matched | the region paints the theme focus ring with `controlRadius` |
