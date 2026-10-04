# Confirm Dialog parity checklist

Reference commit: `71ede6af6037f9dc1aa5ade2c426bd21abb37943`

Reference paths: `core/src/dialog` `packages/svelte/src/lib/dialog` `packages/svelte/src/lib/confirm-dialog`

The Flutter `ConfirmDialog` checked against the Svelte `ConfirmDialog`
(`packages/svelte/src/lib/confirm-dialog`). It builds the dialog family's
panel, so the route, focus trap, Escape, focus return, layout and status
area lines of [dialog.md](dialog.md) hold for it.
Docs page: [Confirm Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/confirm-dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/dialog_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog<bool>(builder: (_) => ConfirmDialog(...))`, completing with `true`, `false` or `null` | the trigger, `open` and `onConfirm` | opening and the choice: confirmed, cancelled, or closed another way |
| `title`, `description` | `title`, `description` | name and consequence |
| `confirmLabel`, `cancelLabel` | `confirmLabel`, `cancelLabel` | outcome-named buttons, the catalog's `dialog.confirm` and `dialog.cancel` by default |
| `confirmVariant` | `confirmVariant` | `ButtonVariant.danger` for a destructive choice |
| `urgent` | `urgent` | role `alertdialog` |
| `onConfirm` | `onConfirm` | runs before the dialog closes |
| `barrierDismissible` on `showInvisibleDialog` | `closeOnOutsideClick` | whether the barrier cancels |
| `closeButton`, `icon`, `controller` | `closeButton`, `icon`, `notify()` | header and status area |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Focus starts on Cancel, the safe choice | matched | `focus starts on the safe choice; outcome-named buttons report the choice` |
| Outcome-named destructive confirmation ("Keep hours" / "Delete") with the danger button's hazard glyph | matched | same test |
| Cancel closes; confirm runs `onConfirm`, then closes; Escape closes without confirming | matched | same test |
| Focus returns to the trigger | matched | same test |
| Role `dialog`; `urgent` makes it `alertdialog`, nothing else changes | matched | same test; `urgent makes it an alert dialog` |
| Catalog labels by default | matched | `urgent makes it an alert dialog` ("Cancel", "Confirm"); `test/messages_test.dart` |
| Status area before the actions | matched | `the presets have a status area before their actions` |
| A dialog on top of another (ADR 0016, case 3) | matched | `the dialog on top takes focus, Escape closes it alone and focus returns inside the dialog below` |
| Text scale 2.0, narrow, right to left | matched | `text scale 2.0 on a narrow screen, right to left: no overflow, the close button at the inline-end` |
| A trigger button inside the component | adapted | Flutter opens dialogs as routes: the app's own button calls `showInvisibleDialog` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
