# RatingGroup parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `packages/svelte/src/lib/rating-group` `packages/svelte/src/lib/radio-group/create-radio-group.ts` `core/src/radio-group`

The Flutter `RatingGroup` checked against the Svelte `RatingGroup`
(`packages/svelte/src/lib/rating-group/RatingGroup.svelte`), a star rating
on native radio buttons sharing a name, following the
[WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
Docs page: [Rating Group](https://dr2madre.github.io/invisible-ui/components/forms/rating-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/rating_group_test.dart` that holds it. The keyboard is the shared
single-choice focus of `RadioGroup`, which runs the navigation
vectors in `core/src/select/__vectors__`.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `RatingGroup(value:, onChanged:)` | `value` with `onValueChange` | controlled rating, change callback |
| `RatingGroup.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `enabled: false` | `disabled` | `disabled` |
| `label`, `max` | the same names | as on the web |
| `onSaved` | none | the form saver |
| `error`, `validator`, `autovalidateMode` | `error` (the app passes and clears it; no validator) | the error message and the form validator every Flutter value control carries |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap or Space chooses a star, reported once | matched | `a tap chooses and reports once; Space chooses the focused star` |
| One tab stop, on the chosen star or the first; arrows move and choose, wrapping; mirrored right to left | matched | `arrows move and choose, wrapping, mirrored right to left; one tab stop on the chosen star` |
| `max` sets the number of stars | matched | `semantics: a radio group of stars named by count, chosen one checked; 24 targets; max sets the count` |
| Reflection never reports | matched | `controlled: a changed value is shown, never reported` |
| Disabled: no choice, no focus | matched | `disabled: no choice, no focus; touch keeps 44 targets at text scale 2.0` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="radiogroup"` named by the visible label | matched | `semantics: a radio group of stars named by count, chosen one checked; 24 targets; max sets the count`: `SemanticsRole.radioGroup` |
| Each star a radio named `rating.stars` ("3 stars"), the chosen one checked | matched | same test; the plural forms are a function of the count, `InvisibleMessages.ratingStars` |
| `aria-orientation="horizontal"` | adapted | Flutter semantics have no orientation; every arrow works, as on native radios |
| Screen reader output on macOS, Windows, Linux | not yet verified | Assistive technology: not tested; a manual session, none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 1.5rem stars: outlined in neutral 400, filled in the secondary colour up to the rating | matched | `the chosen stars fill; hovering previews in grey` |
| Pointer hover previews the stars up to it in neutral 300 | matched | same test |
| Focus ring around the focused star; disabled stars dimmed | matched | `ToggleTile`, shared with the radio and checkbox controls |

## Error message (Flutter)

The web control takes an `error` message the app passes and clears: an
alert after the control, with the hazard glyph, that the control names in
`aria-describedby`. The Flutter control takes it the Flutter way, as the
other Flutter value controls do (`error`, `validator` and
`autovalidateMode` through `FormField`), and a form reset clears the
validator's message.

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `error` or the validator's message, such as a required rating, shows under the stars after the hazard glyph, so the state never relies on colour | adapted | `error a required rating: the validator message shows with the hazard glyph, marks the group invalid and is announced; a form reset clears it and restores the default without a report` |
| The group node is invalid and reads the message with its name; the message is a live region, so a new one is announced | adapted | same test. Assistive technology: not tested |
| A form reset clears the validator's message and restores the current default without a report | adapted | same test; `error a form reset clears a message still showing` |
| The arrows keep working with an error at text scale 2.0, LTR and RTL; targets meet the guidelines | adapted | `error an error keeps the arrows working at text scale 2.0, ltr` and `, rtl` |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Each star keeps the minimum target, 44 under touch; the stars grow with the text | matched | `disabled: no choice, no focus; touch keeps 44 targets at text scale 2.0` |
| The stars wrap in a narrow column at a large text scale | adapted | the web row overflows a narrow container; Flutter wraps it, so every star stays reachable: `error an error keeps the arrows working at text scale 2.0, ltr` |
