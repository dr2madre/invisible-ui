---
"@design-system/vue": minor
---

**Breaking for TypeScript consumers of four controls, encoded as a minor while the package is 0.x** (see `docs/api-stability.md`, "How a classification is encoded"). `RadioGroup`, `SegmentedControl` and `Select` widen their `update:modelValue` payload from `string` to `string | null`, and `RatingGroup` from `number` to `number | null`. That is what "nothing selected" restores to.

Migration: a handler typed `(value: string) => void` no longer compiles, and a handler that did compile now receives `null` after a form reset. Widen the parameter to `string | null` (`number | null` for `RatingGroup`) and decide what an empty selection means for the page. A `v-model` binding needs no change.

The rest of the change is additive. Form reset restores the current default, silently (ADR 0012), matching the Svelte adapter. Every Vue control that submits a value tracks a default that follows its value prop, except a give-back of what the control itself reported, and puts its own state back when its owner's reset event arrives. The Layer 1 shape is Vue's: the vnode carries the default, because Vue writes the attribute alongside the property, and the property is written again after every render. Four composables gain a silent `reset` beside their setters (pin input, time field, multi select, combobox), and the number field's reset target is no longer frozen at mount. A restore also puts a `v-model` binding back, the way the Svelte adapter puts a `bind:value` back, without reporting a change. The Vue textarea also stops rendering a `value` attribute, which a textarea has no such thing as: its default is its child text, and without it a reset emptied a field nobody had touched.
