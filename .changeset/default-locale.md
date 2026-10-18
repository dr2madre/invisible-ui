---
"@invisible-ui/core": minor
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Without a locale from the app, components follow the page's language, then
international conventions. The order is: a component's `locale`, the Locale
Provider's, the page's `lang` (the closest ancestor in Elements, `<html lang>`
in Svelte, Vue and React), then `DEFAULT_LOCALE`, now `en-001-u-hc-h23`
instead of `en`: English messages with the ISO 8601 and CLDR world (001)
conventions. Weeks start on Monday, time fields use 24 hours, and a short
numeric date reads `2026-01-05`. Without a provider, the direction is the
page's `dir`, else `ltr`. A Locale Provider without `locale` takes the locale
around it.

Core adds `resolveLocale`, `pageLocale`, `subscribePageLocale` and
`hourCycleOf`; Time Field in Svelte and Vue now follows the locale's hour
cycle unless `hourCycle` is set, as React and Elements did. The server renders
with the default unless the provider gets `locale`; the browser renders its
first pass the same way, so hydration matches, then applies the page's `lang`.
