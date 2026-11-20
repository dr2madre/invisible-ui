---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-svelte": minor
"@nozcadesign/invisible-ui-vue": minor
"@nozcadesign/invisible-ui-react": minor
"@nozcadesign/invisible-ui-elements": minor
---

Add `navigationBar` to the core: the landmark, list and destination props,
the arrow keys (mirrored under right to left, no wrap), `select` with one
report per activation and none for an unavailable destination, the spoken
name with badge, position and current marker, and the badge announcements
held while a modal dialog is open. The message catalog gains
`navigationBar.label` ("Main"), `navigationBar.position` ("Tab {index} of
{count}"), `navigationBar.current` ("current page") and
`navigationBar.announcement` ("{label}: {badge}").
