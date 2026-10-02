---
"@design-system/elements": minor
---

Messages while a dialog is open follow ADR 0016 in the Elements adapter.

**Status area.** `<ds-dialog>`, `<ds-sheet-dialog>` and the alert, confirm,
prompt and search dialogs have a status area between the body and the footer
for messages about their own task. `notify({ status, title, description,
action, dismissible })` adds a notice styled as an inline notification and
returns its id; `dismissNotice(id)` and `clearNotices()` remove notices. Each
notice is announced once through a polite live region, never takes focus, and
keeps its action and close buttons in the dialog's tab order. Notices belong
to one opening: `notify()` on a closed dialog returns an empty string, and
closing the dialog clears them. The new `DialogNoticeOptions` and
`DialogNoticeAction` types describe the options.

**Copy confirmation.** `copy` on `<ds-button>` copies its text on activation
and shows "Copied" (or `copied-label`) beside the button for two seconds,
announced through a polite live region. `<ds-code-block>` shares the same
logic, and no longer announces a copy when the page has no clipboard.

**Notification region.** `<ds-notification-region>` holds new notifications
while any modal dialog is open in the document and shows them, in order, when
the last one closes; their auto-dismiss countdowns start then. Notifications
already shown keep their place, with their countdowns held. The region always
mounts in `<body>`: it no longer moves into an open dialog around it.

**Dialogs on top.** Closing a dialog, sheet or preset returns focus to the
element that had it when the dialog opened, so a dialog opened from inside
another hands focus back there; the trigger is the fallback. A `close` event
from an element inside the panel, such as a closable inline notification, no
longer closes the dialog.
