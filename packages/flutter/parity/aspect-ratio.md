# AspectRatio parity checklist

Reference commit: `e32e67cd2cc2fb993c9758007c27026cafc20420`

Reference paths: `packages/svelte/src/lib/aspect-ratio`

The Svelte `AspectRatio`
(`packages/svelte/src/lib/aspect-ratio/AspectRatio.svelte`) checked against
what Flutter already ships.
Docs page: [Aspect Ratio](https://dr2madre.github.io/invisible-ui/components/formatting-display/aspect-ratio/).

**Not ported.** The widgets library has an `AspectRatio` of its own, which
every app already imports with `package:flutter/widgets.dart`. A package
widget of the same name would clash with it in every file that uses both,
and a renamed one would add a name for what the SDK does. The web
component's behaviour maps to the SDK widgets one to one:

```dart
AspectRatio(
  aspectRatio: 16 / 9,
  child: ClipRRect(
    borderRadius: BorderRadius.circular(radius), // --ds-aspect-ratio-radius
    child: Image(image: photo, fit: BoxFit.cover),
  ),
)
```

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Holds its content to `ratio` | out of scope | the SDK's `AspectRatio(aspectRatio:)` |
| Full width of the container | out of scope | the SDK widget takes the width its parent gives |
| Clips its content; optional radius | out of scope | `ClipRRect` |
| Images and video fill the box (`object-fit: cover`) | out of scope | `BoxFit.cover` |
| Presentational, no role | out of scope | the SDK widget adds no semantics |
