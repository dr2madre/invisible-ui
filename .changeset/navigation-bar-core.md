---
"@design-system/core": minor
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Add `navigationBar` to the core: the landmark, list and destination props,
the arrow keys (mirrored under right to left, no wrap), `select` with one
report per activation and none for an unavailable destination, the spoken
name with badge, position and current marker, and the badge announcements
held while a modal dialog is open. The message catalog gains
`navigationBar.label` ("Main"), `navigationBar.position` ("Tab {index} of
{count}"), `navigationBar.current` ("current page") and
`navigationBar.announcement` ("{label}: {badge}").
