# Loading Generation Area parity checklist

Reference commit: `5df411f6ee7583b84e5a6d5cbd113ff147043f7d`

Reference review (2026-10-18): checked the token-model change in the Svelte
reference. Behavior and accessibility markup did not change; CSS token names
changed, with resolved Light/Dark values checked by the token runtime tests.

Reference paths: `packages/svelte/src/lib/loading-generation-area`

The Flutter `LoadingGenerationArea` checked against the Svelte
`LoadingGenerationArea` (`packages/svelte/src/lib/loading-generation-area`).
It has no core module.
Docs page: [Loading Area](https://dr2madre.github.io/invisible-ui/components/feedback/loading-generation-area/).

Each line is **matched**, **adapted** (with the platform reason), **out of
scope** or **not yet verified**. Every matched line names the widget test in
`test/loading_generation_area_test.dart` that holds it.

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `loading` | `loading` | whether the process runs; false shows `child` |
| `label`, `decorative` | `label`, `decorative` | the region's name, the catalog's `loading.label` by default; hidden from assistive technology |
| `field` | `field` | the dot field |
| `labelPosition: LoadingAreaLabelPosition.center / top / bottom / start / end` | `labelPosition: "center" / "top" / "bottom" / "left" / "right"` | where the label zone sits |
| `status`, `value`, `detail` | the same | the zone's texts |
| `indicator`, `child` | the `indicator` and `children` snippets | the alternative loader, the result |

## Lines

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A polite live region named from the catalog | matched | `a polite live region named from the catalog; the dot field drifts` |
| The area fills its parent | matched | same test |
| The dot field drifts | matched | same test |
| A status names the region and is announced on each change | matched | `a status names the region and is announced on each change; the percentage and the detail show, unread` |
| The percentage (clamped, rounded) and the detail show and are not announced | matched | same test |
| The label zone placement | matched | same test (bottom); `start and end follow the reading direction` |
| `left` and `right` | adapted | the web places them with `start` and `end` alignment, so they follow the reading direction under physical names; Flutter names them `start` and `end` |
| The field and an indicator are alternatives | matched | `without the field an indicator takes its place; decorative hides it from assistive technology` |
| `decorative` hides the area from assistive technology | matched | same test |
| Under reduced motion the glows hold still | matched | `under reduced motion the glows hold still` |
| When loading ends the result fades in; at once under reduced motion | matched | `when loading ends the result fades in, at once under reduced motion` |
| A 6rem minimum height that grows with the zone | matched | `an open height takes the minimum, scaled with the text; text scale 2.0 right to left does not overflow` |
| The zone text contrast | matched | `the zone text meets the contrast guideline` |
| Dots of 1 and 2.5 pixels every 1.1rem, the glows' sizes, keyframes and easing | not yet verified | `_DotFieldPainter` takes the web stylesheet's values, the gap growing with the text as rem does; no visual baseline compares them yet (golden tests start later, ADR 0017) |
| The dots in `currentColor` | adapted | the colour of the surrounding `DefaultTextStyle`, the theme's text colour by default |
| `--ds-loading-generation-area-*` variables | out of scope | the web defaults; not asked for yet |
| Screen reader output on VoiceOver, TalkBack, NVDA | not yet verified | Assistive technology: not tested |
