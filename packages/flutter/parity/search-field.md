# SearchField parity checklist

Reference commit: `f2943333bf31794885e523ca48b6dd87f189d5af`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `core/src/text-field` `packages/svelte/src/lib/search-field`

The Flutter `SearchField` checked against the Svelte `SearchField`
(`packages/svelte/src/lib/search-field`) over the core text field
(`core/src/text-field`). It shares the field layout and the text box of
[text-field.md](text-field.md).
Docs page: [Search Field](https://dr2madre.github.io/invisible-ui/components/forms/search-field/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/search_field_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `SearchField(value:, onChanged:)` | `value` bindable, `onValueChange` | the query, controlled |
| `SearchField.uncontrolled(initialValue:)` | `value` as the seed | the query, uncontrolled |
| `onSubmitted` | the native form submission | Enter and the submit button run the search |
| `submitButton` | `submitButton` | whether the submit button shows |
| `clearLabel`, `submitLabel` | `clearLabel`, `submitLabel` | the buttons' names, the catalog's `searchField.clear` and `searchField.submit` by default |
| `label`, `hideLabel`, `placeholder` | `label`, `hideLabel`, `placeholder` | name, hidden name, hint |
| `enabled`, `readOnly`, `required` | `disabled`, `readOnly`, `required` | the shared states |
| `autofillHints` | `autocomplete` | autofill |
| `validator`, `onSaved`, `autovalidateMode` | `name` and the native form | form participation |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The field is named by its label; the placeholder is a hint, never the name | matched | `the field is named by its label; the buttons have names; the clear button shows only with text` |
| The clear button shows only while the field holds text | matched | same test |
| The clear and submit glyphs are decorative; the buttons carry the names | matched | same test; `the labels come from the catalog and can be replaced` |
| Tab order: field, clear when present, submit | matched | `Tab goes from the field to the clear button, then to submit` |
| Clear reports an empty value once and returns focus to the field | matched | `a press empties the field, reports once and puts focus back in the field`, `Enter on the focused clear button clears and focuses the field`. Focus returns for a pointer press too: a tap outside the text can take focus away on a touch screen |
| Disabled and read-only fields expose no clear action | matched | `disabled and read-only fields have no clear button` |
| A disabled field disables its submit button | matched | same test |
| Enter in the field submits | adapted | Flutter has no form submission: Enter and the submit button call `onSubmitted` with the text: `Enter and the submit button report the text` |
| Enter that ends an input method composition | adapted | it commits the composed text and does not submit, which the web leaves to the browser: `Enter that ends an input method composition does not submit` |
| Without a submit button the glyph marks the start of the field and the clear button stays | matched | `without a submit button: a leading glyph, the clear button stays` |
| Controllable mirror: a changed value is shown without a report; a given-back value does not churn | matched | `a changed value is shown and never reported; a given-back value does not churn` |
| Form reset restores the current default silently (ADR 0012) | matched | `a form reset restores the default without a report` |
| Right to left and text scale 2.0 at 320 wide | matched | `right to left at text scale 2.0 in 320: no overflow, the buttons at the inline-end` |
| Targets 24 by 24, 44 by 44 under touch; labelled; contrast | matched | `labelled targets and contrast; 44 by 44 under touch` |
| The browser's cancel glyph is suppressed | out of scope | Flutter draws no native cancel glyph |
| A hidden clear button leaves its place | adapted | it keeps its space, out of the focus order and the semantics tree, so the text never jumps |
| The separator line before the submit button | adapted | the buttons sit inside the field's padding; no separator line is drawn |
| `role="search"` on the form | out of scope | the app's form; Flutter has no search landmark |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |
