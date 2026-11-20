---
"@nozcadesign/invisible-ui-core": patch
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-elements": patch
---

A table wider than its Table Set card scrolls inside the card instead of being
cut off. The card becomes a named region with `tabindex="0"` only while it
overflows, so the keyboard can scroll it and a table that fits adds no tab stop
(WCAG 2.2 1.4.10, 2.1.1). Core gains `scrollArea.observeInlineOverflow`, which
reports when a container's content becomes wider than the container.
