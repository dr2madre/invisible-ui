---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

A disabled control no longer submits its value. Every family that
carries its value in a hidden input (combobox, multi-select, pin input,
time field, date picker, date range picker) left that input enabled, so
a form sent the value of a control the user could not touch. Native
controls have never done that.

**If you relied on the old behaviour**, the platform's way to keep a
control frozen but still submitted is `readOnly`, and only MultiSelect
offers it today: for the other families, render your own hidden input
alongside a disabled control until they do.
