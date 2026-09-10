---
"@design-system/core": minor
"@design-system/svelte": minor
---

Form reset restores the current default, silently (ADR 0012). Every
form-participating Svelte control now carries a real DOM default that
follows its value prop (except a give-back of what the control itself
reported), and puts its machine back when its owner's reset event
arrives: after every listener, after the native restore, and not at all
when a listener cancelled the event. The composite families restore the
payload their hidden inputs carry; the combobox restores its committed
text too, so an Escape after a reset settles on the restored label. The
core gains formReset.onFormReset, the shared listener that resolves the
owner at event time, so a moved or re-associated control follows its
real form. NumberField's target is no longer frozen at mount.
