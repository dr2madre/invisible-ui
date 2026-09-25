---
"@design-system/elements": minor
"@design-system/vue": patch
---

New `<ds-tab-panel for="tabs-id" value="…">`: a tab panel placed anywhere on
the page, outside its `<ds-tabs>`. Once a tabs element has an external panel it
renders the tab strip alone, so its height is the strip's and a header that
aligns a button beside the tabs lines it up with them. Tabs without external
panels keep rendering their own. The shared tabs stylesheet displays a panel
element as a block.
