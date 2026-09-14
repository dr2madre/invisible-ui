---
"@design-system/react": minor
---

A form reset now restores the current default in every form-bearing component, and says nothing while doing it (ADR 0012).

Checkbox, Switch, Select, Combobox and MultiSelect each put their own state back when their form is reset. The three built on a native control (Checkbox, Switch, Select) also carry a real DOM default that follows their value prop, so the browser's own reset algorithm does the visible work and server-rendered markup is correct with no script. Combobox and MultiSelect submit through hidden inputs, whose value is its own default, so a reset leaves them untouched and their restore is the component's alone; a page that never hydrates does not reset them, which is true of every adapter.

Before this, React wrote the `checked` attribute only when an element first rendered, so a checkbox and a switch restored the value they had at mount and nothing else; the select and the controls that submit through hidden inputs restored nothing at all; and no component put its own state back, so one could submit a value the component no longer held.

Select also gains a resolved selection of its own, the same controllable shape the checkbox and the switch already had. It needs one to have anything to put back, and it fixes two defects in passing: the next render after a reset no longer writes the undone edit back over it, and a select with nothing chosen comes back to nothing chosen. Left to itself the reset algorithm picks the first option that can be chosen, which answered a `required` select with a value nobody had selected.

The default follows the value prop except when the prop only hands back what the control already holds: without that rule a page that mirrors every report back into its state would drag the default along with each click, and a reset would restore the edit it was meant to undo.

`useCheckbox` and `useSwitch` take a new optional `controlRef`: the element the state renders on. The components pass their own, so nothing changes for anyone using them. A consumer rendering their own markup passes their ref to get the same behaviour, and without one the hooks behave exactly as before, since a control that cannot point at an element cannot say which form it belongs to.

No new props, callbacks or events: the form's own `reset` event stays the one notification, and cancelling it with `preventDefault()` cancels the components' restore too.
