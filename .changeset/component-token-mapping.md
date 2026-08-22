---
"@design-system/svelte": patch
"@design-system/vue": patch
"@design-system/react": patch
"@design-system/elements": patch
---

The component-token tier gets its official mapping and its first defect
sweep. The registry now extracts every `var(--ds-*)` reference the theme
layer does not define — 403 knobs across 74 components — with the component,
the properties controlled, the adapters, every site, the shipped fallback and
the semantic role it follows; five gates hold the surface together (one knob
one value family, adapters must agree on defaults, colour knobs must reach a
role or carry a reviewed reason, prefixes cannot mint phantoms, notes cannot
outlive their token).

Confirmed defects fixed: the modal scrim was another design system's slate in
14 files and is now the project's darkest warm neutral at the same alpha; the
calendar range band was Tailwind blue and now follows the selection tint like
every other selected fill; the calendar price diverged between adapters in
dark; five knobs gained the missing role chain (calendar selected text,
feedback icon on solid, time-field focus text, meter optimal and poor fills —
poor moves from a foreign coral to the danger role); two internal runtime
variables that were never knobs move to the private `--_` prefix
(`--ds-slider-pct`, `--ds-tree-level`).
