---
"@nozcadesign/invisible-ui-core": minor
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
---

A portalled popup takes the direction of the control that opens it, so a
`dir` on a plain wrapper around the control counts, with or without a locale
provider. Svelte and React read it each time the popup opens, Vue on each
render of the overlay; the custom elements keep their popups inside the
element, which already inherit it. The core adds `i18n.elementDirection`.
