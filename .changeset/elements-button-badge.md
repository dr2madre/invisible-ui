---
"@design-system/elements": minor
"@design-system/react": patch
"@design-system/vue": patch
---

`<ds-button>` takes a badge: a `<ds-count slot="badge">`, number or status
dot, on the button's corner. It renders beside the button rather than inside
it, so an icon button keeps its own name and the count describes it
(`aria-describedby`). The shared button stylesheet carries the badge
placement, mirrored in right-to-left layouts.
