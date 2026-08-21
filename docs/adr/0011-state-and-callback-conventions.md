# 11. Cross-adapter state and callback conventions

- **Status:** Accepted
- **Date:** 2026-08-21

## Context

Every component ships as a framework-neutral machine in `core/` plus thin
adapters ([ADR 0001](./0001-headless-vs-amber-web-components.md)). The machines
hold state that consumers may also want to own: an open flag, a selection, a
text value. Each framework has its own idiom for wiring that up, and without a
written rule the adapters drift: one fires a callback when a prop changes,
another loses a callback replaced after mount, a third silently rewrites data
the consumer owns. All three bugs existed and were fixed one by one; this ADR
records the contract those fixes converged on, so the next adapter starts from
the rule instead of rediscovering it.

## Decision

### Controllable mirror

Every stateful prop is a **controllable mirror**: the component works
uncontrolled (the prop seeds the initial state) and controlled (the prop is
reflected into the state whenever it changes) with the same wiring.

- **Reflection never emits.** Applying a prop change to internal state must not
  fire the change callback. Only a user action reports.
- **One action, one callback.** A single user action emits at most one call of
  one callback, unless a component documents an explicit exception.
- **No pruning.** Data the consumer owns through a controlled prop is never
  filtered, deduplicated or truncated by the component. A selection may
  reference rows that are filtered out, on another page, or no longer
  selectable: it is the consumer's data and it survives intact.
- **Give-back guard.** When a controlled parent echoes the reported value back,
  the reflection compares by content and does nothing, so controlled loops
  cannot churn.

How each adapter implements the mirror is idiomatic, and the behaviour must be
identical:

- **Svelte** tracks the last prop value (`let lastX`) and reflects only when
  the incoming prop differs from it — never by comparing against the store,
  which would push stale state back onto uncontrolled consumers.
- **Vue** watches the prop by identity and writes through a no-notify sync
  function on the composable.
- **React** reflects during render with state setters guarded by equality.

### Callbacks

- **Live replacement.** A callback swapped after mount is honoured: adapters
  pass callbacks through a live reference (an arrow wrapper in Svelte, a
  getter in Vue), never by capturing the function once at mount.
- **Naming.** The change callback for a prop `x` is `onXChange`. The shared
  prop vocabulary is `disabled`, `readOnly`, `invalid`, `required`, `open`,
  `value`, `defaultValue` across every adapter.

### Text and values

- **Commit boundaries.** A component that lets the user type a value keeps the
  draft and the committed value apart. The draft commits on blur, Enter, or a
  step action; Escape reverts the draft to the committed value, and swallows
  the key only when it actually undid something, so an enclosing dialog still
  receives the Escape that had nothing to undo.
- **Validate, never clamp.** Typed input is reported as typed, with its
  validity; the component does not rewrite what the user typed.
- **Explicit normalization.** Where equality is not trivial — locale numbers,
  arrays, `NaN`, nullish input — the machine defines the comparison in one
  place in `core/`, and adapters use it.

## Consequences

- A new adapter has a checklist instead of an archaeology project; the
  behaviour is testable in core once, and per-adapter tests only prove the
  wiring (reflection without callbacks, one action one callback, live
  replacement, give-back without churn).
- Controlled consumers can hold state anywhere (a store, a URL, a server)
  without the component fighting them.
- The contract is part of the public API: breaking any of these rules for a
  shipped component is a breaking change, whatever the version number says.
