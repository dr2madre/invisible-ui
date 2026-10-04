# Tabs parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/tabs` `core/src/internal/collection.ts` `packages/svelte/src/lib/tabs`

The Flutter `Tabs` checked against the Svelte `Tabs`
(`packages/svelte/src/lib/tabs/Tabs.svelte`), the WAI-ARIA tabs pattern of
`core/src/tabs`.
Docs page: [Tabs](https://dr2madre.github.io/invisible-ui/components/navigation/tabs/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/tabs_test.dart`
that holds it. The keyboard model also answers the shared vectors in
`core/src/tabs/__vectors__` (`test/navigation_vectors_test.dart`), which
the core runs through `connect()`.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Tabs(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `Tabs.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `label` | `label` | the tab list's accessible name |
| `activationMode: TabActivationMode.manual` | `activationMode: "manual"` | the activation mode |
| `orientation: Axis.vertical` | core's `orientation` | the arrow axis and the layout |
| `items: [TabItem(value:, label:, child:, icon:, count:, iconOnly:, disabled:)]` | `items: [{ value, label, content, icon, count, iconOnly, disabled }]` | the tabs; the panel and the icon are widgets |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The first enabled tab is selected by default; a tap selects, reported once | matched | `the first enabled tab is selected by default; a tap selects and reports once; the selection is bold` |
| Automatic: arrows move and select, skipping disabled tabs, wrapping; Home and End | matched | `automatic: arrows move and select, skipping a disabled tab and wrapping; Home and End jump`, and the shared vectors |
| Right to left: left moves forward | matched | `right to left: left moves forward and the row is mirrored`; the Svelte adapter passes no direction to the core, the core and the custom elements do |
| Manual: arrows move focus only; Enter or Space selects | matched | `manual: arrows move focus only; Enter or Space selects` |
| Vertical: up and down move, left and right do nothing | matched | `vertical: up and down move, left and right do nothing; the list sits beside the panels`; the styled Svelte Tabs is horizontal only, so the layout follows the core's orientation |
| One tab stop on the selected tab, then the panel (`tabindex="0"`) | matched | `one tab stop on the selected tab, then the panel` |
| A disabled tab is skipped and takes no tap | matched | `automatic: …`, `semantics: …` |
| A disabled tab is out of the Tab order | adapted | the web tab keeps its native button tab stop; a disabled Flutter control takes no focus |
| Hidden panels keep their state and leave the focus order | matched | `hidden panels keep their state and leave the focus order` |
| Reflection never reports | matched | `a changed value is shown without a report` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="tablist"` named by the label; `role="tab"` with `aria-selected` | matched | `semantics: a tab bar named by the label, tabs with selected state, the count in the name, a panel named by its tab` (`SemanticsRole.tabBar`, `SemanticsRole.tab`, Flutter's role checks pass) |
| `role="tabpanel"` labelled by its tab | matched | same test (`SemanticsRole.tabPanel`, named by the tab's label) |
| `aria-controls`, `aria-orientation` | adapted | Flutter semantics have no relation between nodes and no orientation property; the arrows follow the layout |
| The count read as part of the tab's name | adapted | the Svelte badge is hidden from assistive technology; the React adapter reads it as `Name (count)`, and Flutter follows it, so the number is not lost: same test |
| Icon-only tabs named by their label | matched | the node's label is the item label whatever shows |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The selected tab is bold and underlined in the selection colour | matched | `the first enabled tab is selected by default; …` |
| Count badge: grey, violet when selected | matched | `_Count` |
| Focus ring inside the tab, since the row clips | matched | `_Tab` |
| A narrow row scrolls sideways; a focused tab scrolls into view | matched | `a narrow row scrolls sideways at text scale 2.0 and a focused tab comes into view` |
| Colour changes fade over 120ms, at once under reduced motion | matched | `_Tab`'s `AnimatedContainer` |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), `tabs keep 44 by 44 under touch` |
