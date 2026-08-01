# @design-system/react

React adapter over the framework-agnostic [`@design-system/core`](../../core).

**Status: proof-of-concept.** Six components — Button, Checkbox, Switch,
Select, Combobox and Dialog — chosen to exercise the integration shapes an adapter has
to solve. The goal is to prove the core drives a second framework, not to reach
parity with the Svelte adapter. See
[`docs/adapters-roadmap.md`](../../docs/adapters-roadmap.md).

## Usage

```tsx
import { Button, Checkbox, Combobox, Dialog, Select, Switch } from "@design-system/react";
import "@design-system/react/styles.css";

function Example() {
  const [checked, setChecked] = useState(false);

  return (
    <>
      <Button variant="primary" onPress={() => save()}>
        Save
      </Button>
      <Checkbox label="Subscribe" checked={checked} onCheckedChange={setChecked} />
      <Switch label="Notifications" />
      <Select label="Fruit" items={[{ value: "apple", label: "Apple" }]} />
      <Combobox label="Fruit" items={[{ value: "apple", label: "Apple" }]} />
      <Dialog title="Share this file" trigger="Share">
        <p>Anyone with the link can view it.</p>
      </Dialog>
    </>
  );
}
```

Import `@design-system/react/tokens.css` alone if you style the components
yourself — it defines the `--ds-*` custom properties everything reads from.

## How it works

Each component is a thin layer over the core:

```
core.connect({ state, setters, normalize })  →  prop bags  →  spread onto JSX
```

- **`normalizeProps`** is the adapter seam. The core already emits React-style
  event keys (`onClick`, `onChange`, …), so it only renames the handful of DOM
  attributes React spells differently (`tabindex` → `tabIndex`) and drops
  `undefined` so React omits the attribute. React owns `aria-*` serialisation,
  so none of the `"true"`/`"false"` coercion the Svelte adapter needs.
- **`useButton` / `useCheckbox` / `useSwitch` / `useCombobox`** hold the resolved
  state and memoise `connect()`. Because the API is recomputed each render,
  handlers always close over current state — no event-listener bookkeeping.
- **`useCombobox`** additionally owns the DOM concerns the core deliberately
  leaves out: filtering, popup positioning (Floating UI), close-on-outside-pointer
  and scroll-into-view. DOM focus stays on the input; the highlight travels via
  `aria-activedescendant`.
- **`useDialog`** runs on the native `<dialog>` + `showModal()`, so the top
  layer, the inert background (a real focus trap) and `::backdrop` come from the
  browser. It adds only scroll lock, backdrop light-dismiss, `initialFocus` and
  focus restore, in an effect gated on `open`.
- Components are **controlled-friendly**: passing a changed `checked` mirrors it
  into internal state during render (no effect, no double render).

The hooks are exported, so you can render your own markup and keep only the
behaviour.

## Notes

- **Select does not use `core/select`.** Per
  [ADR 0003](../../docs/adr/0003-native-select-advanced-combobox.md) the Select
  is a styled **native** `<select>`: the browser owns the popup, keyboard,
  typeahead and the mobile picker. The headless primitive remains for consumers
  building a fully custom select.
- **Combobox is the advanced select.** When options need to be *drawn* (icons,
  rich content) or searched, reach for it instead of `Select`. With
  `searchable={false}` the input becomes a read-only trigger and the list never
  filters — a select-only combobox with a styled popup.
- **Button composes.** Extra props are forwarded to the underlying `<button>`,
  so an overlay can use it as a trigger by spreading `triggerProps`; a forwarded
  `onClick` is composed with the button's own press handler, not replaced.
- **CSS class names match the Svelte adapter** (`.button`, `.checkbox`,
  `.switch`, `.select__native`, …) so both adapters render the same design.
  Svelte scopes its styles; this package ships plain global CSS you opt into.
- **`tokens.css` is a copy** of the Svelte adapter's, kept byte-identical by
  `src/styles/tokens-parity.test.ts` so the two can't drift.

## Scripts

```
pnpm --filter @design-system/react build      # tsup → dist (ESM + d.ts)
pnpm --filter @design-system/react test       # vitest + @testing-library/react + axe
pnpm --filter @design-system/react typecheck
```
