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
| Sized `1em`, following the surrounding text | adapted | the SDK `Icon` takes its size from `IconTheme`; `InvisibleTheme` sets one from the tokens (the base text size, with `applyTextScaling`), and each component sets its own from its text size: `sets the icon theme from the tokens, scaled with the text` (theme_test) |
| Coloured `currentColor` | adapted | `IconTheme.color`: the text colour role from `InvisibleTheme`, and each component's own: same test |
| Decorative by default; `label` makes it an image with a name | matched | the SDK `Icon` adds no semantics without `semanticLabel`, and names itself with one: `a decorative icon adds nothing to the semantics tree; a named one is an image with its name` (theme_test); an icon-only `Button` requires its `semanticLabel`. Assistive technology: not tested |
| A 24 by 24 stroked SVG wrapper for any icon set | out of scope | any widget is an icon: an icon font through `IconData`, or a drawing; the package bundles no icon font (ADR 0017) |
| `animation: "spin"` and `"pulse"`, still under reduced motion | out of scope | work in progress is `Loading`, which spins and stands still under reduced motion; an app animates its own icon with the SDK's transitions |
