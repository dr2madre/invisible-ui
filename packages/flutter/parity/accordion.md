# Accordion parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/accordion` `packages/svelte/src/lib/accordion`

The Flutter `Accordion` checked against the Svelte `Accordion`
(`packages/svelte/src/lib/accordion/Accordion.svelte`), the WAI-ARIA
accordion pattern of `core/src/accordion`.
Docs page: [Accordion](https://dr2madre.github.io/invisible-ui/components/data-layout/accordion/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/accordion_test.dart` that holds it. The toggle rule also answers the
shared vectors in `core/src/accordion/__vectors__`
(`test/navigation_vectors_test.dart`).

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Accordion(value:, onChanged:)` | `value` with `onValueChange` | controlled `value` (a `Set`, the web's array), change callback |
| `Accordion.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `multiple: true` | `type: "multiple"` | the expansion mode; a flag, since there are two modes |
| `collapsible`, `enabled: false` | `collapsible`, `disabled` | the same rules |
| `items: [AccordionItem(value:, label:, child:, disabled:)]` | `items: [{ value, label, content, disabled }]` | the sections; the content is a widget |
| `headingLevel` | the React adapter's `headingLevel`; Svelte renders `h3` | the header level, 3 by default |
| `orientation` | core only | out of scope: the styled reference stacks its sections |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Single: one open at a time; reported once per toggle | matched | `single: opening one closes the other; reported once per toggle` |
| Collapsible: the open section closes again | matched | same test |
| Not collapsible: the open section stays open, no report | matched | `single, not collapsible: the open section stays open, with no report` |
| Multiple: sections open on their own | matched | `multiple: sections open on their own` |
| The toggle rule (`toggleValue`) | matched | the shared vectors |
| Down and Up move focus between enabled headers, wrapping; Home and End | matched | `arrows move focus between enabled headers, wrapping; Home and End jump; Enter and Space toggle; left and right do nothing` |
| Arrows never toggle; Enter and Space toggle | matched | same test |
| Every header in the Tab order; a disabled one is not | matched | `every header is in the Tab order; a disabled one is not` |
| A disabled accordion takes no taps or focus | matched | `a disabled accordion takes no taps` |
| Reflection never reports | matched | `a changed value is shown without a report` |
| Hidden content keeps its state and leaves the focus order | matched | the shared `DisclosurePanel`, held by the Collapsible test `hidden content keeps its state and leaves the focus order` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Header button with `aria-expanded` inside an `h3` | matched | `semantics: headers are buttons and level 3 headings that report expanded; a disabled one reports disabled` |
| Panel `role="region"` labelled by its header | adapted | Flutter 3.32 has no region role and no labelled-by relation; the panel follows its header in reading order |
| Disabled header reported | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Bordered box, sections divided, chevron turning a quarter turn toward the content | matched | `right to left: the chevron sits at the inline-end and turns toward the content; text scale 2.0 in a narrow column` |
| The chevron mirrors right to left and turns the other way | adapted | the web chevron does not mirror; under right-to-left it points to the inline-end as the submenu chevron does: same test |
| The chevron turns at once under reduced motion | matched | the shared `DisclosureTrigger`, held by the Collapsible test `the chevron turns at once under reduced motion` |
| Focus ring inside the header, since the box clips | matched | `DisclosureTrigger(ringInside: true)` |
| Width `16rem` | adapted | the width the parent gives, 256 when it is open |
| Targets 24 by 24, 44 by 44 under touch | matched | `semantics: …` (24), `headers keep 44 by 44 under touch` |
