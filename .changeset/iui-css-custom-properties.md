---
"@nozcadesign/invisible-ui-svelte": minor
"@nozcadesign/invisible-ui-vue": minor
"@nozcadesign/invisible-ui-react": minor
"@nozcadesign/invisible-ui-elements": minor
---

Breaking: every public CSS custom property now starts with `--iui-` instead of
`--ds-`. The rest of each name, every value, every alias and both themes stay
the same. The old `--ds-*` names are removed with no fallback, so an override
written for 0.1.0-alpha.1 has no effect until it uses the new prefix.

To migrate, replace the `--ds-` prefix with `--iui-` in your overrides, for
example `--ds-components-button-radius` becomes
`--iui-components-button-radius`. `packages/tokens/migration-iui.json` lists
all 694 names with the old and new spelling, and the page "Migrate to --iui-"
in the documentation explains the change.

Class names, `<ds-*>` element tags, package names and component behaviour do
not change.
