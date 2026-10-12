---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Define `--ds-dialog-overlay` in `tokens.css`, from the `dialog-overlay` role
of each theme in the design source. Every dialog sheet already reads it for its `::backdrop`. The
light value is the overlay the dialogs painted until now, `rgb(28 25 21 / 0.5)`.
The dark theme gets its own, `rgb(0 0 0 / 0.6)`: the dialog surface now
measures 1.25:1 against the dimmed page instead of 1.07:1. That separation is
a theme choice, not an accessibility requirement.
