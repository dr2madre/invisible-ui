# 15. The Svelte adapter moves to runes in three phases

Date: 2026-09-27

## Status

Accepted. Phases 1 and 2 are done: the presentational and the controllable
components listed below run in runes mode. Phase 3 is open.

## Context

`packages/svelte` targets Svelte 5, and every component was written in the
legacy syntax: `export let`, `$:`, `<slot>`, `$$slots`, `on:`, `use:` and
`class:`. Svelte 5 keeps that syntax working, and marks it as deprecated.

The legacy syntax also hides a class of bug. A prop read once at the top of the
script keeps its first value: the component then ignores every later value
the parent sends. The adapter review found several of these ("follow props
changed after mount") and fixed them one by one. In runes mode the compiler
warns about every such read (`state_referenced_locally`), so the reads that
are meant to happen once are written as such (`untrack`), and the others show
up while the code is written.

Moving 80 components at once would mix three kinds of change: syntax only,
the controllable-state wiring of [ADR 0011](./0011-state-and-callback-conventions.md),
and the slot API consumers write against. Each kind carries a different risk,
so each gets its own phase.

## Decision

The adapter moves to runes mode in three phases. A component moves as a
whole: one file is either legacy or runes.

1. **Presentational components.** Components with no named slots, no slot
   props, no forwarded events and no controllable value. Their public API
   stays the same: a parent that passes children still works, because Svelte
   hands default slot content to a runes component as its `children` snippet.
2. **Controllable components.** Components with a controllable prop (the
   `lastX` mirror of ADR 0011) and no named slots or forwarded events. They
   move to `$props()`, with `$bindable()` where consumers use `bind:`. The
   [amendment for runes](#amendment-for-runes) below records how the mirror
   of ADR 0011 reads in runes.
3. **Named slots and forwarded events.** Named slots become snippet props, and
   forwarded events (`on:click` on the component) become callback props. A
   parent cannot use `on:` on a runes component, and `slot="name"` content does
   not reach it, so this phase is breaking. The docs demos, the examples and
   the README move with it.

### Rules for every phase

- Props come from `$props()` with a typed `Props` interface. Computed values
  use `$derived` or `$derived.by`; `$state` holds only local state the
  template or a derived reads.
- A prop that seeds a factory once is read inside `untrack`, so the
  single read is visible in the code.
- `$effect` stays an escape hatch. Its one use in phase 1 is pushing props into
  the store of a `create-*.ts` factory (`sync`, `setState`, `syncItems`), which
  is state outside the component. These effects are `$effect.pre`, so the
  store is updated before the DOM, as the legacy `$:` statement did.
- DOM work local to one component uses `{@attach}`. Internal DOM events use
  `onclick`-style attributes, conditional classes use `class={[...]}`, and the
  default slot becomes `{@render children?.()}`.

### What stays

- The store-based factories (`create-*.ts`) and their actions. Stores remain
  valid in runes mode, the factories are shared with every legacy component
  still to migrate, and consumers use them directly.
- The actions in `internal/` (`portal`, `swipeDismiss`, `createPropsAction`
  and the factory actions built on `internal/connect.ts`). `use:` works in runes
  mode, so these keep one implementation for both kinds of component.

### Component-typed props

A runes component is a function, typed `Component`, and the older class type
`ComponentType` does not accept it. The props that take a component as data
(`SegmentedControlItem.icon`, `SidebarItem.icon`, `component` on
`Notification`, `InlineNotification` and a notifier's notice) accept both
types from phase 1 on. Without this, passing the migrated `Icon`, or any
consumer component written in runes, to those props stopped type-checking.
The change widens an input type, so existing code keeps compiling.

## Classification

The 80 exported components, by phase. Internal files are classified on their
own: `SidebarGroup` and `SidebarItems` have no named slots and no mirror and
move in phase 1; `DialogHeader` and `SidebarNav` have named slots and move in
phase 3.

### Phase 1 (27): no named slots, no slot props, no forwarded events, no controllable value

AspectRatio, Avatar, AvatarGroup, Breadcrumb, ButtonGroup, Code, CodeBlock,
ContextMenu, Count, DropdownMenu, FeedbackIcon, Icon, Kbd, Label, Loading,
LocaleProvider, Menubar, Meter, NavigationMenu, NotificationRegion, Progress,
ScrollArea, Separator, Skeleton, ToggleGroup, Toolbar, Tooltip.

`NavigationMenu` reports its open panel through `onValueChange` and takes no
value prop, so it holds no controllable state.

### Phase 2 (19): a controllable value, no named slots, no forwarded events

| Component | Controllable prop |
| --- | --- |
| Accordion | `value` |
| Checkbox | `checked` (and `disabled` mirror) |
| CheckboxGroup | `value` |
| DatePicker | `value` |
| DateRangePicker | `value` |
| MultiSelect | `value` |
| NumberField | `value` |
| Pagination | `page` (synced through the factory) |
| PinInput | `value` |
| Radio | `checked` |
| RadioGroup | `value` |
| RatingGroup | `value` |
| SegmentedControl | `value` |
| Select | `value` |
| Stepper | `current` |
| Switch | `checked` (and `disabled` mirror) |
| Textarea | `value` |
| TimeField | `value` |
| ToggleButton | `pressed` |

### Phase 3 (34): named slots, slot props or forwarded events

| Component | Reason |
| --- | --- |
| AlertDialog | named slots |
| Blockquote | named slots |
| Button | named slots, forwards `on:click` |
| Calendar | named slot |
| Card | named slots |
| Carousel | named slots, slot props |
| Collapsible | named slot |
| Combobox | named slots, forwarded event |
| ConfirmDialog | named slots |
| Dialog | named slots |
| EmptyState | named slots |
| ErrorState | named slots |
| Field | named slot, slot props |
| InlineNotification | named slots |
| Link | forwards `on:click` |
| LoadingGenerationArea | named slots |
| LoginForm | named slots, slot props |
| Notification | named slots |
| Popover | named slots |
| PromptDialog | named slots |
| RangeSlider | named slots |
| SearchDialog | named slot |
| SearchField | forwarded events |
| SheetDialog | named slots |
| Sidebar | named slots |
| Slider | named slots |
| Table | named slots, slot props |
| TableSet | named slots |
| TableView | named slots |
| Tabs | named slots |
| Tag | named slots |
| TextField | named slots |
| TreeView | named slots |
| UploadDropArea | named slot |

Several phase 3 components also hold a controllable value. They take the phase
2 wiring when they move.

## Public API impact

| Phase | Impact |
| --- | --- |
| 1 | None for markup: props, default slot content and callbacks work as before. Component-typed props widen to accept runes components. |
| 2 | None for markup: `bind:` keeps working through `$bindable()`, and the ADR 0011 and 0012 behaviour stays identical. One edge moves: `bind:` to a variable holding `undefined` now throws, see the amendment below. |
| 3 | Breaking: named slots become snippet props and forwarded events become callback props. |

## Consequences

- The compiler flags a prop read once, so the bug class the review found
  cannot come back unnoticed in migrated files.
- The API manifest generator reads runes props from the `Props` interface and
  the `$props()` defaults, and produces the same entries as for `export let`.
  A `$bindable(x)` default reads as `x`. A renamed prop (`class`, `for`)
  stays out of the manifest, as before.
- Legacy and runes components coexist until phase 3 ends; the tests, the SSR
  and hydration suites and the docs demos run against both.
- Phase 3 needs a major-version changeset and migration notes for consumers.

## Amendment for runes

Date: 2026-09-27

Phase 2 writes the Svelte mirror of ADR 0011 (`let lastX` and a guarded `$:`
statement) and the reset default of ADR 0012 as one runes idiom, shared by the
19 components through `internal/controllable.svelte.ts`. ADR 0011 and ADR 0012
keep their rules; only the Svelte implementation changes. All 19 components
were checked for named slots, slot props and forwarded events, and none has
any, so the classification above holds.

### The helper

```ts
const mirror = controllable({
  get: () => value, // the prop
  set: (next) => (value = next), // the component's own write, where it has one
  reflect: syncValue, // pushes into the machine, reporting nothing
  isGiveBack: (next) => next === $store.value, // the ADR 0012 give-back test
});
// mirror.defaultValue: the reset default, for the DOM defaults
// mirror.write(next): the component writes its own value to the prop
// mirror.restore: the form reset handler
```

- One `$effect.pre` reads the prop and nothing else: what it calls runs in
  `untrack`, so a change in the machine's store never runs it again. It
  compares the prop with the last value seen (`Object.is`), never with the
  machine. An effect that runs again with the same value does nothing, and a
  reflection never reports.
- The give-back test runs before the reflection, against what the control
  holds: the machine's store, or the element for Radio and Select. A prop that
  differs moves the default; a give-back leaves it. Where the component writes
  its own prop through `write` (DatePicker, DateRangePicker, NumberField),
  `isGiveBack` is left out and every change the mirror sees moves the default:
  the give-back is filtered by construction, as before.
- `write` records the written value as seen by reading the prop back. A
  bindable prop, and a runes parent's `$state`, hand back a proxy of an array
  written to them; the next run of the effect must not take that proxy for a
  parent's change. The prop is written before the callback reports
  (ADR 0011).
- `restore` writes the default to the prop, records it, and reflects it into
  the machine, reporting nothing. NumberField keeps its machine's `reset`, and
  MultiSelect also clears its filter text.
- The default lives in `$state.raw`: the template reads it for the DOM
  defaults, and a consumer's array reaches the markup as passed.
- A prop the user cannot change inside the machine (`disabled`, the star
  count, the layout props) is pushed with a plain `$effect.pre`, as in phase
  1: its sync ignores an unchanged value, so it needs no mirror. The item list
  of MultiSelect keeps its reference mirror, a `controllable` with no `set`.
- The effects keep the order of the legacy statements: ToggleButton pushes
  `disabled` before `pressed`, so a control enabled and pressed in the same
  update takes the new value.

Pagination used to push its page on every change of the prop, with no mirror;
it takes the same helper now. Its sync already ignored an unchanged page, so
nothing a user sees changes.

### Bindable props

Every controllable prop in the phase 2 table is `$bindable()`, and
DateRangePicker binds both `start` and `end`. In legacy mode every prop
accepts `bind:`, the package README binds `Checkbox.checked` and
`Select.value`, and the form reset page documents `bind:value`. What a binding
carries up is unchanged: the values the component writes itself (a picked
date, a typed text, a chosen option, a typed or stepped number) and every form
reset. Accordion, Pagination, Radio and Stepper never write their prop, so a
binding there stays one-way, as it was.

Controlled use without `bind:` works as before: the component writes into a
local override of the prop, and the parent's next value replaces it.

One edge differs from legacy mode. `bind:` to a variable that holds
`undefined` throws (`props_invalid_value`) when the prop has a default, where
legacy mode wrote the default back to the parent. A bound variable needs an
initial value.

`.svelte.ts` modules are linted with the Svelte parser and TypeScript, like
the components' scripts.
