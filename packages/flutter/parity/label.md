# Label parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `core/src/label` `packages/svelte/src/lib/label`

The Flutter `Label` checked against the Svelte `Label`
(`packages/svelte/src/lib/label/Label.svelte`), the headless label of
`core/src/label`.
Docs page: [Label](https://dr2madre.github.io/invisible-ui/components/forms/label/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/label_test.dart`
that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `Label('text')` | `children` | the label text |
| `focusNode` | `for` | the control; Flutter points at its focus node, the web at its id |
| `required` | `required` | the asterisk |
| `enabled` | none | a disabled control's label dims, as `Field`'s does |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A click on the label moves focus to the control | matched | `a tap on the label focuses the control` |
| A double click does not select the label text | matched | Flutter text is not selectable unless wrapped in a selection area |
| A disabled label focuses nothing | matched | `a disabled label dims and focuses nothing` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<label for>` names the control | adapted | Flutter semantics cannot point one node at another; the control carries its own name (`Field` does it from its label). The label is read as its text |
| The asterisk is hidden from assistive technology | matched | `the required asterisk shows in the danger colour and is not read` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Weight 500, tight line height, the text colour; the asterisk in the danger body colour | matched | `the required asterisk …` |
| Text scale 2.0, a narrow parent, right to left | matched | `a long label wraps at text scale 2.0 in a narrow parent, right to left` |
| Targets | out of scope | a label is not a control |
