# Navigation Bar parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/navigation-bar` `packages/svelte/src/lib/navigation-bar` `docs/navigation-bar-spec.md`

The Flutter `NavigationBar` checked against the Svelte `NavigationBar`
(`packages/svelte/src/lib/navigation-bar/NavigationBar.svelte` and the
shared stylesheet the other web adapters copy), the headless navigation bar
in `core/src/navigation-bar` (`connect.ts`, `text.ts`, the shared vectors)
and the behaviour spec
[`docs/navigation-bar-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/navigation-bar-spec.md),
whose "Decisions taken" section is binding.
Docs page: [Navigation Bar](https://dr2madre.github.io/invisible-ui/components/patterns/navigation-bar/).

Each line is **matched**, **adapted** (with the platform reason), **open**
(with the gap), **out of scope** or **not yet verified**. Every matched line
names the widget test in `test/navigation_bar_test.dart` that holds it, or
the vector group in `test/navigation_bar_vectors_test.dart`.

## Names

| Flutter | Web (spec, core) | ADR 0011 meaning |
| --- | --- | --- |
| `NavigationBar<T>` | `NavigationBar` | destination values are any type `T`; the web uses strings |
| `destinations: List<NavigationDestination<T>>` | `destinations` | the destinations, in reading order |
| `NavigationDestination(value:, label:, icon:, uri:, badge:, unavailableReason:)` | `{ value, label, icon, href, badge, unavailable: { reason } }` | a destination; `uri` is its announced address, `icon` a widget, a non-null `unavailableReason` the unavailable state |
| `NavigationBadge(label:, content:, announce:)` | `{ label, content, announce }` | the badge; `announce` defaults to true on both |
| `value` | `value` | the current destination, owned by the app; null for none |
| `onSelected` | `onSelect` | reports the pressed destination's value |
| `label` | `label` | the navigation's name, defaulting to the catalog's `navigationBar.label` |
| `semanticsProfile: NavigationBarSemanticsProfile.tabBar / navigationList` | none | the platform reading, chosen from `defaultTargetPlatform` when null (decision 2) |
| `unavailableIcon` | the adapter's glyph slot | replaces the lock glyph |
| `modals: ModalObserver?` | the adapters' modal count | tells the bar a modal is open, so badge announcements wait (ADR 0016, case 2); the same observer `NotificationRegion` reads |

## Destinations and activation

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A destination without an address is a button that reports its value | matched | `every press reports once, the current destination again; an unavailable one never` |
| A destination with an address is a link that the browser follows and the bar does not report | adapted | Flutter has no `href`: every destination reports through `onSelected` and the app navigates; `uri` is announced as the link's address in the navigation list profile (spec, Data model): `a navigation list on desktop: …` |
| Re-activating the current destination reports again | matched | `every press reports once, the current destination again; …` |
| An unavailable destination: activation does nothing (press, Enter, Space, semantics tap) | matched | same test |
| The callback is read at the press | matched | `the callback is read when pressed` |
| A long press on an available destination does nothing | matched | `a long press does nothing on an available destination` |
| A repeated value throws in development | adapted | debug builds fail an assertion: `a repeated value fails an assertion` |
| More than five destinations warn in development | adapted | `debugPrint` in debug builds, once: `more than five destinations and a value that names none warn once in debug builds` |
| A value that names no destination marks nothing current and warns once | matched | `a value that names no destination marks nothing current`, `more than five destinations …` |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Tab and Shift+Tab: every destination is a tab stop, then out of the bar | matched | `Tab visits every destination in order, unavailable ones included, and leaves the bar` |
| Enter activates a link or a button | matched | `Enter presses every destination; Space presses a button and not a link` |
| Space activates a button; a link ignores Space | matched | same test, under `WidgetsApp`, whose own Space shortcut does not reach a destination: the bar presses through an intent of its own |
| Left and right arrows: next or previous destination, no wrap, mirrored under right-to-left, unavailable ones kept in the order | matched | `arrows move focus, mirrored, with no wrap and no press (ltr)`, `(rtl)`; the port of `move` runs `keys.json`: `navigation bar key vectors` |
| At either end an arrow keeps focus | adapted | the web leaves the key to the browser, which does nothing on a link; in Flutter an unhandled arrow reaches the app's directional focus and would leave the bar, so the bar keeps it: same test |
| Home and End are not handled | matched | same tests and `keys.json` |
| Arrows move focus only, never activate | matched | same tests |
| Focus after navigation is the app's | matched | the bar moves no focus on a press |

## Current state and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Current mark: indicator behind the icon, label weight 600, never colour alone | matched | `the current destination has an indicator and a bolder label; …` |
| The indicator paints the `navigation-bar-current-indicator` role: the secondary mixed 90 % with white in the light theme, 74 % with neutral 50 in the dark one | matched | `the current destination has an indicator and a bolder label; …` checks the role in the light theme; the dark recipe and its value (`#9a7cd7`) in `test/tokens_test.dart`: `every mix recipe computes the value its role holds`. No Flutter test measures the indicator's 3:1 against the surface or the text; the ratios are the token's (`docs/tokens.md`) |
| The label keeps its weight-600 width, so the current state never reflows the bar | matched | `the current state never changes the label width` |
| Web: `<nav aria-label>` around a list, `aria-current="page"` | adapted | Flutter has no landmark or `aria-current`; the two profiles below carry the same information |
| iOS, Android, Fuchsia: tab bar profile. Bar: container, `SemanticsRole.tabBar`, label. Destination: `SemanticsRole.tab`, `button`, `selected` true or false, `enabled`, `onTap`, `indexInParent` | matched | `a tab bar on iOS and Android: tab role, selected, position and badge in the name, the reason as the hint` |
| Position "Tab {index} of {count}" from `navigationBar.position`, counting only the destinations passed, left out on the web build | matched | same test; the port of `describeDestination` runs `describe.json`, locale overrides included: `navigation bar describe vectors` |
| macOS, Windows, Linux: navigation list profile. Bar: container, `SemanticsRole.navigation`, label, a `SemanticsRole.list` inside; each destination a `SemanticsRole.listItem` around a `link` (with `linkUrl`) or `button` node, `selected` and `value` = `navigationBar.current` on the current one | matched | `a navigation list on desktop: navigation and list roles, links with their address, the current page as the value` |
| `semanticsProfile` overrides the platform's profile | matched | `the profile follows the app when it passes one` |
| Icon and badge glyph hidden from assistive technology; the badge text is in the name | matched | `a tab bar on iOS and Android: …` (the count "3" is not read, "3 unread" is) |
| The roles' own checks pass (a tab bar holds tabs, a list item sits in a list) | matched | `expect(tester.takeException(), isNull)` in both semantics tests |
| Flutter 3.35 has every role and property used (`tab`, `tabBar`, `navigation`, `list`, `listItem`, `linkUrl`, `IndexedSemantics`) | matched | the whole suite runs on 3.35.7 and 3.44 with no fallback |

## Platform conventions the Flutter bridges do not expose natively

| Line | Status | Evidence or reason |
| --- | --- | --- |
| iOS and Android read no native tab trait or class from `SemanticsRole.tab` and `tabBar` (Flutter 3.44 embedders) | adapted | the bar composes the "Tab n of m" position into the label from the catalog, as Material's `NavigationBar` does; the roles stay on the nodes for a later embedder and for Flutter web, which maps them to ARIA |
| Android fills `CollectionItemInfo` only under a scrolling parent | adapted | the position is in the label; `indexInParent` is set anyway |
| The desktop bridge builds the native role from flags only; `SemanticsRole.navigation`, `list` and `listItem` are read only by Flutter web today | adapted | desktop reads the destinations as links or buttons with `selected`, and the current one as "current page" through `value`, as Sidebar does with `sidebar.current` |
| Flutter semantics have no `aria-current` and no `aria-describedby` | adapted | the current marker is the `value` (navigation list) or `selected` (tab bar); the unavailable reason is the `hint` |

## Unavailable destinations

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Stays visible and focusable; reason read with it; activation does nothing | matched | `a tab bar on iOS and Android: …` (`enabled: false`, hint, focusable, no tap action), `every press reports once, …` |
| Lock glyph (the web's drawing) starting 6 past the indicator's centre at its bottom edge, replaceable by the app; label and icon in `text-disabled`; default cursor | matched | `the badge sits at the icon's inline-end top edge, the lock at its inline-end bottom corner, mirrored right to left`, `the app can replace the lock`, `the current destination has an indicator …` |
| The reason shows on hover, at once, and on keyboard focus; Escape hides it until focus or the pointer leaves | matched | `the mouse resting on it shows the reason; leaving hides it`, `keyboard focus shows the reason and Escape hides it` |
| A long press shows the reason | adapted | it shows while the finger rests and hides when it lifts, as the web's long press does on touch, where the pointer leaves on release: `a long press shows the reason until the finger lifts` |
| The reason bubble: the tooltip's look, 12rem wide at most, above the destination with a 0.25rem gap | adapted | drawn in the overlay with the same look, 192 wide at most, outside the semantics tree, since the reason is already the destination's hint; the package's `Tooltip` would add it a second time as a tooltip |
| Hiding the destination instead | matched | the app does not pass it; the position counts only the destinations passed: `describe.json` |

## Badges and announcements

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Count pill (`content`) or dot, starting 6 past the indicator's centre at its top edge (the dot 4 lower); `danger` fill, `on-status` text | matched | `the badge sits at the icon's inline-end top edge, …`, `the current destination has an indicator …` |
| Badge text required and part of the destination's name | matched | `a tab bar on iOS and Android: …`; Dart requires `label` |
| A polite announcement "{label}: {badge}" when a badge's label appears or changes; none on first build, none when it goes away, none with `announce: false`, none for a content change with the same label | matched | `once per change, none on first build, none when the badge goes away, none with announce false`; the port of `badgeAnnouncements` runs `badges.json`: `navigation bar badge vectors` |
| Announced through `SemanticsService.sendAnnouncement` with the widget's `View` | adapted | through the package's `announce`, which sends the same message with the view id: `sendAnnouncement` arrived after Flutter 3.35 |
| Held while a modal is open, the latest per destination made after the last modal closes (ADR 0016, case 2) | matched | `held while a modal is open, the latest per destination made after the last one closes`, `a dialog route holds them too`; the port of `holdAnnouncements`: `held announcements keep the latest per destination, …` |
| The bar knows a modal is open | adapted | through the app's `ModalObserver`, passed as `modals`, the mechanism `NotificationRegion` uses; without it nothing is held |
<<<<<<< HEAD
| Only a modal outside the bar holds them: a bar shown inside an open modal still announces | matched | `a bar inside the open dialog keeps announcing`. The bar gives the shared `BadgeAnnouncer` the route it shows in, as `Sidebar` does, and the announcer skips the hold while that route is the current popup route |
=======
| Only a modal outside the bar holds them: a bar shown inside an open modal still announces | open | the Flutter bar holds while any modal is open, the route that shows it included; the shared `BadgeAnnouncer` skips the hold for its own current popup route, but only `Sidebar` gives it that route, and no test covers a bar inside a modal |
>>>>>>> origin/main

## Layout, density, text and contrast

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A row, each destination an equal share, icon above label; the bar reads no screen size | matched | `text scale 2.0 at 320 wide: no overflow, labels wrap` (60.8 wide each of five at 320, with the gaps) |
| Each destination fills its share of the height | matched | same test (equal heights); the row sits in an `IntrinsicHeight` |
| The container gets the surface role and nothing else | matched | `the bar paints the surface colour and takes the hover tint under the mouse` |
| Metrics: 4 between destinations, padding 8 by 4, gap 4, indicator 56 by 32 (never wider than the share), pill radius, icon 24, label 12 at the tight line height, badge 16 minimum and 11 w600, dot 8, lock 14 | matched | `_DestinationFace` and `_Badge`; the label and the badge count scale with the text; the icon, the indicator and the corner glyphs keep their size, as on the web |
| Hover tint `state-hover` for the mouse only, unavailable destinations included | matched | `the bar paints the surface colour and takes the hover tint under the mouse` |
| Focus ring on keyboard focus only, around the whole destination | adapted | the package's ring, drawn inside the destination because the bar often sits at the screen's edge: `the focus ring shows on keyboard focus only` |
| Target size: 24 by 24, 44 by 44 under touch, from `minTargetSize`, never smaller | matched | `targets, names and contrast pass the guidelines`, `44 by 44 targets under touch` |
| Labels wrap and never truncate at text scale 2.0 and 320 wide; long words break | matched | `text scale 2.0 at 320 wide: no overflow, labels wrap` |
| Text contrast, light and dark | matched | `targets, names and contrast pass the guidelines` |
| Right to left: order from the inline start, badge and lock at the inline-end corners, arrows mirrored | matched | `arrows move focus, mirrored, … (rtl)`, `the badge sits at the icon's inline-end top edge, …` |
| Forced colours: a 2px outline on the indicator, a border on the badge and on the reason | adapted | Flutter has no forced-colours mode; under `MediaQuery.highContrastOf` the indicator gains a 2 wide border in the text role, the badge and the reason a 1 wide one, and the focus ring is drawn alone: `the current destination has an indicator and a bolder label; high contrast adds borders to the indicator and the dot` |
| Reduced motion | matched | nothing moves in v1: the current mark changes at once |
| Icon-only presentation | out of scope | not in v1 (spec, Text scale and truncation) |

## Assistive technology

| Line | Status | Evidence or reason |
| --- | --- | --- |
| VoiceOver on iOS, TalkBack on Android: label, position and selected; badge text; unavailable reason; a badge change announced once | not yet verified | Assistive technology: not tested |
| VoiceOver on macOS, Narrator and NVDA on Windows, Orca on Linux: the list, the current destination and its "current page" value | not yet verified | Assistive technology: not tested |
| Switch Control or Switch Access: every destination reachable, the current one included | not yet verified | Assistive technology: not tested |
| Flutter web with a screen reader: the tab roles mapped to ARIA | not yet verified | Assistive technology: not tested |
