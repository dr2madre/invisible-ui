# @design-system/react

React adapter over the framework-agnostic [`@design-system/core`](../../core).

**Status: in scope for the full catalog.** The adapter started as the proof
of concept that showed the core drives a second framework. It is being
completed to the full catalog, like the Svelte, Vue and custom elements
adapters, and carries 33 components today: Button, Checkbox, Switch,
TextField, SearchField, Select, Combobox, MultiSelect, the dialog family
(Dialog, AlertDialog, ConfirmDialog, PromptDialog, SheetDialog and
SearchDialog), the overlays and menus (Popover, Tooltip, DropdownMenu,
ContextMenu, Menubar and NavigationMenu), the value controls (Radio,
RadioGroup, CheckboxGroup, SegmentedControl, ToggleButton, ToggleGroup,
Slider, RangeSlider, NumberField, PinInput and RatingGroup), Icon and
LocaleProvider. See item 14 in
[`docs/technical-roadmap.md`](../../docs/technical-roadmap.md) and the
history in [`docs/adapters-roadmap.md`](../../docs/adapters-roadmap.md).

The tests include dedicated server-rendering and hydration coverage for
every public renderable export.

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
  focus restore, in an effect gated on `open`. The rest of the dialog family
  runs on it: the Alert, Confirm and Prompt presets share one shell,
  `useSheetDialog` adds the edge drag (written to the panel's transform, not
  rendered) and `useSearchDialog` wires the headless combobox inside it.
- **The menus** (DropdownMenu, ContextMenu, Menubar) share one internal layer
  over the core `menu` and `menubar` modules: roving focus, typeahead per
  level, and the submenus of `docs/menu-submenu-spec.md`, with the 100 ms
  hover delay, the grace area and placement by `menu.placeSubmenu`. Each
  open submenu stays inside the root popup, so its keys reach the root and an
  outside press sees one tree. Closing by a key or an activation moves focus
  back before `onSelect` runs.
- **`usePopover`, `useHoverPreview`, `useTooltip` and `useNavigationMenu`**
  own positioning (Floating UI), the hover delays and outside-press and
  focus-leave dismissal. Every overlay portals into the dialog its trigger
  sits in, else into the body (ADR 0016).
- **The value controls** keep the browser's own controls underneath: native
  radios for RadioGroup, SegmentedControl and RatingGroup (one
  `useRadioGroup`), native boxes for CheckboxGroup and ToggleButton, native
  ranges for Slider and RangeSlider. `useNumberField` and `usePinInput` drive
  text inputs through the core. Each writes the DOM default a form reset
  restores and puts its own value back after the reset (ADR 0012). The
  standalone Radio leaves its input uncontrolled: the radios of one name sit
  in separate components, and only the browser sees all of them.
- Components are **controlled-friendly**: passing a changed `checked` mirrors it
  into internal state during render (no effect, no double render).

The hooks are exported, so you can render your own markup and keep only the
behaviour.

## SSR and hydration

Every public component renders in a Node environment without accessing the
DOM, and the dialogs render open there too. A browser test then hydrates the
same public surface, closed and open dialogs and open overlays included, and
fails on React hydration mismatches or recoverable errors.
The Combobox and the overlays render their body-level portals only after
hydration, keeping the server and initial client trees identical before
moving the popup into its runtime layer.

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
