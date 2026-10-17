---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Navigation Menu: hover opens a panel while the pointer stays, the first click
keeps it open even when hover opened it, and a second click closes it; a
pending hover delay never reopens a panel a click, Escape or an outside press
closed. Activating a link closes the panel before the browser follows it and
leaves focus where the page puts it, falling back to the trigger only when
focus would be lost. Links accept `current`: the current link gets
`aria-current="page"` and a visible mark that does not rely on colour alone,
and its trigger is marked on screen only. In core, the state gains `kept` and
`setValue` receives it.
