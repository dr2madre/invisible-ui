---
"@design-system/react": minor
---

A form reset now restores the current default in every form-bearing component, and says nothing while doing it (ADR 0012).

Checkbox, Switch, Select, Combobox and MultiSelect each carry a real DOM default that follows their value prop, so the browser's own reset algorithm does the visible work and server-rendered markup is correct with no script; and each puts its own state back when its form is reset. Before this, React wrote the `checked` attribute only when an element first rendered, so a checkbox and a switch restored the value they had at mount and nothing else, the select and the controls that submit through hidden inputs restored nothing at all, and no component put its own state back, so one could submit a value the component no longer held.

The default follows the value prop except when the prop only hands back what the control already holds: without that rule a page that mirrors every report back into its state would drag the default along with each click, and a reset would restore the edit it was meant to undo.

`useCheckbox` and `useSwitch` take a new optional `controlRef`: the element the state renders on. The components pass their own, so nothing changes for anyone using them. A consumer rendering their own markup passes their ref to get the same behaviour, and without one the hooks behave exactly as before, since a control that cannot point at an element cannot say which form it belongs to.

No new props, callbacks or events: the form's own `reset` event stays the one notification, and cancelling it with `preventDefault()` cancels the components' restore too.
