# Sidebar parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/collapsible` `packages/svelte/src/lib/sidebar` `docs/sidebar-spec.md`

The Flutter `Sidebar` checked against the Svelte `Sidebar`
(`packages/svelte/src/lib/sidebar`: `Sidebar.svelte`, `SidebarNav.svelte`,
`SidebarGroup.svelte`, `SidebarItems.svelte`, `identity.ts`), the headless
collapsible its sections use, the design record in
[`docs/sidebar-spec.md`](https://github.com/dr2madre/invisible-ui/blob/main/docs/sidebar-spec.md)
and [ADR 0013](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0013-sidebar-and-the-menu-name.md).
Docs page: [Sidebar](https://dr2madre.github.io/invisible-ui/components/patterns/sidebar/).

Each line is **matched**, **adapted** (with the platform reason), **out of
scope** or **not yet verified**. Every matched line names the widget test in
`test/sidebar_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Sidebar<T>` | `Sidebar` | destination values are any type `T`; the web uses strings |
| `sections: List<SidebarSection<T>>` | `sections: SidebarSection[]` | the groups, in order |
| `SidebarSection(label:, items:)` | `{ label, items }` | a plain section |
| `SidebarSection.collapsible(id:, label:, items:, initiallyExpanded:)` | `{ collapsible: true, id, label, items, defaultOpen }` | a section with a disclosure heading; `initiallyExpanded` is the Flutter name for the default |
| `SidebarItem(value:, label:, icon:, uri:)` | `{ value, label, icon, href }` | a destination; `uri` is its announced address, `icon` a widget |
| `value` | `value` | the current destination, owned by the app |
| `label` | `label` | the navigation's name, defaulting to the catalog's `sidebar.label` |
| `onSelected` | `onSelect` | reports the pressed destination's value |
| `collapsed`, `onCollapsedChanged` | `collapsed`, `onCollapsedChange` | the rail, owned by the app; the callback reports the state the user asks for |
| `expandedSections`, `onExpandedSectionsChanged` | `openGroups`, `onOpenGroupsChange` | the expanded sections by id; a nullable set mirrors the reference's optional `openGroups` instead of two constructors, because ADR 0013 makes the controlled set an exception to the controllable mirror and supports handing it back |
| `logo`, `footer` | `logo`, `footer` snippets | widgets |

## Destinations

| Line | Status | Evidence or reason |
| --- | --- | --- |
| An item without an address is a button that reports its value; Enter and Space press it | matched | `every destination reports its value; a link takes Enter, a button Enter and Space; the callback is read when pressed` |
| An item with an address is a link; Enter presses it, Space does not | matched | same test |
| A link reports its value too | adapted | the web follows the `href` and reports nothing; Flutter has no `href`, so every destination reports through `onSelected` and the app navigates: same test |
| The callback is read at the press | matched | same test |
| The current destination: tinted, bold, read as the current page | adapted | Flutter semantics have no current-item property: the item's value is `sidebar.current` ("current page"), a catalog key added for this, as Breadcrumb and Pagination do: `semantics: a container named from the catalog; sections are lists; the current destination is read as the current page; links carry their address` |
| Plain Tab order, no roving focus | matched | `Tab moves through the destinations in order, with no roving` |
| `data-current` | out of scope | a styling hook for the web stylesheet; Flutter has no attribute selectors |

## Collapsible sections

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A heading is a disclosure button that says whether it is expanded; hidden items leave the semantics tree and the focus order | matched | `semantics: …`; the shared `DisclosureTrigger` and `DisclosurePanel` |
| Uncontrolled: sections marked `initiallyExpanded` start open; a press toggles and reports the new set | matched | `left to itself: initially expanded sections open; a press toggles a section and reports the set` |
| Uncontrolled: the section holding the current destination starts open | matched | `left to itself: the section holding the current destination opens silently, when the value moves and when the sections change` |
| Uncontrolled: it opens silently whenever the holder changes, by `value` moving or by `sections` changing; the same holder never reopens a section the user closed | matched | same test |
| Controlled: a press only reports, the visible set waits for the app (ADR 0013 exception) | matched | `owned by the app: a press only reports; the value moving opens nothing; handing back null continues from the set on screen` |
| Controlled: neither a `value` change nor a `sections` change moves or reports anything | matched | same test |
| Handing the set back continues from the set on screen | matched | same test |
| Missing or repeated collapsible ids: development throws | adapted | Flutter fails an assertion in debug builds: `section ids: a missing or repeated id fails an assertion; the fallback is deterministic and never shared` |
| Production fallback: position for a missing id, `id#2` for a repeated one, plain sections claim their position | matched | same test |
| A collapsible section with a missing id at the type level | adapted | Dart requires `id` on `SidebarSection.collapsible`; an empty id is the missing case |

## Rail

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The toggle renders only with `onCollapsedChanged` and an icon on every destination | matched | `no rail without an icon on every destination: no toggle, and a collapsed sidebar fails an assertion`, `the rail toggle reports the state it asks for, says whether the sidebar is collapsed and points the way it will go` |
| The toggle reports the opposite of `collapsed`; the app owns the state | matched | `the rail toggle reports …` |
| The toggle: `aria-pressed`, named "Expand the navigation" while collapsed and "Collapse the navigation" otherwise | adapted | `toggled` semantics stand for `aria-pressed`: same test |
| The toggle's chevron points the way the sidebar will go | matched | `the rail toggle reports …`; it mirrors right to left with the shared glyph |
| `collapsed` without an icon on every destination: development says why, labels stay | adapted | debug builds fail an assertion; release builds keep the labels: `no rail without an icon …` |
| In the rail labels leave the screen and stay in the accessibility tree | matched | `the rail: 56 wide, labels and headings leave the screen and stay in semantics, each destination has a tooltip at the end` |
| Each destination in the rail has a tooltip with its label, placed at the inline-end | matched | same test |
| Section headings leave the screen in the rail | adapted | a plain section's heading names its list (see Semantics), so it stays readable without a hidden text node; a collapsible heading keeps its name on its button: same test |
| A heading pressed in the rail reports `collapsed: false` and opens the section if it was closed, reporting it | matched | `a section pressed in the rail expands the sidebar and opens the section, reporting both once` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<nav aria-label>` named `label` or the catalog's `sidebar.label` | adapted | Flutter has no landmark role: a container named the same way, as Pagination: `semantics: …` |
| Each section's items as a list | matched | `SemanticsRole.list` with `SemanticsRole.listItem` children: `semantics: …` |
| A plain section's heading | adapted | the web renders a paragraph before the list; Flutter names the list with the heading, so it is read with the list in both layouts: `semantics: …`, `the rail: …` |
| Collapsible heading `aria-controls` | adapted | Flutter semantics have no relation between nodes; the content follows the button in the tree |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Width 15rem, rail 3.5rem, never wider than the parent | adapted | 240 and 56 at text scale 1.0, scaled with the text as rem is with the browser's text size, then clamped to the parent: `the rail: 56 wide, …`, `right to left at text scale 2.0 in a 320 wide parent: long labels wrap with no overflow; 44 by 44 targets under touch`, `the rail right to left at text scale 2.0 under touch: no overflow, 44 by 44 targets` |
| Padding 12, gap 12, `background`, `border`, `radius.surface` | matched | `Sidebar.build`; the reference stylesheet sets the same roles |
| Items: padding 8 by 10, gap 10, `radius.control`, `state-hover` on hover; current: `secondary-body-text`, 10% `secondary` tint, w600 | matched | `_ItemButton`; the tint is the 10% the package's selected states use |
| Long labels wrap | matched | `right to left at text scale 2.0 in a 320 wide parent: …` |
| Headings: 11 px, bold, uppercase, 0.05 em tracking, `text-secondary` | matched | `semantics: …` (the uppercase heading is read as written, "Projects") |
| Heading chevron: a quarter turn toward the content, mirrored right to left, none under reduced motion | matched | `the heading chevron turns a quarter turn toward the content, mirrored right to left, at once under reduced motion` |
| Heading hover tint | adapted | the shared disclosure header paints no hover tint; the keyboard ring stays |
| Heading chevron size | adapted | the shared disclosure header sizes it at 1.1 em of the body text; the web sizes it at 1 em of the heading |
| Footer at the bottom with a top border and 8 of space | matched | `bounded height: the sections scroll and the footer sits at the bottom; unbounded: a plain column` |
| The sections scroll between the logo and the footer | adapted | with a bounded height the sections scroll; with an unbounded one the sidebar is a plain column, since Flutter cannot fill an unbounded height: same test |
| Focus ring for keyboard focus | adapted | the package's ring; on items and headings it is drawn inside the control, as Dropdown Menu items do, because the scrolling sections clip at their edges |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), `right to left at text scale 2.0 in a 320 wide parent: …` and `the rail right to left …` (44) |
| Text contrast | matched | `semantics: …`, `right to left at text scale 2.0 in a 320 wide parent: …` (`textContrastGuideline`) |
| `--ds-sidebar-*` theme variables, `data-mode`, `data-side`, `data-collapsed` | out of scope | the Flutter theme carries the shared roles; component variables and attribute hooks have no Flutter equivalent yet |

## Out of scope

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `mode="drawer"`, `open`, `onOpenChange`, `closeOnNavigate`, `title`, `renderTrigger`, `returnFocusTo`, `trigger` | out of scope | the drawer composes Sheet Dialog (ADR 0013), which the Flutter package does not have yet |
| `side` (inline-start or inline-end) | out of scope | it places the drawer's edge only; the inline sidebar sits where the app puts it |
| Responsive presentation | out of scope | as on the web, the component reads no screen size; the app decides where and when to show it and whether it is a rail |
