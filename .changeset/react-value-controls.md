---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships the value controls: `Radio`, `RadioGroup`,
`CheckboxGroup`, `SegmentedControl`, `ToggleButton`, `ToggleGroup`, `Slider`,
`RangeSlider`, `NumberField`, `PinInput` and `RatingGroup`, with the markup,
classes and behaviour of the other adapters. Each value works controlled and
uncontrolled (ADR 0011): a changed prop reports nothing, a user action reports
once, and a parent echoing the value back changes nothing. Each control
submits with its form, and a form reset puts it back to the current default
without reporting (ADR 0012). The default labels (the stars, the PIN cells, the
spin buttons, the range thumbs' value text and the number messages) come from
the catalog. All of them render on the server and hydrate without mismatches.

Eight hooks render the same behaviour in markup of your own: `useRadioGroup`,
`useCheckboxGroup`, `useToggleButton`, `useSlider`, `useRangeSlider`,
`useNumberField`, `usePinInput` and `useRatingGroup`.

`styles.css` now includes the eleven sheets. They are the same files the Vue
and custom element packages ship, now held byte for byte to the React copies.

A bundle that imports one component no longer carries the others: the
`TextField`-only bundle drops from 9.99 kB to 6.04 kB. A text input or a range
also keeps its DOM default after the edit that changed it, where React had
written the edited value over it.
