---
"@design-system/svelte": patch
---

Ten Svelte controls now keep the conventions the project wrote down for
itself. A changed `value` prop reaches the control (switch, radio group,
checkbox group, slider, pin input, rating group, segmented control,
toggle button, time field), reflecting a prop reports nothing (the toggle
button used to report a change the consumer had made itself), and the
callback in force at the time of an action is the one that is called: all
ten used to call the callback they were mounted with, so a consumer that
swapped it kept hearing from the old one.

The headless factories gain the no-notify sync each mirror needs
(`syncChecked`, `syncValue`, `syncPressed`), alongside the setters that
report.
