# @design-system/elements

Web Components adapter over the framework-agnostic
[`@design-system/core`](../../core): framework-free custom elements for
contexts **without** a framework — plain HTML pages, server-driven stacks
(HTMX, LiveView, Hotwire, Livewire) and legacy portals. Framework users should
prefer their native adapter (`@design-system/svelte`, `@design-system/react`).

**Status: proof-of-concept** (ADR 0008) — twelve components: Button, Checkbox,
Switch, Select, Combobox, Dialog, Label, Field, TextField, Textarea,
RadioGroup, CheckboxGroup. The first six match the React PoC; the forms core
that follows them has no React counterpart yet.

Both JavaScript entrypoints are safe to import during SSR. The server emits
declarative `<ds-*>` light-DOM markup; when `@design-system/elements/define`
loads in the browser, the elements upgrade that existing content in place.

## Usage — no build step required

```html
<link rel="stylesheet" href=".../@design-system/elements/styles.css" />
<script type="module" src=".../@design-system/elements/define.js"></script>

<ds-button variant="primary">Save</ds-button>

<ds-select label="Fruit" name="fruit">
  <option value="apple">Apple</option>
  <option value="fig" disabled>Fig</option>
</ds-select>

<ds-dialog heading="Share this file" trigger="Share…">
  <p>Anyone with the link can view it.</p>
</ds-dialog>
```

The dist is **self-contained** (core and Floating UI bundled), so a script tag
is genuinely enough. In a bundled app, import selectively instead:

```js
import { DsButton } from "@design-system/elements";
customElements.define("ds-button", DsButton);
```

## Design decisions (ADR 0008)

- **Light DOM, not Shadow DOM.** The elements render real markup in the page's
  tree — the same native-first stance as ADR 0003/0005: a real
  `<input type="checkbox">` participates in real forms (no ElementInternals
  machinery), real labels associate, the shared stylesheet applies with no
  boundary to pierce, and server-rendered HTML upgrades in place (no
  Declarative Shadow DOM needed). Style encapsulation is by class namespacing
  (`.checkbox__input`, …), exactly like the other adapters.
- **Items are `<option>` children.** `<ds-select>`, `<ds-combobox>`,
  `<ds-radio-group>` and `<ds-checkbox-group>` read their options from
  light-DOM `<option>` elements — the most HTML-native API possible, ideal for
  server-rendered fragments — or from an `items` property. The children are
  declarative *initial state*: they are read once and consumed, so rewriting
  them later changes nothing. Replace the set through `items`.
- **Events are bubbling `CustomEvent`s** with a typed `detail`: `change`
  (`{value}` / `{checked}`), `input-change`, `open-change`. The native inner
  `change` is stopped so listeners never receive doubles.
- **`heading`, not `title`.** The global HTML `title` attribute is a browser
  tooltip, so `<ds-dialog>` names its title `heading`.
- **Attributes in, properties too**: attributes are the declarative API
  (`checked`, `value`, `open`, `disabled` — observed and reflected);
  `checked` / `value` / `open` / `items` also exist as JS properties.
- **Every documented attribute is live.** Rewriting an attribute on a mounted
  element updates it, which is what the server-driven stacks above actually do.
  Two exceptions are deliberate and documented at the source: `field-id` on
  `<ds-field>` is read once, because every part id derives from it; and
  `aria-label` on `<ds-button>` moves to the inner button, so it can be set
  and changed through the host but not cleared through it.

## Habitats

`examples/elements/` proves the three consumption habitats:

- `index.html` — plain HTML, script tag, zero build (verified in a real
  browser).
- `vue.html` — a Vue app consuming the elements with plain attributes and
  `@change` CustomEvents (`isCustomElement: tag => tag.startsWith("ds-")`).
- `htmx.html` — an HTMX page swapping in a server-rendered fragment
  (`fragment.html`); the elements upgrade on arrival.

## Tests

126 tests across 14 files: component tests (jsdom, Testing Library, axe on
every component), a CSS parity suite over 13 sheets, two Node import checks and
a browser upgrade test for server-rendered light DOM. The parity suite keeps
the stylesheets byte-identical to the React adapter's, and to the Vue
adapter's where React has no counterpart:

```sh
pnpm --filter @design-system/elements test
```
