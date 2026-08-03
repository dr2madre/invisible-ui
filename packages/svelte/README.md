# @design-system/svelte

Svelte adapter over the framework-agnostic
[`@design-system/core`](../../core). It carries the complete Invisible UI
catalog: 74 styled components plus headless factories for components with
shared behavior.

**Status: alpha and unpublished.** The package is currently private while
names, APIs and the release scope are finalized. The suite contains 762 tests,
including accessibility and server-rendering coverage.

## Usage

Styled components are available through explicit Svelte subpaths. Their styles
are component-scoped and use the shared `--ds-*` theme tokens.

```svelte
<script lang="ts">
  import Button from "@design-system/svelte/Button.svelte";
  import Checkbox from "@design-system/svelte/Checkbox.svelte";
  import Select from "@design-system/svelte/Select.svelte";

  let subscribed = false;
  let fruit: string | null = null;
  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
</script>

<Checkbox bind:checked={subscribed} label="Subscribe" name="subscribed" />
<Select bind:value={fruit} label="Fruit" items={fruits} name="fruit" />
<Button variant="primary" onpress={() => console.log("Saved")}>Save</Button>
```

Import `@design-system/svelte/tokens.css` when using the shared theme outside
component-scoped styles.

For a runnable integration, see [`examples/svelte`](../../examples/svelte).

## Headless factories

The package root exports the framework adapter's headless factories. Each
factory wraps a core primitive and returns reactive state plus Svelte actions
that apply the connected prop bags to real DOM elements.

```svelte
<script lang="ts">
  import { createButton } from "@design-system/svelte";

  let presses = 0;
  const { rootAction } = createButton({
    onPress: () => (presses += 1),
  });
</script>

<button use:rootAction>Pressed {presses} times</button>
```

## Localization and RTL

English labels work without setup. Wrap a subtree in `LocaleProvider` to set
locale metadata, writing direction or message overrides:

```svelte
<script lang="ts">
  import LocaleProvider from "@design-system/svelte/LocaleProvider.svelte";
  import Select from "@design-system/svelte/Select.svelte";

  let value: string | null = null;
  const messages = { "select.placeholder": "Scegli…" };
</script>

<LocaleProvider locale="it" dir="ltr" {messages}>
  <Select bind:value label="Frutto" items={[{ value: "apple", label: "Mela" }]} />
</LocaleProvider>
```

Explicit component label props override catalog defaults.

## Current constraints

- The package is ESM-only and currently private/unpublished.
- Every component fixture is rendered in a DOM-free Node test to keep the
  public surface safe during SSR.
- The styled components use scoped CSS; shared custom properties remain the
  theming contract across adapters.

## Scripts

```text
pnpm --filter @design-system/svelte build
pnpm --filter @design-system/svelte test
pnpm --filter @design-system/svelte typecheck
```

Run `pnpm install` from the repository root first.
