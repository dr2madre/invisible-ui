# @design-system/vue

Vue 3 adapter over the framework-agnostic
[`@design-system/core`](../../core). It carries the complete Invisible UI
catalog: the same 74 styled components available in the Svelte adapter, plus
native Vue composables for components with headless behavior.

**Status: alpha and unpublished.** The package is currently private while
names, APIs and the release scope are finalized. Vue `^3.4` is supported. Full
catalog parity landed across PRs #193–#199; the Vue suite currently contains
866 tests, including dedicated server-rendering and hydration coverage.

## Usage

Import the components you need and opt into the complete stylesheet:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Button, Checkbox, Dialog, Select } from "@design-system/vue";
import "@design-system/vue/styles.css";

const subscribed = ref(false);
const fruit = ref<string | null>(null);
const fruits = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
];

const save = () => {
  // Persist the form.
};
</script>

<template>
  <Checkbox v-model="subscribed" label="Subscribe" name="subscribed" />
  <Select v-model="fruit" label="Fruit" :items="fruits" name="fruit" />

  <Dialog title="Share this file" trigger="Share">
    <p>Anyone with the link can view it.</p>
  </Dialog>

  <Button variant="primary" :on-press="save">Save</Button>
</template>
```

Import `@design-system/vue/tokens.css` alone when rendering your own markup or
replacing the component styles. It defines the shared `--ds-*` custom
properties without loading every component stylesheet.

## Controlled values and `v-model`

Value components expose idiomatic `v-model` and retain explicit callbacks for
cross-adapter consistency. For example, these forms are equivalent:

```vue
<Checkbox v-model="checked" label="Subscribe" />

<Checkbox
  :checked="checked"
  label="Subscribe"
  :on-checked-change="(next) => (checked = next)"
/>
```

`v-model` takes precedence when both forms are supplied. Value controls emit
`update:modelValue`; named models use their matching event, such as
`update:open` for `v-model:open`. Components also call callbacks such as
`onCheckedChange`, `onValueChange` or `onOpenChange` when provided.

## Headless composables

The styled layer is optional. Composables expose the core's connected prop
bags as reactive computed values, so consumers can keep the behavior and
accessibility while owning all markup and styling:

```vue
<script setup lang="ts">
import { useButton } from "@design-system/vue";

const save = () => {
  // Persist the form.
};

const button = useButton({
  variant: "primary",
  onPress: () => save(),
});
</script>

<template>
  <button v-bind="button.rootProps">Save</button>
</template>
```

Stateful composables return an object containing a reactive `api` plus their
resolved state and any necessary template refs. For example,
`useCombobox()` returns `api`, filtered `items`, `open`, `value`, input/listbox
refs and popup-positioning styles.

## Localization and RTL

English labels work without setup. Wrap a subtree in `LocaleProvider` to set
locale metadata, writing direction or message overrides:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { LocaleProvider, Select } from "@design-system/vue";

const value = ref<string | null>(null);
const items = [{ value: "apple", label: "Mela" }];
const messages = {
  "select.placeholder": "Scegli…",
};
</script>

<template>
  <LocaleProvider locale="it" dir="ltr" :messages="messages">
    <Select v-model="value" label="Frutto" :items="items" />
  </LocaleProvider>
</template>
```

`LocaleProvider` uses Vue `provide`/`inject` and renders a wrapper carrying the
`dir` attribute. Explicit component label props always override catalog
defaults.

## How it works

Each headless composable wraps a core `connect()` call in Vue reactivity:

```text
core.connect({ state, setters, normalize }) → computed prop bags → Vue vnode
```

- `normalizeProps` adapts multi-word DOM handler names to Vue's vnode event
  convention and drops `undefined` values.
- `useDomProps` applies live DOM-only properties declared by the core, such as
  a checkbox's `indeterminate` state.
- Controlled props are mirrored with `watch`; connected APIs are recomputed so
  handlers always close over current state.
- Components use `defineComponent()` and `h()` render functions. No SFC
  compiler or Vue build plugin is required by the package.
- Popup positioning uses Floating UI. Dialogs use the native `<dialog>` and
  `showModal()` for the top layer and inert background.

See [ADR 0010](../../docs/adr/0010-vue-adapter.md) for the design decision and
the findings from the full port.

## Current constraints

- The package is ESM-only and currently private/unpublished.
- Every public component export is server-rendered in a DOM-free Node test.
  Representative stateful, overlay and date components are also rendered in a
  server runtime and hydrated in a separate client runtime without mismatches.
  Body-level Teleports stay in place through hydration and move after mount.
- `useMenubar` reads the structure of its menu list once during setup; item and
  disabled state remain reactive, but adding, removing or reordering top-level
  menus requires remounting it.
- Styles are global and opt-in. Class names match the other adapters so the
  same design tokens produce the same visual language.

## Scripts

```text
pnpm --filter @design-system/vue build
pnpm --filter @design-system/vue test
pnpm --filter @design-system/vue typecheck
```

Run `pnpm install` from the repository root first.
