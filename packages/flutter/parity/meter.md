# Meter parity checklist

Reference commit: `27ae41b22e7951ac8b1cbd78fb0f1e70a3c5e7c6`

Reference paths: `core/src/meter` `packages/svelte/src/lib/meter`

The Flutter `Meter` checked against the Svelte `Meter`
(`packages/svelte/src/lib/meter/Meter.svelte`), the WAI-ARIA meter pattern
of `core/src/meter`.
Docs page: [Meter](https://dr2madre.github.io/invisible-ui/components/data-layout/meter/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/meter_test.dart`
that holds it. The percentage, band and quality also answer the shared
vectors in `core/src/meter/__vectors__` (`test/navigation_vectors_test.dart`).

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `value`, `min`, `max`, `low`, `high`, `optimum`, `label` | the same names | the reading, its bands, its good end and its name |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Percentage, band (`level`) and quality (`quality`) | matched | the shared vectors |
| The fill coloured by quality, not by band | matched | `the fill is coloured by how good the value is: the same reading means opposite things for battery and disk` |
| A new value slides over 200ms, at once under reduced motion | matched | `the fill starts at the inline-start right to left and moves at once under reduced motion` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="meter"` named by the label | adapted | Flutter has no meter role; a node named by the label: `semantics: named by the label, the level read as a percentage of the range` |
| `aria-valuenow` with `aria-valuemin` and `aria-valuemax` | adapted | Flutter 3.32 semantics carry a value string, not a range; the value is the percentage of the range: same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Poor in the danger colour, suboptimal in the warning colour | matched | `the fill is coloured by …` |
| Optimal in pastel green | adapted | `--ds-pastel-green` is not in `tokens.json`, and on the border-coloured track it falls short of 3:1; the success role stands in: same test |
| The fill starts at the inline-start, mirrored right to left | matched | `the fill starts at the inline-start right to left and moves at once under reduced motion` |
| Width `16rem` | adapted | the width the parent gives, 256 when it is open: `a narrow parent narrows the track at text scale 2.0` |
| Targets | out of scope | not interactive |
