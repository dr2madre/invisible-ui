# Stepper parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/stepper` `packages/svelte/src/lib/stepper`

The Flutter `Stepper` checked against the Svelte `Stepper`
(`packages/svelte/src/lib/stepper/Stepper.svelte`) and the headless stepper
in `core/src/stepper`: a labelled `<nav>` around an ordered list of step
buttons, the current one marked `aria-current="step"`.
Docs page: [Stepper](https://dr2madre.github.io/invisible-ui/components/patterns/stepper/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in `test/stepper_test.dart`
that holds it. The step clamp, the statuses and the reachable steps answer
the shared vectors in `core/src/stepper/__vectors__`, read by
`test/value_vectors_test.dart` and by the core tests.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `Stepper(currentStep:, onStepChanged:)` | `current` with `onStepChange` | controlled step, change callback |
| `Stepper.uncontrolled(initialStep:)` | `current` unbound | the starting step |
| `StepItem(label:, description:)` | `StepDescriptor` | a step's content |
| `enabled: false` | `disabled` | `disabled` |
| `semanticLabel` | `label` | the name of the steps, default `stepper.label` |
| `linear`, `orientation`, `steps` | the same names | as on the web |

The name collides with Material's `Stepper`: an app importing both hides one
or imports this package with a prefix.

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Linear: the current and completed steps can be chosen; upcoming ones are disabled | matched | `linear: completed and current steps can be chosen, upcoming ones are disabled; a choice is reported once` |
| Choosing the current step is no change | matched | same test |
| Non-linear: any step; disabled: none | matched | `non-linear: any step; disabled: none` |
| A step out of range is clamped | matched | the shared vectors |
| Reflection never reports | matched | `controlled: a changed step is shown, never reported` |
| `next`, `prev`, `goTo` | out of scope | imperative helpers of the web store; a Flutter parent changes `currentStep` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `<nav><ol>` named from the catalog | adapted | Flutter has no landmark role; a container named `stepper.label`, or `semanticLabel`: `semantics: named steps, the current one read as current, the completed ones as completed with a tick` |
| Each step a button named by its label; the description read after it | matched | same test: the label, and the description as the hint |
| `aria-current="step"` | adapted | Flutter semantics have no current state; the current step's value reads `stepper.current` ("current step"), a catalog key added for platforms without one: same test |
| A completed step read as completed; the tick decorative | matched | same test: the value reads `stepper.completed` |
| An unreachable step reported disabled | matched | same test |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 1.75rem circles: complete filled with a tick, current tinted with the selection colour, upcoming dashed; numbers otherwise | matched | `_Indicator` |
| Dotted connector before every step but the first, in the selection colour up to the current step | matched | `_Connector` |
| Focus ring on keyboard focus | matched | `the ring shows on keyboard focus; 44 targets under touch` |
| Colour transitions of the circle | out of scope | 120ms cosmetic fades; the state changes at once |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A horizontal row; stacked when the stepper is narrower than 30rem, or vertical; the order stays | matched | `a row when wide; stacked when narrow or vertical; mirrored right to left`: the web's container query, measured with `LayoutBuilder` and grown with the text scale as `rem` grows |
| Long labels wrap, never truncate | matched | same test, at text scale 2.0 |
| Steps keep the minimum target, 44 under touch | matched | `the ring shows on keyboard focus; 44 targets under touch` |
