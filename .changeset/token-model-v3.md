---
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Breaking: reorganize the token source into `palette`, `brand`, `feedback`,
`metrics`, `typography` and `components`, with shared component values under
`components.general`. Palette names now identify the color family. The generated
CSS variables follow these paths: for example, replace
`--ds-colors-palette-grey-500` with `--ds-palette-grey-500` and
`--ds-colors-brand-primary-default` with `--ds-brand-primary-default`.
Replace old component and role paths with their v3 equivalents in
`packages/tokens/migration-v3.json`; update direct DTCG references in the
same way. The button hover and Switch styling now follow the approved shared
tokens.
