# RangeSlider parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/range-slider` `packages/svelte/src/lib/range-slider`

The Flutter `RangeSlider` checked against the Svelte `RangeSlider`
(`packages/svelte/src/lib/range-slider/RangeSlider.svelte`) and the headless
range slider in `core/src/range-slider`: two native range inputs on one
track, each following the
[WAI-ARIA slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/).
Docs page: [Range Slider](https://dr2madre.github.io/invisible-ui/components/forms/range-slider/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/range_slider_test.dart` that holds it. The snap, the distance rule,
`clampPair`, `normalizePair`, the bound order, the nearer thumb and the
pointer fraction answer the shared vectors in
`core/src/range-slider/__vectors__`, read by `test/value_vectors_test.dart`
and by the core tests.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `RangeSlider(value:, onChanged:)` | `value` with `onValueChange` | controlled pair, change callback with the whole pair |
| `RangeSlider.uncontrolled(initialValue:)` | `value` unbound | `defaultValue` |
| `(double, double)` | `readonly [number, number]` | the pair, lower first |
| `thumbLabels: (String, String)` | `thumbLabels` | each thumb's name |
| `onChangeEnd` | none | the end of a gesture; Flutter's own slider name |
| `enabled: false` | `disabled` | `disabled` |
| `min`, `max`, `step`, `minDistance`, `orientation`, `showValue`, `showRange`, `ticks`, `format`, `icon`, `label` | the same names | as on the web |
| `locale`, `onSaved` | none | the digits of the default text; the form saver |
| `name` | `name` | out of scope: Flutter forms submit no strings |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Each thumb is a tab stop with the native range keys | matched | `each thumb is a tab stop with the slider keys; the pair is reported whole, once per key` |
| The thumbs never cross and keep `minDistance`, rounded up to the grid; a refused move reports nothing | matched | `the thumbs never cross and keep the distance`, and the `clampPair` vectors |
| Right to left mirrors the arrows and the track | matched | `right to left: the left arrow increases and the lower thumb sits at the right` |
| A press reaches the nearer thumb, the lower one midway, and drags it | matched | `a press moves the nearer thumb and drags it; onChangeEnd once per gesture`; the web raises that thumb before the press with `nearerThumb`, Flutter moves it with the same rule |
| `onChangeEnd` once per gesture, when the pair moved | adapted | no end-of-gesture callback on the web: same test |
| A controlled pair is made legal (grid, bounds, order, distance) and never reported | matched | `controlled: an illegal pair is shown legal, never reported`, and the `normalizePair` vectors |
| Reversed bounds read smaller first | matched | the `orderBounds` vectors |
| Disabled: no focus, no input | matched | `disabled: no focus and no drag` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by `label` | matched | `semantics: a named group; each thumb a slider with its name and the bound it may not pass` |
| Each thumb a slider named by its label, its value text naming the bound it may not pass (`rangeSlider.lowerText`, `rangeSlider.upperText`) | matched | same test |
| `aria-valuemin` and `aria-valuemax` narrowed to the other thumb | adapted | Flutter semantics have no bounds; the value text names the bound, as the web's `aria-valuetext` does |
| Increment and decrement by a step | matched | same test, the decrease action |
| The fill and the ticks are hidden from assistive technology | matched | painted only |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 4px track in the border colour, fill between the thumbs in the primary colour, 1.5rem thumbs in the primary colour with a 2px rim | matched | `SliderTrack` and the thumbs in `range_slider.dart` |
| Ticks as dots on the track, one per reachable grid point, up to 20 | matched | `sliderTicks(whole: true)` |
| The raised thumb (z-order) | out of scope | a web hit-testing workaround: Flutter picks the thumb from the press position |
| Focus ring around the focused thumb | matched | `FocusRingPainter` on each thumb |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default pair, made legal, reports nothing | matched | `a form reset restores the default pair without a report` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 14rem wide by default, 12rem tall when vertical | matched | `OpenWidth`, 224, and 192 |
| Thumbs keep the minimum target, 44 under touch; a narrow column at text scale 2.0 does not overflow; vertical fills upward | matched | `touch: 44 targets in a narrow column at text scale 2.0; vertical fills upward` |
