# Dialog parity checklist

Reference commit: `0f1ba82071d59bb0a0b68a33210323e17837e24f`

Reference paths: `core/src/dialog` `packages/svelte/src/lib/dialog` `packages/elements/src/dialog` `packages/elements/src/internal/modal-stack.ts`

The Flutter `Dialog`, `showInvisibleDialog`, `InvisibleDialogRoute` and
`DialogController` checked against the Svelte `Dialog`, `DialogHeader`,
`DialogStatus` and `createDialog` (`packages/svelte/src/lib/dialog`) over the
core dialog (`core/src/dialog`), with the custom elements dialog
(`packages/elements/src/dialog`) as the second reading of
[ADR 0005](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0005-native-dialog-and-urgency.md)
and [ADR 0016](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0016-feedback-while-a-dialog-is-open.md).
The lines on the route, focus, Escape and the status area hold for
`AlertDialog` and `ConfirmDialog` too: they build the same panel.
Docs page: [Dialog](https://dr2madre.github.io/invisible-ui/components/feedback/dialog/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/dialog_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `showInvisibleDialog(context:, builder:)`, a `Future` of the result | the trigger button with `open` bindable and `onOpenChange` | opening and closing; Flutter opens a dialog as a route, as its own `showDialog` does, and the future completing is the close report |
| `Navigator.pop(context, result)` | `open = false` | closing from the content |
| `barrierDismissible` | `closeOnOutsideClick` | whether a press on the barrier closes |
| `title`, `hideTitle`, `description` | `title`, `hideTitle`, `description` | name, hidden name, subtitle that describes |
| `child` | `children` | the body |
| `actions`, `footerLead`, `footerClose` | `footer`, `footerLead`, `footerClose` | the footer |
| `closeButton` | `closeButton` | the header close button |
| `icon`, `headerLead`, `headerMeta`, `headerActions` | the snippets of the same names | header content |
| `initialFocus: FocusNode` | `initialFocus` selector | what takes focus on open |
| `DialogController.notify`, `dismissNotice`, `clearNotices` | `notify`, `dismissNotice`, `clearNotices` on the instance | the status area (ADR 0016) |
| `Dialog.of(context)` | `bind:this` | reaching the status area from the content; a `controller` from outside |
| `notify(action: NotificationAction(label:, onPressed:))` | `action: { label, onAction }` | a notice button |
| `notify(dismissible:)` | `dismissible` | whether a notice has a close button |

## Modal behaviour (ADR 0005)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Modal: the screen below takes no pointer and leaves the accessibility tree | matched | `InvisibleDialogRoute` is a `PopupRoute` over a `ModalBarrier`, which blocks the pointer and the semantics of the routes below |
| Named by the title, described by the subtitle | matched | `opens as a modal, named and described, with focus on the dialog, never on the close button` |
| Role `dialog` | matched | same test (`SemanticsRole.dialog`, `namesRoute`) |
| Focus moves into the dialog on open: to `initialFocus`, else the panel, never the close button | matched | same test; `initialFocus takes focus when it opens` |
| Focus trap: Tab and Shift+Tab wrap inside the dialog | matched | `Tab stays inside the dialog, wrapping at both ends` (`TraversalEdgeBehavior.closedLoop`) |
| Escape closes; focus returns to the trigger | matched | `Escape closes it and focus returns to the trigger` |
| Escape closes even when the barrier does not | matched | `a barrier that does not dismiss still lets Escape close` |
| The close button, the footer Close, an action and the barrier close it | matched | `the close buttons, an action result and the barrier close it` |
| Body scroll lock | adapted | the barrier takes every pointer and scroll gesture meant for the screen below, so nothing below scrolls |
| Native `<dialog>` top layer and `::backdrop` | adapted | the navigator's overlay holds the route above the screen; the barrier paints `--ds-dialog-overlay` |
| A focus ring on the panel when it has keyboard focus | matched | the shared focus ring, shown in keyboard highlight mode |
| No motion on open and close | matched | the route has no transition, as the web dialogs have none |

## Layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| At most 30rem wide, full width less the inset on a narrow screen | matched | `full width less the inset on a narrow screen, at most 30rem on a wide one` |
| Header and footer stay; the body is the only scrolling part | matched | `the body scrolls; header and footer stay` |
| A short window or a large text scale | adapted | under 320 logical pixels of height, scaled with the text, the whole panel scrolls, header and footer included, so nothing is cut off: `a short window scrolls the whole panel`; `text scale 2.0 on a narrow screen, right to left: no overflow, the close button at the inline-end` |
| Clear of the keyboard and the system areas | matched | the panel's inset adds the media query's padding and view insets |
| Header: icon, leading button, context, title, subtitle, actions, close, centred against the title block | matched | `header context, leading actions and the footer order` |
| A hidden title still names the dialog; an empty header takes no space | matched | `a hidden title still names it; no header shows` |
| One footer bar: leading actions at the start, the rest at the end, wrapping in source order | matched | `header context, leading actions and the footer order` |
| Right to left: the header and the footer mirror | matched | `text scale 2.0 on a narrow screen, right to left: no overflow, the close button at the inline-end` |
| `bodyLayout: "stack"` | out of scope | the body is a widget; a `Column` with `spacing` gives the same result |
| Close button 1.75rem | adapted | the close button is the package's icon-only ghost button, at least 36 logical pixels and the theme's minimum target |
| `--ds-dialog-*` custom properties | out of scope | not asked for yet |
| Contrast and labelled targets, light and dark; 24 and 44 targets | matched | `labelled targets and text contrast, light`, `… dark`; `targets meet 44 by 44 under touch` |

## Status area (ADR 0016, case 1)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Between the body and the footer, hidden while empty | matched | `a notice sits between the body and the footer, announced once, and focus stays` |
| Each notice is an Inline Notification, a group named by its title | matched | the status area builds `InlineNotification(role: group)` |
| Announced once, politely, when added | adapted | the panel announces each notice through the accessibility channel, politely, after the frame that shows it, instead of a persistent hidden live region: same test |
| A notice removed before its turn is not announced | matched | `a notice removed before its turn is not announced` |
| A notice never takes focus | matched | `a notice sits between the body and the footer, announced once, and focus stays` |
| Its buttons follow the body in the tab order, before the footer | matched | `the action follows the body in tab order, runs and closes the notice` |
| The action runs and closes the notice | matched | same test |
| A notice that held focus closes: the panel takes focus | matched | same test |
| A notice's close button closes it, not the dialog | matched | `the close button of a notice closes it, not the dialog` |
| `dismissible: false` has no close button | matched | `dismissible and not; by id and all at once` |
| `dismissNotice(id)` and `clearNotices()` | matched | same test |
| `notify()` while closed shows nothing and returns an empty string; closing clears | matched | `shows nothing while closed; closing clears the notices` |
| Reaching it from the content | matched | `Dialog.of reaches the status area from the content` |

## Dialogs on top (ADR 0016, case 3) and the region (case 2)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A dialog opened from inside another takes focus | matched | `the dialog on top takes focus, Escape closes it alone and focus returns inside the dialog below` |
| Escape closes only the innermost | matched | same test |
| Closing returns focus to the element that had it when the dialog opened | matched | same test |
| Falls back when that element is gone | adapted | the navigator's own focus history decides, since a Flutter dialog has no trigger of its own: `focus falls back when the element that had focus is gone` |
| Closing reacts only to the dialog's own close | matched | only the route's pop closes it; a widget inside cannot close it by accident |
| The notification region holds toasts while a dialog is open | matched | `the notification region holds toasts while a dialog is open (ADR 0016, case 2)`; the route is a `PopupRoute`, which `ModalObserver` counts |
| `returnFocusTo` selector | out of scope | not asked for yet; the element that had focus is the default |

## Not yet verified

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
