---
"@design-system/vue": minor
---

Add `NavigationBar`: primary navigation between a few sections, a `<nav>`
around a list of links (`href`) or buttons (`onSelect`), `aria-current="page"`
on the application's `value`, unavailable destinations kept focusable with
their reason, and badges whose text is part of the name and whose changes are
announced politely, held while a modal dialog is open. The `unavailableIcon`
slot replaces the lock glyph.
