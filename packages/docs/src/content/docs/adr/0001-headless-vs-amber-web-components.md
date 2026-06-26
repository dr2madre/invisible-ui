---
title: "1. Headless primitives instead of Amber-style styled Web Components"
---

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

Bitrock already maintains the **Amber Design System** (GitHub org
`bitrockteam`):

- [`@amber-ds/components`](https://github.com/bitrockteam/amber-components) —
  **styled Web Components** (Custom Elements + Shadow DOM, TypeScript,
  Lit / lit-html, SASS, Webpack, Storybook, Jest).
- [`@amber-ds/visual`](https://github.com/bitrockteam/amber-visual) —
  styleguide and **design tokens** (SASS variables + CSS custom properties).
- [`amber-website`](https://github.com/bitrockteam/amber-website) — VuePress
  docs at [amber.bitrock.it](https://amber.bitrock.it/).

This project (`design-system`) targets the same goal — a Bitrock design
system — but takes the **opposite approach on the styling axis**. We need to
record why, so contributors understand we are not duplicating Amber.

## Decision

Build **headless, framework-agnostic primitives**: a `core/` package that owns
state, behavior, and accessibility (WAI-ARIA, keyboard, focus), plus thin
per-framework adapters (Svelte today; the core is ready for others). Visual
styling is **owned by the consumer** and attached through the `data-*` hooks
each primitive exposes. Accessibility is a first-class, non-negotiable pillar.

We deliberately **do not** ship visual tokens inside the primitives, and we do
not depend on Lit or Shadow DOM.

## Comparison: Amber vs. this design-system

| Aspect | Amber | This design-system |
| --- | --- | --- |
| Philosophy | Styled components | Headless (behavior + a11y only) |
| Multi-framework strategy | Native Web Components | Framework-agnostic `core/` + adapters |
| Core technology | Lit / LitElement, Shadow DOM | Plain TS core; Svelte store + action |
| Design tokens | Yes (`@amber-ds/visual`) | None by design (consumer styles) |
| Accessibility | WCAG AA contrast for color/type | First-class WAI-ARIA + axe in tests |
| Tooling | Webpack, Storybook, Jest | pnpm, Turborepo, tsup, Vitest, axe |
| Maturity | Mature, published to npm | Early (Button, Toggle) |

## Principles borrowed from Amber

Two Amber foundations are orthogonal to the styled-vs-headless split and are
adopted here (see `CONTRIBUTING.md`):

- **WCAG AA contrast target** — 4.5:1 for normal text, 3:1 for large text.
  Applies to styled output (examples / the optional theme layer), since the
  unstyled primitives carry no color.
- **Responsive-by-default** — primitives must work across viewport sizes and
  input modalities, inspired by Amber's responsive type scale.

## Optional theme layer

Amber's `@amber-ds/visual` shows the value of a shared token layer. We can
offer the same idea as an **opt-in, fully customizable** layer applied *on top
of* our headless primitives (font stack, color scale, …) without baking it
into the core. These recommended-but-overridable defaults are documented in
[`../foundations.md`](../foundations.md).

## Consequences

**Positive**
- Full styling freedom for consumers; no visual opinions to fight.
- Accessibility and behavior are written once in `core/` and shared.
- Small, framework-agnostic surface; new adapters are thin.

**Negative / trade-offs**
- Not "batteries included": consumers must bring styling (mitigated by the
  optional theme layer and examples).
- Conceptual overlap with Amber; this ADR exists to clarify the distinction.
- A theme layer, if added, must be maintained alongside the primitives.

## References

- [amber-components](https://github.com/bitrockteam/amber-components) ·
  [`@amber-ds/components` on npm](https://www.npmjs.com/package/@amber-ds/components)
- [amber-visual](https://github.com/bitrockteam/amber-visual)
- [amber-website](https://github.com/bitrockteam/amber-website) ·
  [amber.bitrock.it](https://amber.bitrock.it/)
