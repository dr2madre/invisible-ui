# Adapter review: report

Review of 2026-09-27. Each adapter was checked on three axes: the framework's
best practices, simplification, and security (safe with untrusted data). Every
finding was verified in the code and fixed with a test that fails without the
fix. All fixes are merged on `main` (#400 to #412).

## Svelte

The reference adapter.

| Kind | Problem | Fix | PR |
| --- | --- | --- | --- |
| Security | Carousel and Avatar Group wrote image URLs and colours from data straight into the style attribute, so a crafted value could add declarations such as a full-screen overlay. | The image URL is quoted; a colour containing `;`, `{` or `}` is dropped. | #400 |
| Security | A Link that received `target="_blank"` as a plain attribute (Error State and Empty State actions) rendered without a safe `rel`. | `rel="noopener noreferrer"` follows the final target and is applied last. | #400 |
| Bug | Ten components read some props only at mount: a Slider mounted disabled stayed frozen, menus walked their first item list, Menubar ignored new menus. | Props changed after mount reach the factories (`syncConfig`, `syncItems` and similar). | #401 |
| Bug | Calendar and Avatar Group threw on two events or two people with the same label or name. | Keys include the position. | #401 |
| Simplification | Popup positioning and the outside-press listener were copied in four components; about 40 actions wrapped their store twice. | Shared `attachFloating`, `onOutsidePointerDown` and action helpers. The barrel went from 49.73 kB to 49.37 kB. | #403 |
| Security | The notification id counter was shared by every server request. | One counter per notifier. | #407 |
| Bug | Actions ignored a changed parameter; reduced motion was read once; the shared English i18n default could be changed by any request; child styles were forced with `:global`. | A shared `update()`, a live reduced-motion listener, a frozen default, custom properties. | #412 |

## Vue

| Kind | Problem | Fix | PR |
| --- | --- | --- | --- |
| Security | Carousel and Avatar Group had the same style injection as Svelte. Vue's server renderer writes style objects without escaping `;`, so it reached server output. | Same fix as Svelte. | #402, #405 |
| Security | Link lost its safe `rel` in the same way; the notification counter was shared across server requests. | Same fix as Svelte. | #405 |
| Bug | Popover and Hover Card mounted open got no positioning, dismissal or focus. | The watch also runs for a component that mounts open. | #405 |
| Bug | Progress and Meter ignored new ranges; Radio did not come back on a native form reset; Combobox showed no label when its items arrived after the value. | Range sync, the `checked` attribute, a label refresh on new items. | #405 |
| Bug | Repeatable keys in eight components; Menubar tied menu state to list position; reduced motion caused a server and client mismatch; infinite scroll stopped with the sentinel still in view. | Index-based keys, state keyed by value, a read after mount, a re-check after each load. | #405 |
| Simplification | Popup and outside-press code copied in Combobox and MultiSelect; menu typeahead duplicated; the iOS ghost-click guard missing from DatePicker, DateRangePicker and Menubar. | Shared helpers, the guard inside the composables. The barrel went from 74.89 kB to 74.66 kB. | #410 |

## React

The React adapter carries 11 of the 80 components, none of those that had
problems in Svelte and Vue. React 19 already blocks `javascript:` URLs, and
every id comes from `useId`: no security finding.

| Kind | Problem | Fix | PR |
| --- | --- | --- | --- |
| Bug | The React team's lint plugin was missing; once enabled it reported 12 findings, such as refs written during render. | `eslint-plugin-react-hooks` on every React source, findings fixed in code with one documented exception. | #404 |
| Bug | Combobox, MultiSelect and Dialog called `onValueChange` and `onOpenChange` inside state updaters: twice under StrictMode, sometimes during render. | Pure updaters; each change is reported once, after the write (ADR 0011). | #406 |
| Bug | Combobox showed no label when items arrived late; fixed English labels; popups kept their first width; MultiSelect stayed open when disabled. | Targeted fixes. | #406 |
| Simplification | Combobox and MultiSelect duplicated their popup and state plumbing line for line; glyphs were drawn by hand in several files. | Shared hooks and glyph components. | #409 |

## Custom elements and every adapter

| Kind | Problem | Fix | PR |
| --- | --- | --- | --- |
| Bug | Navigation Menu reopened by itself when a second click closed it during the 150 ms hover delay. This caused a flaky test. | Pending delays stop when the panel closes, in custom elements and Svelte. | #412 |
| Bug | Disabled menu triggers did not look disabled. | The core menu trigger emits `data-disabled` for every adapter. | #412 |
| Simplification | Deprecated names: Menu, the `-soft` colour tokens, old message keys. | Removed everywhere; the catalog is 80 components. | #411 |
| Security | Nothing told consumers that URLs are written as given. | A Security section in the docs API page, linked from the component pages. | #412 |

## Decisions recorded

- React is in scope for the full catalog (technical roadmap, item 14).
- A Flutter adapter comes after React, and an ADR comes before any adapter
  code. The proposal is in [`proposals/flutter-adapter.md`](./proposals/flutter-adapter.md) (#408).
- The packages stay unpublished.
- Work on an adapter follows its framework's best-practice skill in
  `.agents/skills/` (Svelte, Vue, React).

## Open

- Moving the Svelte adapter to runes syntax: recommended in three phases,
  not decided.
- The visual suite was not run locally for the CSS changes in #412.
