---
"@nozcadesign/invisible-ui-core": patch
"@nozcadesign/invisible-ui-svelte": patch
"@nozcadesign/invisible-ui-vue": patch
"@nozcadesign/invisible-ui-react": patch
"@nozcadesign/invisible-ui-elements": patch
---

A filtered table announces its result count politely when filtering changes
it, in Svelte, Vue and React as in the custom elements: a live region outside
the table says "3 results", and stays silent on the first render, on an
unchanged count and on rows that arrive with no filtering behind them. The
no-results state is announced once, by its status. The decision is
`table.tableResultsUpdate` in core, which the custom element now uses too.
