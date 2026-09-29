---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

`<ds-table-set>` and `<ds-table-view>` take their heading from `heading` and
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
