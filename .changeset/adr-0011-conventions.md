---
"@design-system/svelte": minor
---

The Svelte adapter now keeps the conventions in ADR 0011 for every prop a
consumer can control.

**Reflection reaches the control.** A changed `value` reflects into the
switch, radio group, checkbox group, slider, pin input, rating group,
segmented control, time field, text field, textarea, accordion and tree,
and a changed `open`, `current` or `selected` into the dialogs, the
popover, the collapsible, the stepper and the tree. Several of these
could not be driven from the outside at all before.

**Reflection reports nothing.** Opening a dialog or a popover from the
outside used to call `onOpenChange`, and pressing a toggle button's prop
used to call `onPressedChange`: a parent was told about a change it had
made itself.

**A swapped callback is honoured.** Every one of these components
captured its callback at mount, so a consumer that replaced it kept
hearing from the old one.

Two related repairs found while proving the above: the stepper's step
status is now recomputed when the step changes, and the time field takes
a value the consumer echoes back as the committed one, so Escape cannot
revert past it.

Additive public surface on the headless factories: `syncChecked`,
`syncDisabled`, `syncValue`, `syncPressed`, `syncOpen`, `syncStep`,
`syncExpanded`, `syncSelected`, `syncFocus`, `syncView`.
