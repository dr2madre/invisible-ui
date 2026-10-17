---
"@invisible-ui/elements": minor
---

A form reset now restores the current default in every form-bearing element, and says nothing while doing it (ADR 0012).

Each element carries a real DOM default that follows its value attribute, so the browser's own reset algorithm does the visible work and server-rendered markup is correct with no script; and each one answers its form's `reset` by putting its own copy of the value back. Before this, six of them wrote the value as a DOM property only, so a reset emptied a field nobody had touched, and `ds-combobox` and `ds-multi-select` submit through hidden inputs, which a native reset never touches, so their payload survived the reset entirely.

The default follows the attribute except when the attribute is only handing back what the control itself reported: without that rule, a page that mirrors every change back into the attribute would drag the default along with each keystroke, and a reset would restore the edit it was meant to undo.

No new attributes, properties or events: the form's own `reset` event stays the one notification, and cancelling it with `preventDefault()` cancels the components' restore too.
