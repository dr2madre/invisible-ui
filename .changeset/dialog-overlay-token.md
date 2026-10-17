---
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Define `--ds-dialog-overlay` in `tokens.css`, from the `dialog-overlay` role
of each theme in the design source. Every dialog sheet already reads it for its `::backdrop`. The
light value is the darkest neutral at half opacity, `rgb(27 27 27 / 0.5)`.
The dark theme gets its own, `rgb(0 0 0 / 0.6)`: the dialog surface now
measures 1.27:1 against the dimmed page instead of 1.07:1. That separation is
a theme choice, not an accessibility requirement.
