---
"@design-system/svelte": patch
---

Svelte components now follow props changed after mount, instead of keeping
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
