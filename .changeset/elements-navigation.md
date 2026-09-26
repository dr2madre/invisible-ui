---
"@design-system/elements": minor
"@design-system/svelte": patch
"@design-system/vue": patch
---

New `<ds-sidebar>` and `<ds-avatar>`, ported from the Svelte adapter with
identical classes. The sidebar renders a named navigation landmark with a logo,
labelled sections, collapsible groups, a footer and an optional rail of icons;
items are links or buttons, the current destination carries
`aria-current="page"`, and `select`, `navigate`, `collapsed-change` and
`open-groups-change` report what happened. The avatar shows an image or falls
back to initials, as one named image.
The sidebar and avatar tokens now ship in Elements as well as in Svelte and
Vue.
