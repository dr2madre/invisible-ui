---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

Messages while a dialog is open follow ADR 0016 in the React adapter.

**Status area.** `Dialog` has a status area between the body and the footer
for messages about its own task. A ref on `Dialog` (the new `DialogHandle`
type) holds `notify({ status, title, description, action, dismissible })`,
which adds a notice styled as an inline notification and returns its id,
`dismissNotice(id)` and `clearNotices()`. `useDialog()` returns the same three
functions with the `notices` and the `announcement` to render. Each notice is
announced once through a polite live region, never takes focus, and keeps its
action and close buttons in the dialog's tab order. Notices belong to one
opening: `notify()` on a closed dialog returns an empty string, and closing
the dialog clears them. The new `DialogNoticeOptions`, `DialogNoticeAction`,
`DialogNoticeStatus`, `DialogNotice` and `DialogNotices` types describe them,
and `dialog-status.css` places the area. The stylesheet gains
`inline-notification.css` and `feedback-icon.css`, identical to the other
adapters' copies, so notices have the Inline Notification look.

**Copy confirmation.** `copy` on `Button` copies its text on press and shows
"Copied" (or `copiedLabel`) beside the button for two seconds, announced
through a polite live region. The button keeps its name and focus. A refused
clipboard shows nothing.

**Dialogs on top.** Closing a dialog returns focus to the element that had it
when the dialog opened, so a dialog opened from inside another hands focus
back there; the trigger is the fallback. A `close` event from an element
inside the panel no longer closes the dialog.
