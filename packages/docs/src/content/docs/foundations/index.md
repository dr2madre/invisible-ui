---
title: "Foundations (optional, customizable)"
---

This design system is **headless**: the primitives ship behavior and
accessibility, not visual styling. The foundations below are **recommended
defaults, not requirements** — an opt-in theme layer you apply *on top of* the
primitives through the `data-*` hooks they expose (e.g. `data-state`,
`data-disabled`).

They are inspired by Bitrock's [Amber Design System](https://amber.bitrock.it/)
(specifically [`@amber-ds/visual`](https://github.com/bitrockteam/amber-visual)),
but here everything is expressed as **overridable CSS custom properties**, so
you can keep them, retheme them, or ignore them entirely.

> Nothing here is bundled into `@design-system/core` or the adapters. Copy what
> you want into your app's global stylesheet and change the values freely.

The visual layer is documented in its own chapters:

- **[Color palette](/invisible-ui/presentation/color-palette/)** — the raw
  colors (HEX / OKLCH) and the per-hue scale.
- **[Tokens](/invisible-ui/presentation/tokens/)** — the two-tier token system
  (primitives → semantic roles), theme remapping and customizing.

## Typography

A **system font stack** adapts to the user's OS (native feel, no web-font
download, no layout shift):

```css
:root {
  --ds-font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", "Noto Color Emoji";
  --ds-font-mono:
    SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
}

body {
  font-family: var(--ds-font-sans);
}
```

Both stacks ship in the token layer (`tokens.css`) as `--ds-font-sans` (UI text)
and `--ds-font-mono` (code/numeric), so you can reference them directly.

**Responsive scaling (guideline).** Use a slightly smaller base size on small
screens and scale up at a medium breakpoint, so text is comfortable on mobile
and desktop:

```css
:root {
  --ds-font-size-base: 0.9375rem; /* 15px on small screens */
}

@media (min-width: 768px) {
  :root {
    --ds-font-size-base: 1rem; /* 16px from the medium breakpoint up */
  }
}
```

## Accessibility: contrast

Whatever palette you choose, text/background combinations must meet
**WCAG AA**: a contrast ratio of **4.5:1** for normal text and **3:1** for
large text or icon glyphs. This is a hard requirement for any styled output
(examples and the theme layer); the unstyled primitives carry no color and so
impose none. The shipped token defaults are verified by an automated contrast
test over `tokens.css` — see [Tokens](/invisible-ui/presentation/tokens/).

See also ADR 0001 (headless primitives) and ADR 0002 (tokens decoupled from
style) in the repository's `docs/adr/`.
