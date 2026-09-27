---
"@design-system/vue": patch
---

Vue components are safer with consumer data and follow props changed after
mount.

- **AvatarGroup**: a `color` containing `;`, `{` or `}` is ignored, so data
  from outside can no longer add its own style declarations to the page.
- **Link**: a link that opens a new tab always gets `rel="noopener
  noreferrer"`, also when `target="_blank"` is passed as a plain attribute
  (as EmptyState and ErrorState actions do). A `rel` of your own is kept
  next to it.
- **createNotifier**: each notifier numbers its notices on its own, so a
  server no longer carries ids over from one request to the next.
- **Popover, HoverCard**: a popover or hover card rendered already open is
  positioned, closes on Escape and outside presses, and (popover) takes
  focus, as it does when opened later. With **Tooltip**, it also moves when
  `placement` or `offset` change while it is open.
- **Progress** (`min`, `max`) and **Meter** (`min`, `max`, `low`, `high`,
  `optimum`) follow changes after mount. `useProgress` and `useMeter` gain
  `syncRange`.
- **Radio**: the checked radio is also written as an attribute, so a native
  form reset restores it on every supported Vue release.
- **Combobox**: when the items arrive after the component mounted, the input
  shows the selected option's label.
- **Menubar**: a menu keeps its state (open, highlighted item) when the list
  of menus reorders, and the keyboard tab stop stays on a trigger that still
  exists when menus are removed.
- **NotificationRegion**: the reduced-motion preference is read after mount,
  so server-rendered pages hydrate without a mismatch.
- **TableSet**: with infinite scroll, a load that ends while the bottom of
  the list is still in view loads the next batch.
- **AvatarGroup, Calendar, DropdownMenu, EmptyState, ErrorState,
  InlineNotification, NavigationMenu**: two entries that share a name,
  label or link no longer confuse the rendered list.
