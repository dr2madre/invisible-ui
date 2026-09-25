---
"@design-system/elements": minor
"@design-system/vue": patch
---

Tabs can be written as markup: `<ds-tabs>` is the root that holds the state,
and inside it, anywhere, a `<ds-tab-list>` of `<ds-tab value>` elements and
one `<ds-tab-panel value>` per tab. The strip can sit in a header beside other
controls, and a button placed there lines up with the tabs instead of with the
whole panel. The `items` form stays as the shortcut. The shared tabs
stylesheet displays the root and the panels as blocks.
