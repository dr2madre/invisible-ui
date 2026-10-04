---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the overlays and menus: `Popover` (with
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
