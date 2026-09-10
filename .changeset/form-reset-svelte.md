---
"@design-system/core": minor
"@design-system/svelte": minor
---

Form reset restores the current default, silently (ADR 0012). Every
Svelte control that submits a value now tracks a default that follows its
value prop (except a give-back of what the control itself reported): the
native ones carry it as a real DOM default, the composite ones carry the
payload in their hidden inputs, and each puts its own state back when its
owner's reset event arrives: after every listener, after the native restore, and not at all
when a listener cancelled the event. The composite families restore the
payload their hidden inputs carry; the combobox restores its committed
text too, so an Escape after a reset settles on the restored label. The
core gains formReset.onFormReset, the shared listener that resolves the
owner at event time, so a moved or re-associated control follows its
real form. NumberField's target is no longer frozen at mount.
