# Select parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/select` `core/src/internal/collection.ts` `packages/svelte/src/lib/select`

The Flutter `Select` checked against the headless select in
`core/src/select`, the
[WAI-ARIA select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/),
and the Svelte `Select` (`packages/svelte/src/lib/select/Select.svelte`) for
its props, placeholder and messages. The Svelte component styles a native
`<select>`, whose popup the browser draws; Flutter has no native popup, so
the list is drawn by the adapter as the core describes it, with the
styling of the web Combobox list.
Docs page: [Select](https://dr2madre.github.io/invisible-ui/components/forms/select/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/select_test.dart`
that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Select(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback |
| `Select.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `items: [ChoiceItem(...)]` | `items: [{ value, label?, disabled? }]` | the options; an `icon` shows in the list and the trigger |
| `placeholder` | `placeholder` | defaults to the catalog key `select.placeholder` |
| `enabled: false` | `disabled` | `disabled` |
| `label`, `hideLabel`, `required`, `error` | the same names | as on the web |
| `description`, `validator`, `onSaved` | none | the field parts every Flutter value control carries |
| `width` (`wrap`, `fill`, `fixed`) | `width` | adapted: the field takes its parent's width, or 18rem when the parent leaves it open, like every Flutter field |
| `onOpenChange` (core) | not on the component | out of scope, as on the web component |
| Option groups | none | out of scope: the reference has none |

## Pointer

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Placeholder while empty; a tap toggles the list; an option tap chooses, closes, then reports once | matched | `the placeholder shows; a tap opens; an option tap chooses, closes, then reports once` |
| A pointer opens with no option highlighted but the chosen one | matched | same test |
| Choosing the chosen option reports nothing; a disabled option does nothing | matched | `choosing the chosen option reports nothing; a disabled option does nothing` |
| A press outside closes | matched | `a press outside closes; a second tap on the trigger too` |
| The mouse highlights the option under it | matched | `the mouse highlights the option under it` |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Down, Up, Enter and Space open on the chosen option, else the first enabled | matched | `Down opens on the chosen option, or the first enabled one` |
| Up and Down move, skipping disabled options, wrapping; Home and End jump | matched | `Up and Down move, skipping a disabled option and wrapping; Home and End jump; Enter chooses and focus stays`; the steps answer the shared vectors in `core/src/select/__vectors__/select.json` |
| Enter and Space choose; focus stays on the trigger | matched | same test |
| Typeahead (`matchOption`): opens on a match, a query builds for 500 ms | matched | `typed characters open on a match and find the next one`; `matchOption` answers the shared vectors |
| Escape closes and is consumed; a closed select leaves it to the page | matched | `Tab closes and moves on; Escape stays with the select` |
| Tab closes and moves on | matched | same test |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Trigger `role="combobox"` with `aria-expanded`, named by the label and its text | adapted | `SemanticsRole.comboBox` fails Flutter's debug role check, so the trigger is a button node named by the label, with the chosen option as its value and the expanded state: `the trigger: name, value, expanded, hints and error` |
| Invalid, required, placeholder | matched | same test |
| `role="listbox"` named by the label; `role="option"` with `aria-selected`, `aria-disabled` | adapted | Flutter has no listbox role; a list node named by the label, whose list items carry selected and enabled states: `the list: named, options selected and enabled or not` |
| `aria-activedescendant` for the highlighted option | adapted | Flutter has no active descendant; focus stays on the trigger as on the web, and each newly highlighted option is announced politely: `the highlighted option is announced` |
| Labeled targets and contrast | matched | `the list: named, options selected and enabled or not` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, layout and states

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Disabled: no focus, no opening | matched | `disabled: no focus, no opening` |
| Focus ring on keyboard focus; danger ring when invalid | matched | `keyboard focus shows the ring` and `the trigger: name, value, expanded, hints and error` |
| The list as wide as the trigger, flipping above near the bottom, 16rem high at most and scrolling | matched | `the list is as wide as the trigger, flips above it near the bottom, and scrolls a long list` |
| The chosen option ticked and bold; the highlighted one ringed | matched | the shared listbox list, as the web Combobox list |
| Right to left at text scale 2.0 in a narrow column; 44 by 44 options under touch | matched | `right to left at text scale 2.0 in a narrow column, with 44 by 44 options under touch` |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report; the validator shows its message` |
| A controlled value becomes the reset default, never reported | matched | `a controlled value is shown without a report and becomes the reset default` |
