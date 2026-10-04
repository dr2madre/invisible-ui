# Textarea parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/text-field` `packages/svelte/src/lib/text-field`

The Flutter `Textarea` checked against the Svelte `Textarea`
(`packages/svelte/src/lib/text-field/Textarea.svelte`), which shares the
headless text field in `core/src/text-field` with `TextField`. Docs page:
[Text Area](https://dr2madre.github.io/invisible-ui/components/forms/text-area/).

`Textarea` and `TextField` share one implementation in Flutter, as they
share the headless text field on the web. Every line of
[text-field.md](text-field.md) holds for `Textarea` except the ones below.
Matched lines name tests in `test/text_field_test.dart`, group `Textarea`.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Textarea(value:, onChanged:)`, `Textarea.uncontrolled(initialValue:)` | `value` with `onValueChange` | as for TextField |
| `minLines` (default 3) | `rows` (default 3) | the visible lines |
| `maxLines` (default unlimited) | none; the user resizes | where growth stops and scrolling starts |

## Lines that differ from TextField

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Multi-line semantics, multi-line keyboard, Enter inserts a line break | matched | `multi-line: grows from minLines to maxLines` |
| Three visible lines by default | matched | same test |
| Height | adapted | the web box keeps `rows` and offers a resize grip; Flutter has no resize handle in the widgets layer, so the box grows with its text from `minLines` to `maxLines` (Timelog uses 3 to 6), then scrolls |
| `maxLines` below `minLines` | adapted | refused by an assertion (`maxLines below minLines is refused`); the web has no such pair |
| Controlled, reset and reports | matched | `controlled, reset and reports like a text field` |
| Invalid ring only on focus | adapted | the web text area keeps a danger border at rest and adds the ring on focus; the Flutter box shows the danger ring at rest as TextField does |
| Resize grip stripes | out of scope | no resize in Flutter, see height |
| `leading`, `trailing`, `obscureText`, `onSubmitted` | out of scope | the web Textarea has none of them |
