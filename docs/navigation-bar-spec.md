# Navigation Bar

A navigation bar moves a person between the main sections of an application:
a short, flat set of destinations, each with an icon and a label, one of
which is the current one. This file is the behaviour spec for every
platform: `core/`, the web adapters (Svelte, Vue, custom elements, React)
and the Flutter adapter. It is the "specified once" work named in
[ADR 0017](./adr/0017-flutter-adapter.md) §6. The driving case is Timelog's
home shell: five sections (Home, Clients, Projects, Hours, Profile) with
icon and label, the current section exposed to assistive technology, and
Profile marked when it needs attention
([wave 2 row](./proposals/flutter-adapter.md#wave-2--forms-lists-dialogs)).

Status: proposed. Nothing here is built. The
[open questions](#open-questions) need the maintainer's decisions before any
code is written.

## Pattern

- [WAI-ARIA APG Landmarks, navigation](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html):
  a `<nav>` landmark holds the links; several navigation landmarks each carry
  a unique label, and two landmarks with the same links share one label.
- [APG disclosure navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/):
  site navigation as a list of links, `aria-current="page"` on the link of
  the page on screen, Tab between links, optional arrow keys, and no `menu`
  role.
- [ADR 0011](./adr/0011-state-and-callback-conventions.md): the current
  destination is the application's; one activation, one report.
- [ADR 0013](./adr/0013-sidebar-and-the-menu-name.md) and
  [`sidebar-spec.md`](./sidebar-spec.md): the application owns routing and
  the breakpoint policy; the component reads no media query.
- WCAG 2.2 AA: 1.4.1 Use of Color, 1.4.4 Resize Text, 1.4.11 Non-text
  Contrast, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum), 2.5.8
  Target Size (Minimum), 3.2.3 Consistent Navigation, 4.1.2 Name, Role,
  Value, 4.1.3 Status Messages.

## Scope

### What it is

- Primary navigation between three to five top-level sections on a phone,
  and a similar number in a vertical rail on a tablet. Five is the reference
  for the mobile pattern; the API sets no upper or lower limit.
- Every destination leads to a section. Activating one changes what the
  application shows; it never runs a command on the current view.
- The section state (scroll position, a half-filled form) is the
  application's. Timelog keeps it with an `IndexedStack`.

### What it is not

| Component | Why it does not fit primary navigation |
| --- | --- |
| Tabs | APG tabs are "layered sections of content, known as tab panels, that display one panel of content at a time" ([APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)). The pattern needs `tabpanel` elements linked to each tab, a single tab stop with roving focus, and content on the same page. A destination is a page or a route, with its own heading and focus target, and on the web it has an address a person can open in a new tab. A tablist of links would announce panels that do not exist. |
| Sidebar | The right model for desktop: sections, collapsible groups, a rail, a drawer (ADR 0013). Its rail hides the labels and needs a toggle; a phone bar keeps the labels and has no toggle. The desktop layout reuses Sidebar, see [Relation to Sidebar](#relation-to-sidebar). |
| Segmented Control | A radio group: it chooses a value inside a view and participates in forms. Its docs page presents `stacked` as "a mobile bottom bar" and `orientation="vertical"` as "a sidebar"; a radio group announces "radio button, 2 of 5, checked" and moves selection with the arrow keys, which is the wrong contract for navigation. That wording is updated when Navigation Bar ships. |
| Navigation Menu | A horizontal site bar with disclosure panels of links and hover timing. No icons, no badges, no mobile layout. |
| Toolbar | Actions on the current view (Apple: "use a tab bar to support navigation, not to provide actions"). |

## Prior art

Read on 2026-10-13.

| Decision | Observed | Who | Ours |
| --- | --- | --- | --- |
| Purpose | "Use a tab bar to support navigation, not to provide actions"; it lets people "switch between sections of the view while preserving the current navigation state within each section" | [Apple HIG tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Navigation only; section state stays in the app |
| Number of destinations | "three to five destinations"; `BottomNavigationView` refuses more than five | [Material Components Android, navigation bar](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomNavigation.md) | Five is a reference in the docs, never a limit in the API |
| Labels | "Include tab labels to help with navigation" | Apple HIG | Labels always visible in the bar and the rail |
| | `LABEL_VISIBILITY_AUTO` hides labels on unselected items from four items; `labelMaxLines` is 1; labels do not scale with font size by default | Material Components Android | Rejected: labels always shown, scaled with the text |
| Unavailable sections | "Don't disable or hide tab bar buttons, even when their content is unavailable … If a section is empty, explain why" | Apple HIG | The section explains by default; an `unavailable` state stays focusable and carries its reason ([question 3](#open-questions)) |
| Badges | "Reserve badges for critical information" | Apple HIG | Badge with required accessible text |
| | The item's content description becomes "title, badge description"; each badge sets its own TalkBack text | Material Components Android, [BadgeDrawable](https://github.com/material-components/material-components-android/blob/master/docs/components/BadgeDrawable.md) | The badge text is part of the destination's name |
| Position and selection on Android | Each item reports its column and `selected` in `CollectionItemInfo`, a role description "Tab", and drops the click action while selected | Material Components Android `NavigationBarItemView` source | Flutter mobile composes position and selection, see [Semantics](#semantics-and-announcements) |
| Flutter Material | `NavigationBar`: `SemanticsRole.tabBar` on the bar, `SemanticsRole.tab` and `selected` on each destination, `button: true`, and outside the web an extra label "Tab 4 of 5" from `MaterialLocalizations.tabLabel`. `NavigationRail`: `selected` and the same "Tab n of m" label | Flutter 3.44.2 source, `material/navigation_bar.dart`, `navigation_rail.dart` | Same information through the widgets layer |
| Responsive mapping | Navigation bar when width or height is compact, rail otherwise, drawer as an app override at expanded width; the app passes `layoutType` | [Build adaptive navigation](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation), [window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes): compact below 600 dp, medium to 840, expanded to 1200, large to 1600, extra-large above | A layout helper on these breakpoints; the app decides |
| Tablet | iPadOS shows the tab bar near the top and can convert it to a sidebar; "aim for a default list of five or fewer" | Apple HIG tab bars, [sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) | Rail on tablet, Sidebar as an app choice |
| Desktop | Left pane by default: expanded at 1008 px and wider, icon-only from 641 to 1007, a menu button at 640 and below; arrow keys move inside the pane | [WinUI NavigationView](https://learn.microsoft.com/en-us/windows/apps/design/controls/navigationview) | Desktop never gets the phone bar automatically |
| | Sidebars on macOS; "consider automatically hiding and revealing a sidebar when its container window resizes" | Apple HIG sidebars | Sidebar, with its drawer for narrow windows |
| Re-activating the current item | `ItemInvoked` fires "even if it's already selected" | WinUI NavigationView | Reported; the app decides (scroll to top, back to the section root) |
| Current page on the web | `aria-current` on the active link, plus a visible mark; a toggle button on small screens | [GOV.UK service navigation](https://design-system.service.gov.uk/components/service-navigation/) | `aria-current="page"` and a non-colour mark |
| | Header links move into a left panel menu on small screens; a skip link comes first | [Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/) | The skip link is the app's; layouts change by the app's policy |
| | A unique label for each navigation area; slots carry the landmark roles | [Atlassian navigation system layout](https://atlassian.design/components/navigation-system/layout/usage) | One `label`, shared with the Sidebar when both carry the same links |
| Forui | Docs: "a small number of views, typically between three and five"; no accessibility text. Source (0.22.3): each item is an `FTappable` with `button: true` and `selected`, the icon excluded from semantics, the label as text; no container role, no position | [Forui bottom navigation bar](https://forui.dev/docs/navigation/bottom-navigation-bar), package source | Not adopted as a model, see below |

### Timelog today

Read from `apps/desktop/lib/pages/home_shell.dart`. The bar is an
`FBottomNavigationBar` in a floating pill (maximum width 380, radius, shadow).
Its children are a custom `_NavItem`, a `GestureDetector`, not
`FBottomNavigationBarItem`, so Forui's tappable is bypassed:

- no keyboard focus and no focus ring: Tab never reaches the destinations;
- no button role and no selected state in semantics: a screen reader reads
  five labels with nothing marking the current one;
- the current destination is marked by a filled pill and a colour; the
  label weight stays the same on purpose;
- the attention mark on Profile is a red icon; the text "needs attention"
  reaches assistive technology through `semanticsLabel`, which is the right
  idea;
- labels are one line with an ellipsis, so they cut at large text sizes;
- the content gets bottom padding equal to the bar height, so the bar does
  not cover focused content (WCAG 2.4.11).

Navigation Bar keeps the last two good points (attention in text, content
padding) and fixes the others.

## Anatomy

```text
<nav "Main">
  list
    destination  [ icon ] [ badge ]   current mark
                 [ label           ]
    destination  …
```

| Part | Required | Notes |
| --- | --- | --- |
| Landmark | yes | Named by `label`, default from the catalog (`navigationBar.label`, "Main", the same text as `sidebar.label`). |
| List | yes | One list of destinations, in reading order. |
| Destination | yes | A link (web, with `href`) or a button (no `href`), never both. |
| Icon | yes | Decorative: hidden from assistive technology. Passed in by the app (component on the web, widget in Flutter). |
| Label | yes | Visible text, the accessible name. |
| Current mark | on the current destination | A shape (an indicator behind the icon, or a bar on the block-start edge in the rail), plus a text-weight change, plus `aria-current`. Never colour alone. |
| Badge | optional | A short visible mark (a count or a dot glyph) plus required accessible text. |
| Unavailable reason | optional | Text, read with the destination. |

Width, position (fixed, floating, inset), radius, shadow, the floating pill
and the safe-area padding are the application's. Invisible UI draws the
destinations, the current mark, the badge and the focus ring; the container
gets the surface role and nothing else.

## Data model

### Destination

```ts
export interface NavigationDestination {
  /** Identity; unique in the bar. The same field name as `SidebarItem`. */
  value: string;
  /** Visible label and accessible name. */
  label: string;
  /** Decorative icon, hidden from assistive technology. */
  icon: Component;
  /** Renders a link. Without it the destination is a button that reports `onSelect`. */
  href?: string;
  /** A notification on the section. */
  badge?: NavigationBadge;
  /** The section cannot open now; the reason is read with the destination. */
  unavailable?: { reason: string };
}

export interface NavigationBadge {
  /** Visible content: a short count ("3", "99+"). Omitted: a dot glyph. */
  content?: string;
  /** Accessible text, required: "3 unread", "Needs attention". */
  label: string;
  /** Announce politely when `label` changes. Default true. */
  announce?: boolean;
}
```

Bar props: `destinations`, `value` (the current destination, or `null`),
`label`, `layout` (`"bar" | "rail"`), `onSelect(value)`.

- **The current destination is `value` on the bar**, as in Sidebar: one
  field, so two destinations can never be current at once, and the
  application passes its router's state. A per-destination `current` flag
  was considered; Navigation Menu uses one because panel links carry no
  value, and every destination here has one. A `value` that names no
  destination marks nothing current and warns in development (a settings
  page reached from elsewhere is a valid `null`).
- **Values are unique.** A repeated value throws in development, as Sidebar
  section ids do.
- **`href` or `onSelect`.** A destination with `href` is a link: the browser
  or the app's router follows it, and the bar reports nothing, as Sidebar
  does. A destination without `href` is a button that calls
  `onSelect(value)`. In Flutter every destination reports through
  `onSelected` and the app navigates; an optional `uri` is the announced
  address, as `SidebarItem` has.
- **Re-activating the current destination** follows the same rule: a link
  is followed again, a button reports its value again. The application
  decides what that means (iOS apps return to the section root or scroll to
  the top). The current destination stays operable; Android's removal of
  the click action is not adopted, because a keyboard or switch user would
  lose the way back to the section root.
- **Badge text.** `label` is required. A count shows `content`; a dot shows
  when `content` is absent. The dot is a shape, and the meaning lives in
  `label`.
- **No limit on the count of destinations.** The docs say three to five for
  the bar; a development warning names more than five in the `bar` layout,
  because they stop fitting at 320 px and text scale 2.0.

### Flutter

```dart
import 'package:invisible_ui/invisible_ui.dart' as iu;

iu.NavigationBar<Section>(
  label: loc.navLabel,
  value: _section,
  onSelected: (section) => setState(() => _section = section),
  destinations: [
    iu.NavigationDestination(
      value: Section.home,
      label: loc.navHome,
      icon: const Icon(LucideIcons.home),
    ),
    // Clients, Projects, Hours …
    iu.NavigationDestination(
      value: Section.profile,
      label: loc.navProfile,
      icon: const Icon(LucideIcons.user),
      badge: status.needsAttention
          ? iu.NavigationBadge(label: loc.navProfileAttention)
          : null,
    ),
  ],
)
```

- Values are any type `T`, as `Sidebar<T>`.
- Names follow ADR 0017 §2: `onSelected` (web `onSelect`), `value`. The
  current destination is always the app's, so there is one constructor.
- `NavigationBar` and `NavigationDestination` share their names with
  Material widgets; the `iu` prefix keeps them apart, and the package never
  imports Material.

## Behaviour per window class

The component exposes layouts. It reads no screen size, no platform and no
media query. The application chooses the layout, or asks a helper.

| Window class | Width | Phone and tablet apps | Desktop apps (macOS, Windows, Linux, desktop web) |
| --- | --- | --- | --- |
| Compact | below 600 | `bar` at the block-end edge | Sidebar drawer behind a menu button (ADR 0013) |
| Medium | 600 to 839 | `rail` at the inline-start edge | `rail`, or Sidebar collapsed |
| Expanded and wider | 840 and above | `rail`, or Sidebar | Sidebar expanded |

- **Mobile (`bar`).** A horizontal row; each destination takes an equal
  share of the width, icon above label. The app places it (Timelog: a
  floating pill, maximum width 380) and adds bottom padding to its content
  equal to the bar's height, so the bar never covers focused content
  (WCAG 2.4.11). On the web the app sets `scroll-padding-block-end` to the
  same height.
- **Tablet (`rail`).** A vertical column at the inline-start edge, icon above
  label, labels always visible. Destinations sit at the block-start end. It
  holds the same destinations as the bar, so turning a tablet changes the
  layout and keeps focus on the same destination.
- **Desktop.** The desktop model is the Sidebar: sections, room for more
  destinations, and its drawer for narrow windows. A desktop window that is
  narrow gets the drawer, never the phone bar: a bottom bar on a desktop
  window is a phone convention applied where pointer and keyboard users
  expect a side pane (WinUI's left pane, macOS sidebars).

### The layout helper

`core/src/navigation-bar` exports a pure function, mirrored in Dart:

```ts
navigationLayout({ width, formFactor }): "bar" | "rail" | "sidebar" | "sidebar-drawer"
```

`formFactor` is `"handheld"` or `"desktop"`, and the application passes it:
in Flutter from `defaultTargetPlatform`, on the web from its own knowledge
(a responsive web app may treat a coarse pointer as handheld). The helper
applies the table above. It is a recommendation: the application can ignore
it, override one class, or use its own breakpoints, as Android's
`NavigationSuiteScaffold` lets an app pass its own `layoutType`.

**Recommendation:** ship the helper on the window size classes above, which
are the published numeric breakpoints and sit close to WinUI's 641 and
1008; keep `formFactor` a required argument so the phone bar never reaches
a desktop window by accident.

## Keyboard

| Key | Focus on a destination |
| --- | --- |
| Tab, Shift+Tab | Next or previous destination, then out of the bar. Every destination is a tab stop. |
| Enter | Activates a link or a button. |
| Space | Activates a button; a link ignores Space, as native links do. |
| Arrow along the bar (inline direction in `bar`, block direction in `rail`) | Next or previous destination. No wrap at the ends. Mirrored under right-to-left. |
| Home, End | Not handled. |

- **One tab stop per destination.** The bar is a list of links in a
  navigation landmark, not a composite widget. APG's disclosure navigation
  uses Tab between links and adds arrows as an option; Sidebar already
  rejected roving focus for the same reason ("Navigation is links"). A
  single tab stop with roving focus belongs to tablists, toolbars and radio
  groups, whose roles announce that model; a `<nav>` of links announces no
  such thing.
- **Arrows are an addition, never a replacement.** Flutter's default
  shortcuts outside the web already map the arrows to directional focus;
  WinUI moves with arrows inside its pane; APG allows them. The web adapter
  adds them in `core/` so the four web adapters and Flutter behave the same.
  Arrows move focus only; activation stays on Enter (and Space for buttons).
- **No wrap, no Home and End.** Wrapping and Home/End are composite-widget
  behaviour; a person who reaches the end continues with Tab.
- **Unavailable destinations stay in the order** so their reason can be
  heard (see [States](#states)).
- **Focus after navigation** is the application's: the new section moves
  focus to its heading or main region, or keeps it on the destination. The
  docs recommend keeping focus on the destination in the `bar` and `rail`
  layouts (the bar stays on screen, so the person can continue through it)
  and say so in the example.

## Pointer, touch and focus

- **Target size.** Every destination's hit area is at least
  `--ds-min-target-size` (24 by 24) and at least `--ds-min-target-size-touch`
  (44 by 44) under `@media (pointer: coarse)`. In Flutter it follows
  `minTargetSize`: 44 by 44 under `touch` and Timelog's explicit setting. In
  the `bar` each destination fills its share of the height and width, so the
  painted indicator can be smaller than the hit area.
- **Press.** A press activates on release, inside the target. A long press
  on an unavailable destination shows its reason; on any other destination
  it does nothing (the label is already visible).
- **Hover.** A hover tint from `--ds-state-hover`, for pointer devices only.
- **Focus ring.** The token focus ring on keyboard focus only
  (`:focus-visible`, Flutter's `highlightMode` traditional). It surrounds
  the whole destination, so it stays visible beside the current mark and
  never depends on it.

## States

| State | Visible | Web | Flutter |
| --- | --- | --- | --- |
| Current | Indicator shape behind the icon (bar) or on the block-start edge (rail), label weight 600 | `aria-current="page"` | `selected: true` plus the position and current text, see below |
| Unavailable | A status glyph at the icon's inline-end bottom corner (a lock by default, replaceable by the app), the reason in a tooltip on focus and hover, label and icon in `--ds-color-text-disabled` | `aria-disabled="true"`, focusable, reason in `aria-describedby` | `enabled: false` with the reason in the hint, kept focusable |
| Badge | Count or dot glyph at the icon's inline-end top edge | Badge text inside the destination's name | Badge text inside the label |
| Focus | Focus ring | `:focus-visible` | `highlightMode` |

- **Never colour alone.** The current destination differs by shape and text
  weight, and the badge by a glyph. The indicator meets 3:1 against the
  surface (WCAG 1.4.11). The unavailable state differs by its glyph and its
  reason text; the colour adds to both.
- **Unavailable.** Apple's guidance is to keep every destination active and
  let the section explain why it is empty; the docs recommend that first.
  When the section truly cannot open (no permission, offline only), the
  `unavailable` state keeps the destination visible and focusable with its
  reason, and activation does nothing. Hiding destinations is never done by
  the component.
- **Width stays stable.** The current label's weight change must not
  reflow the bar: each destination reserves the width of its label at
  weight 600 (Timelog avoided bold for this reason).

## Semantics and announcements

### Web

```html
<nav aria-label="Main">
  <ul>
    <li><a href="/hours" aria-current="page">[icon aria-hidden] Hours</a></li>
    <li><a href="/profile">[icon] Profile <span class="visually-hidden">, Needs attention</span>[dot aria-hidden]</a></li>
  </ul>
</nav>
```

- `<nav>` named by `label`; a `<ul>` gives "list, 5 items" and the position
  in screen readers that announce it.
- `aria-current="page"` on the current destination, link or button. A
  screen reader reads it as "current page".
- When the bar and a Sidebar carry the same destinations and only one is
  shown, the hidden one is removed from the accessibility tree
  (`display: none` or not rendered), and both use the same label (APG).
- No `tablist`, `tab` or `menu` role.

### Flutter on iOS and Android

The maintainer's requirement is the native tab bar reading: label, role,
position and selection, for example "Hours, tab, 4 of 5, selected".

In the Flutter 3.44 embedder sources read for this spec, the iOS and
Android bridges do not map `SemanticsRole.tab` or `tabBar` to a native tab
trait or class: iOS reads flags (`selected` becomes
`UIAccessibilityTraitSelected`, `button`, `link`, `header`), and Android
fills `CollectionItemInfo` only under a scrolling parent. This is why
Material's `NavigationBar` adds the "Tab 4 of 5" label itself outside the
web. The adapter does the same with the widgets layer:

| Node | Semantics |
| --- | --- |
| Bar | `container`, `explicitChildNodes`, `role: SemanticsRole.tabBar`, `label` |
| Destination | `role: SemanticsRole.tab`, `button: true`, `selected` (true or false), `enabled`, `label` = the destination label plus the badge text, `hint` = the unavailable reason, `onTap` |
| Position | Composed into the label from the catalog: `navigationBar.position` ("Tab {index} of {count}"), so a locale can reorder it |
| Icon, badge glyph | `ExcludeSemantics` |

`indexInParent` is set on each destination as well; the framework uses it
for scrolling lists, and setting it costs nothing. Roles stay on the nodes
so that a later embedder that maps them, and Flutter web, which maps
`tab` and `tabBar` to ARIA, gain native reading. On the web build the
position text is left out, as Material does.

The target is the requirement's reading: label, "tab", position and
selected. What VoiceOver and TalkBack actually say, and in which order, is
not tested.

### Flutter on desktop (macOS, Windows, Linux)

The desktop bridge (`shell/platform/common/accessibility_bridge.cc`, 3.44)
builds the native role from flags only (button, link, header, text field,
check box and similar) and passes `selected`. A rail on desktop is a
navigation list in platform conventions (a macOS sidebar list, a WinUI
pane), not a tab bar. So on desktop platforms:

| Node | Semantics |
| --- | --- |
| Rail | `container`, `role: SemanticsRole.navigation` (present since Flutter 3.35, read only by Flutter web today), named by `label`; a `SemanticsRole.list` inside |
| Destination | `SemanticsRole.listItem` around a `link: true` node (or `button: true` without `uri`), `selected` on the current one, `value` = the catalog's `navigationBar.current` ("current page"), as Sidebar's `sidebarCurrent` |

The profile is chosen by `defaultTargetPlatform`, with a
`semanticsProfile` override (`tabBar`, `navigationList`) for an app that
knows better ([question 2](#open-questions)).

### Announcements

- **Navigation.** No announcement: the new section's content and focus
  speak for themselves, and the destination's selected state updates.
- **Badges.** When a badge's `label` appears or changes, the bar announces
  it once, politely: "{destination label}: {badge label}" ("Profile: Needs
  attention"). Not on first render, not when the badge disappears, and not
  when `announce` is false (for counts that change often). On the web the
  bar owns one `aria-live="polite"` region; in Flutter,
  `SemanticsService.sendAnnouncement` with the widget's `View`.
- **While a modal is open** the announcement waits and the latest one per
  destination is made after the last modal closes, as the notification
  region holds new notifications (ADR 0016, case 2).
- Screen reader output on every platform is a manual check, written as not
  yet verified until a dated session exists
  ([evidence register](./evidence-register.md)).

## Text scale and truncation

- Labels scale with the text (browser text size, Flutter `textScaler`), and
  the destination grows with them; nothing clips at 200% or text scale 2.0.
- In the `bar`, a label wraps onto a second line at a word break, and long
  words break (`overflow-wrap: anywhere`). The bar grows in height. No
  ellipsis: a cut label loses content (WCAG 1.4.4), and the full name in
  semantics does not help a sighted reader ([question 5](#open-questions)).
- In the `rail`, the rail grows in width up to the app's limit, and labels
  wrap below that.
- **Icon-only.** Not available in the `bar` or the `rail` in v1: both
  patterns rely on visible labels (Apple, Material, Timelog). An icon-only
  presentation exists in the Sidebar's collapsed rail, with its tooltip and
  the name kept in semantics. The accessible name is the label in every
  layout.

## Right to left

- The `bar` orders destinations from the inline-start edge: in
  right-to-left text the first destination is on the right.
- The `rail` sits at the inline-start edge; its current mark is on the
  inline-start side of the destination.
- The badge sits at the inline-end top corner of the icon.
- The arrow keys follow the reading direction (`dir` on the web,
  `Directionality` in Flutter).
- Icons are the app's; the bar mirrors none.

## Reduced motion

The current mark changes at once in v1: the token set has no motion
duration, and a new motion language needs approval (AGENTS.md). If an
animation is approved later, it stops under `prefers-reduced-motion:
reduce` and `MediaQuery.disableAnimationsOf`.

## Forced colors and high contrast

- Under `forced-colors: active`, backgrounds are removed, so the current
  indicator draws a border in `CanvasText` (or `Highlight`), the focus ring
  uses `Highlight`, and the badge dot is a bordered glyph, not a filled
  background. Icons use `currentColor`.
- In Flutter, the same rules apply under `MediaQuery.highContrastOf`: the
  indicator gains a border in the text role.

## Tokens

Role names only (ADR 0002). Existing roles first; new component tokens only
where a component needs its own value.

| Token | Role | Source |
| --- | --- | --- |
| `--ds-navigation-bar-surface` | Container surface | Falls back to `--ds-color-surface` |
| `--ds-navigation-bar-item-text` | Destination label and icon | Falls back to `--ds-color-text-secondary` |
| `--ds-navigation-bar-item-current-text` | Current label and icon | Falls back to `--ds-color-secondary-body-text`, the role of Sidebar's current item |
| `--ds-navigation-bar-current-indicator` | The current mark | New, light and dark values in `packages/tokens/tokens.json`, 3:1 against the surface |
| `--ds-navigation-bar-badge-surface`, `--ds-navigation-bar-badge-text` | Badge | Fall back to the Count roles |
| `--ds-navigation-bar-gap`, `--ds-navigation-bar-item-padding` | Spacing | Fall back to the spacing scale |
| Focus ring, `--ds-state-hover`, `--ds-color-text-disabled`, `--ds-min-target-size`, `--ds-min-target-size-touch` | Shared | Existing |

No token for width, maximum width, radius, elevation, shadow or position:
those are the application's (the floating pill is a theme or app style, as
ADR 0017 decision 5 records for product looks). Exact fallback names are
checked against `docs/tokens.md` when the tokens are added.

## Relation to ADR 0016

None expected for the bar itself: it opens no dialog. Two points touch it:
badge announcements wait while a modal is open (above), and a modal covers
the bar, which is inert under it (Apple names the modal as the one
exception to keeping the tab bar visible).

## Relation to Sidebar

- **Desktop reuses Sidebar.** Building a third desktop navigation would
  repeat Sidebar's sections, drawer and rail. The desktop layout is a
  Sidebar with the same destinations.
- **One destination list.** `NavigationDestination` is a superset of
  `SidebarItem` (`value`, `label`, `icon`, `href`) with `badge` and
  `unavailable`. The app passes `[{ items: destinations }]` to Sidebar
  unchanged. Sidebar gains badge and unavailable support in the same
  change, so a section's notification does not disappear when the window
  widens.
- **Rail.** Sidebar's collapsed rail hides labels and needs a toggle; the
  Navigation Bar rail keeps labels under the icons and has no toggle. Both
  exist because tablets and desktops use them differently
  ([question 1](#open-questions)).
- **Same landmark label** when both carry the same destinations.

## Headless split

### `core/src/navigation-bar`

- Types: `NavigationDestination`, `NavigationBadge`, layouts.
- `connect(state, options)`: `getRootProps()` (landmark and label),
  `getListProps()`, `getDestinationProps(value)` (`href` or button type,
  `aria-current`, `aria-disabled`, `aria-describedby` for the reason),
  `onDestinationKeyDown` (arrows, mirrored, no wrap; unhandled keys left
  alone), `select(value)` (reports once; does nothing when unavailable).
- `navigationLayout({ width, formFactor })`.
- `describeDestination(destination, { index, count, current, locale })`:
  the composed text Flutter uses (label, badge, position, current), from
  the catalog, so the order lives in one place.
- `badgeAnnouncements(previous, next)`: which badge changes to announce.
- Development checks: repeated values, a `value` that names no
  destination, more than five destinations in the `bar`.
- Shared vectors in `core/src/navigation-bar/__vectors__/`:
  `layout.json` (width and form factor to layout, at each boundary),
  `keys.json` (start, key, direction, layout to the new focus),
  `describe.json` (destination and position to the composed text per
  locale), `badges.json` (previous and next badges to announcements).

### Adapters

Render the markup, the styles, the live region and the hover tint; map
props. Svelte first as the reference, then Vue, custom elements and React.
Flutter renders with `FocusableActionDetector`, `Semantics` per the
profiles above, `Shortcuts` for the arrows, and the Dart ports of the four
pure functions running the same vectors.

## Test plan

### Unit (`core/`)

- Props: `aria-current` only on `value`; `aria-disabled` and the reason
  link; link versus button by `href`.
- Keys: each row of the keyboard table, both directions, both layouts, no
  wrap, unavailable destinations kept in the order.
- `select`: one report per activation; none for an unavailable
  destination; the current destination reports again.
- The four pure functions against their vectors.
- Development checks.

### Adapter interaction (Svelte, Vue, custom elements, React)

- Tab visits every destination and leaves the bar; arrows move and mirror
  under right-to-left.
- Enter follows a link; Space presses a button and not a link.
- `onSelect` once per press, read live (ADR 0011 live replacement).
- Badge: one polite announcement when the label changes, none on mount,
  none with `announce: false`, held while a modal dialog is open.
- axe on the bar in both layouts, with a badge and an unavailable
  destination.

### End-to-end (Playwright, three engines)

- `bar` at 320 px with five destinations, 200% text: no clipping, no
  horizontal scroll, labels wrap.
- Coarse pointer: every destination at least 44 by 44
  (`e2e/target-size.spec.ts`).
- Forced colors: current mark and focus ring visible.
- Right-to-left page: order and arrows mirrored.
- Focus not obscured: tabbing through content above a fixed bar keeps the
  focused element visible with the documented scroll padding.

### Flutter widget tests

- The shared vectors.
- Semantics with `matchesSemantics` for each profile: role, `selected`,
  `enabled`, `button` or `link`, the composed label, the hint.
- Keyboard with `sendKeyEvent`: Tab, arrows, Enter, Space, under
  `TextDirection.ltr` and `rtl`.
- `meetsGuideline`: `labeledTapTargetGuideline`, a 44 by 44
  `MinimumTapTargetGuideline` under touch, `textContrastGuideline`.
- Text scale 2.0 at 320 wide: no overflow, labels wrap.
- High contrast.
- Badge announcement through a fake `SemanticsService` (once per change).

### Parity checklist lines

For `packages/flutter/parity/navigation-bar.md`: destination as link or
button; `value` and `onSelected` mapped to ADR 0011 names; repeated values;
current state and its two semantic profiles; position text; unavailable
with reason; badge text and its announcement; held announcement under a
modal; each keyboard row; right-to-left; target size per density; text
scale and wrapping; forced colors and high contrast; reduced motion; the
layout helper; screen reader output (not yet verified).

### Assistive technology session

Each line is "not tested" until a dated session records it.

- VoiceOver on iOS, TalkBack on Android: the destination reads label,
  position and selected; the badge text is read; an unavailable reason is
  read; a badge change is announced once.
- VoiceOver on macOS, Narrator and NVDA on Windows, Orca on Linux (Flutter
  desktop rail): the list, the current destination and its "current page"
  value.
- Web: VoiceOver with Safari, NVDA with Firefox and Chrome, TalkBack with
  Chrome: the landmark in the landmarks list, "current page", list position,
  badge announcement.
- Switch Control or Switch Access on one mobile platform: every destination
  reachable, the current one included.

## Open questions

1. **Tablet rail: Navigation Bar or Sidebar?**
   - A. Navigation Bar has `bar` and `rail`; desktop uses Sidebar.
   - B. Navigation Bar has `bar` only; tablets use Sidebar collapsed.
   - C. One component for bar, rail and side pane.

   **Recommendation: A.** The tablet rail keeps visible labels with no
   toggle, which Sidebar's rail does not do; C repeats Sidebar.

2. **Flutter semantics per platform.**
   - A. Tab bar profile on iOS and Android (role `tab`, `selected`, "Tab 4
     of 5"), navigation list profile on desktop ("current page"), chosen by
     `defaultTargetPlatform` with an override.
   - B. Tab bar profile everywhere.
   - C. Navigation list profile everywhere, the same as Sidebar and the web.

   **Recommendation: A.** It matches what each platform's own navigation
   announces, as the requirement asks; the AT session confirms the wording.

3. **Unavailable destinations.**
   - A. No such state: the destination always opens and the section explains
     (Apple).
   - B. A state that stays visible and focusable, with a required reason;
     activation does nothing. The docs recommend A first.
   - C. The app hides the destination.

   **Recommendation: B**, documented as the exception.

4. **Badge announcements by default.**
   - A. On by default, `announce: false` to silence a badge.
   - B. Off by default, `announce: true` to enable.

   **Recommendation: A.** A change the person has not seen is a status
   message (WCAG 4.1.3); counts that change often opt out.

5. **Labels at text scale 2.0.**
   - A. Wrap to more lines, never truncate; the bar grows.
   - B. One line with an ellipsis, the full label in semantics and a
     tooltip.

   **Recommendation: A.** B cuts visible content for the people who
   enlarged it.
