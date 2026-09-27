---
"@design-system/vue": patch
---

The Vue adapter shares more of its internals: Combobox and MultiSelect use
the shared positioning and outside-press helpers, the menus share one
typeahead, the form controls share one form-reset helper, and the date
pickers share their field parts. The public API does not change.

The DatePicker, DateRangePicker and Menubar triggers now ignore the duplicate
click iOS sends after a tap, so they no longer open and then close at once.
