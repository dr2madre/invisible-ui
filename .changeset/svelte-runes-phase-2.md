---
"@design-system/svelte": patch
---

Nineteen controllable components now use the runes syntax internally:
Accordion, Checkbox, CheckboxGroup, DatePicker, DateRangePicker, MultiSelect,
NumberField, Pagination, PinInput, Radio, RadioGroup, RatingGroup,
SegmentedControl, Select, Stepper, Switch, Textarea, TimeField and
ToggleButton. Their props, content and callbacks work as before, controlled
and uncontrolled, and `bind:` keeps working on each controllable prop. A form
reset restores the same defaults as before. One edge changes: binding a
variable that holds `undefined` to one of these props now throws; give the
variable an initial value.

`Label` now follows a `for` prop changed after mount; it kept the first value
before. `createLabel` gains a `sync` function that updates the association.
