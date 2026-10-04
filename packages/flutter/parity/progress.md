# Progress parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/progress` `packages/svelte/src/lib/progress`

The Flutter `Progress` checked against the Svelte `Progress`
(`packages/svelte/src/lib/progress/Progress.svelte`) and
`core/src/progress`.
Docs page: [Progress](https://dr2madre.github.io/invisible-ui/components/data-layout/progress/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/progress_test.dart` that holds it. The percentage also answers the
shared vectors in `core/src/progress/__vectors__`
(`test/navigation_vectors_test.dart`).

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `value`, `min`, `max`, `label`, `showValue` | the same names | the reading and its name |
| `shape: ProgressShape.circle` | `shape: "circle"` | a bar or a ring |
| an indeterminate state | none | out of scope, as on the web: work of unknown length is waiting, which `Loading` shows (`LoadingVariant.bar` stands still under reduced motion) |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The completion as a percentage of the range, clamped | matched | `semantics: named by the label, the completion read as a percentage of the range; values out of range are clamped`, and the shared vectors |
| A new value slides over 200ms, at once under reduced motion | matched | `a new value slides over 200ms, and at once under reduced motion` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="progressbar"` named by the label | adapted | Flutter 3.32's progress bar role fails its own debug role check; a node named by the label: `semantics: …` |
| `aria-valuenow` with `aria-valuemin` and `aria-valuemax` | adapted | Flutter 3.32 semantics carry a value string, not a range; the value is the percentage, which screen readers announce for a progress bar: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A track filling from the inline-start, mirrored right to left | matched | `the bar fills from the inline-start, mirrored right to left` |
| A ring filling clockwise from the top, with the percentage when asked | matched | `the circle shows its percentage when asked, scaled with the text` |
| Width `16rem` | adapted | the width the parent gives, 256 when it is open: `a bar in an open width takes the default width; text scale and density leave it alone` |
| Targets | out of scope | not interactive |
