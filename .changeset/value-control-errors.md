---
"@design-system/elements": minor
"@design-system/react": minor
"@design-system/svelte": minor
"@design-system/vue": minor
---

Slider, Range Slider, PIN Input, Rating Group and Toggle Button take an
`error` message (the `error` attribute on `<ds-slider>`, `<ds-range-slider>`,
`<ds-rating-group>` and `<ds-toggle-button>`; `<ds-pin-input>` already had
it). A non-empty message shows after the control as an alert with the hazard
glyph, the `field__error field__message` markup the text field uses, and
every focusable control names it in `aria-describedby`: the slider input,
both range thumbs, each PIN cell, each star and the toggle button. The slider
inputs and the PIN cells also take `aria-invalid`; the stars, the groups and
the toggle button do not. On the PIN input, the error also gives the cells
the invalid look of `invalid`.

The app owns the message: it passes it and clears it, and a form reset
leaves it in place. There is no validation hook.

In Vue, PIN Input and Toggle Button render the message beside their root
element, so their attributes now go on the group and the label by hand.
