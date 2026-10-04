# TextField parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/text-field` `packages/svelte/src/lib/text-field`

The Flutter `TextField` checked against the Svelte `TextField`
(`packages/svelte/src/lib/text-field/TextField.svelte`) and the headless text
field in `core/src/text-field`. Docs page:
[Text Field](https://dr2madre.github.io/invisible-ui/components/forms/text-field/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/text_field_test.dart` that holds it. The box is built on
`EditableText`, not on Material's `TextField`.

## Names

ADR 0017 decision 6: the Flutter API uses Flutter names. This table maps
them to the web names and to the ADR 0011 vocabulary.

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `TextField(value:, onChanged:)` | `value` with `onValueChange` | controlled `value`, change callback `onValueChange` |
| `TextField.uncontrolled(initialValue:)` | `value` unbound | `defaultValue`; two constructors keep the modes apart |
| `onChanged` | `onValueChange` | reported after the text moved, once per edit, read at call time |
| `enabled: false` | `disabled` | `disabled` |
| `readOnly`, `required` | the same names | `readOnly`, `required` |
| `error`, `description`, `placeholder`, `hideLabel` | the same names | as on the web |
| `maxLength` | `maxlength` | the typing limit |
| `obscureText`, `keyboardType`, `autofillHints` | `type`, `inputmode`, `autocomplete` | input purpose |
| `leading`, `trailing` | `left`, `right` snippets | decorative icons |
| `validator`, `onSaved`, `autovalidateMode` | native constraint validation | Flutter `Form` validation |
| `onSubmitted`, `focusNode`, `autofocus` | none | Flutter wiring |

The name collides with Material's `TextField`: an app importing both hides
one or imports this package with a prefix.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Each edit reports once, after the state moved | matched | `typing reports each edit once, after the text moved` |
| Uncontrolled starts from the default | matched | `uncontrolled starts from initialValue` |
| Reflection never reports | matched | `a changed value is shown and never reported` |
| Give-back does not churn | matched | `a controlled parent that gives the text back does not churn` |
| Live callback replacement | matched | `the callback is read at the edit` |
| Consumer data is never cut | matched | `maxLength stops typing; a longer value from the parent stays` |
| Enter keeps focus | matched | `Enter keeps focus and calls onSubmitted` |

## States

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Disabled: not focusable, no edits, dim label, reported disabled | matched | `disabled: no focus, no edits, reported disabled, dim label` |
| Read-only: focusable, selectable, no edits | matched | `read-only: focus and no edits, reported read-only` |
| Invalid: danger border and ring at rest | matched | `an invalid field shows a danger ring at rest` |
| Placeholder while empty | matched | `a placeholder shows while empty` |
| Label click focuses the control | matched | `a tap on the label focuses the field` |
| Success message and check (`success`) | out of scope | no consumer asks for it yet |
| `minlength`, `pattern` | adapted | browser constraint validation has no Flutter equivalent; a `validator` checks them inside a `Form` |

## Keyboard and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Tab enters the field; a disabled field is skipped | matched | `Tab moves into the field and skips a disabled one` |
| Text editing keys | adapted | `EditableText` with the app's `DefaultTextEditingShortcuts`, as every Flutter text input |
| Focus ring whenever focused (`:focus-visible` matches a text input in every mode) | matched | `shows whenever the field has focus, in any mode` |
| Dark ring colour `style.focus.onDark` | matched | `dark uses style.focus.onDark` |
| Text cursor over the field | matched | `a mouse over the field shows the text cursor` |
| Selection handles and context menu on touch | out of scope | they come from Material or Cupertino controls; desktop selection (drag, double click) works through the widgets layer |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Text field named by the label, value is the text | matched | `label, description and error are on the text field node` |
| Description and error (`aria-describedby`) | adapted | same test: they form the node's hint, one per line |
| `aria-invalid`, `aria-required` | matched | `validationResult` and `isRequired`, same test |
| `maxlength` | matched | `maxValueLength` and `currentValueLength`, same test |
| Error announced (`role="alert"`) | adapted | `the error is a live region with a glyph, not colour alone`. Flutter live regions have no assertive level; the error is polite |
| Invalid not by colour alone | matched | the hazard glyph and the text, same test |
| No invalid state when valid | matched | `a valid field reports no validation result` |
| Hidden label still names the field | matched | `a hidden label still names the field` |
| Password input | matched | `an obscured field reports it` |
| Labeled targets and text contrast | matched | `meets the labeled tap target and text contrast guidelines` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the default, reports nothing | matched | `a reset restores the current default without a report` |
| The default is the last value the parent set, never a given-back edit | matched | `a controlled reset restores the last value the parent set, not a given-back edit` |
| Validation and save | adapted | `the validator shows its message and saves the text`: Flutter `Form` validation in place of the browser's |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Box at least the minimum target, 44 by 44 under touch | matched | `the box keeps the minimum target height under touch` |
| Padding 8 by 12, radius `radius.control`, colours from the roles | matched | the field stylesheet values; roles from the theme |
| Right to left | matched | `right to left aligns the label and text to the right` |
| Text scale 2.0 in a narrow column | matched | `text scale 2.0 at a narrow width does not overflow` |
| Width | adapted | see the Field checklist: the parent sets it, 288 px when open (`an open width falls back to the web default`) |
