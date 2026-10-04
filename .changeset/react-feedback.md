---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the feedback components: `Loading`,
`LoadingGenerationArea`, `FeedbackIcon`, `EmptyState`, `ErrorState`,
`InlineNotification`, `Notification` and `NotificationRegion`, with
`createNotifier`, and the markup, classes and behaviour of the other
adapters. Default labels come from the catalog: the loading name, the
notification's close button and link, the region's landmark name.

`NotificationRegion` holds new notifications while a modal dialog is open,
then shows them in order and starts their countdowns (ADR 0016, case 2). It
counts the dialogs of the family, which now register their panels, and any
native `<dialog>` opened with `showModal()`. It mounts in `<body>` through a
portal, renders nothing on the server, and enters, leaves and reflows with
the shared motion, none under reduced motion. Hovering or focusing the stack
pauses every countdown, and a notification can be swiped away.

In React, `createNotifier()` returns an external store: `subscribe` and
`getSnapshot` read the queue with `useSyncExternalStore`. The slots of the
other adapters are props that take markup (`icon`, `link`, `actions`,
`illustration`, `indicator`, `children`), and `InlineNotification` takes
`open` with `onOpenChange`. The dialog status area now draws its icon with
`FeedbackIcon`, and SearchDialog its loading dots with `Loading`.

`styles.css` now includes the notification region, empty state, error state
and loading generation area sheets. They are the same files the Vue and
custom element packages ship, now held byte for byte to the React copies.
