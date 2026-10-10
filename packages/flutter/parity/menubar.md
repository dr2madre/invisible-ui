# Menubar parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/menu` `core/src/menubar` `packages/svelte/src/lib/menubar` `docs/menu-submenu-spec.md`

The Flutter `Menubar` checked against the Svelte `Menubar`
(`packages/svelte/src/lib/menubar`), the bar coordination in
`core/src/menubar`, the headless menu in `core/src/menu` and the submenu spec
in [`docs/menu-submenu-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/menu-submenu-spec.md), which
follow the [WAI-ARIA menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
The Svelte component takes flat lists of items today; the spec widens each
top menu to the whole `MenuEntry` model with submenus, as the React adapter
does, and the Flutter widget follows the spec. Each top menu is the shared
menu layer of Dropdown Menu, so the lines of
[`dropdown-menu.md`](dropdown-menu.md) about keys, hover, submenus,
semantics and placement inside a menu apply here too; this file lists what
the bar adds.
Docs page: [Menubar](https://dr2madre.github.io/invisible-ui/components/patterns/menubar/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the test that holds it, in
`test/menubar_test.dart` unless it says `vectors:` for
`test/menu_vectors_test.dart`, which runs
`core/src/menubar/__vectors__/menubar-keyboard.json`, the file
`core/src/menubar/vectors.test.ts` runs too.

## Names

| Flutter | Svelte and core | ADR 0011 meaning |
| --- | --- | --- |
| `Menubar<T>` | `Menubar` | menu and item values are any type `T` |
| `label` | `label` | the bar's accessible name |
| `menus: List<MenubarMenu<T>>` | `menus: MenubarMenu[]` | the top menus |
| `MenubarMenu(value:, label:, items:, disabled:)` | `{ value, label, items, disabled }` | `items` is `List<MenuEntry<T>>`, the spec's model |
| `onSelected(menu, item)` | `onSelect(menuValue, itemValue)` | once per activation, after the menu closed and focus returned |

## Bar

| Line | Status | Evidence or reason |
| --- | --- | --- |
| One tab stop on the bar, following the trigger that had focus last | matched | `the bar is one tab stop` |
| Left and right move between triggers, wrapping, disabled ones included | matched | `<direction>: the arrows move between triggers, wrapping, and reach a disabled one`; vectors |
| Right to left mirrors the arrows | matched | the `rtl` variants of both arrow tests; vectors: `RTL: …` |
| Home and End move between triggers only while every menu is closed | matched | `Home and End jump to the end triggers while closed`, `Home and End stay with an open menu`; vectors |
| A tab stop past the last menu stays on the bar | matched | vectors: `A tab stop past the last menu is kept on the bar` |
| Down, Enter and Space open a menu on its first item, Up on its last | matched | `ArrowDown opens…`, `Enter…`, `Space…`, `ArrowUp opens a menu on its last item` |
| A disabled menu takes focus and never opens | matched | `a disabled menu opens by no key or press`; vectors |

## Between menus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| In an open menu, the arrow toward the inline-end on a submenu trigger opens the submenu | matched | `<direction>: in an open menu the arrows switch top menus unless an item opens a submenu` |
| The arrow toward the inline-end on any other item opens the next top menu, focusing its first item | matched | same test; vectors: `ArrowRight switches the open menu to the next one` |
| The arrow toward the inline-start in a submenu closes it, focusing its trigger | matched | same test |
| The arrow toward the inline-start in a root menu opens the previous top menu | matched | same test |
| The bar acts only on a key the open menu left unused | matched | the menu's actions are disabled for keys it does not use, so the key reaches the bar's `Focus`, the Dart form of an unprevented DOM event; vectors: `An arrow the open menu already used is left alone` |
| Switching onto a disabled menu closes the open one and focuses its trigger | matched | `a switch onto a disabled menu closes the open one and focuses its trigger`; vectors |
| One open menu at a time | matched | the bar closes the open session before it opens another; every switching test checks the previous menu is gone |

## Pointer

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A press on a trigger toggles its menu | matched | `a press on a trigger toggles its menu; a press on an item reports it` |
| While a menu is open, hovering another trigger opens that one | matched | `while a menu is open, hovering another trigger opens that one instead`; vectors: hover cases |
| Hover opens nothing while every menu is closed | matched | `hovering a trigger opens nothing while every menu is closed`; vectors |
| A press on another trigger while a menu is open switches to it | matched | `a press on another trigger switches the open menu` |
| An outside press closes the menu without moving focus back | adapted | `a press outside closes the menu and leaves focus`; the reason in `dropdown-menu.md` |

## Closing and activation

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Escape closes the menu and focus returns to its trigger | matched | `Escape closes the menu and focus returns to its trigger` |
| Tab closes the menu and moves on from the bar | adapted | `Tab closes the menu and moves on from the bar`; the reason in `dropdown-menu.md` |
| Activation closes every level, returns focus to the trigger, then reports the menu and the item once | matched | `Enter in a submenu closes every level, returns focus to the trigger, then reports the menu and the item once` |
| The callback is read at the activation | matched | `the callback is read when the item is chosen` |
| A menu that goes away while open closes without a report | matched | `a menu that goes away while open closes silently` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Bar `role="menubar"`, `aria-orientation="horizontal"`, named by `label` | adapted | `SemanticsRole.menuBar` named by `label`: `a named menu bar of menu items that say whether their menu is open`. Flutter semantics have no orientation property |
| Triggers `role="menuitem"`, `aria-expanded`, `aria-disabled` | matched | same test (`SemanticsRole.menuItem`, expanded state, enabled state, focusable) |
| Trigger `aria-haspopup="menu"` | adapted | Flutter has no popup property; the expanded state says the trigger opens a menu |
| Each menu `role="menu"` named by its trigger | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Layout and tokens

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Menus open below their trigger at the inline-start edge, shifted inside the screen | matched | `a menu opens below its trigger at the inline-start edge` |
| Trigger and item hit area 24 by 24, 44 by 44 under touch | matched | `every trigger and item is at least 24 by 24, and 44 by 44 under touch` |
| A bar wider than its parent | adapted | the web bar is an `inline-flex` row; the Flutter bar wraps onto more rows instead of overflowing, and the arrows keep the reading order: `text scale 2.0 on a narrow screen wraps the bar and keeps the menu inside` |
| Bar border, `radius.surface`, background; trigger padding, bold label, `radius.control`, `state-hover` tint on hover and while open, focus ring | matched | the values of the Svelte stylesheet |
| Each top menu a root `RawMenuAnchor`, coordinated by the bar | matched | the spec's Flutter section: the bar applies the `core/src/menubar` rules itself rather than through a `RawMenuAnchorGroup`, whose own outside-press handling can return focus to the trigger; vectors |
