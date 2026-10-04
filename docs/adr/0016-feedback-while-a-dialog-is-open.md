# 16. Feedback while a dialog is open goes to the dialog, after it, or on top of it

Date: 2026-09-29

## Status

Accepted. The custom elements, Svelte and Vue adapters implement it, and
React implements it for the components it has.

| Adapter | Contract |
| --- | --- |
| Elements | Implemented. |
| Svelte | Implemented. |
| Vue | Implemented. |
| React | Implemented for the dialog family (Dialog, Sheet Dialog and the Alert, Confirm, Prompt and Search presets: status area, dialogs on top) and Button (`copy`). Popover, Tooltip, the menus and Navigation Menu render inside the dialog their trigger sits in, and a menu returns focus to its trigger before an item opens a dialog. React has no notification region yet: case 2 applies when the region is ported. |
| Flutter | Case 2 implemented in `NotificationRegion`: it holds new notifications while a modal route or a held overlay is open (`ModalObserver`), and hides the ones already shown until it closes, since the region paints over the navigator. Flutter has no dialog family yet: cases 1 and 3 apply when it is ported. |

## Context

A notification region shows toasts, fixed to a corner of the viewport. A toast
is informational, often transient, and sits outside the centre of attention.
A modal dialog is the opposite: it takes the user's attention and focus, and
makes the rest of the page inert ([ADR 0005](./0005-native-dialog-and-urgency.md)).

A toast shown above or below an open modal dialog is wrong in both
positions. Below it, under the backdrop, it is unseen and cannot be operated,
and its countdown can run out before anyone reads it. Above it, it competes
with the dialog for attention, can cover the dialog's content, and offers
controls outside the dialog while focus is kept inside it. Screen reader users
hear an announcement that has nothing to do with the task in front of them,
or miss it.

The elements adapter used to move the notification region into an open
dialog around it, so toasts showed above the dialog and took input. That
fixed the stacking and kept the conflict.

## Decision

Where a message appears depends on the case, and there are three cases.

1. **A message about the dialog's own task** appears in the dialog's context.
   Either on the control that caused it, such as "Link copied" beside the copy
   control, or in the dialog's status area, such as a failed upload with a
   Retry action, or an error or a backend event tied to the task.
2. **An unrelated message that can wait** appears after the dialog closes.
3. **An unrelated message that must take focus** (rare) opens a dialog on top.
   That dialog takes focus for the decision; when it closes, focus returns to
   the element in the original dialog that had it. The same mechanism serves
   any dialog opened from inside another.

### The status area (case 1)

Every dialog in the family (Dialog, Sheet Dialog and the Alert, Confirm,
Prompt and Search presets) has a status area between the body and the footer.

- `notify({ status, title, description?, action?, dismissible? })` adds a
  notice and returns its id. `action` is `{ label, onAction }`; running it
  closes the notice. `dismissible` defaults to `true` and adds a close button.
- `dismissNotice(id)` removes one notice and `clearNotices()` removes all.
- A notice uses the Inline Notification markup and look. It is a group named
  by its title. A persistent polite live region in the panel announces each
  notice once, when it is added.
- A notice never takes focus. Its buttons follow the body in the tab order,
  before the footer. When a notice that holds focus closes, the panel takes
  focus.
- Notices belong to one opening of the dialog. `notify()` on a closed dialog
  shows nothing and returns an empty string, and closing clears every notice.
  A message that is still true when the dialog opens again is shown again by
  the application.

### Feedback at the source (case 1)

A control that copies text confirms beside itself. In the elements adapter,
`copy` on `<ds-button>` holds the text to copy; after a successful copy the
text "Copied" (the `button.copied` catalog message, or `copied-label`) shows
beside the button for two seconds. That text is a polite live region, so it is
announced; the button keeps its name and focus. Code Block keeps its own copy
button and shares the same clipboard and timing logic.

### The notification region waits (case 2)

While any modal dialog is open in the document, the notification region holds
new notifications in its queue, unshown and unannounced. When the last modal
closes it shows them in order, and their auto-dismiss countdowns start then.
Notifications already shown when a modal opens stay where they are, with
their countdowns held; a change to one of them is announced after the modal
closes. The region counts every modal dialog, including a native `<dialog>`
opened with `showModal()` outside the design system, and always mounts in
`<body>`.

### Dialogs on top (case 3)

The family's native modal machinery already stacks: the browser keeps each
`showModal()` dialog in the top layer, and the Escape handler stops at the
innermost dialog. The adapters add two guarantees.

- Closing a dialog returns focus to the element that had it when the dialog
  opened, and falls back to the trigger when that element is gone.
- Closing reacts only to the panel's own `close` event, so an element inside
  the panel that emits `close` does not close the dialog.

The scroll lock was already counted across nested overlays; it now has a test
for a stack of dialogs.

## Alternatives rejected

- **Move the notification region into the open dialog.** It puts toasts above
  the dialog and makes them operable, which is the conflict this decision
  removes. It also leaves one region in the tree of whichever dialog opened
  last, and loses its notifications when that dialog closes.
- **Show the region in the top layer with the Popover API.** A popover shown
  after the dialog renders above it, so the toast is visible. It is still
  outside the dialog, so the modal makes it inert: its buttons cannot be
  reached. It also announces an unrelated message in the middle of the task.
- **Document a notification region per dialog.** Every application would
  place and style its own region, the placement would differ from dialog to
  dialog, and the task messages would still arrive as transient toasts. The
  status area gives each dialog the same place for them.

## Consequences

- Applications route messages by case: `notify()` on the dialog for the
  dialog's task, the notification region for everything else, and a dialog
  on top when a decision cannot wait.
- A notification shown while a dialog is open appears later than before. An
  application that relied on a region placed inside a dialog moves those
  messages to the dialog's status area.
- Focus return changes for dialogs opened without their trigger: focus goes
  back to where it was, as with a native `<dialog>`, instead of to a trigger
  the user never pressed.
- The Vue and React adapters are not equivalent until they implement
  the same three cases.
