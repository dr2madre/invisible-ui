---
"@design-system/svelte": minor
---

Messages while a dialog is open follow ADR 0016 in the Svelte adapter.

**Status area.** `Dialog`, `SheetDialog` and the alert, confirm, prompt and
search dialogs have a status area between the body and the footer (after the
results in `SearchDialog`) for messages about their own task. The component
instance (`bind:this`) has `notify({ status, title, description, action,
dismissible })`, which adds a notice styled as an Inline Notification and
returns its id, and `dismissNotice(id)` and `clearNotices()`. `createDialog`,
`createSheetDialog` and `createSearchDialog` return the same functions with
the `notices` and `announcement` stores. Each notice is announced once through
a polite live region, never takes focus, and keeps its action and close
buttons in the dialog's tab order. Notices belong to one opening: `notify()`
on a closed dialog returns an empty string, and closing the dialog clears
them. The new `DialogNoticeOptions`, `DialogNoticeAction`, `DialogNotice`,
`DialogNoticeStatus` and `DialogAnnouncement` types describe them.
`InlineNotification` accepts `role="group"` for a notice announced elsewhere.

**Copy confirmation.** `copy` on `Button` copies its text on press and shows
"Copied" (or `copiedLabel`) beside the button for two seconds, announced
through a polite live region. `CodeBlock` shares the same logic, takes its
copy texts from the catalog, and no longer announces a copy when the page has
no clipboard.

**Notification region.** `NotificationRegion` holds new notifications while
any modal dialog is open in the document and shows them, in order, when the
last one closes; their auto-dismiss countdowns start then. Notifications
already shown keep their place, with their countdowns held, and a change to
one of them shows after the dialog closes. The region always mounts in
`<body>`: it no longer moves into an open dialog around it.

**Dialogs on top.** Closing a dialog, sheet or preset returns focus to the
element that had it when the dialog opened, so a dialog opened from inside
another hands focus back there; the trigger is the fallback, and
`returnFocusTo` still comes first. A `close` event from an element inside the
panel no longer closes the dialog.
