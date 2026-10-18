---
"@invisible-ui/core": patch
"@invisible-ui/svelte": patch
"@invisible-ui/vue": patch
"@invisible-ui/elements": patch
---

A disabled menu trigger now carries `data-disabled` from the core, next to
`aria-disabled`. The dropdown menu and menubar triggers in Svelte and Vue now
show the disabled look their stylesheets already defined. The web components
no longer set the attribute themselves.
