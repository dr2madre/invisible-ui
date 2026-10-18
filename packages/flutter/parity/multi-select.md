# MultiSelect parity checklist

Reference commit: `31edd44ea7637357a2eac288bcc050e07f52852f`

Reference paths: `core/src/multi-select/state.ts` `core/src/multi-select/connect.ts` `core/src/multi-select/types.ts` `packages/svelte/src/lib/multi-select`

The Flutter `MultiSelect` checked against the Svelte `MultiSelect`
(`packages/svelte/src/lib/multi-select`) over the core multi select
(`core/src/multi-select`). The selection rules (`addValue`, `removeValue`,
`lastRemovableValue`, `resolveItem`) answer the shared vectors in
`core/src/multi-select/__vectors__/multi-select.json`, read by
`core/src/multi-select/vectors.test.ts` and `test/multi_select_vectors_test.dart`.
Docs page: [Multi Select](https://dr2madre.github.io/invisible-ui/components/forms/multi-select/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/multi_select_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `MultiSelect<T>(values:, onChanged:)` | `values`, `onValuesChange` | the chosen values in pick order, controlled; values are any type `T` |
| `MultiSelect.uncontrolled(initialValues:)` | `values` as the seed | uncontrolled |
| `items: List<ChoiceItem<T>>` | `items` | the options |
| `onInputChanged` | `onInputValueChange` | the filter text |
| `filter` | `filter` (adapter context) | which options the text lets through |
| `max`, `removeOnBackspace` | `max`, `removeOnBackspace` | addition cap, Backspace opt-in |
| `enabled`, `readOnly`, `required` | `disabled`, `readOnly`, `required` | the shared states |
| `placeholder`, `emptyText` | `placeholder`, `emptyText` | the catalog's `multiSelect.placeholder` and `multiSelect.empty` by default |
| `validator`, `onSaved` | `name` and hidden inputs | form participation |

## Choosing

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The popup takes the direction of the control that opens it, so a `dir` on a plain wrapper around the control counts | open | the overlay child of `OverlayPortal` is built in the context of the control, so the `Directionality` around the control reaches it, but no widget test wraps one control in its own `Directionality`; the web holds it in every adapter |
| Typing filters and opens the list on the first enabled match | matched | `typing opens and filters; Enter adds, empties the text, keeps the list open and announces the addition` |
| Enter adds the highlighted option, empties the text and keeps the list open | matched | same test |
| Down and Up open on the first enabled option, skip disabled ones and wrap | matched | `Down opens on the first enabled option; arrows skip a disabled one and wrap`; the vectors in `core/src/select` |
| A chosen option stays listed and ticked; choosing it again is a no-op | matched | `a chosen option stays listed, ticked; choosing it again changes nothing` |
| A pointer press on an option adds it and keeps the list | matched | `a pointer press on an option adds it; the list stays` |
| `max` blocks additions and keeps existing values | matched | `max blocks additions and keeps the chosen values`; vectors |
| Escape closes the list and keeps the text; with the list closed it reaches the dialog | matched | `Escape closes the list and keeps the text; with the list closed it is left to the dialog` |
| Tab closes the list and moves on | matched | `Tab closes the list and moves on` |
| Each addition is announced politely | adapted | the web announces nothing beyond the new `aria-selected`; Flutter announces "Ada added" (`multiSelect.added`, a catalog key added for this): same test |
| The highlighted option is announced | adapted | Flutter has no `aria-activedescendant`: the highlight is announced politely, as in `Combobox` |

## Removing

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Every tag has a remove button named "Remove <label>", an ordinary tab stop | matched | `a remove button removes, announces, and focus moves to the next remove button, then the previous, then the field` |
| Removing through a button moves focus to the next remove button, else the previous, else the field | adapted | the web picks the button at the removed tag's position among all tags, which lands on the wrong one when a tag before it cannot be removed; Flutter walks the chosen values from the removed position and skips those with no button: same test; `focus skips a value that cannot be removed` |
| Each removal is announced politely | adapted | "Grace removed" (`multiSelect.removed`, a catalog key added for this): same test |
| Backspace in the empty field removes the last removable value, only with the opt-in | matched | `Backspace in the empty field removes the last removable value only with the opt-in`; vectors |
| A value whose option is disabled can be neither added nor removed | matched | `focus skips a value that cannot be removed`; vectors |
| Read-only: focus, no list, no remove buttons; disabled: nothing | matched | `read-only and disabled: no remove buttons, no list` |

## State and forms

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A value with no option stays chosen and shows its raw value | matched | `a value with no option stays chosen and shows its raw value`; vectors |
| Controllable mirror: a changed list is shown without a report; the same values in another order are a give-back | matched | `controlled: a changed list is shown, never reported; the same values in another order change nothing` |
| Values and text committed before either is reported (ADR 0011) | matched | `typing opens and filters; …` (`onChanged` then `onInputChanged('')`) |
| Form reset restores the current default and empties the text, silently (ADR 0012) | matched | `a form reset restores the default and empties the text, silently` |
| One hidden input per value under `name`; `required` exposes `aria-required` only | adapted | Flutter forms read the list through `FormField`: `validator` and `onSaved` receive it; `required` marks the field required and shows the asterisk |
| Duplicate controlled values fail in development | out of scope | not asked for yet; the list is used as given |

## Semantics and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The field says whether the list is expanded | matched | `the field says whether the list is expanded; the tags form a named list` |
| The tags form a list named "Selected values", never options | matched | same test (`multiSelect.selected`) |
| `aria-multiselectable` on the list | adapted | Flutter semantics have no multiselectable flag; each option reports its selected state |
| Tags inside the bordered control | adapted | the tags wrap above the text box, in the same field, so a tag is never squeezed beside the cursor; the reading and focus order is tags, then field, as on the web |
| Right to left, text scale 2.0, 320 wide, long labels | matched | `right to left at text scale 2.0 in 320 with long labels: no overflow; labelled 44 by 44 targets under touch` |
| Remove buttons meet the target size (24, 44 under touch); labelled; contrast | matched | same test |
| `--ds-multi-select-*` variables | out of scope | the Flutter theme carries the shared roles |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |

## Background token

The background reads the component token `--ds-components-menu-background-default` on the web and `InvisibleColors.menuBackground` in Flutter, both generated from `packages/tokens/tokens.json`; `tokens-parity.test.ts` and the Dart token tests hold the values.
