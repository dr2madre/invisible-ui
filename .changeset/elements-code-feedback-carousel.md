---
"@design-system/elements": minor
"@design-system/react": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

Add `<ds-code>`, `<ds-code-block>`, `<ds-feedback-icon>` and `<ds-carousel>`,
ported from the Svelte adapter with identical classes and stylesheets.

**`<ds-code>`** wraps its children in a `<code>` element for inline code.

**`<ds-code-block>`** shows a preformatted sample from the `code` attribute or
property, always inserted as text. The block and its focusable scroller are
named groups, so several blocks stay off the landmark list. The copy button
copies the source and announces the copy through a polite status; set
`copyable="false"` to remove it and `copy-label` to rename it. Element children
render in place of the plain source for highlighted markup.

**`<ds-feedback-icon>`** draws the status glyph in a tinted, transparent or
solid box (`status`, `box`, `shape`). It is decorative until `label` names it.

**`<ds-carousel>`** follows the WAI-ARIA carousel pattern through the headless
core: "N of M" slides, previous and next buttons, slide-picker dots, `loop`,
and arrow keys along the `orientation`. It supports the `slide`, `gallery` and
`coverflow` layouts. Element children become the slides; without them the
`items` property draws built-in slides. A slide out of view is hidden and
inert. `change` reports `detail.index` after a user action. When the focused
arrow turns disabled at an end, the other arrow takes the focus.

Every default string comes from the shared catalog, and the label attributes
still win. New catalog keys in the core: `codeBlock.copyText`,
`codeBlock.copiedText`, `codeBlock.copied`, `codeBlock.label`,
`codeBlock.labelLanguage`, `codeBlock.sample`, `codeBlock.sampleLanguage`,
`carousel.slide`, `carousel.goTo`, `carousel.roleDescription` and
`carousel.slideRoleDescription`.

The Svelte, Vue and React adapters re-export the catalog as `en`, so they carry the
new keys too; their components are unchanged.
