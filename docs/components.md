# Component API reference

This is the API reference for the **styled layer** of the Svelte adapter. The
library is **headless**: behaviour, state and accessibility live in
[`@design-system/core`](../core) and are exposed through small `create*`
functions; each styled component is a thin Svelte wrapper around one of those
primitives. Styling is done entirely through `--ds-*` CSS custom properties, so
every component follows the light/dark theme out of the box and stays
re-themeable. For the project overview see the [README](../README.md), and
browse the live, interactive docs in
[Storybook](https://dr2madre.github.io/design-system/).

Styled components are imported from their own module
(`@design-system/svelte/<Component>.svelte`). The headless `create*` functions
and `createNotifier` come from the package root (`@design-system/svelte`).

## Table of contents

- [Button](#button)
- [ButtonGroup](#buttongroup)
- [ToggleButton](#togglebutton)
- [Toolbar](#toolbar)
- [Separator](#separator)
- [Switch](#switch)
- [Checkbox](#checkbox)
- [CheckboxGroup](#checkboxgroup)
- [RadioGroup](#radiogroup)
- [SegmentedControl](#segmentedcontrol)
- [Tabs](#tabs)
- [Accordion](#accordion)
- [Collapsible](#collapsible)
- [TextField](#textfield)
- [Textarea](#textarea)
- [Select](#select)
- [Combobox](#combobox)
- [Command](#command)
- [DropdownMenu](#dropdownmenu)
- [ContextMenu](#contextmenu)
- [Menubar](#menubar)
- [NavigationMenu](#navigationmenu)
- [Popover](#popover)
- [Tooltip](#tooltip)
- [HoverCard](#hovercard)
- [Dialog](#dialog)
- [AlertDialog](#alertdialog)
- [Sheet](#sheet)
- [Drawer](#drawer)
- [Alert](#alert)
- [FeedbackIcon](#feedbackicon)
- [CloseButton](#closebutton)
- [Notice](#notice)
- [NoticeRegion](#noticeregion)
- [Avatar](#avatar)
- [Icon](#icon)
- [Using custom icons (swap via slot)](#using-custom-icons-swap-via-slot)

## Using custom icons (swap via slot)

The components ship a sensible **default** icon, but they don't lock you into it.
Each icon is exposed through a **slot**, so you can drop in your own — a
[Lucide](https://lucide.dev/) component, a FontAwesome SVG, or any custom
`<svg>` — and it replaces the built-in one. This is how the system supports any
icon set **without bundling an icon font or a hard dependency** (see the
[README "Inspiration"](../README.md) for why we use SVG, not a font).

A "slot" is a placeholder inside a component where you insert your own markup.
"Swap via slot" simply means: *override the default icon by putting your icon in
that slot.*

### Icon — the standard wrapper for your own glyphs

[`Icon`](#icon) is the seam for using your own icon set. Drop the glyph shapes
(paths/lines) — from [Lucide](https://lucide.dev/), FontAwesome, or a custom
`<svg>` — into its default slot and they pick up the standard sizing (`1em`, so
they scale with the surrounding font-size), color (`currentColor`, so they
inherit text color), and accessibility:

```svelte
<script>
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<!-- A custom bell glyph; decorative by default -->
<Icon size="1.5rem">
  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</Icon>

<!-- Labelled (exposed as an image to assistive tech) -->
<Icon label="Add">
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</Icon>
```

If your icon is already a Svelte component (e.g. `lucide-svelte`), you can use it
directly — it's a standardized SVG too:

```svelte
<script>
  import { Bell } from "lucide-svelte";
</script>

<Bell />
```

### Button — the `left` / `right` slots

Components that draw an icon expose a slot to override it. `Button` has named
slots for its leading and trailing icons:

```svelte
<script>
  import Button from "@design-system/svelte/Button.svelte";
  import { Trash2 } from "lucide-svelte";
</script>

<Button variant="danger">
  <Trash2 slot="left" />
  Delete
</Button>
```

The same pattern applies wherever a component draws an icon (e.g. `Select`,
`FeedbackIcon`, `CloseButton`): provide the icon in the relevant slot to override
the default.

> Tip: icons inherit `color`, so to recolor one just set `color` on the icon (or
> a parent) — no icon-specific prop needed.

## Button

The styled, batteries-included button, carrying a semantic `variant` (what the action means, not a style).

### Import

```svelte
<script>
  import Button from "@design-system/svelte/Button.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "primary" \| "secondary" \| "ghost" \| "danger"` | `"default"` | Semantic emphasis, surfaced as `data-variant`. |
| `disabled` | `boolean` | `false` | Disable the button. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Native button type. |
| `onpress` | `((event: Event) => void) \| undefined` | `undefined` | Called when activated (click, or Enter/Space). |
| `iconOnly` | `boolean` | `false` | Square, icon-only button (pass one icon in the slot + an `ariaLabel`). The CloseButton is a preset of this. |
| `leftIcon` | `boolean \| undefined` | `undefined` | Show a leading icon. Defaults on for `danger`. |
| `rightIcon` | `boolean` | `false` | Show a trailing icon. |
| `ariaLabel` | `string \| undefined` | `undefined` | Accessible name; required for icon-only buttons. |

### Accessibility

- Every button needs an accessible name: visible text (default slot) or `ariaLabel` for icon-only buttons.
- `danger` shows a hazard icon by default, so meaning never relies on color alone (WCAG 1.4.1).
- Behaviour and a11y (focus, Enter/Space activation) come from the headless button.

### Example

```svelte
<Button variant="primary" onpress={() => save()}>Save changes</Button>

<!-- Icon button: square, icon-only, with an accessible name -->
<Button iconOnly variant="ghost" ariaLabel="Close" onpress={() => dismiss()}>
  <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
</Button>
```

Themeable via `--ds-button-*` (icon buttons: `--ds-button-icon-min`,
`--ds-button-icon-size`, `--ds-button-icon-padding`).

## ButtonGroup

Groups related action buttons into a labelled `role="group"`, optionally joined into one segmented bar.

### Import

```svelte
<script>
  import ButtonGroup from "@design-system/svelte/ButtonGroup.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the group. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Layout direction. |
| `attached` | `boolean` | `true` | Visually merge the buttons into one bar. |

### Accessibility

- Renders a labelled `role="group"` with `aria-orientation`.
- Holds no selection — each button stays an independent action and tab stop.

### Example

```svelte
<ButtonGroup label="Text alignment">
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
```

Themeable via `--ds-button-group-*`.

## ToggleButton

A button that is on or off (`aria-pressed`), suited to toolbars like text formatting.

### Import

```svelte
<script>
  import ToggleButton from "@design-system/svelte/ToggleButton.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pressed` | `boolean` | `false` | On/off state. |
| `disabled` | `boolean` | `false` | Disable the control. |
| `label` | `string \| undefined` | `undefined` | Accessible name; required when the slot is icon-only. |
| `onPressedChange` | `((p: boolean) => void) \| undefined` | `undefined` | Called whenever `pressed` changes. |

### Accessibility

- Exposes `aria-pressed` and `data-state="on" \| "off"`.
- Provide `label` when the slot content is icon-only so the control still has an accessible name.
- Distinct from `Switch`: a toggle button is an action, a switch is a setting.

### Example

```svelte
<ToggleButton label="Bold" onPressedChange={(on) => setBold(on)}>B</ToggleButton>
```

Themeable via `--ds-toggle-*`.

## Toolbar

A grouping container (`role="toolbar"`) for a set of related controls, with the toolbar keyboard pattern.

### Import

```svelte
<script>
  import Toolbar from "@design-system/svelte/Toolbar.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the toolbar. |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Navigation/layout direction. |
| `flat` | `boolean` | `false` | Borderless presentation: the controls inside lose their individual border/fill at rest (they read as one group, divided only by separators) with a subtle hover overlay. |

### Accessibility

- `role="toolbar"` with `aria-orientation`; a `label` is required.
- Single tab stop (roving tabindex); arrow keys move between controls (Left/Right horizontal, Up/Down vertical), plus Home/End with wrapping.

### Example

```svelte
<Toolbar label="Formatting">
  <ToggleButton label="Bold">B</ToggleButton>
  <ToggleButton label="Italic">I</ToggleButton>
  <Separator orientation="vertical" decorative />
  <Button ariaLabel="Add">+</Button>
</Toolbar>
```

Themeable via `--ds-toolbar-gap`.

## Separator

A thin visual divider between content or groups of controls.

### Import

```svelte
<script>
  import Separator from "@design-system/svelte/Separator.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Divider direction. |
| `decorative` | `boolean` | `false` | Hide from assistive tech (purely visual). |

### Accessibility

- Semantic by default: `role="separator"` with `aria-orientation`.
- Set `decorative` when it carries no meaning so it is hidden from assistive tech.

### Example

```svelte
<Separator orientation="vertical" decorative />
```

Themeable via `--ds-separator-*` (falling back to `--ds-color-border`).

## Switch

A WAI-ARIA switch (`role="switch"` + `aria-checked`) for instant on/off settings.

### Import

```svelte
<script>
  import Switch from "@design-system/svelte/Switch.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible, visible label; override with the default slot. |
| `checked` | `boolean` | `false` | On/off state. |
| `disabled` | `boolean` | `false` | Disable the control. |
| `onCheckedChange` | `((c: boolean) => void) \| undefined` | `undefined` | Called whenever the value changes. |

### Accessibility

- WAI-ARIA switch pattern; screen readers announce "on"/"off".
- A `label` is required (the control needs an accessible name); the visible text is tied to the control via `aria-labelledby`.

### Example

```svelte
<Switch label="Wi-Fi" checked onCheckedChange={(on) => setWifi(on)} />
```

Themeable via `--ds-switch-*`.

## Checkbox

The styled checkbox, with tri-state support (`true`, `false`, `"indeterminate"`).

### Import

```svelte
<script>
  import Checkbox from "@design-system/svelte/Checkbox.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible, visible label; override with the default slot. |
| `checked` | `CheckedState` (`boolean \| "indeterminate"`) | `false` | Checked state (tri-state). |
| `disabled` | `boolean` | `false` | Disable the control. |
| `onCheckedChange` | `((c: CheckedState) => void) \| undefined` | `undefined` | Called whenever the checked value changes. |

### Accessibility

- `role="checkbox"` with `aria-checked` (including `mixed`) and `data-state`; toggled by click and Space.
- A `label` is required; the visible text is tied to the box via `aria-labelledby`.

### Example

```svelte
<Checkbox label="Accept terms" onCheckedChange={(c) => setAccepted(c)} />
```

Themeable via `--ds-checkbox-*`.

## CheckboxGroup

A multi-select group of checkboxes (`role="group"` of `role="checkbox"` items).

### Import

```svelte
<script>
  import CheckboxGroup from "@design-system/svelte/CheckboxGroup.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `CheckboxGroupItem[]` | — (required) | Items (`{ value, label?, disabled? }`); `label` falls back to `value`. |
| `value` | `string[]` | `[]` | Selected values. |
| `disabled` | `boolean` | `false` | Disable the whole group. |
| `label` | `string` | — (required) | Accessible name for the group. |
| `onValueChange` | `((value: string[]) => void) \| undefined` | `undefined` | Called whenever the selection changes. |

### Accessibility

- Each item is independently Tab-focusable and toggled with Space; several can be checked.
- Supports per-item and whole-group `disabled`; the group needs an accessible `label`.

### Example

```svelte
<CheckboxGroup
  label="Toppings"
  value={["cheese"]}
  items={[
    { value: "cheese", label: "Cheese" },
    { value: "olives", label: "Olives" },
    { value: "anchovies", label: "Anchovies", disabled: true },
  ]}
  onValueChange={(v) => (selected = v)}
/>
```

Themeable via `--ds-checkbox-*`.

## RadioGroup

A single-select WAI-ARIA radio group with roving tabindex and arrow navigation.

### Import

```svelte
<script>
  import RadioGroup from "@design-system/svelte/RadioGroup.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `RadioGroupItem[]` | — (required) | Items (`{ value, disabled?, label? }`); `label` falls back to `value`. |
| `value` | `string \| null` | `null` | Selected value. |
| `disabled` | `boolean` | `false` | Disable the whole group. |
| `label` | `string` | — (required) | Accessible name for the group. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the selected value changes. |

### Accessibility

- WAI-ARIA radio pattern: roving tabindex, arrow/Home/End navigation, selection follows focus.
- Exposes `aria-checked` and `data-state` per item; the group needs an accessible `label`.

### Example

```svelte
<RadioGroup
  label="Plan"
  value="pro"
  items={[
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
  ]}
  onValueChange={(v) => (plan = v)}
/>
```

Themeable via `--ds-radio-*`.

## SegmentedControl

The radio-group semantics laid out as a horizontal bar of segments.

### Import

```svelte
<script>
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `SegmentedControlItem[]` | — (required) | Items (`{ value, disabled?, label? }`); `label` falls back to `value`. |
| `value` | `string \| null` | `null` | Selected value. |
| `disabled` | `boolean` | `false` | Disable the whole control. |
| `label` | `string` | — (required) | Accessible name for the control. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the selected value changes. |

### Accessibility

- Shares the WAI-ARIA radio semantics (roving tabindex, arrow navigation).
- The control needs an accessible name via `label`.

### Example

```svelte
<SegmentedControl
  label="View"
  value="list"
  items={[
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
  ]}
  onValueChange={(v) => (view = v)}
/>
```

Themeable via `--ds-segment-*`.

## Tabs

A WAI-ARIA tabs widget: a tablist linked to panels, with arrow navigation.

### Import

```svelte
<script>
  import Tabs from "@design-system/svelte/Tabs.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `TabsItem[]` | — (required) | Tabs (`{ value, disabled?, label?, content? }`); `label` falls back to `value`. |
| `value` | `string \| null` | `null` | Active tab value. |
| `activationMode` | `"automatic" \| "manual"` | `"automatic"` | Whether moving focus activates the tab. |
| `label` | `string` | — (required) | Accessible name for the tab list. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the selected tab changes. |

### Accessibility

- WAI-ARIA tabs pattern: roving tabindex, arrow/Home/End navigation, automatic or manual activation.
- For rich panel markup, drive the headless `createTabs` directly.

### Example

```svelte
<Tabs
  label="Settings"
  value="account"
  items={[
    { value: "account", label: "Account", content: "Account settings." },
    { value: "password", label: "Password", content: "Password settings." },
  ]}
/>
```

Themeable via `--ds-tabs-*`.

## Accordion

A WAI-ARIA accordion with single or multiple expansion and arrow movement between headers.

### Import

```svelte
<script>
  import Accordion from "@design-system/svelte/Accordion.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AccordionEntry[]` | — (required) | Items (`{ value, disabled?, label?, content? }`); `label` falls back to `value`. |
| `value` | `string[]` | `[]` | Expanded item value(s). |
| `type` | `"single" \| "multiple"` | `"single"` | One open at a time, or many. |
| `collapsible` | `boolean` | `true` | For `single`: allow collapsing the open item. |
| `disabled` | `boolean` | `false` | Disable the whole accordion. |
| `onValueChange` | `((value: string[]) => void) \| undefined` | `undefined` | Called whenever the expanded set changes. |

### Accessibility

- WAI-ARIA accordion pattern: header buttons (`aria-expanded`) linked to regions, arrow/Home/End movement between headers.
- For rich panel markup, drive the headless `createAccordion` directly.

### Example

```svelte
<Accordion
  items={[
    { value: "shipping", label: "Shipping", content: "Ships in 2-3 days." },
    { value: "returns", label: "Returns", content: "30-day returns." },
  ]}
/>
```

Themeable via `--ds-accordion-*`.

## Collapsible

A single-item disclosure (WAI-ARIA disclosure pattern): one trigger button showing or hiding one content region.

### Import

```svelte
<script>
  import Collapsible from "@design-system/svelte/Collapsible.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | Initial open state. |
| `disabled` | `boolean` | `false` | Disable the collapsible. |
| `label` | `string \| undefined` | `undefined` | Trigger text, used when the `trigger` slot is not provided. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called whenever the open state changes. |

### Slots

| Slot | Description |
| --- | --- |
| `trigger` | The trigger's content (falls back to the `label` prop). |
| default | The collapsible content. |

### Accessibility

- WAI-ARIA disclosure pattern: a trigger button (`aria-expanded` + `aria-controls`) toggling one content region; the content is `hidden` when closed.
- For full control over markup, drive the headless `createCollapsible` directly.

### Example

```svelte
<Collapsible label="Show details">
  <p>Hidden content revealed on toggle.</p>
</Collapsible>
```

Themeable via `--ds-collapsible-*`.

## TextField

A styled single-line text field with label, optional description and error message.

### Import

```svelte
<script>
  import TextField from "@design-system/svelte/TextField.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Visible label, tied to the control. |
| `value` | `string` | `""` | Field value. |
| `type` | `"text" \| "search" \| "email" \| "password" \| "tel" \| "url" \| "number"` | `"text"` | Input type. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder text. |
| `description` | `string \| undefined` | `undefined` | Hint shown under the control, linked via `aria-describedby`. |
| `error` | `string \| undefined` | `undefined` | When non-empty the field becomes invalid and announces the message. |
| `disabled` | `boolean` | `false` | Disable the field. |
| `required` | `boolean` | `false` | Mark as required. |
| `readOnly` | `boolean` | `false` | Make the field read-only. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the value changes. |

### Accessibility

- Label association plus `aria-describedby` (hint and error), `aria-invalid`, `aria-required` come from the headless text field.
- A non-empty `error` puts the field in the invalid state and announces the message.

### Example

```svelte
<TextField
  label="Email"
  type="email"
  description="We'll never share it."
  onValueChange={(v) => (email = v)}
/>
```

Themeable via `--ds-field-*`.

## Textarea

A styled multi-line text field sharing the text-field wiring with `TextField`.

### Import

```svelte
<script>
  import Textarea from "@design-system/svelte/Textarea.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Visible label, tied to the control. |
| `value` | `string` | `""` | Field value. |
| `placeholder` | `string \| undefined` | `undefined` | Placeholder text. |
| `rows` | `number` | `3` | Visible text rows. |
| `description` | `string \| undefined` | `undefined` | Hint shown under the control, linked via `aria-describedby`. |
| `error` | `string \| undefined` | `undefined` | When non-empty the field becomes invalid and announces the message. |
| `disabled` | `boolean` | `false` | Disable the field. |
| `required` | `boolean` | `false` | Mark as required. |
| `readOnly` | `boolean` | `false` | Make the field read-only. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the value changes. |

### Accessibility

- Label association plus `aria-describedby` (hint and error), `aria-invalid`, `aria-required` come from the shared headless text field.
- A non-empty `error` puts the field in the invalid state and announces the message.

### Example

```svelte
<Textarea label="Message" rows={5} onValueChange={(v) => (message = v)} />
```

Themeable via `--ds-field-*`.

## Select

A styled single-select dropdown (WAI-ARIA select-only combobox) with an elevated popup.

### Import

```svelte
<script>
  import Select from "@design-system/svelte/Select.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the control. |
| `items` | `SelectItem[]` | — (required) | Options (`{ value, label?, disabled? }`); `label` falls back to `value`. |
| `value` | `string \| null` | `null` | Selected value. |
| `placeholder` | `string` | `"Select…"` | Trigger text when nothing is selected. |
| `disabled` | `boolean` | `false` | Disable the control. |
| `onValueChange` | `((value: string) => void) \| undefined` | `undefined` | Called whenever the selected value changes. |

### Accessibility

- Select-only combobox: open/close, arrow & Home/End navigation, typeahead, `aria-activedescendant`, selection — all headless in the core.
- Popup positioning (flip/shift, stays attached on scroll) is handled by the adapter via `@floating-ui/dom`.

### Example

```svelte
<Select
  label="Country"
  items={[
    { value: "it", label: "Italy" },
    { value: "fr", label: "France" },
  ]}
  onValueChange={(v) => (country = v)}
/>
```

Themeable via `--ds-select-*`.

## Combobox

An editable autocomplete (WAI-ARIA editable combobox): a text input paired with a
filtered listbox. Unlike `Select` (a button that opens a fixed list), the user
types to filter.

### Import

```svelte
<script>
  import Combobox from "@design-system/svelte/Combobox.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the control. |
| `items` | `ComboboxItem[]` | — (required) | Options: `{ value, label?, disabled? }`. |
| `value` | `string \| null` | `null` | Selected value. |
| `placeholder` | `string` | `"Search…"` | Input placeholder. |
| `disabled` | `boolean` | `false` | Disable the control. |
| `clearLabel` | `string` | `"Clear"` | Accessible label for the clear button. |
| `emptyText` | `string` | `"No results"` | Shown when nothing matches. |
| `onValueChange` | `((value: string \| null) => void) \| undefined` | `undefined` | Called when the selection changes. |
| `onInputValueChange` | `((text: string) => void) \| undefined` | `undefined` | Called when the input text changes. |

### Accessibility

- The input is `role="combobox"` with `aria-autocomplete="list"`, `aria-expanded`
  and `aria-controls`; the popup is `role="listbox"` of `role="option"`s. DOM
  focus stays on the input — the highlight moves via `aria-activedescendant`.
- Typing filters; **Arrow Up/Down** move the highlight, **Enter** selects (filling
  the input), **Escape** closes. Filtering, positioning (flip/shift) and keeping
  the active option in view are handled by the adapter. Provide your own matcher
  via the headless `createCombobox`'s `filter` option.

### Example

```svelte
<Combobox
  label="Fruit"
  items={[{ value: "apple", label: "Apple" }, { value: "pear", label: "Pear" }]}
  onValueChange={(v) => (fruit = v)}
/>
```

Themeable via `--ds-combobox-*` (and the shared `--ds-select-*` listbox tokens).

## Command

A command palette (⌘K-style): a search combobox inside a modal dialog. It
composes the **Dialog** (portal, focus trap, scroll lock, Escape / backdrop
close, focus restore) and the **Combobox** (search, filter, keyboard) — no new
core code.

### Import

```svelte
<script>
  import Command from "@design-system/svelte/Command.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `CommandItem[]` | — (required) | Commands: `{ value, label?, disabled? }`. |
| `open` | `boolean` | `false` | Initial open state (bind to wire a shortcut). |
| `title` | `string` | `"Command menu"` | Accessible title for the dialog. |
| `label` | `string` | `"Search commands"` | Accessible label for the search input. |
| `placeholder` | `string` | `"Type a command or search…"` | Input placeholder. |
| `emptyText` | `string` | `"No results found."` | Shown when nothing matches. |
| `onCommand` | `((value: string) => void) \| undefined` | `undefined` | Called when a command is chosen. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the palette opens/closes. |

The `trigger` slot is the opener button's content.

### Accessibility

- A modal `role="dialog"` (`aria-modal`) containing a `role="combobox"` search
  input over a `role="listbox"` of results. On open, focus moves to the input and
  is trapped; **Escape** / a backdrop press close it and restore focus.
- Typing filters; **Arrow Up/Down** move the highlight (`aria-activedescendant`),
  **Enter** runs the active command and closes.

### Example

```svelte
<Command
  items={[{ value: "save", label: "Save" }, { value: "open", label: "Open…" }]}
  onCommand={(v) => run(v)}
>
  <span slot="trigger">Search…</span>
</Command>
```

Themeable via `--ds-command-*` (and the shared dialog/select tokens).

## DropdownMenu

A menu button (WAI-ARIA menu button pattern): a trigger opens a `role="menu"` of
action items.

### Import

```svelte
<script>
  import DropdownMenu from "@design-system/svelte/DropdownMenu.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible text on the trigger button. |
| `items` | `MenuItem[]` | — (required) | `{ value, label?, disabled? }[]` action items. |
| `disabled` | `boolean` | `false` | Disable the whole menu. |
| `onSelect` | `((value: string) => void) \| undefined` | `undefined` | Called with the chosen item's value. |

### Accessibility

- Trigger carries `aria-haspopup="menu"` / `aria-expanded`; the popup is
  `role="menu"` with `role="menuitem"` actions.
- Open with Enter / Space / ArrowDown (ArrowUp opens to the last item); arrow /
  Home / End move, typeahead jumps, Enter/click activates, Escape / Tab /
  outside-pointer close. DOM focus moves into the menu and returns to the
  trigger on close.
- Popup positioning (flip/shift, stays attached on scroll) via `@floating-ui/dom`.

### Example

```svelte
<DropdownMenu
  label="Actions"
  items={[
    { value: "rename", label: "Rename" },
    { value: "delete", label: "Delete" },
  ]}
  onSelect={(v) => run(v)}
/>
```

Themeable via `--ds-menu-*`.

## ContextMenu

A menu summoned by right-click (or the keyboard menu key) on a region, opening a
`role="menu"` of action items at the pointer. Reuses the same headless `menu`
primitive as DropdownMenu.

### Import

```svelte
<script>
  import ContextMenu from "@design-system/svelte/ContextMenu.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `MenuItem[]` | — (required) | `{ value, label?, disabled? }[]` action items. |
| `disabled` | `boolean` | `false` | Disable the whole menu. |
| `label` | `string` | `"Context menu"` | Accessible name for the popup (there is no labelling trigger). |
| `onSelect` | `((value: string) => void) \| undefined` | `undefined` | Called with the chosen item's value. |

Slot: the default slot is the region the menu is summoned from.

### Accessibility

- The popup is `role="menu"` (named via `aria-label`) with `role="menuitem"`
  actions; disabled items carry `aria-disabled`.
- Opens at the pointer on right-click, or at the focused region via the keyboard
  context-menu key. Arrow / Home / End move, typeahead jumps, Enter/click
  activates, Escape / Tab / outside-pointer close. DOM focus moves into the menu
  and is restored to the previously focused element on close.
- Positioning (flip/shift against a virtual anchor at the pointer) via
  `@floating-ui/dom`.

### Example

```svelte
<ContextMenu
  items={[
    { value: "reload", label: "Reload" },
    { value: "inspect", label: "Inspect" },
  ]}
  onSelect={(v) => run(v)}
>
  <div>Right-click this area</div>
</ContextMenu>
```

Themeable via the shared `--ds-menu-*` custom properties.

## Menubar

A horizontal bar of menus (WAI-ARIA menubar pattern), like an application menu
(File / Edit / View). Each menu reuses the headless menu; the menubar adds
cross-menu navigation.

### Import

```svelte
<script>
  import Menubar from "@design-system/svelte/Menubar.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the menubar. |
| `menus` | `MenubarMenu[]` | — (required) | Top-level menus: `{ value, label, items, disabled? }`. |
| `onSelect` | `((menuValue: string, itemValue: string) => void) \| undefined` | `undefined` | Called when an item is activated. |

### Accessibility

- `role="menubar"` with `role="menuitem"` triggers (`aria-haspopup="menu"`) and
  `role="menu"` popups. Roving tabindex: only the active trigger is a tab stop.
- **ArrowLeft/Right** move between triggers (wrapping) or, when a menu is open,
  switch the open menu; **Home/End** jump to the first/last trigger;
  **ArrowDown / Enter / Space** open a menu and focus its first item. Inside a
  menu, arrows / Home / End / typeahead navigate, **Enter** activates,
  **Escape** closes and returns focus to the trigger. Hovering another trigger
  while a menu is open switches to it.

### Example

```svelte
<Menubar
  label="Main"
  menus={[
    { value: "file", label: "File", items: [{ value: "new", label: "New" }] },
    { value: "edit", label: "Edit", items: [{ value: "undo", label: "Undo" }] },
  ]}
  onSelect={(menu, item) => run(menu, item)}
/>
```

Themeable via `--ds-menu-*` (shared with DropdownMenu) and `--ds-menubar-*`.

## NavigationMenu

A site-navigation bar where some items reveal a panel of links (Radix Navigation
Menu). Plain items are ordinary links; panel items are disclosures.

### Import

```svelte
<script>
  import NavigationMenu from "@design-system/svelte/NavigationMenu.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — (required) | Accessible name for the `<nav>` landmark. |
| `items` | `NavigationMenuItem[]` | — (required) | Links (`{ value, label, href }`) or panels (`{ value, label, links }`). |
| `onValueChange` | `((value: string \| null) => void) \| undefined` | `undefined` | Called when the open panel changes. |

A panel link is `{ label, href, description? }`.

### Accessibility

- A `<nav>` landmark containing links and disclosure buttons
  (`aria-expanded` / `aria-controls` → a labelled content panel). At most one
  panel is open.
- Opens on **hover** (with delay) and on **click / ArrowDown** (ArrowDown also
  moves focus into the panel); switches immediately between panels while open;
  closes on leave, **Escape** (returning focus to the trigger), or an outside
  press. Positioning (flip/shift) is handled by the adapter.

### Example

```svelte
<NavigationMenu
  label="Main"
  items={[
    { value: "products", label: "Products", links: [
      { label: "Analytics", href: "/analytics", description: "Understand traffic." },
    ] },
    { value: "pricing", label: "Pricing", href: "/pricing" },
  ]}
/>
```

Themeable via `--ds-navmenu-*`.

## Popover

A non-modal floating panel anchored to a trigger button (positioned with
Floating UI; flip/shift; outside-press + focus-leave dismissal).

### Import

```svelte
<script>
  import Popover from "@design-system/svelte/Popover.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` | Initial open state. |
| `placement` | `Placement` | `"bottom"` | Preferred placement (Floating UI); flips when there's no room. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the panel opens/closes. |

Slots: `trigger` (the trigger button's content) and the default slot (the panel
content).

### Accessibility

- Trigger carries `aria-haspopup="dialog"` / `aria-expanded` and, while open,
  `aria-controls`.
- Non-modal: focus moves into the panel on open; **Escape** closes and returns
  focus to the trigger; an outside pointer press or focus leaving the panel also
  closes (without stealing focus back).
- Positioning (flip/shift, stays attached on scroll) via `@floating-ui/dom`.

### Example

```svelte
<Popover>
  <span slot="trigger">Open</span>
  <p>Panel content goes here.</p>
</Popover>
```

Themeable via `--ds-popover-*`.

## Tooltip

A descriptive label shown on hover/focus of a trigger (`role="tooltip"`, linked
via `aria-describedby`).

### Import

```svelte
<script>
  import Tooltip from "@design-system/svelte/Tooltip.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — (required) | The tooltip label. |
| `placement` | `Placement` | `"top"` | Preferred placement; flips when there's no room. |
| `openDelay` | `number` | `300` | Delay before showing on hover, in ms (focus shows immediately). |
| `closeDelay` | `number` | `100` | Delay before hiding on leave, in ms. |

The default slot is the trigger (wrap a focusable element).

### Accessibility

- Shows on hover **and** keyboard focus; the trigger gets `aria-describedby`
  pointing at the `role="tooltip"` element while open.
- WCAG 1.4.13: hoverable (stays open while the pointer is over the tooltip) and
  dismissable (**Escape**). Focus is never moved into the tooltip.
- Positioning (flip/shift) via `@floating-ui/dom`.
- For precise control (e.g. putting `aria-describedby` directly on your own
  element) use the headless `createTooltip`.

### Example

```svelte
<Tooltip text="Copy to clipboard">
  <button>Copy</button>
</Tooltip>
```

Themeable via `--ds-tooltip-*`.

## HoverCard

A non-modal card revealed on hover/focus of a trigger (typically a link) — Radix
"Hover Card" / Bits "Link Preview". Supplementary content only.

### Import

```svelte
<script>
  import HoverCard from "@design-system/svelte/HoverCard.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `placement` | `Placement` | `"bottom"` | Preferred placement; flips when there's no room. |
| `openDelay` | `number` | `300` | Delay before opening on hover, in ms (focus opens immediately). |
| `closeDelay` | `number` | `200` | Delay before closing on leave, in ms. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the card opens/closes. |

Slots: `trigger` (wrap a focusable element) and the default slot (the card).

### Accessibility

- Opens on hover **and** keyboard focus; stays open while the pointer is over the
  card (hoverable); closes when focus leaves both trigger and card, or on
  **Escape**. Focus is never moved into the card — its links are reached by Tab.
- It is **supplementary**: don't put essential information only in a hover card.
  For precise ARIA wiring use the headless `createHoverCard`.

### Example

```svelte
<HoverCard>
  <a slot="trigger" href="/users/ada">@ada</a>
  <div>Ada Lovelace — the first programmer.</div>
</HoverCard>
```

Themeable via `--ds-hover-card-*`.

## Dialog

A modal window (WAI-ARIA dialog pattern): a trigger opens a `role="dialog"` panel
with `aria-modal="true"`, portalled to `<body>` over a backdrop, with a focus
trap and body scroll lock.

### Import

```svelte
<script>
  import Dialog from "@design-system/svelte/Dialog.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — (required) | Accessible title naming the dialog. |
| `description` | `string \| undefined` | `undefined` | Optional description, wired via `aria-describedby`. |
| `open` | `boolean` | `false` | Initial open state. |
| `closeLabel` | `string` | `"Close"` | Accessible label for the close button. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the dialog opens/closes. |

Slots: `trigger` (the trigger button's content) and the default slot (the body).

### Accessibility

- Trigger carries `aria-haspopup="dialog"` / `aria-expanded` and, while open,
  `aria-controls`. The panel is `role="dialog"` with `aria-modal="true"`, named
  by its title (`aria-labelledby`) and optionally described (`aria-describedby`).
- Modal semantics: focus moves into the panel on open, is **trapped** (Tab
  wraps), body scroll is **locked**; **Escape**, the close button, or a backdrop
  press close it and return focus to the trigger.
- Portalled to `<body>` to escape ancestor `overflow`/stacking contexts.

### Example

```svelte
<Dialog title="Edit profile" description="Make changes to your profile here.">
  <span slot="trigger">Edit profile</span>
  <form>…</form>
</Dialog>
```

Themeable via `--ds-dialog-*`. The shared modal utilities (`portal`, `trapFocus`,
`lockScroll`) are reused by the Alert Dialog, Sheet and Drawer.

## AlertDialog

A modal that interrupts the user to confirm a consequential action (WAI-ARIA
alertdialog pattern). Reuses the headless dialog with `role="alertdialog"` and
the shared modal adapter. Unlike Dialog it is **not** dismissed by a backdrop
press and has no close (✕) button.

### Import

```svelte
<script>
  import AlertDialog from "@design-system/svelte/AlertDialog.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — (required) | Accessible title naming the alert. |
| `description` | `string` | — (required) | Description of the consequence. |
| `actionLabel` | `string` | `"Confirm"` | Label of the confirming action button. |
| `cancelLabel` | `string` | `"Cancel"` | Label of the cancel button (also the Escape action). |
| `actionVariant` | `ButtonVariant` | `"primary"` | Action button variant; use `"danger"` for destructive actions. |
| `onAction` | `(() => void) \| undefined` | `undefined` | Called when the action button is pressed (before closing). |
| `open` | `boolean` | `false` | Initial open state. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the alert opens/closes. |

The default slot is the trigger's content.

### Accessibility

- Panel is `role="alertdialog"` with `aria-modal="true"`, named by the title and
  described by the description (both required).
- Focus starts on **Cancel** (the least-destructive action). **Escape** cancels;
  there is **no** backdrop-press dismissal — the user must choose. Focus is
  trapped and body scroll locked; focus returns to the trigger on close.

### Example

```svelte
<AlertDialog
  title="Delete file?"
  description="This action cannot be undone."
  actionLabel="Delete"
  actionVariant="danger"
  onAction={() => remove()}
>
  Delete file
</AlertDialog>
```

Themeable via `--ds-dialog-*` (shared with Dialog).

## Sheet

A Dialog anchored to an edge of the viewport (the "side panel" pattern). Reuses
the headless dialog and the shared modal adapter unchanged; the only additions
over Dialog are edge anchoring and a slide-in animation.

### Import

```svelte
<script>
  import Sheet from "@design-system/svelte/Sheet.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | `"right"` | Which edge the sheet is anchored to. |
| `title` | `string` | — (required) | Accessible title naming the sheet. |
| `description` | `string \| undefined` | `undefined` | Optional description, wired via `aria-describedby`. |
| `open` | `boolean` | `false` | Initial open state. |
| `closeLabel` | `string` | `"Close"` | Accessible label for the close button. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the sheet opens/closes. |

Slots: `trigger` (the trigger button's content) and the default slot (the body).

### Accessibility

Identical to Dialog: `role="dialog"` + `aria-modal`, focus moves in and is
trapped, body scroll is locked, and **Escape** / the close button / a backdrop
press close it and restore focus to the trigger. The anchored edge is exposed as
`data-side`.

### Example

```svelte
<Sheet side="right" title="Filters" description="Refine the results.">
  <span slot="trigger">Open filters</span>
  <form>…</form>
</Sheet>
```

Themeable via `--ds-dialog-*` (shared) plus `--ds-sheet-size` for the panel extent.

## Drawer

A bottom-anchored modal you can **drag down to dismiss** (the "Vaul" pattern).
Reuses the shared modal adapter and adds a pointer drag gesture.

### Import

```svelte
<script>
  import Drawer from "@design-system/svelte/Drawer.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — (required) | Accessible title naming the drawer. |
| `description` | `string \| undefined` | `undefined` | Optional description, wired via `aria-describedby`. |
| `open` | `boolean` | `false` | Initial open state. |
| `closeLabel` | `string` | `"Close"` | Accessible label for the close button. |
| `onOpenChange` | `((open: boolean) => void) \| undefined` | `undefined` | Called when the drawer opens/closes. |

Slots: `trigger` (the trigger button's content) and the default slot (the body).

### Accessibility

`role="dialog"` + `aria-modal`, focus trapped, body scroll locked; **Escape** /
the close button / a backdrop press close it and restore focus. The grab handle
is a pointer affordance only (`aria-hidden`) — keyboard users dismiss via Escape
or the close button. Dragging past a distance (25% of the panel height) or a
downward velocity threshold dismisses; a smaller drag snaps back.

### Example

```svelte
<Drawer title="Account" description="Manage your account.">
  <span slot="trigger">Open account</span>
  <nav>…</nav>
</Drawer>
```

Themeable via `--ds-dialog-*` (shared) plus `--ds-drawer-*` (handle, max height,
radius, duration).

## Alert

A styled feedback banner: status icon, title, body, optional link, actions and close button.

### Import

```svelte
<script>
  import Alert from "@design-system/svelte/Alert.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"info" \| "success" \| "warning" \| "danger" \| "neutral"` | `"info"` | Feedback status (icon + surface tint). |
| `title` | `string` | — (required) | Heading. |
| `description` | `string` | — (required) | Body text; override with the default slot for rich content. |
| `href` | `string \| undefined` | `undefined` | Link href; when set (and no `link` slot) a link is rendered. |
| `linkText` | `string` | `"Learn more"` | Link text. |
| `actions` | `AlertAction[] \| undefined` | `undefined` | Data-driven action buttons (alternative to the `actions` slot). |
| `closable` | `boolean` | `false` | Render the close button. |
| `closeLabel` | `string` | `"Close"` | Accessible name for the close button. |
| `role` | `"status" \| "alert" \| "region"` | `"status"` | Live-region role; `"alert"` for urgent messages. |
| `inverted` | `boolean` | `false` | High-contrast inverse surface. |
| `onclose` | `(() => void) \| undefined` | `undefined` | Called when dismissed. |

### Accessibility

- A live region: `role="status"` (polite) by default; pass `role="alert"` for urgent, interrupting messages.
- Status is conveyed by color + glyph + surface tint, never color alone; the FeedbackIcon is decorative.
- Not dismissible by default — set `closable` to render the WCAG-sized ghost close button.

### Example

```svelte
<Alert
  status="success"
  title="Saved"
  description="Your changes have been saved."
  closable
/>
```

Themeable via `--ds-alert-*` (and the `--ds-color-*` token layer).

## FeedbackIcon

A status icon enclosed in a rounded, colored box (the "system icon" look).

### Import

```svelte
<script>
  import FeedbackIcon from "@design-system/svelte/FeedbackIcon.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `"info" \| "success" \| "warning" \| "danger" \| "neutral"` | `"info"` | Which feedback type to show. |
| `label` | `string \| undefined` | `undefined` | When set, exposes the box as an image with this accessible name. |

### Accessibility

- Decorative by default (`aria-hidden`); pass `label` to expose it as a `role="img"` with an accessible name.
- A built-in icon is provided per status; override it via the default slot.

### Example

```svelte
<FeedbackIcon status="warning" label="Warning" />
```

Themeable via `--ds-feedback-*`.

## CloseButton

A styled "dismiss" button (the × in alerts, dialogs, notices). It is a **preset
of the Button icon button** — a ghost, `iconOnly` Button with the × glyph and a
comfortable square hit area.

### Import

```svelte
<script>
  import CloseButton from "@design-system/svelte/CloseButton.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `"Close"` | Accessible name (the icon is hidden from assistive tech). |
| `disabled` | `boolean` | `false` | Disable the button. |
| `onclose` | `(() => void) \| undefined` | `undefined` | Called when activated (click or Enter/Space). |

### Accessibility

- The icon is hidden from assistive tech; the button carries an accessible name via `label`.
- Ghost treatment with a generous square hit area around a small glyph (WCAG 2.5.8 Target Size).

### Example

```svelte
<CloseButton label="Dismiss" onclose={() => (open = false)} />
```

Themeable via `--ds-close-*`.

## Notice

An ephemeral, auto-dismissing Alert meant to be stacked inside a `NoticeRegion`.

### Import

```svelte
<script>
  import Notice from "@design-system/svelte/Notice.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `status` | `NoticeStatus` (`"info" \| "success" \| "warning" \| "danger" \| "neutral"`) | `"info"` | Feedback status. |
| `title` | `string \| undefined` | `undefined` | Heading. |
| `text` | `string \| undefined` | `undefined` | Body text. |
| `duration` | `number` | `5000` | Auto-dismiss delay in ms; `0` keeps it until closed. |
| `closable` | `boolean` | `true` | Render the close button. |
| `role` | `"status" \| "alert"` | `"status"` | Live-region role. |
| `actions` | `NoticeAction[] \| undefined` | `undefined` | Action buttons (dismiss on click unless `keepOpen`). |
| `inverted` | `boolean` | `false` | High-contrast inverse surface. |
| `onclose` | `(() => void) \| undefined` | `undefined` | Called when dismissed (auto, close button, or action). |

### Accessibility

- It *is* the live region (reuses Alert's anatomy); additions are announced.
- The auto-dismiss countdown pauses while the notice is hovered or focused (WCAG 2.2.1).

### Example

```svelte
<Notice status="success" title="Saved" text="Your changes were saved." />
```

Typically you drive notices through `createNotifier()` + `NoticeRegion` rather than rendering `Notice` directly.

## NoticeRegion

A fixed, stacking landmark that renders a notifier's queue of notices.

### Import

```svelte
<script>
  import NoticeRegion from "@design-system/svelte/NoticeRegion.svelte";
  import { createNotifier } from "@design-system/svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `notifier` | `Notifier` | — (required) | The store created with `createNotifier()`. |
| `placement` | `"top-start" \| "top-center" \| "top-end" \| "bottom-start" \| "bottom-center" \| "bottom-end"` | `"top-end"` | Where the stack sits on screen. |
| `label` | `string` | `"Notices"` | Accessible name for the region. |
| `maxVisible` | `number` | `3` | Max notices rendered at once; `0` means no limit. |
| `duration` | `number` | `200` | Enter/leave/reflow motion duration in ms. |

### Accessibility

- An accessible landmark: `role="region"` with a label; each Notice inside is its own live region.
- Notices enter/leave with a fly/fade transition and the stack reflows via FLIP, disabled under reduced motion.

### Example

```svelte
<script>
  const notifier = createNotifier();
</script>

<NoticeRegion {notifier} placement="top-end" />
<Button onpress={() => notifier.show({ status: "success", title: "Saved" })}>
  Save
</Button>
```

Themeable via `--ds-notice-*` and `--ds-elevation-overlay`.

## Avatar

A small account image that falls back to the account's initials.

### Import

```svelte
<script>
  import Avatar from "@design-system/svelte/Avatar.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — (required) | Provides the accessible name and the initials fallback. |
| `src` | `string \| undefined` | `undefined` | Image URL; when absent or it fails to load, initials are shown. |
| `alt` | `string \| undefined` | `undefined` | Accessible name; defaults to `name`. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Avatar size. |
| `shape` | `"circle" \| "square"` | `"circle"` | Avatar shape. |

### Accessibility

- Exposed as a single image (`role="img"` + `aria-label`), so it reads the same whether the photo or initials show.

### Example

```svelte
<Avatar name="Ada Lovelace" src="/ada.jpg" size="lg" />
```

Themeable via `--ds-avatar-*`.

## Icon

A standardized SVG wrapper for the system's glyphs and any icon you drop in.

### Import

```svelte
<script>
  import Icon from "@design-system/svelte/Icon.svelte";
</script>
```

### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `string` | `"1em"` | Width/height (scales with font-size by default). |
| `viewBox` | `string` | `"0 0 24 24"` | SVG viewBox. |
| `strokeWidth` | `number \| string` | `2` | Stroke width in viewBox units. |
| `label` | `string \| undefined` | `undefined` | Accessible name; when omitted the icon is decorative. |
| `class` | `string` | `""` | Extra classes merged onto the `<svg>`. |

### Accessibility

- Decorative by default (`aria-hidden`); pass `label` to expose it as a `role="img"` with an accessible name.
- Provide the glyph shapes (`<path>`, `<line>`, `<polyline>`, …) via the default slot.

### Example

```svelte
<Icon label="Add">
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</Icon>
```
