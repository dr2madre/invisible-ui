# Prompt Dialog parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/dialog` `packages/svelte/src/lib/prompt-dialog`

The Flutter `PromptDialog` checked against the Svelte `PromptDialog`
(`packages/svelte/src/lib/prompt-dialog`) and
[ADR 0005](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0005-native-dialog-and-urgency.md).
It builds the dialog family's panel, so the route, focus trap, Escape, focus
return, layout and status area lines of [dialog.md](dialog.md) hold for it.
Docs page: [Prompt Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/prompt-dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/prompt_dialog_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog<String>(builder: (_) => PromptDialog(...))`, completing with the text or `null` | the trigger, `open` and `onConfirm` | opening, and the value or a cancellation |
| `title`, `description`, `label`, `placeholder` | the same | name, description, field name, hint |
| `initialValue` | `value` | the text the field holds on each opening |
| `required`, `confirmValue` | `required`, `confirmValue` | the confirm gates |
| `confirmLabel`, `cancelLabel`, `confirmVariant`, `urgent` | the same | the buttons and the urgency |
| `onConfirm(String)` | `onConfirm(value)` | reports the text after the dialog has closed |
| `closeButton`, `icon`, `controller` | `closeButton`, `icon`, `notify()` | header and status area |
| `barrierDismissible` on `showInvisibleDialog` | `closeOnOutsideClick` | whether the barrier cancels |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The field takes focus when the dialog opens | matched | `opens with focus in the field, named and described; urgent makes it an alert dialog` |
| Named by the title, described by the description; the field is labelled | matched | same test |
| `urgent` makes it an alert dialog; nothing else changes | matched | same test; `without urgent it is a dialog; the value is optional and the buttons come from the catalog` |
| The value is optional by default | matched | `without urgent it is a dialog; …` |
| `required` keeps confirm disabled while blank or spaces, Enter included | matched | `required keeps confirm disabled while blank or spaces` |
| `confirmValue` opens the gate on an exact match only | matched | `the type-to-confirm gate opens on an exact match only` |
| Enter in the field confirms | matched | `Enter confirms: the dialog closes first, then reports the text, and focus returns to the trigger` |
| Enter during an input method composition | adapted | the web confirms on any Enter `keydown`, composition included; Flutter commits the composed text and confirms only on the next Enter: `Enter that ends an input method composition does not confirm` |
| `onConfirm` runs, then the dialog closes | adapted | ADR 0011 says a component closes before it reports; the web calls `onConfirm` before closing. Flutter closes first, then calls `onConfirm`: same Enter test |
| Cancel, Escape and the barrier close without confirming | matched | `Cancel and Escape close without confirming` |
| The field is reset to the initial value on every opening | matched | `the field starts from initialValue on every opening` |
| The status area sits before the actions; a notice takes no focus | matched | `a notice shows in the status area before the actions` |
| Focus returns to the trigger | matched | the Enter test |
| Text scale 2.0, narrow, right to left; 44 by 44 targets under touch; labelled | matched | `right to left at text scale 2.0 on a narrow screen: no overflow; labelled 44 by 44 targets under touch` |
| Text contrast with the gate open | matched | `opens with focus in the field, …`; a disabled button is exempt from the contrast minimum |
| `required` shows the asterisk on the field label | adapted | the web label shows none; Flutter's field shows the required asterisk, as every Flutter field does, and reports the field required |
| A trigger button inside the component | adapted | Flutter opens dialogs as routes: the app's own button calls `showInvisibleDialog` |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |
