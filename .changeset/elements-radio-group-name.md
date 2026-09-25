---
"@design-system/elements": patch
---

`<ds-radio-group>` without a `name` generates one, as the Svelte radio group
does, so its radios still form one group: only one can be checked and the
arrow keys move between them.
