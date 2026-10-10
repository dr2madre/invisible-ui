# PinInput parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/pin-input` `packages/svelte/src/lib/pin-input`

The Flutter `PinInput` checked against the Svelte `PinInput`
(`packages/svelte/src/lib/pin-input/PinInput.svelte`) and the headless PIN
input in `core/src/pin-input`: a named group of single-character text
inputs.
Docs page: [Pin Input](https://dr2madre.github.io/invisible-ui/components/forms/pin-input/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/pin_input_test.dart` that holds it. The split, the character filter
and the paste distribution answer the shared vectors in
`core/src/pin-input/__vectors__`, read by `test/value_vectors_test.dart`
and by the core tests, which run the paste through the core's own paste
handler.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `PinInput(value:, onChanged:)` | `value` with `onValueChange` | controlled code, change callback |
| `PinInput.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `onCompleted` | `onComplete` | every cell filled; the name Flutter code-input packages use |
| `obscureText` | `mask` | hidden characters; Flutter's text field name |
| `type: PinInputType.numeric` / `.alphanumeric` | `type` | allowed characters |
| `enabled: false` | `disabled` | `disabled` |
| `length`, `invalid`, `success`, `label` | the same names | as on the web |
| `autofocus`, `onSaved` | none | the first cell's focus; the form saver |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| An allowed character fills the cell and moves on; others are refused | matched | `typing fills a cell and moves on; refused characters stay out; completion is reported` |
| `onComplete` each time a change fills every cell | matched | same test |
| A typed character replaces the cell's character | matched | `a typed character replaces the one in the cell`: the web selects the cell on focus and holds one character |
| Backspace clears the cell, or the previous one when empty, moving there | matched | `Backspace clears the cell, then the previous one, moving back; arrows, Home and End move; mirrored right to left` |
| Arrows move between cells; Home and End to the ends | matched | same test |
| Right to left mirrors the arrows | adapted | the web's arrows keep their physical direction while the cells follow `dir`, so the left arrow moves right there; ADR 0017 has arrows follow `Directionality`: same test |
| A paste spreads over the cells from the focused one, keeping allowed characters | matched | `a pasted or autofilled code spreads over the cells from the focused one`: the keyboard paste reads the clipboard; a code typed or filled in at once spreads the same way |
| Reflection never reports | matched | `controlled: a changed value is shown, never reported` |
| Disabled: no focus, no input | matched | `disabled: no focus and no input` |
| The code is never logged | matched | no log or diagnostics write it; obscured cells keep it out of semantics |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by `label` | matched | `semantics: a named group of named text cells; the first carries the one-time code hint; obscured hides the characters` |
| Each cell a text field named by `pinInput.cell` | matched | same test |
| `autocomplete="one-time-code"` on the first cell | matched | same test: `AutofillHints.oneTimeCode` |
| `inputmode="numeric"` | matched | a number keyboard for `numeric`, text otherwise |
| `aria-invalid` with `invalid` | matched | same test: each cell's validation result |
| `type="password"` with `mask` | matched | same test: obscured |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 2.75rem square cells, 1.25rem text, control border, gap 0.5rem | matched | `_Cell` |
| Focus: focus-colour border and ring | matched | `_Cell` |
| Invalid: danger borders and ring; success: success borders and ring | matched | `_Cell`; `invalid` wins, as on the web |
| Disabled cells dimmed | matched | opacity 0.5 |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Cells grow with the text and wrap in a narrow column | adapted | the web row overflows a narrow container; Flutter wraps it, so the code stays reachable: `a narrow column at text scale 2.0 wraps the cells` |
| Each cell is 44 by 44 at text scale 1, above every minimum target | matched | `semantics: a named group of named text cells; the first carries the one-time code hint; obscured hides the characters` |
