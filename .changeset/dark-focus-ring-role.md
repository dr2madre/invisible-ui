---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The dark theme's focus ring is the `color-focus-ring` role of that theme,
`role.dark.color-focus-ring` in the design source: `#a286db`, the secondary
mixed 70% with white. The design source now holds that value and its mix
itself, so consumers that cannot mix colours, such as the Flutter apps, read
the same ring as the stylesheet. It reaches 5.1:1 on the dark panel, above
the 3:1 that WCAG 1.4.11 and 2.4.13 require. Nothing changes on screen, and
no variable is added: the stylesheet still exposes the ring as
`--ds-color-focus-ring` in both themes. Token names say the role, never how
a colour looks (ADR 0002).
