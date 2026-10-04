# Alert Dialog parity checklist

Reference commit: `71ede6af6037f9dc1aa5ade2c426bd21abb37943`

Reference paths: `core/src/dialog` `packages/svelte/src/lib/dialog` `packages/svelte/src/lib/alert-dialog`

The Flutter `AlertDialog` checked against the Svelte `AlertDialog`
(`packages/svelte/src/lib/alert-dialog`). It builds the dialog family's
panel, so the route, focus trap, Escape, focus return, layout and status
area lines of [dialog.md](dialog.md) hold for it.
Docs page: [Alert Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/alert-dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/dialog_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog(builder: (_) => AlertDialog(...))` | the trigger and `open` | opening, as for `Dialog` |
| `title`, `description` (both required) | `title`, `description` | name and message |
| `dismissLabel` | `dismissLabel` | the button, the catalog's `dialog.dismiss` ("OK") by default |
| `onDismiss` | `onDismiss` | runs after every way of closing |
| `barrierDismissible` on `showInvisibleDialog` | `closeOnOutsideClick` | whether the barrier acknowledges |
| `closeButton`, `icon`, `controller` | `closeButton`, `icon`, `notify()` | header and status area |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Role `alertdialog`, named by the title, described by the message | matched | `an alert dialog, focus on its one button, every way of closing acknowledges` |
| Focus starts on the one button | matched | same test |
| The button, Escape and the barrier all acknowledge: `onDismiss` each time | matched | same test |
| Focus returns to the trigger | matched | same test |
| An outcome-named button and an optional close button | matched | `names the outcome and offers an optional close button` |
| The catalog's `dialog.dismiss` and `dialog.close` | matched | `InvisibleMessages.dialogDismissLabel`, `dialogCloseLabel`; `test/messages_test.dart` |
| At most 28rem wide, the message under the title, actions at the end | matched | the family panel with the preset spacing; layout tests in [dialog.md](dialog.md) |
| Status area before the actions | matched | `the presets have a status area before their actions` (a `ConfirmDialog`, the same panel) |
| A trigger button inside the component | adapted | Flutter opens dialogs as routes: the app's own button calls `showInvisibleDialog` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
