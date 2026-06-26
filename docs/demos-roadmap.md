# Demo roadmap

Tracks which styled components still need an **Astro live demo** in the docs site
(`packages/docs`).

A component "has a demo" when it has a page
`packages/docs/src/content/docs/components/<name>.mdx` embedding a live island —
`<Preview><…Demo client:* /></Preview>` — backed by
`packages/docs/src/demos/<Name>Demo.svelte`.

**Status: 66 of 67 components have a demo (added LocaleProvider). The only one without — `TableView` — is internal (no public export).**

Every public component page now embeds a `*Demo.svelte` island (the six that
previously inlined the component inside `<Preview>` — Button, Checkbox, Combobox,
Dialog, Switch, Tooltip — were normalized to the island convention).

## How to add a demo

1. Create `packages/docs/src/demos/<Name>Demo.svelte` — a small, self-contained
   usage of the styled component (import it from
   `@design-system/svelte/<Name>.svelte`), theme-aware (light/dark).
2. Create `packages/docs/src/content/docs/components/<name>.mdx`: frontmatter
   `title`, import `Preview` + the demo, then
   `<Preview><…Demo client:visible /></Preview>` followed by the prose (props
   table, accessibility notes). **Copy an existing page — e.g. `accordion.mdx` —
   as the template.** Overlay/portal components (dialog, popover, …) use
   `client:load`/`client:only` instead of `client:visible`.
3. Register the page in the Starlight sidebar if `packages/docs/astro.config.*`
   lists component pages explicitly.

## Missing demos (1, internal)

### Phase 4 — Form & value
- [x] AspectRatio
- [x] Collapsible
- [x] Field
- [x] Label
- [x] Meter
- [x] Pagination
- [x] PinInput
- [x] Progress
- [x] RatingGroup
- [x] ScrollArea
- [x] Slider
- [x] ToggleGroup

### Radio
- [x] Radio

### Phase 5 — Data & presentational
- [x] AvatarGroup
- [x] Card
- [x] Carousel
- [x] Skeleton
- [x] Stepper
- [x] Table
- [x] TableSet
- [x] Tag
- [x] TreeView
- ~~TableView~~ (internal — no public export, no demo)

### Phase 6 — Date & time
- [x] Calendar
- [x] DatePicker
- [x] DateRangePicker
- [x] TimeField

### Typography / misc
- [x] Blockquote
- [x] Code
- [x] CodeBlock
- [x] Count
