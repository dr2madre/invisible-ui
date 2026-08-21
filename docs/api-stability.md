# API stability

How changes to the public surface are classified and what a consumer can rely
on. The packages are private and unpublished; this policy still applies from
now on, so the discipline exists before the first release rather than after.

## What is public

- **Core**: everything importable from `@design-system/core` — the component
  namespaces (`connect`, `initialState`, their types), `normalizeProps`'
  contract (`Normalize`), `ElementProps`, `DomProps`, `i18n`.
- **Svelte**: the barrel (factories, Api/Context/State types, shared
  vocabularies, `normalizeProps`, the notifier) and the `*.svelte` subpath
  components with their documented props; `./tokens.css`.
- **Vue**: the barrel (components, `Props` types, `use*` composables) and
  `./styles.css`, `./tokens.css`.
- **Tokens**: the custom properties listed in the token catalog, at the
  stability each card states.
- **Styling hooks**: the documented `data-*` attributes.
- **Behavioural contracts**: ADR 0011 (state and callbacks), the commit
  boundary and validate-never-clamp rules, focus and keyboard behaviour as
  documented per component.

The React and Elements packages are proofs of concept: public to try, no
compatibility promise yet. Internal modules, undocumented class names and the
pixel output of the styled layer are not public surface.

## Change classification

- **Breaking**: removing or renaming any public export, token or documented
  `data-*` hook; changing a signature or type incompatibly; changing what a
  token points at in a way that alters relationships (a divider becoming a
  control boundary); changing documented behaviour (callback cardinality,
  commit boundaries, keyboard maps).
- **Minor**: additive exports, tokens, props with defaults, new components.
- **Patch**: value-only token adjustments that keep the documented
  relationships and contrast floors, bug fixes that restore documented
  behaviour, documentation.

The generated gates are the arbiters: a change is breaking if it removes or
alters entries in the committed API reports, the prop manifests or the token
registry, and additive if it only adds. The reports diff in review, so the
classification is visible before merge.

## Deprecation

A renamed or retired public name keeps resolving for at least one minor
release. It is marked deprecated where it is documented (the token catalog
shows the replacement on the card; code carries the note in its declaration),
and it is removed only in a major release — or, while everything is still
0.x-alpha, after at least one release cycle with the replacement available
and a migration note.

## Every public change carries a changeset

A pull request that changes an API report, a prop manifest or the token
registry includes a changeset describing the change at its classification.
The changeset is the migration note's home: what changed, why, before/after,
and the mechanical rewrite when one exists.
