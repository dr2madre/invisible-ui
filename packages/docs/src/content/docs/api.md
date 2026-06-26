---
title: "API"
description: "Shared API conventions for the headless components: the core/adapter model, prop getters, data-* hooks, ARIA, and theming."
---

How the library's API is shaped — the conventions that hold **across every
component**. The API of a *specific* component (its props, slots and events)
lives on that component's own page under **Components**.

## The headless model

Behaviour, state and accessibility live once in the framework-agnostic core
(`@design-system/core`); thin per-framework adapters expose it idiomatically.

- **Core** — each component is a pure **state** plus a `connect()` function that
  returns framework-agnostic **prop getters**: plain objects carrying ARIA
  attributes, `data-*` styling hooks and event handlers. The core never imports a
  framework and never touches the DOM.
- **Adapter** (e.g. Svelte) — wraps the state in a store and applies the
  connected props to real elements. You bring the markup and the styling.

## Svelte adapter: `create*` + actions

Each component exposes a `create*` factory returning Svelte **actions** (and
reactive stores). Apply an action to your element with `use:`; it keeps the
element's attributes, ARIA and event listeners in sync with state.

```svelte
<script>
  import { createCollapsible } from "@design-system/svelte";
  const { rootAction, triggerAction, contentAction, open } =
    createCollapsible({ open: false });
</script>

<div use:rootAction>
  <button use:triggerAction>Toggle</button>
  <div use:contentAction>Content</div>
</div>
```

The **styled** components are imported from their own module
(`@design-system/svelte/<Component>.svelte`); the headless `create*` functions
come from the package root (`@design-system/svelte`).

## `data-*` styling hooks

Style components by targeting the `data-*` attributes the prop getters set —
never internal classes. The recurring hooks:

| Hook | Meaning |
| --- | --- |
| `data-state` | the component's discrete state — e.g. `open`/`closed`, `checked`/`unchecked`, `on`/`off`, `selected` |
| `data-disabled` | present (empty string) when the element is disabled |
| `data-orientation` | `horizontal` / `vertical` |
| `data-active` | the active/highlighted item (e.g. combobox option, roving focus) |
| `data-value` | an item's value, used to scope behaviour and focus |

```css
.switch[data-state="checked"] { background: var(--ds-color-primary-500); }
.switch[data-disabled] { opacity: 0.5; }
```

## Accessibility

Components implement the relevant
[WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) pattern: correct
roles and attributes, full keyboard support, focus management, and roving
tabindex where applicable. Interactive demos are checked with `vitest-axe`. Any
control that needs an accessible name takes it from the consumer (a `label` prop,
`aria-label`, or an associated `<label>`).

## Normalisation

Adapters supply a `normalize` function that maps the generic prop bag into
framework-native props. The Svelte adapter applies props to the DOM directly via
its `use:` action, so normalisation is the identity — the same prop getters can
back other frameworks by remapping keys.

## Theming

Components ship **no opinionated visual styling**. The styled layer is themed
entirely through `--ds-*` CSS custom properties, so everything follows the
light/dark theme and stays re-themeable. See **Foundations** for the token
system (color scale, typography, contrast).
