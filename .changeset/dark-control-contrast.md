---
"@invisible-ui/svelte": patch
"@invisible-ui/react": patch
"@invisible-ui/vue": patch
"@invisible-ui/elements": patch
---

Dark now keeps the Light contrast with the page for the default and secondary
Button, the Toggle Button, the Toggle Group items and the selected Segmented
Control segment. The default Button and a resting toggle have no fill in either
theme. In Dark the default border is darker (`#595959`), the default label is
Grey 100, the secondary fill is darker and its border and label match the Light
contrast, and the pressed toggle and selected segment take a 16% selection fill
with the selection text colour as label.

New shared tokens: `--ds-components-general-background-action`,
`--ds-components-general-foreground-action`,
`--ds-components-general-background-selected` and
`--ds-components-general-foreground-selected`. New component tokens point at
them: `--ds-components-toggle-button-background-default`, `-background-selected`,
`-foreground-default` and `-foreground-selected`, and
`--ds-components-segmented-control-background-selected` and
`-foreground-selected`. `--ds-components-button-background-default` and
`--ds-components-button-foreground-default` point at the shared action tokens.
