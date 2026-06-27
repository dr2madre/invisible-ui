# Design pass — progress & backlog

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

## ⏳ Backlog

1. **Focus style** — solid inner ring + a transparent halo of the same color
   (cross-cutting across components).
2. **Pastel OKLCH set** — define tokens and use them: carousel slides; soft red
   destructive button background (`#E5A1AC`); lightened backgrounds for
   FeedbackIcon / Alert / Notification. Pastels:
   `#E5A1AC #B8A1E6 #7ABECC #8DCC7A #E5CB44`.
3. **Demos** —
   - Toolbar: a real example (toggle group + segmented control with alignment
     icons + an icon-only Select for layout).
   - Skeleton: add a "wave" example and a long, low, rounded-rectangle shape.
   - Card: rich example (image on top, date, title, tag, description, button
     group with primary + ghost actions).
   - FeedbackIcon: a fully-round box group example (same colors).
   - Segmented control: extract the desktop/tablet sidebar example into a
     separate **Menu** organism (sidebar + menu bar).
4. **Notice / Toast** — Notice action button → default (white); fix toast/notice
   z-index (overlaps page content).
5. **DateRangePicker** — calendar icon gray when empty, selection color when set
   (like DatePicker).
6. **Docs IA** — group the sidebar into sections (Feedback, Forms, …); move
   **LocaleProvider** out of the components section (it's not a component).
7. **New components** — Kbd (keyboard shortcut, white bg); Drag-and-drop area;
   Login form organism (social login, field icons, "forgot" link, logo on top);
   Breadcrumb (home icon, linked items black + underlined, last = selection
   color); Menu (sidebar) organism.
8. **Table** *(last)* — TableSet should not have an outer card (only the table
   does) and needs correct table padding; table title slightly bigger; column
   header labels medium-dark (not black); header row same height as the others
   (not thicker); sort selection no longer applies — fix it.
