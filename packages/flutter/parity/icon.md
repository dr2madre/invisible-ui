# Icon parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `packages/svelte/src/lib/icon`

The Svelte `Icon` (`packages/svelte/src/lib/icon/Icon.svelte`) checked
against what Flutter already ships.
Docs page: [Icon](https://dr2madre.github.io/invisible-ui/components/formatting-display/icon/).

**Not ported.** The widgets library has an `Icon` of its own, which every
app already imports with `package:flutter/widgets.dart`, and the package's
components take their icons as widgets, sized and coloured by the
`IconTheme` they set. A package widget of the same name would clash with it
in every file that uses both. The web component's behaviour maps to the SDK
widgets:

```dart
Icon(
  const IconData(0xe145, fontFamily: 'AppIcons'),
  semanticLabel: 'Add', // null keeps it decorative, as on the web
)
```

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Sized `1em`, following the surrounding text | out of scope | the SDK `Icon` takes its size from `IconTheme`, which each component sets from its text size, with `applyTextScaling` |
| Coloured `currentColor` | out of scope | `IconTheme.color`, which each component sets |
| Decorative by default; `label` makes it an image with a name | out of scope | the SDK `Icon` adds no semantics without `semanticLabel`, and names itself with one |
| A 24 by 24 stroked SVG wrapper for any icon set | out of scope | any widget is an icon: an icon font through `IconData`, or a drawing; the package bundles no icon font (ADR 0017) |
| `animation: "spin"` and `"pulse"`, still under reduced motion | out of scope | work in progress is `Loading`, which spins and stands still under reduced motion; an app animates its own icon with the SDK's transitions |
