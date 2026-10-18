---
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Tabs gains an actions area for commands such as "add": the `actions` snippet
in Svelte, the `actions` slot in Vue, the `actions` prop in React, and children
marked `slot="actions"` in Elements. It sits right after the tab list, on the
same row, outside `role="tablist"`, and wraps below the tab list on a narrow
row. Its controls are ordinary buttons: Tab reaches them after the selected
tab, the arrow keys never do, and they never become tabs. Under a coarse
pointer they keep the 44 by 44 touch target. The Tabs demo now adds a view
with an "Add view" button in the actions area instead of a tab.
