---
"@design-system/svelte": patch
---

The English default that components use without a `LocaleProvider` can no
longer be changed. Calling `set` on it did change the locale for every
component on the page, and on the server for every request. It now does
nothing; use a `LocaleProvider` to change the locale.
