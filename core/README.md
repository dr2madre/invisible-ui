# @design-system/core

Framework-agnostic behavior and accessibility primitives for Invisible UI.
The core owns state models, keyboard interaction, ARIA semantics and DOM-shaped
prop bags; it does not render components or import a UI framework.

**Status: alpha and unpublished.** The package is currently private while
names, APIs and the release scope are finalized.

## Usage

Each primitive is exported as a namespace so its common names (`connect`,
`initialState`, types) do not collide with other primitives:

```ts
import { button } from "@design-system/core";

const state = button.initialState({ variant: "primary" });
const api = button.connect({
  state,
  onPress: () => console.log("Saved"),
});

// Apply this plain prop bag through an adapter or directly to the DOM.
console.log(api.rootProps);
```

Stateful primitives keep ownership outside the core. The adapter passes the
current state and setters into `connect()`, then recomputes the API when state
changes:

```ts
import { checkbox } from "@design-system/core";

let checked: checkbox.CheckedState = false;

const api = checkbox.connect({
  state: { checked, disabled: false },
  setChecked: (next) => {
    checked = next;
  },
});
```

## Adapter contract

- `rootProps`, `triggerProps`, `contentProps` and similar bags contain plain
  DOM-shaped attributes, event handlers and `data-*` state hooks.
- `normalize` lets each adapter translate those bags into framework-native
  property names and event conventions.
- `rootDomProps` covers live DOM properties that HTML cannot express as
  attributes, such as `HTMLInputElement.indeterminate`.
- The browser remains responsible wherever native controls already provide the
  correct semantics, keyboard behavior and form participation.

The Svelte, Vue, React and custom-elements adapters all consume this same
contract. See the repository's [API conventions](../packages/docs/src/content/docs/api.md)
and [adapter roadmap](../docs/adapters-roadmap.md) for the integration details.

## Build and tree shaking

The ESM build preserves source modules so consumers can tree-shake unused
primitives. The package declares `sideEffects: false` and ships a bundled type
entrypoint.

## Scripts

```text
pnpm --filter @design-system/core build
pnpm --filter @design-system/core test
pnpm --filter @design-system/core typecheck
```

Run `pnpm install` from the repository root first.
