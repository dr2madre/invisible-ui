---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Remove `--ds-color-focus-ring-on-dark` and `style.focus.onDark`. No component
read them. The dark focus ring is the `color-focus-ring` role of the dark
theme, `role.dark.color-focus-ring` in the design source, which now holds
`#a286db` and its mix (the secondary 70% with white) itself. Token names say
the role, never how a colour looks (ADR 0002). The ring looks the same in
both themes. A consumer that read `--ds-color-focus-ring-on-dark` reads
`--ds-color-focus-ring` under the dark theme instead.
