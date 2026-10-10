# ToggleButton parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/toggle-button` `packages/svelte/src/lib/toggle-button`

The Flutter `ToggleButton` checked against the Svelte `ToggleButton`
(`packages/svelte/src/lib/toggle-button/ToggleButton.svelte`) and the
headless toggle button in `core/src/toggle-button`. On the web it is a
native checkbox styled as a button, not an `aria-pressed` button, so it is
announced as checked or not checked.
Docs page: [Toggle Button](https://dr2madre.github.io/invisible-ui/components/forms/toggle-button/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/toggle_button_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `ToggleButton(value:, onChanged:)` | `pressed` with `onPressedChange` | controlled pressed state, change callback |
| `ToggleButton.uncontrolled(initialValue:)` | `pressed` unbound | `defaultPressed` |
| `child` | children | the content |
| `semanticLabel` | `label` | the accessible name, required when the content is an icon |
| `enabled: false` | `disabled` | `disabled` |
| `check` | `check` | the filter-chip tick |
| `focusNode`, `onSaved` | none | focus from code; the form saver |
| `name`, `value` | the same names | out of scope: Flutter forms submit no strings |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap or Space flips it, reported once; Enter does not, as on a checkbox | matched | `a tap and Space flip it and report once; Enter does not` |
| Reflection never reports; the callback is read at call time | matched | `controlled: a changed value is shown, never reported; the callback is read at the press` |
| Disabled: no change, no focus | matched | `disabled: no change, no focus, dimmed` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Checkbox semantics: checked when on, named by its content or `label` | matched | `semantics: checked when on, named by its text or its label; icon-only meets the target and label guidelines` |
| Screen reader output on macOS, Windows, Linux | not yet verified | a manual session; none is recorded |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 2.25rem surface, control border and radius; on: a tint and border of the selection colour and selection-coloured content | matched | `check shows a tick only while on; on takes the selection colour` |
| `check`: a leading tick only while on | matched | same test |
| Hover keeps the rest background | matched | no hover change, as the default `--ds-toggle-bg-hover` |
| Focus ring on keyboard focus | matched | `the ring shows on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the surface` |
| Reduced motion: no colour transition | matched | `reducedMotion` sets the 120ms transition to zero |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The target is at least the minimum, 44 under touch; the surface grows with the text | matched | `the ring shows on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the surface` |
