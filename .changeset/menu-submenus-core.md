---
"@design-system/core": minor
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/elements": patch
---

The headless menu supports submenus, as `docs/menu-submenu-spec.md`
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
