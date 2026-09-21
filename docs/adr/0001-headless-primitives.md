# 1. Headless primitives instead of styled Web Components

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

The common way to ship a multi-framework design system is a library of
**styled Web Components**: Custom Elements with Shadow DOM, usually built on
Lit, carrying their own tokens and stylesheets, published once and consumed
from any framework. It is a proven approach, and the obvious default.

This project targets the same goal, a design system every framework can use,
but takes the **opposite approach on the styling axis**. We need to record
why, so contributors understand the choice is deliberate.

## Decision

Build **headless, framework-agnostic primitives**: a `core/` package that owns
state, behavior, and accessibility (WAI-ARIA, keyboard, focus), plus thin
per-framework adapters (Svelte today; the core is ready for others). Visual
styling is **owned by the consumer** and attached through the `data-*` hooks
each primitive exposes. Accessibility is a first-class, non-negotiable pillar.

We deliberately **do not** ship visual tokens inside the primitives, and we do
not depend on Lit or Shadow DOM.

## Comparison: styled Web Components vs. this design-system

| Aspect | Styled Web Components | This design-system |
| --- | --- | --- |
| Philosophy | Styled components | Headless (behavior + a11y only) |
| Multi-framework strategy | Native Web Components | Framework-agnostic `core/` + adapters |
| Core technology | Lit / LitElement, Shadow DOM | Plain TS core; Svelte store + action |
| Design tokens | Shipped inside the components | None by design (consumer styles) |
| Accessibility | Varies; often contrast only | First-class WAI-ARIA + axe in tests |
| Maturity | Many mature libraries on npm | Early (Button, Toggle) |

## Principles kept

Two foundations are orthogonal to the styled-vs-headless split and are adopted
here (see `CONTRIBUTING.md`):

- **WCAG AA contrast target** — 4.5:1 for normal text, 3:1 for large text.
  Applies to styled output (examples / the optional theme layer), since the
  unstyled primitives carry no color.
- **Responsive-by-default** — primitives must work across viewport sizes and
  input modalities.

## Optional theme layer

A shared token layer has real value. We can offer the same idea as an
**opt-in, fully customizable** layer applied *on top of* our headless
primitives (font stack, color scale, …) without baking it into the core. These
recommended-but-overridable defaults are documented in
[`../foundations.md`](../foundations.md).

## Consequences

**Positive**
- Full styling freedom for consumers; no visual opinions to fight.
- Accessibility and behavior are written once in `core/` and shared.
- Small, framework-agnostic surface; new adapters are thin.

**Negative / trade-offs**
- Not "batteries included": consumers must bring styling (mitigated by the
  optional theme layer and examples).
- A theme layer, if added, must be maintained alongside the primitives.
