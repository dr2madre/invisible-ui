# Browser support

The design system targets **evergreen browsers** — the last 2 versions of
Chrome, Edge, Firefox and Safari (desktop + mobile). It ships standard,
framework-agnostic DOM/ARIA and modern CSS; no polyfills are bundled.

## Baseline

| Feature | Used for | Min versions |
| --- | --- | --- |
| CSS logical properties (`inline-size`, `inset-block-…`) | layout + RTL | Chrome 89, Safari 15, Firefox 66 |
| `:focus-visible` | focus rings | Chrome 86, Safari 15.4, Firefox 85 |
| `aspect-ratio` | Aspect Ratio, media | Chrome 88, Safari 15, Firefox 89 |
| `color-mix()` | tinted status surfaces/borders | Chrome 111, Safari 16.2, Firefox 113 |
| `Intl.DateTimeFormat#formatRange` | Calendar / range pickers | Chrome 76, Safari 14.1, Firefox 91 |

Everything except `color-mix()` is comfortably within the last-2-versions
window. `color-mix()` is the newest; it has a **graceful fallback** (below), so
older browsers stay usable — they just lose the subtle hue tint.

## `color-mix()` fallback

The tinted feedback surfaces/borders (Alert, Notice, status tokens) are derived
with `color-mix()`. `tokens.css` includes an `@supports not (...)` block: where
`color-mix()` is unavailable, tinted **surfaces** fall back to a neutral surface
and **borders** to the solid feedback hue — so status is still conveyed.

## Notes

- No IE / legacy Edge support.
- Behaviour/ARIA is the platform's; styling is overridable CSS custom properties.
- If you must support older engines, transpile/autoprefix in your app build and
  provide your own `color-mix()` substitutes by overriding the `--ds-color-*`
  tokens.
