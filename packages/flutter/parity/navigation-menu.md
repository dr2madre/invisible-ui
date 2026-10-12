# Navigation Menu parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/navigation-menu` `packages/svelte/src/lib/navigation-menu`

The Flutter `NavigationMenu` checked against the Svelte `NavigationMenu`
(`packages/svelte/src/lib/navigation-menu/NavigationMenu.svelte` and
`create-navigation-menu.ts`) and the headless navigation menu in
`core/src/navigation-menu`, which follow the
[WAI-ARIA disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
pattern.
Docs page: [Navigation Menu](https://dr2madre.github.io/invisible-ui/components/patterns/navigation-menu/).

Each line is **matched**, **adapted** (with the platform reason), **out of
scope** or **not yet verified**. Every matched line names the widget test in
`test/navigation_menu_test.dart` that holds it.

## Names

| Flutter | Svelte and core | ADR 0011 meaning |
| --- | --- | --- |
| `NavigationMenu<T>` | `NavigationMenu` | item values are any type `T`; the web uses strings |
| `label` | `label` | the navigation's accessible name |
| `items: List<NavigationMenuItem<T>>` | `items: NavigationMenuItem[]` | the bar, in order |
| `NavigationMenuItem.link(value:, label:, onPressed:, uri:, current:)` | `{ value, label, href }` | a plain link; it opens through the app's callback, `uri` is its announced address |
| `NavigationMenuItem.panel(value:, label:, links:)` | `{ value, label, links }` | a trigger and its panel |
| `NavigationMenuLink(label:, onPressed:, description:, uri:, current:)` | `{ label, href, description }` | a link in a panel |
| `current` on a link | none | the app marks the link of the page on screen. A flag on the link, as Radix's `NavigationMenu.Link active` does, because panel links carry no value a menu-level `value` could name, and the app builds the items for each page anyway. The web has no current-page support (open point) |
| `onOpenChanged` | `onValueChange` | reports the open item's value, or null, once per change, after the change |
| The open panel | `value` in the store | internal, as the Svelte component exposes no `value` prop |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| At most one panel open | matched | `hover opens after 150 ms, switches at once, …` (Products closes when Resources opens) |
| A press opens a panel and keeps it open; the next press closes it | adapted | `a click opens a panel and keeps it; Escape and a press outside close a kept panel`, `touch has no hover: a tap toggles the panel`. Approved decision: the web click toggles, so a click on a panel the pointer opened closes it; Flutter keeps it open |
| The first press on a panel the pointer opened keeps it open, with no timing threshold | adapted | `the first click keeps a panel the pointer opened; leaving then closes nothing; the next click closes it`. Approved decision; the web closes it |
| A kept panel stays when the pointer leaves; Escape and a press outside close it | adapted | same tests. Approved decision; on the web leaving always closes after 150 ms |
| Hover on another trigger while a kept panel is open switches at once and the menu stays kept | adapted | `the first click keeps a panel …`. The press asked the menu to stay open, so a switch by hover does not undo it; the web has no kept state |
| After a press or Escape closes a panel, the resting pointer opens nothing; leaving the trigger re-arms hover | adapted | `after a click closes the panel, the resting pointer opens nothing; leaving the trigger re-arms hover`, `after a Escape closes the panel, …`. Approved decision. Hover opens only on entering a trigger, so no timer or flag is needed; the web behaves the same way for the same reason |
| Pointer rest on a trigger opens after 150 ms | matched | `hover opens after 150 ms, switches at once, stays over the panel and closes 150 ms after leaving` |
| Hover on another trigger while a panel is open switches at once | matched | same test |
| Leaving the trigger or the panel closes a panel the pointer opened after 150 ms; entering the panel cancels the close | matched | same test |
| A click closes what it opened even when a hover delay runs out afterwards | matched | `a click closes what it opened even when the hover delay runs out afterwards` |
| Touch has no hover; a tap toggles | matched | `touch has no hover: a tap toggles the panel` |
| A press outside closes; focus is not moved back | adapted | `a press outside closes without moving focus back; a press on another trigger switches`. On the web a removed panel leaves focus on the page; Flutter would move it to the trigger, so focus inside the panel goes to the focus scope first, as Dropdown Menu does |
| A press on another trigger closes the open panel, then opens its own | matched | same test (`null`, then `resources`) |
| Plain links open through their callback on a tap or Enter, never Space | adapted | `links open through their callbacks by a tap or Enter, never Space; the callbacks are read when pressed`. Flutter has no `href`: a link opens through the app's callback, as `Link` does |
| A pending hover survives another item going away | matched | `a pending hover survives another item going away; a panel whose item goes away closes without a report` |
| A panel whose item is removed | adapted | same test. It closes without a report, since no user asked for it; the web keeps the stale value in its store with nothing to show |
| A link closes the open panel before its callback runs; a plain link in the bar closes an open panel too | adapted | `a link closes the panel before its callback runs, by a tap and by Enter; a plain link closes an open panel too` (`onOpenChanged(null)` comes before the link's callback, ADR 0011). Approved decision; the web closes nothing on activation (open point) |
| After a link, focus is not returned to the trigger; it stays where the callback puts it | adapted | `a link leaves focus where its callback puts it, never back on the trigger by itself`. Focus inside the panel goes to its scope, so the app can move it into the page it opens. Approved decision |
| Safety net: focus left nowhere after the callback and the next frame goes to the trigger, if the trigger still exists | adapted | `a link whose callback leaves focus nowhere hands it to the trigger; a trigger that is gone takes nothing`. Flutter's equivalent of focus on the page body is the scope itself holding focus; the trigger takes it only then |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Enter and Space on a trigger toggle its panel | matched | `ltr: Enter and Space toggle; ArrowDown opens and focuses the first link; Escape closes and returns focus`, `rtl: …` |
| ArrowDown on a trigger opens its panel and moves focus to the first link | matched | same tests |
| Escape on a trigger closes the open panel | matched | same tests |
| Escape in a panel closes it and focus returns to its trigger | matched | same tests |
| Escape with nothing open reaches the handlers above | matched | `Escape with nothing open is left to the rest of the app` |
| Right to left: the same keys, the bar from the right | matched | `rtl: …`, `right to left at text scale 2.0 in a narrow window …` |
| Tab after a trigger whose panel is open | adapted | `Tab enters an open panel after its trigger, then moves on`. The web portals the panel to the end of the page, so Tab passes it by; Flutter follows the reading order, and each item is a traversal group, so Tab enters the open panel after its trigger and then moves to the next item |
| Tab closes nothing | matched | same test |
| Focus inside a panel that closes by hover returns to its trigger | adapted | on the web focus falls back to the page; Flutter would move it to the last focused node of the scope, so it returns to the trigger |

## Callbacks

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `onOpenChanged` once per change, after the change | matched | `onOpenChanged reports once per change and is read at the change`; every keyboard and pointer test checks the full report list |
| The callbacks are read at call time | matched | same test; `links open through their callbacks …` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<nav aria-label>` with a `<ul>` of items | adapted | Flutter has no landmark role: a list (`SemanticsRole.list`, items `SemanticsRole.listItem`) named `label`, as Breadcrumb: `semantics: a list named by the label; triggers are buttons that say whether they are expanded; the panel is a list named by its trigger; links carry their address` |
| Trigger: button with `aria-expanded` | matched | same test |
| Trigger `aria-controls` | adapted | Flutter semantics have no relation between nodes; the panel carries the trigger's name instead |
| Panel labelled by its trigger, a list of links | matched | same test |
| Links announced as links with their address | matched | same test (`linkUrl`) |
| A link's description | adapted | read as the link's hint, after its name; on the web it is part of the link's text: same test |
| Chevron decorative | matched | it sits in excluded semantics |
| The current link is read as the current page; no other link is | adapted | Flutter semantics have no `aria-current`: the link's value is `InvisibleMessages.navigationMenuCurrent` ("current page"), as Sidebar reads `sidebarCurrent`: `only the current link is read as the current page; its trigger is marked on screen and read as before`, `a plain link in the bar can be the current page`. The web has no current-page support (open point) |
| The trigger that holds the current link is marked on screen only, with no announcement | adapted | same test; the web has nothing to compare |
| At most one current link | adapted | debug builds fail an assertion: `two current links fail an assertion` |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The bar wraps onto more rows, gap 4 | matched | `right to left at text scale 2.0 in a narrow window the bar wraps and the panel stays inside; 44 by 44 targets under touch` |
| Trigger and top link: padding 8 by 12, bold, radius `radius.control`, `state-hover` on hover and while open | matched | `_BarButton`; the reference stylesheet sets the same roles |
| Chevron turns half a turn while open; at once under reduced motion | matched | `the chevron turns half a turn when open, at once under reduced motion; the keyboard ring shows` |
| Focus ring on triggers and links for keyboard focus | matched | same test |
| Current page look: a 2 px `secondary-body-text` bar under the bar item, along the inline-start edge of a panel link (mirrored right to left), the label in `secondary-body-text`, the panel link tinted 10% `secondary` | adapted | `only the current link is read …`, `the mark of a current panel link sits at the inline-start edge, mirrored right to left`, `right to left at text scale 2.0 under touch: no overflow, labelled 44 by 44 targets`. The bar keeps the state off colour alone, since the labels are already bold; the web has no current-page style |
| Panel focus style on a link | adapted | the reference tints the focused link with `state-hover`; Flutter adds the package's focus ring to the tint, since the tint alone is faint |
| Panel below the trigger at the inline-start edge, gap 8, at least 288 wide | matched | `the panel sits below its trigger at the inline-start edge, at least 288 wide` |
| Panel flips and shifts to stay 8 inside the window | matched | the shared `AnchoredLayout`; `right to left at text scale 2.0 in a narrow window …` |
| Panel padding 8, `background`, `border`, `radius.surface`; links gap 2, padding 8 by 10, label w600, description 14 px `text-secondary` | matched | `_buildPanel`, `_PanelLink`; same roles |
| A panel taller than the window scrolls | adapted | the reference sets no maximum height; the Flutter panel scrolls, as Popover does |
| Elevation `--ds-elevation-overlay` | adapted | the role lives in `tokens.css` only; the Flutter values copy its numbers |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), `right to left at text scale 2.0 …` (44) |
| Text contrast | matched | `semantics: …` (`textContrastGuideline`) |
| `--ds-navmenu-*` theme variables | out of scope | the Flutter theme carries the shared roles; component variables have no Flutter equivalent yet |
