---
"@design-system/svelte": patch
"@design-system/vue": patch
---

The Date Picker and the Date Range Picker open from the keyboard: Enter, Space
or ArrowDown on the field, as in React and the custom elements. Focus goes to
the selected day, or the day the calendar would focus, not to the Today button.
A pick, or a finished range, returns focus to the field, and the clear button
leaves focus on the field when it removes itself. The popover options of both
adapters gain `initialFocus`, a selector of what takes focus when it opens.
