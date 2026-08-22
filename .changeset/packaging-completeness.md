---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The packed Svelte package becomes usable for what it advertises: the tarball
shipped the 79 component subpaths without the sibling modules they import
(124 unresolvable relative imports — the factories, the i18n helpers, the
internal utilities), so any bundling consumer of a `.svelte` subpath failed
to resolve. The package now ships the whole `src/lib` source tree, with a
nested `.npmignore` stripping tests and fixtures. The packed smoke gains a
resolve-all check that walks every shipped component's relative imports, and
the parity test files stop shipping in the Vue, React and Elements tarballs.
