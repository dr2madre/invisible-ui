# 6. The Python adapter wraps the React components

- **Status:** Accepted
- **Date:** 2026-08-02

## Context

Technical-roadmap item #6 asks for adapters beyond Svelte to prove the
framework-agnostic core. React shipped first (`packages/react`). For Python,
the field splits into two families:

- **Server-side UI frameworks** (FastHTML, NiceGUI, Streamlit/Dash) render
  markup on the server. They could emit the accessible *static* HTML, but every
  interactive behaviour in this design system — keyboard navigation, focus
  management, `aria-activedescendant`, popup positioning, the `<dialog>`
  lifecycle — lives in the TS core and runs **in the browser as JavaScript**.
  A server-side target would need that whole layer re-implemented or a JS
  runtime bolted on.
- **Reflex** compiles Python to React. A component is a thin `rx.Component`
  subclass naming an npm `library` and a `tag`; Python wires state to props and
  events back to handlers, and the referenced React component runs unchanged in
  the browser.

## Decision

The Python adapter is **Reflex wrappers over `@design-system/react`**
(`packages/reflex`, importable as `invisible_ui`). Each PoC component is an
`rx.Component` subclass with typed vars mirroring the React props (snake_case →
camelCase; `button_type` renamed to React's `type`) and `rx.EventHandler`
triggers for the callbacks. Every wrapper imports
`@design-system/react/styles.css`, so tokens and styling follow automatically.

Nothing is re-implemented in Python — no second `connect()`, no duplicated
behaviour. The wrappers' tests assert only the Python layer's job (right tag,
right props, right triggers, right imports); behaviour remains covered by the
React package's own suite.

## Consequences

- Full client behaviour (keyboard, focus, dynamic ARIA) comes for free and can
  never drift from the React adapter — it *is* the React adapter.
- The constraint is explicit: a server-side-only Python target is out of scope.
  If one is ever wanted, it is a new ADR, not an extension of this one.
- The wrappers inherit React's release cadence: a React prop rename is a
  Python-visible change. The render tests catch the wiring half of that.
- Until `@design-system/react` is published to npm, a consuming Reflex app must
  make the package resolvable itself (tarball via `npm pack`, local registry,
  or a workspace link) — documented in the package README.
