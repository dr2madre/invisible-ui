---
"@design-system/elements": minor
"@design-system/core": minor
"@design-system/react": minor
"@design-system/svelte": minor
"@design-system/vue": minor
---

The custom elements are localized through the shared message catalog.

**`<ds-locale-provider>`** sets the locale (`locale`), the writing direction
(`dir`) and message overrides (the `messages` property) for every element
inside it, and writes `lang` and `dir` on itself. The closest provider wins.
Without one, an element reads the closest `lang` attribute, then English.
Changing `locale`, `dir` or `messages` renders the labels again.

Every default label now comes from the catalog: dialog close buttons and
triggers, the search field, the search dialog and its results count, the
sidebar, pagination, combobox, multi select, select, switch, tag, tree view,
table set, breadcrumb, loading, inline notification, upload drop area,
avatar group and login form. Labels that could not be changed before (the
login form's field labels, its divider and provider buttons, the avatar
group's overflow name, the table's view switch, the combobox's options
button and the multi select's selected values list) can now be translated.
A label attribute on an element still wins over the catalog.

New catalog keys in the core: `avatarGroup.more` (a plural message),
`loginForm.email`, `loginForm.emailPlaceholder`, `loginForm.password`,
`loginForm.divider`, `loginForm.provider`, `table.view`, `table.viewTable` and
`table.viewCards`.

The Svelte, Vue and React adapters re-export the catalog as `en`, so they
carry the new keys too; their components are unchanged.
