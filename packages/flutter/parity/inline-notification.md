# Inline Notification parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `packages/svelte/src/lib/inline-notification` `packages/svelte/src/lib/feedback-icon`

The Flutter `InlineNotification` checked against the Svelte
`InlineNotification` (`packages/svelte/src/lib/inline-notification`) and the
`FeedbackIcon` it composes.
Docs page: [Inline Notification](https://dr2madre.github.io/invisible-ui/components/feedback/inline-notification/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/inline_notification_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `status: NotificationStatus.info`, `.success`, `.warning`, `.danger`, `.neutral` | `status` | the kind of feedback |
| `title`, `description` | `title`, `description` | heading and body |
| `child` | the children, `component` | rich body content |
| `actions: List<NotificationAction>` | `actions` (data) | buttons; `onPressed` where the web says `onClick` |
| `onClose` | `closable` with `onclose` | a close button exists when `onClose` is given; the app removes the banner, as with Flutter's own dismissible widgets |
| `role: InlineNotificationRole.status`, `.alert`, `.group` | `role="status"`, `"alert"`, `"group"` | how it reaches assistive technology |
| `inverted`, `plain` | `inverted`, `plain` | surfaces |
| `icon` | `icon` snippet | a custom glyph |

## Content and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A glyph per status beside the text, so the status never relies on colour | matched | `every status has its own glyph beside the text` |
| Rich content replaces the description | matched | `rich content replaces the description` |
| Action buttons, ghost by default | matched | `actions are buttons that run their callback` |
| Not dismissible by default; a close button named by the catalog's "Close" | matched | `only with onClose; named by the theme message` |
| Close button: a 40 by 40 target at the top inline-end, text never under it | matched | `the close button is a 40 by 40 target at the inline-end` |
| The close button takes the surface's text colour | matched | `on an inverted banner the close glyph takes its text colour` |
| `open` bindable visibility | adapted | Flutter widgets do not hide themselves: the app removes the banner in `onClose`, which keeps the state in one place |
| Link (`href`, `linkText`, `link` snippet) | out of scope | the package has no link widget yet; an action covers the case |
| `region` role | out of scope | Flutter 3.32 has no region role |
| `snack` layout, `iconShape`, `iconBox` | out of scope | no consumer asks for them yet |

## Semantics and announcements

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `status`: a polite live region | matched | `status is a polite live region` (`liveRegion`, ADR 0017 §3, with title and body in one node) |
| `alert`: urgent, interrupting | adapted | Flutter's live regions have no assertive level: an `alert` banner announces itself through the accessibility channel with the assertive level when it appears and when its text changes: `alert interrupts when it appears and when it changes` |
| `group`: carries its title, announces nothing | matched | `group carries its title and announces nothing` |
| The glyph is decorative | matched | the status icon sits in excluded semantics |
| Announcements name the widget's window | adapted | `SemanticsService.sendAnnouncement` arrived after the package's lower bound; the package sends the same message itself, with the view id |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Tokens, layout and target size

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Status surfaces and borders, inverted `emphasis` roles, plain without surface | matched | `text contrast holds for every status, light and dark` |
| Glyph colours from the status roles, chip at 15 % on plain and inverted banners | matched | the reference's FeedbackIcon rules; same roles |
| Padding 0.875rem 1rem, gap 0.75rem, radius `radius.surface`, title weight 600 at the tight line height | matched | the reference sets them in its stylesheet; same numbers |
| Targets follow the theme: 44 by 44 under touch | matched | `targets meet the guidelines under touch` |
| Long text wraps at text scale 2.0 in a narrow space, right to left | matched | `long text wraps in a narrow space at text scale 2.0` |
