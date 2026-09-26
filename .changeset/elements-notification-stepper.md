---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

Add `<ds-notification>`, `<ds-notification-region>` and `<ds-stepper>`.

The region owns the notification queue: `show()` and the status shorthands
return an id for `update()` and `dismiss()`, and `promise()` turns a loading
notification into its outcome. Each notification is a polite or assertive
live region; the countdown holds while the stack is hovered or holds focus,
and motion is off under reduced motion. The stepper marks the current step
with `aria-current="step"`, reads a completed step as "label, status,
description", and wraps its labels instead of cutting them. Every default
label comes from the locale catalog, and a label attribute wins over it.
