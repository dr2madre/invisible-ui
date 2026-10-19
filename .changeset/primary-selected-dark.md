---
"@invisible-ui/svelte": patch
"@invisible-ui/react": patch
"@invisible-ui/vue": patch
"@invisible-ui/elements": patch
---

In Dark the brand primary is Purple 500 mixed 62% with Grey 50 (`#a990dc`),
with a 50% mix on hover, and the label on the primary fill is Black. It reads
on the Black page at 6.88:1, and its label at 6.88:1.

Every selected, checked, current or on part now points at the primary selected
colour, `--ds-components-general-selection-background-default`, or at a token
derived from it, in place of the secondary or primary action colour: Tabs,
Checkbox, Checkbox Group, Radio, Switch, Calendar, Date Picker, Date Range
Picker, Pagination, Navigation Menu, Sidebar, Table, Table Set, Tree View, Tag,
Stepper, Rating Group, Slider, Range Slider, Carousel, Time Field and Upload
Drop Area. The Switch thumb takes the label colour on the selected fill when on.
`--ds-components-general-selection-foreground-default` now points at
the label on the primary fill, so a label on a solid selected fill is Black in
Dark. Links and the focus ring keep their own colours.
