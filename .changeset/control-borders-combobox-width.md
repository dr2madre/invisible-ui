---
"@invisible-ui/svelte": patch
"@invisible-ui/react": patch
"@invisible-ui/vue": patch
"@invisible-ui/elements": patch
---

Draw the Toggle Button, Toggle Group and Segmented Control borders with the
same colour as the default Button border. A pressed toggle takes the selection
colour mixed 70% with the background, so its border stands out more. The shared
decisions are the new `--ds-components-general-border-action` and
`--ds-components-general-border-selected` tokens, which
`--ds-components-button-border-default` and the new
`--ds-components-toggle-button-border-default`,
`--ds-components-toggle-button-border-selected`,
`--ds-components-toggle-group-border-default` and
`--ds-components-segmented-control-border-default` tokens point at.

In the fixed and fill width modes the Combobox input now takes the room the
control leaves after its icon and buttons. The hidden element that sizes the
control to its longest option now takes part in the layout only with
`width="wrap"`.
