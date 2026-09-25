---
"@design-system/elements": minor
---

Add `<ds-number-field>` and `<ds-pin-input>`, ported from the Svelte adapter with the same classes,
roles and stylesheets. The number field parses and formats in the element's locale and submits the
canonical ASCII value; the PIN input submits the combined code through a hidden input under `name`.
