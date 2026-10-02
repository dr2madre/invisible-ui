---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

Add `--ds-color-focus-ring-on-dark` (`style.focus.onDark` in the design source),
the dark-mode focus ring as one fixed value, `#a286db`. It is the colour the
dark `--ds-color-focus-ring` already resolves to, so nothing changes on screen.
Consumers that cannot mix colours, such as the Flutter apps, need it: the
primary reaches only 2.87:1 on the dark panel, below the 3:1 that WCAG 1.4.11
and 2.4.13 require, while this reaches 5.1:1.
