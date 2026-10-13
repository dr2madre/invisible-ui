# ToggleButton parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/toggle-button` `packages/svelte/src/lib/toggle-button`

The Flutter `ToggleButton` checked against the Svelte `ToggleButton`
(`packages/svelte/src/lib/toggle-button/ToggleButton.svelte`), the headless
toggle button in `core/src/toggle-button`, and the approved decision for
every adapter: a button with a toggled state, the
[WAI-ARIA button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
with `aria-pressed`, whose name never changes with the state. The web
adapters still render a native checkbox styled as a button, announced as
checked or not checked; Flutter follows the decision.
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
| `error`, `validator`, `autovalidateMode` | `error` (the app passes and clears it; no validator) | the error message every Flutter value control carries, through `FormField` |
| `focusNode`, `onSaved` | none | focus from code; the form saver |
| `name`, `value` | the same names | out of scope: Flutter forms submit no strings |

## Value and callbacks (ADR 0011)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A tap, Enter or Space flips it, reported once | matched | `a tap, Enter and Space each flip it and report once`: the decision; the web checkbox takes Space only |
| Reflection never reports; the callback is read at call time | matched | `controlled: a changed value is shown, never reported; the callback is read at the press` |
| Disabled: no change, no focus | matched | `disabled: no change, no focus, dimmed` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A button with a toggled state, never a checked state | matched | `semantics: a button with a toggled state, never checked; the name stays the same in both states; icon-only meets the target and label guidelines`: Flutter's `button` and `toggled` flags, the `aria-pressed` equivalent |
| The name stays the same on and off; named by its content or `semanticLabel` | matched | same test |
| Error: the message describes the toggle and marks it invalid | matched | `the validator message shows with a hazard glyph, marks the toggle invalid and is announced; a form reset clears it and restores the default silently` |
| Screen reader output on VoiceOver, TalkBack, NVDA | adapted | Assistive technology: not tested |

## Look, motion and focus

| Line | Status | Evidence or reason |
| --- | --- | --- |
| 2.25rem surface, control border and radius; on: a tint and border of the selection colour and selection-coloured content | matched | `check shows a tick only while on, at the inline start; on takes the selection colour` |
| `check`: a leading tick only while on, at the inline start in both directions | matched | same test |
| Hover keeps the rest background | matched | no hover change, as the default `--ds-toggle-bg-hover` |
| Focus ring on keyboard focus | matched | `the ring shows on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the surface` |
| Reduced motion: no colour transition | matched | `reducedMotion` sets the 120ms transition to zero |

## Error message

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The message shows under the toggle with a hazard glyph, so it never relies on colour alone, and is announced as a live region | adapted | the web shows no message of its own; every Flutter value control carries one through `FormField`: `the validator message shows with a hazard glyph, marks the toggle invalid and is announced; a form reset clears it and restores the default silently` |
| `error` takes precedence over the validator's message | matched | `the error prop takes precedence; focus stays on the toggle while an error shows and clears` |
| Focus stays on the toggle while a message shows or clears | matched | same test |
| A long message wraps at a narrow width and text scale 2.0 | matched | `a long error wraps at a narrow width and text scale 2.0` |
| In a segmented `ToggleGroup` the message shows inside the joined bar | adapted | the bar clips its toggles; show the message beside the group there |

## Form reset (ADR 0012)

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Reset restores the current default, reports nothing | matched | `a form reset restores the default without a report` |
| Reset clears the validator's message | matched | `the validator message shows with a hazard glyph, marks the toggle invalid and is announced; a form reset clears it and restores the default silently` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| The target is at least the minimum, 24 by 24, and 44 by 44 under touch; the surface grows with the text | matched | `semantics: a button with a toggled state, never checked; the name stays the same in both states; icon-only meets the target and label guidelines` and `the ring shows on keyboard focus; 44 by 44 under touch; text scale 2.0 grows the surface` |
| Right to left mirrors the tick and the content | matched | `check shows a tick only while on, at the inline start; on takes the selection colour` |
