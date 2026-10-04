# Error State parity checklist

Reference commit: `e47db9b6717964787e0d689629f1beb73f18612d`

Reference paths: `packages/svelte/src/lib/error-state` `packages/svelte/src/lib/feedback-icon` `packages/elements/src/error-state`

The Flutter `ErrorState` checked against the Svelte `ErrorState`
(`packages/svelte/src/lib/error-state`) and the `FeedbackIcon` it composes,
with the custom elements `<ds-error-state>` as the reading of the live role
decided there. It shares its layout with `EmptyState`.
Docs page: [Error State](https://dr2madre.github.io/invisible-ui/components/feedback/error-state/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/feedback_state_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `title`, `description` | `title`, `description` | heading and body |
| `status: NotificationStatus` | `status` | the default icon's status, danger by default |
| `headingLevel` (1 to 6) | `headingLevel` | the title's place in the outline |
| `icon` | `icon` snippet | a glyph or artwork in place of the icon |
| `child` | `children` | extra content |
| `actionLabel`, `onAction` | `actionLabel`, `onAction` | the recovery button |
| `actions: List<Widget>` | `actions` (data or snippet) | the action area |
| `size: FeedbackStateSize.medium`, `.small` | `size: "md"`, `"sm"` | density |
| `live` | `live` (elements) | an alert when set |

## Content and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Icon, heading, description, recovery action that runs | matched | `a heading and a recovery action; silent unless live` |
| Not dismissible: it replaces the content it covers | matched | no close control exists |
| Action group, heading level, small size, width, wrapping | matched | shared with `EmptyState`: see [empty-state.md](empty-state.md); `centred and wrapped at text scale 2.0 in a narrow space, right to left` uses an `ErrorState` |
| Action group data with variants and links | adapted, out of scope | as in [empty-state.md](empty-state.md) |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No live role unless `live` is set (the elements decision) | matched | `a heading and a recovery action; silent unless live` |
| `live`: an alert, read at once | adapted | Flutter's live regions have no assertive level: a live error state announces its title and description through the accessibility channel with the assertive level once, when it appears: `live interrupts once, when it appears` |
| The Svelte state is always `role="alert"` | adapted | the elements adapter made the live role opt-in, so a failure shown when the screen loads does not interrupt; the Flutter widget follows it |
| Contrast and labelled targets, light and dark | matched | `contrast and labelled targets, light`, `… dark` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
