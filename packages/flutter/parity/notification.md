# Notification and Notification Region parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `packages/svelte/src/lib/notification` `packages/elements/src/notification` `packages/elements/src/internal/modal-stack.ts`

The Flutter toast, `NotificationRegion` and `NotificationController`
checked against the Svelte `Notification`, `NotificationRegion` and
`createNotifier` (`packages/svelte/src/lib/notification`), with the custom
elements region (`packages/elements/src/notification`) as the second reading
of the modal deferral in
[ADR 0016](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0016-feedback-while-a-dialog-is-open.md).
Docs pages: [Notification](https://dr2madre.github.io/invisible-ui/components/feedback/notification/),
[Notification Region](https://dr2madre.github.io/invisible-ui/components/feedback/notification-region/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the test in `test/notification_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `NotificationController` | `createNotifier()` | the list, apart from how it is shown; a controller, as Flutter names these |
| `show`, `info`, `success`, `warning`, `danger`, `neutral`, `update`, `dismiss`, `clear`, `promise` | the same methods | same meaning |
| `Notice` | `NotificationItem` | one notification |
| `duration: Duration` | `duration` in ms | auto-dismiss, zero keeps it |
| `assertive: true` | `role: "alert"` | announced interrupting |
| `NotificationAction(onPressed:, keepOpen:)` | `NotificationAction(onClick, keepOpen)` | an action, closing the toast unless `keepOpen` |
| `onDismiss(NotificationDismissReason)` | `onDismiss(reason)` | `user`, `timeout`, `action`, `api` |
| `NotificationRegion(controller:, child:)` | `NotificationRegion notifier` | the region wraps the app instead of portalling to `<body>` |
| `ModalObserver` | the document's open modals | what tells the region a modal is open |
| The toast | `Notification` | a toast inside the region; `Notification` is a class of Flutter's widgets layer, so the toast has no public widget of its own |

## Controller

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Show appends; a live id replaces in place without `onDismiss` | matched | `show adds in order; a live id replaces in place` |
| Dismiss removes first, then reports the reason once | matched | `dismiss removes first, then reports the reason once` |
| Clear empties the list, then tells each one | matched | `clear empties the list, then tells each one` |
| Update changes one in place | matched | `update changes one notification in place` |
| Promise: loading, then success or danger (alert) | matched | `promise turns a loading notice into success or danger` |
| A replacement merges with the old fields | adapted | Dart named defaults cannot tell an omitted field from a default, so `show` with a live id replaces every field; `update` changes only the given ones |

## Region

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Newest on top of the stack | matched | `newest on top, each announced once with its level` |
| Each notification announced once, politely or assertively; a change to a shown one announced again | adapted | the web toast is a live region; the Flutter region announces each one through the accessibility channel when it appears or changes, with its level, in list order: same test |
| The region is a landmark named "Notifications" | adapted | Flutter 3.32 has no region role: a semantics container named by the catalog label while it holds toasts: `the region is named and each toast keeps its glyph` |
| Auto-dismiss is opt-in | matched | `auto-dismiss is opt-in and pauses while hovered` |
| The whole stack pauses while hovered (WCAG 2.2.1) | matched | same test |
| The whole stack pauses while focus is inside | matched | `focus inside the stack pauses the countdown` |
| Close button reports `user`, an action `action`, `keepOpen` stays | matched | `close, action and keepOpen report their reasons` |
| A swipe dismisses with `user` | matched | `a swipe dismisses a toast` |
| `maxVisible` keeps the newest | matched | `maxVisible keeps the newest` |
| Only the toasts take the pointer; the page beside them keeps it | matched | `the app beside the toasts keeps the pointer` |
| Past the far edge the oldest are clipped, never overflowing | matched | `more toasts than the height allows are clipped, not overflowing` |
| Placement corners follow the reading direction; width 24rem | matched | `placement follows the reading direction` |
| A narrow screen gets one full-width column | matched | `a narrow screen gets one full-width column at text scale 2.0` |
| Enter and leave motion, reflow; none under reduced motion | matched | `no motion under reduced motion` |
| Toasts reuse the Inline Notification anatomy, with elevation | matched | the toast is an `InlineNotification` in the `group` role |
| Snack layout, rich `component` body, icon shape and box | out of scope | no consumer asks for them yet |

## Modals (ADR 0016, case 2)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| New notifications wait while a modal is open, unshown and unannounced | matched | `new notifications wait while a modal is open, then show and are announced in order` |
| When the last modal closes they show in order and their countdowns start | matched | same test |
| Notifications shown before keep their countdowns held | matched | same test |
| A change to a shown notification waits for the modal to close, then is announced | matched | same test |
| Shown notifications stay where they are, under the modal | adapted | the Flutter region paints over the navigator, so a toast left visible would sit above the modal and take input. While a modal is open the shown toasts are hidden, inert and out of the focus order; they come back when it closes: same test |
| Every modal counts, including one opened outside the design system | adapted | `ModalObserver` counts every `PopupRoute` (dialogs and modal sheets) in the navigator it observes: `a dialog route counts as a modal`; an overlay that is not a route calls `hold()` |
| The package's own dialogs count | matched | `showInvisibleDialog` pushes a `PopupRoute`: `the notification region holds toasts while a dialog is open (ADR 0016, case 2)` in `test/dialog_test.dart` |
| The region mounts in `<body>`, never inside a dialog | adapted | the app places the region around its navigator (`WidgetsApp.builder`), outside every route |
| Dialog status area (case 1) and dialogs on top (case 3) | out of scope | they belong to the dialog family, which the Flutter package does not have yet |

## Accessibility and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Targets follow the theme: 44 by 44 under touch; labeled | matched | `targets meet 44 by 44 under touch` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
