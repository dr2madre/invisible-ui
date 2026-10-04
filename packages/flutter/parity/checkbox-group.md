# CheckboxGroup parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/checkbox-group` `packages/svelte/src/lib/checkbox-group`

The Flutter `CheckboxGroup` checked against the Svelte `CheckboxGroup`
(`packages/svelte/src/lib/checkbox-group/CheckboxGroup.svelte`) and the
headless group in `core/src/checkbox-group`: a `<fieldset>` of native
checkboxes, zero or more checked.
Docs page: [Checkbox Group](https://dr2madre.github.io/invisible-ui/components/forms/checkbox-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/checkbox_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `CheckboxGroup(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `CheckboxGroup.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `items: [ChoiceItem(value:, label:, disabled:)]` | `items: [{ value, label?, disabled? }]` | the options; the label is required in Dart, the web falls back to the value |
| `enabled: false` | `disabled` | `disabled` |
| `label` | `label` (the legend) | the group's name |
| `hideLabel`, `required`, `description`, `error`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |
| `min`, `max` | none | out of scope: the reference has no limits; a `validator` checks counts |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Each item toggles; the value keeps toggle order (`toggleValue`) and may be empty | matched | `each item toggles; the value keeps the order of checking and may be empty` |
| A disabled item, or a disabled group, takes no change | matched | `a disabled item and a disabled group take no change` |
| A reordered echo is the same selection (give-back by content) | matched | `a reordered value from the parent is the same selection` |
| State first, then the report; reflection never reports | matched | the shared `ValueControl`, held for this group by the tests above and for `Checkbox` by `a changed value is shown and never reported` |

## Keyboard and semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Every enabled item is a tab stop (no roving); Space toggles; a disabled item is skipped | matched | `every enabled item is a tab stop; Space toggles` |
| `<fieldset>` with a `<legend>`: a named group | adapted | Flutter has no group role; a container node named by the label, with the items as child nodes: `semantics: a named group of checkbox nodes` |
| Each item a checkbox named by its label, disabled reported | matched | same test |
| A tap on the legend focuses the first item | adapted | a `<legend>` does nothing on the web; Flutter's field label focuses its control: `a tap on the group label focuses the first item; text scale 2.0 right to left does not overflow` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a reset restores the default; the validator can require one` |
| A validator can require a choice | matched | same test |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Items stacked with a 0.5rem gap; targets as `Checkbox` | matched | `semantics: a named group of checkbox nodes` (labelled targets) |
| Right to left at text scale 2.0 in a narrow column | matched | `a tap on the group label focuses the first item; text scale 2.0 right to left does not overflow` |
