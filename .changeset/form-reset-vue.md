---
"@design-system/vue": minor
---

Form reset restores the current default, silently (ADR 0012), matching
the Svelte adapter. Every Vue control that submits a value tracks a
default that follows its value prop, except a give-back of what the
control itself reported, and puts its own state back when its owner's
reset event arrives. The Layer 1 shape is Vue's: the vnode carries the
default, because Vue writes the attribute alongside the property, and
the property is written again after every render. Three composables
gain a silent `reset` beside their setters (pin input, time field,
multi select), and the number field's reset target is no longer frozen
at mount. The Vue textarea also stops rendering a `value` attribute,
which a textarea has no such thing as: its default is its child text,
and without it a reset emptied a field nobody had touched.
