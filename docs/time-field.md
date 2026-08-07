# Time Field interaction and value contract

The Time Field is a segmented input for hours, minutes, optional seconds, and
an optional day period. Its design separates what people see and edit from the
value an application stores.

This is the normative behavior for the core, Vue, and Svelte implementations.
Future changes should preserve this contract unless there is user research or
an accessibility finding that justifies changing it.

## Value contract

The public value is always a locale-independent 24-hour string:

- `HH:mm` when `withSeconds` is `false`
- `HH:mm:ss` when `withSeconds` is `true`
- `null` while the field is empty or incomplete

`hourCycle` controls presentation and editing only. In 12-hour mode, `9:30 PM`
is displayed as `09 : 30 PM`, but the published and submitted value is
`21:30`. Applications therefore do not have to migrate stored values when the
user changes locale or hour-cycle preference.

The parser accepts a completed hour with one or two digits and normalizes it:

| Input | Configuration | Result |
| --- | --- | --- |
| `9:30` | minutes | valid, canonical `09:30` |
| `09:30` | minutes | valid, canonical `09:30` |
| `09:30:05` | seconds | valid, canonical `09:30:05` |
| `25:30` | minutes | invalid, no partial value |
| `09:72` | minutes | invalid, no partial value |
| `09:30` | seconds | invalid, seconds required |
| `09:30:05` | minutes | invalid, seconds not allowed |

Normalization is not error recovery. A missing leading zero is unambiguous and
safe to normalize after the value is complete. An out-of-range or malformed
value is not clamped, split, or reinterpreted.

## Editing model

The field exposes four states through `TimeFieldApi.status` and the root
`data-status` attribute:

- `empty`: no segment has a value
- `incomplete`: at least one segment has a value, but the full time cannot be
  published yet
- `valid`: every required segment is complete and the API has a canonical value
- `invalid`: an external value is malformed, out of range, or disagrees with
  the configured seconds precision

Incomplete editing is normal interaction, not an error. Clearing minutes from
`09:30`, for example, publishes `null` and leaves the user free to finish.

In 12-hour mode, AM or PM must be explicit before a newly entered time can be
published. The placeholder is `--`; the component never assumes AM. A valid
canonical value supplied by the application, such as `21:30`, has enough
information to derive and display PM.

Digit entry advances only when the current segment is complete. An impossible
second digit is ignored without changing focus or treating that digit as a new
number. Typing `2`, then `5`, in a 24-hour hour segment keeps `02`; it does not
silently become `05`.

## Validation and errors

Structural validation applies to values supplied by the application. It uses
the following stable error codes:

- `invalid-format`
- `out-of-range`
- `seconds-required`
- `seconds-not-allowed`

Vue and Svelte translate these codes into visible guidance, mark the group with
`aria-invalid`, and connect the message with `aria-describedby`. The segment
that is out of range is also marked when it can be identified. Editing clears
the structural error so the user receives immediate feedback that correction
is in progress.

Use `invalid` and `error` for application rules such as business hours or an
unavailable appointment slot. `error` should state the problem and, when the
remedy is known, how to fix it. Use `onValidationChange` when the application
needs the structural error code.

Do not show an error merely because the user has focused the field or has not
finished every segment. Required-field validation belongs to the containing
form and should normally run on submit or after a completed field loses focus.

## Keyboard and pointer behavior

Each segment follows the ARIA spinbutton interaction:

- digits enter a numeric segment
- `ArrowUp` and `ArrowDown` increment or decrement with wrapping
- `ArrowLeft` and `ArrowRight` move between adjacent segments
- `Backspace` and `Delete` clear the active segment
- `A` and `P` select AM or PM in 12-hour mode
- clicking the day-period segment toggles AM and PM

Disabled fields are removed from the tab order, expose `aria-disabled`, and do
not respond to keyboard or pointer editing.

## Accessibility rationale

The group has an accessible name, and every editable segment is a labelled
`role="spinbutton"` with its range and current value exposed to assistive
technology. Empty segments omit `aria-valuenow` and announce localized empty
text through `aria-valuetext`. Separators are decorative.

This design is aligned with the [WAI-ARIA spinbutton
pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/), WCAG guidance on
[error identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification)
and [error suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion),
and the [Nielsen Norman Group usability
heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). In
particular, it keeps system status visible, matches the user's 12- or 24-hour
convention, prevents silent destructive correction, and provides specific
recovery guidance.

This is an implementation rationale, not a claim that a component alone can
make an application WCAG compliant. Product context, labels, instructions,
validation timing, contrast, zoom, and testing with assistive technology still
matter.

## Adapter API

Vue `TimeField` supports `value` or `v-model`; Svelte `TimeField` supports
`value` and `onValueChange`. Both adapters expose:

- `hourCycle: 12 | 24`
- `withSeconds: boolean`
- `disabled: boolean`
- `invalid: boolean`
- `error: string`
- `name: string` for canonical hidden-input form submission
- `onValidationChange(error)` for structural validation

The headless Vue `useTimeField` and Svelte `createTimeField` APIs additionally
accept localized segment messages and an `aria-describedby` target.

## Verification boundary

The regression suite records the decisions above: flexible normalization,
atomic rejection, seconds precision, explicit AM/PM, incomplete state,
impossible digit handling, disabled behavior, error linkage, form submission,
and automated accessibility checks in both styled adapters.

Do not add speculative parsing such as free-form natural language, locale date
tokens, timezone conversion, or silent clamping to this component. Those are
different product requirements and need their own evidence and contract.
