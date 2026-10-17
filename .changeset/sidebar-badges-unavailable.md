---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Sidebar takes the Navigation Bar's destinations as they are, badges and
unavailable destinations included. A `badge` shows a count or a dot, after the
label or on the icon in the rail; its text is part of the item's name, and a
badge that appears or changes is announced politely once (`announce: false`
silences it), held while a modal dialog outside the sidebar is open (ADR 0016).
An `unavailable` item stays visible and focusable with its reason shown and
read as its description, and activating it does nothing. The rail marks the
current item with a bar at the inline start, so it never relies on colour.

The core's `navigationBar` gains `destinationProps`, the state and activation
of one destination that the bar and the Sidebar share, and
`createBadgeAnnouncer`, the badge comparison and the hold behind a modal that
every adapter's live region uses. The message catalog gains
`sidebar.unavailableTooltip` ("{label}: {reason}"), the rail's tooltip on an
unavailable item. The badge reads `--ds-sidebar-badge-surface` and
`--ds-sidebar-badge-text`.
