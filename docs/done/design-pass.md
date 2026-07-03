# Design pass — progress & backlog

> **Status: completed ✅ (July 2026).** Everything in the backlog below has
> shipped; the file is archived under `docs/done/`.

Running checklist for the alpha visual/design pass (June 2026). Colors are
authored in OKLCH; brand primary = green `#8DCC7A`, selection/secondary = violet
`#7B52CC`, neutrals = Tailwind **stone**.

## ✅ Done (shipped, PRs #24–#30)

- **Tokens**: stone neutrals; `info #527ACC`, `warning #E58A2E` (dark
  `on-warning` for AA); primary green + selection violet in OKLCH.
- **Selection color** (violet) across switch, radio, checkbox(+group), slider,
  rating, pagination, tabs, segmented control, toggle button/group; switch thumb
  white again; large selected elements use a ~10% tint.
- **Inputs**: date/time pickers white background; Select check = selection color
  + leading icon slot; Combobox search icon; Card white background.
- **Misc**: progress black; meter red `#E6735C` / green `#8DCC7A`; skeleton
  darker; context-menu lateral padding; popover z-index; FeedbackIcon "tip"
  (lightbulb) glyph; Tag `selected` status; Alert ✕ pinned top-right; TreeView
  selected check; Tooltip trigger uses Button; ToggleGroup item slot + demo
  (B/I/U + icons); Stepper states (done/current/upcoming) + short dividers;
  Blockquote bar; AspectRatio gradient demo.
- **Home**: violet accent (not blue), design-system cards with aligned icons,
  `/components/` overview page (fixes hero 404).
- **Foundations**: docs updated with the new colors and decisions.

## ✅ Backlog — all shipped

1. ✅ **Focus style** — solid inner ring + transparent halo, tokenized as
   `--ds-focus-ring-width/offset` + `--ds-focus-halo-width` /
   `--ds-color-focus-halo` in `tokens.css`.
2. ✅ **Pastel OKLCH set** — `--ds-pastel-{pink,violet,teal,green,yellow}`
   tokens in `tokens.css`; carousel slides use them (#51); soft red destructive
   background via `--ds-color-danger-soft`; lightened FeedbackIcon / Alert
   variants (#69).
3. ✅ **Demos** — Toolbar real example (toggle group + segmented control +
   icon-only Select); Skeleton "wave" example; Card rich example (#64);
   FeedbackIcon round box group (#69); the sidebar example became the **Menu**
   organism (`packages/svelte/src/lib/menu`).
4. ✅ **Notice / Toast** — white default action button + isolated region
   stacking (#36).
5. ✅ **DateRangePicker** — icon adopts the selection color once a range is
   set, gray when empty.
6. ✅ **Docs IA** — sidebar grouped into sections; Locale Provider sits in its
   own group, out of the component lists.
7. ✅ **New components** — Kbd, Breadcrumb, Menu (sidebar) and Login form all
   shipped in `packages/svelte/src/lib/`; the drag-and-drop area is covered by
   DropZone (#63).
8. ✅ **Table** — single card, bigger title, lighter header labels, visible
   sort (#40); TableSet harmonized — single title, ghost settings button (#60).
