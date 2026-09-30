---
"@design-system/vue": minor
---

Messages while a dialog is open follow ADR 0016 in the Vue adapter.

**Status area.** `Dialog`, `SheetDialog`, `AlertDialog`, `ConfirmDialog`,
`PromptDialog` and `SearchDialog` have a status area between the body and the
footer (after the results in `SearchDialog`) for messages about their own
task. Their template ref exposes `notify({ status, title, description,
action, dismissible })`, which adds a notice styled as an inline notification
and returns its id, and `dismissNotice(id)` and `clearNotices()`, which remove
notices. `useDialog`, `useSheetDialog` and `useSearchDialog` return the same
methods plus the `notices` and `announcement` to render. Each notice is
announced once through a polite live region, never takes focus, and keeps its
action and close buttons in the dialog's tab order. Notices belong to one
opening: `notify()` on a closed dialog returns an empty string, and closing
the dialog clears them. The new `DialogNoticeOptions`, `DialogNoticeAction`,
`DialogNotice` and `DialogNoticeControls` types describe them.

**Copy confirmation.** `copy` on `Button` copies its text on activation and
shows "Copied" (or `copiedLabel`) beside the button for two seconds, announced
through a polite live region. Extra attributes still go to the `<button>`.
`CodeBlock` shares the same logic, and no longer announces a copy when the
page has no clipboard.

**Notification region.** `NotificationRegion` holds new notifications while
any modal dialog is open in the document and shows them, in order, when the
last one closes; their auto-dismiss countdowns start then. Notifications
already shown keep their place, as they were, with their countdowns held.

**Dialogs on top.** Closing a dialog, sheet or preset returns focus to the
element that had it when the dialog opened, so a dialog opened from inside
another hands focus back there; the trigger is the fallback, and
`returnFocusTo` still comes first. A `close` event from an element inside the
panel no longer closes the dialog.
