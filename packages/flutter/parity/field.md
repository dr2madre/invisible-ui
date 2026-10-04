# Field parity checklist

Reference commit: `bde4433a71312b89d1164c6a1adce57471999a4a`

Reference paths: `core/src/field` `packages/svelte/src/lib/field`

The Flutter `Field` checked against the Svelte `Field`
(`packages/svelte/src/lib/field/Field.svelte`) and the headless field in
`core/src/field`, which follow the WAI-ARIA practice for labelling form
controls. Docs page:
[Field](https://dr2madre.github.io/invisible-ui/components/forms/field/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/field_test.dart`
that holds it. `TextField`, `Textarea` and `NumberField` lay themselves out
with the same field frame and semantics; their checklists cover them there.

## Names

ADR 0017 decision 6: the Flutter API uses Flutter names. This table maps
them to the web names and to the ADR 0011 vocabulary.

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `label` | `label` | the visible label and accessible name |
| `description` | `description` | the hint under the control |
| `error` | `error` | a non-empty message marks the field invalid |
| `required` | `required` | `required` |
| `enabled: false` | `disabled` | `disabled`; Flutter widgets say `enabled` |
| `hideLabel` | none on `Field` (`hideLabel` on `TextField`) | label kept as the name, hidden from view |
| `child` | the `children` snippet with `controlProps` | the control |
| none | `id` | Flutter semantics link by tree position, not by id |

## States

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Optional, valid, enabled by default | matched | `a valid field reports no validation result` in `test/text_field_test.dart`, which shares the frame |
| Invalid when an error is set | matched | `label, description and error describe the control` |
| Required: asterisk shown, kept out of the name | matched | `the required asterisk is shown and kept out of the name` |
| Disabled: dimmed label, control reported disabled | matched | `a disabled field dims its label and reports disabled` |
| Hidden label still names the control | adapted | `a hidden label still names the control`. The web Field has no `hideLabel`; the Flutter Field shares the frame with TextField, which has it |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The label names the control (`for` and `id`) | matched | `label, description and error describe the control` |
| Description and error describe the control (`aria-describedby`) | adapted | `label, description and error describe the control`. Flutter has no described-by relation: both texts join the control node's hint, description first, one per line |
| `aria-invalid` | matched | the node's `validationResult` is `invalid`, same test |
| `aria-required` | matched | the node's `isRequired`, same test |
| Error is a polite live region | matched | `label, description and error describe the control`: the error text is its own node with `liveRegion` |
| Invalid state not by colour alone | adapted | the error text carries a hazard glyph, which the web Field does not draw; the message is text in both |
| A click on the label focuses the control | matched | `a tap on the label focuses the control` |
| The control's semantics merge into the field's node | adapted | Flutter's equivalent of spreading `controlProps`: a control that opens its own semantics container keeps its own node |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Tokens and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Label weight 600, 14 px; description secondary text; error danger body text | matched | the frame reads the colour roles; sizes match the stylesheet of the shipped fields |
| Gap of 6 px between parts | matched | the stylesheet value, as a constant |
| Width `18rem`, at most the container | adapted | Flutter layout gives the width to the parent: the field fills a bounded width, and takes 288 px only when the width is open (`an open width falls back to the web default` in `test/text_field_test.dart`) |
| Right to left and text scale 2.0 in a narrow column | matched | `right to left at text scale 2.0 in a narrow column` |
