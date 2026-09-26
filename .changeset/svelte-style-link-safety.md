---
"@design-system/svelte": patch
---

Consumer data can no longer add style declarations: a Carousel slide image is
set as one quoted URL, and an Avatar Group colour that would close its
declaration is dropped. A Link that opens a new tab through a plain `target`
attribute now gets `rel="noopener noreferrer"` too.
