---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

A disabled control no longer submits its value. Every family that
carries its value in a hidden input (combobox, multi-select, pin input,
time field, date picker, date range picker) left that input enabled, so
a form sent the value of a control the user could not touch. Native
controls have never done that, and the number field already did it
right: the hidden input is disabled with the control.
