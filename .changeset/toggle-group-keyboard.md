---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Toggle Group adds the shared keyboard rule from `toggleGroup` in core: with
three or more toggles the group is one Tab stop, the arrow keys move focus
between the enabled toggles (mirrored in right-to-left text, Up and Down in a
vertical group) and Home and End jump to the ends; with one or two toggles
each keeps its own Tab stop; inside a Toolbar the toolbar's keys apply.
Moving focus never changes a toggle, and adding or removing toggles never
loses focus. The container stays `role="group"` with an optional name.
