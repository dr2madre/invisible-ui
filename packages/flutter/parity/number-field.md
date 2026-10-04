# NumberField parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/number-field/state.ts` `core/src/number-field/connect.ts` `core/src/number-field/types.ts` `core/src/i18n/format.ts` `packages/svelte/src/lib/number-field/NumberField.svelte` `packages/svelte/src/lib/number-field/create-number-field.ts`

The Flutter `NumberField` checked against the Svelte `NumberField`
(`packages/svelte/src/lib/number-field/NumberField.svelte`) and the headless
number field in `core/src/number-field`, which follow the
[WAI-ARIA spinbutton pattern](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/)
on a text input. Docs page:
[Number Field](https://dr2madre.github.io/invisible-ui/components/forms/number-field/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/number_field_test.dart` that holds it.

## Shared logic and vectors

Parsing, validation, stepping and formatting are ported from
`core/src/number-field/state.ts` to `lib/src/number_field/number_format.dart`.
Both answer the language-neutral cases in
`core/src/number-field/__vectors__/number-field.json`: the core reads them in
`core/src/number-field/vectors.test.ts`, the Flutter package in
`test/number_format_test.dart`. A changed vector fails both.

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Grammar: empty, incomplete (lone sign, lone separator, trailing separator), valid, invalid | matched | vectors `parse` |
| Group separators anywhere; plain, no-break, narrow and thin spaces for space-grouping locales | matched | vectors `parse` (fr-FR, sv) |
| Locale digits folded (Arabic-Indic, Persian), direction marks ignored, typographic minus | matched | vectors `parse` (ar-EG, ar, fa, sv) |
| `-0` is 0; numbers beyond the double range do not parse | matched | vectors `parse` |
| Range and step validity with float tolerance, grid from `min` | matched | vectors `validate` |
| Step on scaled integers, off-grid snap in the pressed direction, clamp, empty to the nearest bound to zero | matched | vectors `snap` |
| Display: up to 15 fraction digits, locale symbols and grouping, minimum grouping digits, direction marks before the minus | matched | vectors `format` |
| Canonical ASCII form value | matched | vectors `canonical`; exposed for a form through `onSaved` and `value` |
| Locale symbols | adapted | Flutter's widgets layer has no `Intl`. `NumberSymbols.forLocale` holds the CLDR symbols of 23 locales, checked against the core's `numberSymbols` by vectors `symbols`; another locale falls back to its language, then English, and `symbols:` sets any other |

## Names

ADR 0017 decision 6: the Flutter API uses Flutter names. This table maps
them to the web names and to the ADR 0011 vocabulary.

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `NumberField(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`; null is empty in both modes |
| `NumberField.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `onChanged` | `onValueChange` | the number moved: typing, a step, Escape |
| `onChangeEnd` | `onValueCommit` | a commit moved the committed number; Flutter's `Slider` names its commit callback the same way |
| `NumberFieldState.validationError`, `.status`, `.text` | `api.validationError`, `api.status`, `api.inputValue` | validity as data |
| `enabled: false` | `disabled` | `disabled` |
| `min`, `max`, `step`, `readOnly`, `required`, `changeOnWheel`, `description`, `error`, `label` | the same names | as on the web |
| `locale` (a `Locale`), else `Localizations`, else English | `locale`, else the provider's locale | the reading and writing locale |
| `symbols` | none | explicit symbols for a locale outside the table |
| `validator`, `onSaved`, `autovalidateMode` | `name` with the hidden input | Flutter `Form` |

## Value, draft and commits (ADR 0011, ADR 0017 §2)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The number follows the draft; one report per change; typing never commits | matched | `the number follows the draft, one report per change` |
| Blur commits once; a repeat blur is silent | matched | `blur commits once; a repeat blur stays silent` |
| A commit reformats in the locale | matched | `a commit reformats the text in the locale` |
| Empty is null, distinct from 0 | matched | `empty is null, distinct from 0` |
| Unparseable text stays as typed, never commits, says why | matched | `text that does not parse stays, never commits, and says why` |
| Out of range: reported, never clamped, message with the bound in the locale | matched | `a typed number out of range is reported, never clamped` |
| Step mismatch reported, step in the locale | matched | `a typed step mismatch is reported in the locale` |
| An explicit `error` replaces the validity message | matched | `an explicit error replaces the validity message` |
| Enter commits | matched | `Enter commits` (Flutter delivers Enter as the text input action) |
| Escape reverts and is consumed only when it undid something | matched | `Escape reverts a draft, and passes on when there is none` |
| Reflection never reports | matched | `a changed value is shown and never reported` |
| Give-back keeps the draft and the commit point | matched | `a given-back value keeps the draft and the commit point` |
| A parent value while editing keeps the typed text | matched | `a parent value while editing keeps the typed text` |
| Live callback replacement | matched | `the callbacks are read at the action` |
| Locale from the app | matched | `the locale comes from Localizations when none is given` |
| A locale change reformats an idle display; a draft or kept invalid text stays | matched | `a locale change reformats an idle display, not a draft` |

## Keyboard

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Arrow Up and Down step; each step commits | matched | `arrows step, and each step commits` |
| A step starts from the draft and snaps to the grid | matched | `a step starts from the draft and snaps to the grid` |
| From empty to the nearest bound to zero | matched | `steps from empty land on the nearest bound to zero` |
| Home and End only with both bounds; otherwise the caret keys | matched | `Home and End go to the bounds only when both exist` |
| Page Up and Page Down | out of scope | the reference does not bind them (the APG lists them as optional); adding them is a spec change for every adapter |
| Read-only arrows keep their caret meaning; disabled takes no focus | matched | `read-only and disabled fields neither edit nor step` |
| Wheel steps only when opted in, focused and hovered; the page does not scroll then | matched | `steps only when opted in and focused` |

## Step buttons

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Step, commit, focus stays in the text | matched | `step, commit and leave focus in the text` |
| Out of the Tab order (`tabindex="-1"`) | matched | `stay out of the Tab order` |
| Disabled at the bound | matched | `a bound disables the matching button` |
| Named "Increase {label}" and "Decrease {label}" from the messages | matched | `are named from the theme messages` |
| Order mirrors in right to left | matched | `mirror in right to left` |
| Built from Button | adapted | the web draws its own spin buttons joined to the input; Flutter uses `Button.icon`, each a separate rounded control with a 4 px gap |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Named by the label; description, required | matched | `a text field that can be increased and decreased` |
| `role="spinbutton"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | adapted | a text field node with increase and decrease actions and the next values (`increasedValue`, `decreasedValue`), which screen readers read as an adjustable control: same test. The node's value is the text, the draft included, where the web reports the committed number in `aria-valuetext` |
| The increase action steps and commits | matched | `the increase action steps` |
| Invalid with the message (`aria-invalid`, `aria-describedby`) | matched | `text that does not parse stays, never commits, and says why` |
| Validity as data | matched | `NumberFieldState.validationError` in the tests above |
| Labeled targets | matched | `meets the labeled tap target guideline` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default and its display, reports nothing | matched | `a reset restores the current default silently` |
| Uncontrolled reset restores the initial number, even empty | matched | `an uncontrolled reset restores initialValue, even empty` |
| A form submits the canonical number | adapted | `validation fails on the field validity, then the validator`: `Form.save` hands `onSaved` the number; Flutter forms have no hidden inputs |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Targets 24 by 24, 44 by 44 under touch | matched | `targets are at least 24 by 24, and 44 by 44 under touch` |
| Text centred, tabular figures | adapted | centred; tabular figures follow the consumer's font family |
| Text scale 2.0 in a narrow column | matched | `text scale 2.0 in a narrow column does not overflow` |
