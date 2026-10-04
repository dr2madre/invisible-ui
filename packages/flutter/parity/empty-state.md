# Empty State parity checklist

Reference commit: `e47db9b6717964787e0d689629f1beb73f18612d`

Reference paths: `packages/svelte/src/lib/empty-state` `packages/svelte/src/lib/feedback-icon` `packages/elements/src/empty-state`

The Flutter `EmptyState` checked against the Svelte `EmptyState`
(`packages/svelte/src/lib/empty-state`) and the `FeedbackIcon` it composes,
with the custom elements `<ds-empty-state>` as the reading of the live role
decided there.
Docs page: [Empty State](https://dr2madre.github.io/invisible-ui/components/feedback/empty-state/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/feedback_state_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `title`, `description` | `title`, `description` | heading and body |
| `status: NotificationStatus` | `status` | the default icon's status, neutral by default |
| `headingLevel` (1 to 6) | `headingLevel` | the title's place in the outline |
| `illustration` | `illustration` snippet | artwork in place of the icon |
| `child` | `children` | extra content |
| `actionLabel`, `onAction` | `actionLabel`, `onAction` | one action button |
| `actions: List<Widget>` | `actions` (data or snippet) | the action area |
| `size: FeedbackStateSize.medium`, `.small` | `size: "md"`, `"sm"` | density |
| `live` | `live` (elements) | a polite live region when set |

## Content and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Icon, heading, description, action that runs | matched | `a heading, a description and an action that runs` |
| The theme's status icon, round and tinted, as the fallback | matched | the shared `FeedbackIcon` with `round`; the icon is decorative |
| An illustration replaces the icon | matched | `an action group replaces the single action; an illustration replaces the icon; the heading level follows the outline` |
| An action group takes the place of the single action | matched | same test |
| Action group data: first action `default`, the rest `ghost` | adapted | the app passes the `Button`s it wants, as Flutter's own dialogs take `actions`, so the variants are the app's choice |
| An action with `href` renders a link | out of scope | the package has no link widget yet |
| Heading level | matched | same test |
| The small size: smaller icon, title and padding | matched | `the small size is quieter` |
| Centred, at most 24rem wide, wrapping | matched | `at most 24rem wide`; `centred and wrapped at text scale 2.0 in a narrow space, right to left` |
| `--ds-empty-state-*` custom properties | out of scope | not asked for yet |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No live role unless `live` is set (the elements decision) | matched | `not live unless live is set, then a polite live region` |
| `live`: a polite status | matched | same test (`liveRegion`) |
| The Svelte state is always `role="status"` | adapted | the elements adapter made the live role opt-in, so a state present when the screen loads is not read out as news; the Flutter widget follows it |
| The title is a heading | matched | `a heading, a description and an action that runs` |
| Contrast and labelled targets, light and dark; 24 and 44 targets | matched | `contrast and labelled targets, light`, `… dark`; `targets meet 44 by 44 under touch` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |
