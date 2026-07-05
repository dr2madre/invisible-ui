---
title: "Foundations (optional, customizable)"
---

This design system is **headless**: the primitives ship behavior and
accessibility, not visual styling. The foundations below are **recommended
defaults, not requirements** — an opt-in theme layer you apply *on top of* the
primitives through the `data-*` hooks they expose (e.g. `data-state`,
`data-disabled`).

They are inspired by Bitrock's [Amber Design System](https://amber.bitrock.it/)
(specifically [`@amber-ds/visual`](https://github.com/bitrockteam/amber-visual)),
but here everything is expressed as **overridable CSS custom properties**, so
you can keep them, retheme them, or ignore them entirely.

> Nothing here is bundled into `@design-system/core` or the adapters. Copy what
> you want into your app's global stylesheet and change the values freely.

## Typography

A **system font stack** adapts to the user's OS (native feel, no web-font
download, no layout shift):

```css
:root {
  --ds-font-sans:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol", "Noto Color Emoji";
  --ds-font-mono:
    SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
}

body {
  font-family: var(--ds-font-sans);
}
```

Both stacks ship in the token layer (`tokens.css`) as `--ds-font-sans` (UI text)
and `--ds-font-mono` (code/numeric), so you can reference them directly.

**Responsive scaling (guideline).** Use a slightly smaller base size on small
screens and scale up at a medium breakpoint, so text is comfortable on mobile
and desktop:

```css
:root {
  --ds-font-size-base: 0.9375rem; /* 15px on small screens */
}

@media (min-width: 768px) {
  :root {
    --ds-font-size-base: 1rem; /* 16px from the medium breakpoint up */
  }
}
```

## Color

A **10-weight scale** per hue, from `50` (lightest) to `900` (darkest). Pick a
semantic primary and step up/down in weight for hover, active, borders, etc.
Replace the values with your brand palette.

```css
:root {
  /* Primary — swap these for your brand hue (here: the Invisible UI green) */
  --ds-color-primary-50: #f2faee;
  --ds-color-primary-100: #e2f3d9;
  --ds-color-primary-200: #c6e7b4;
  --ds-color-primary-300: #a7d98c;
  --ds-color-primary-400: #8dcc7a; /* brand green */
  --ds-color-primary-500: #6fb35d; /* base / primary */
  --ds-color-primary-600: #579646;
  --ds-color-primary-700: #437438;
  --ds-color-primary-800: #355c2d;
  --ds-color-primary-900: #2a4a25;

  /* Grey — Tailwind "stone": text, backgrounds, lines and borders */
  --ds-color-grey-50: #fafaf9;
  --ds-color-grey-100: #f5f5f4;
  --ds-color-grey-200: #e7e5e4;
  --ds-color-grey-300: #d6d3d1;
  --ds-color-grey-400: #a8a29e;
  --ds-color-grey-500: #78716c;
  --ds-color-grey-600: #57534e;
  --ds-color-grey-700: #44403c;
  --ds-color-grey-800: #292524;
  --ds-color-grey-900: #1c1917;
}
```

**Text emphasis (guideline).** Map grey weights to emphasis levels:

| Emphasis | Token |
| --- | --- |
| High-emphasis text | `--ds-color-grey-900` |
| Medium-emphasis text | `--ds-color-grey-700` |
| Disabled text | `--ds-color-grey-500` |

### The token layer (two tiers, 3 palette groups)

Theming ships as `tokens.css`, organized the way design and engineering
conventions expect — **primitives** (the raw palette) feed **semantic** tokens
(roles) that the components consume:

```js
import "@design-system/svelte/tokens.css";
```

**Tier 1 — primitives.** The palette is deliberately small: **three groups**,
listed in the order you most likely customize them.

Brand colors are authored in **OKLCH** (perceptually uniform — predictable
lightness for hover/contrast). The **primary** is green; the **secondary** is
violet and doubles as the **selection / focus** color (selected controls and the
focus ring derive from it, not from the primary).

```css
:root {
  /* 1) Brand — usually the only thing you need to change (OKLCH). */
  --ds-brand-primary: oklch(78.3% 0.129 138.7); /* #8DCC7A green */
  --ds-brand-primary-hover: oklch(72.3% 0.129 138.7);
  --ds-brand-secondary: oklch(54.5% 0.181 295.2); /* #7B52CC violet — selection/focus */
  --ds-brand-secondary-hover: oklch(48.5% 0.181 295.2);

  /* 2) Feedback hues. */
  --ds-feedback-info: #527acc;
  --ds-feedback-success: #16a34a;
  --ds-feedback-warning: #e58a2e; /* light amber → uses a dark on-warning glyph */
  --ds-feedback-danger: #dc2626;
  --ds-feedback-danger-hover: #b91c1c;

  /* 3) Neutrals (UI) — Tailwind "stone" 0–950 ramp for text, surfaces, borders. */
  --ds-neutral-0: #ffffff;
  --ds-neutral-50: #fafaf9;
  /* … #f5f5f4 #e7e5e4 #d6d3d1 #a8a29e #78716c #57534e #44403c #292524 #1c1917 … */
  --ds-neutral-950: #0c0a09;
}
```

> Because the primary green is light, `--ds-color-on-primary` is **dark** (dark
> label on the green button); the light amber warning likewise uses a dark
> `--ds-color-on-warning`. Both keep WCAG AA contrast.

**Tier 2 — semantic (`--ds-color-*`).** Role tokens that reference the
primitives and **remap between light/dark**. Components only ever read these.
Tinted InlineNotification/Notification surfaces are **derived from the feedback hue** with
`color-mix`, so changing a feedback color cascades to its surface automatically:

> **Naming rule — decoupled from style.** A semantic token names a **role**
> (`surface`, `border`, `text`, `primary`, `emphasis-surface`…) or a **state**
> (`hover`, `pressed`, `disabled`, `focus-ring`…) — **never an appearance**.
> There is no `muted`, `soft` or `subtle`: the neutral control fill is
> `--ds-color-surface`, the hover overlay is `--ds-state-hover`. A word like
> "mute" is allowed only when it is a real *state* (a muted mic), never as a
> visual adjective. This keeps a token honest when you re-theme its role. See
> ADR 0002 (tokens decoupled from style) in the repository's `docs/adr/`.

```css
--ds-color-primary: var(--ds-brand-primary);
--ds-color-danger: var(--ds-feedback-danger);
--ds-color-text: var(--ds-neutral-900);            /* light; → --ds-neutral-50 in dark */
--ds-color-info-surface: color-mix(in srgb, var(--ds-feedback-info) 8%, var(--ds-neutral-0));
```

**Surface, text and state roles.** Beyond the brand/feedback roles, the
semantic layer covers the everyday neutrals — each named for its role or state,
and each remapping per theme:

| Token | Role / state |
| --- | --- |
| `--ds-color-background` | the page surface |
| `--ds-color-surface` / `--ds-color-surface-hover` | a raised control/panel fill and its hover |
| `--ds-color-text` / `--ds-color-text-secondary` | primary and secondary (medium-emphasis) text |
| `--ds-color-text-disabled` / `--ds-color-disabled` | the *disabled* state — text and fill |
| `--ds-state-hover` / `--ds-state-pressed` | interaction overlays (hover, pressed) |
| `--ds-color-focus-ring` | the focus state |

Note the *disabled* tokens name a **state**, not a look: primitives still expose
it via `data-disabled`, so a themer can choose a flat `--ds-color-disabled` fill,
dim the text with `--ds-color-text-disabled`, or keep a simple `opacity` — the
token name commits to none of them.

**Customizing — in order of effort:**

1. **Brand** — set `--ds-brand-primary` (primary buttons follow) and
   `-secondary` (the **selection / focus** color: selected controls, the focus
   ring and selected/active states follow it).
2. **Feedback** — set `--ds-feedback-*`; the status icons and the
   InlineNotification/Notification surfaces re-derive.
3. **Neutrals** — set the `--ds-neutral-*` ramp to restyle every UI surface,
   border and text color.

**Shape & elevation (non-color).** Radius and shadow are tokens too, named for
the role they shape rather than a pixel size:

| Token | Role |
| --- | --- |
| `--ds-radius-control` | buttons, inputs, the close button (0.5rem) |
| `--ds-radius-surface` | alerts, notices, cards (0.75rem) |
| `--ds-radius-pill` | fully rounded — toggles, chips (999px) |
| `--ds-elevation-overlay` | the floating overlay shadow (remaps per theme) |

Components read these through their per-component override, e.g.
`var(--ds-button-radius, var(--ds-radius-control, …))` — set the role token to
restyle a whole class of shapes at once, or the component token for a one-off.

**Theme switch.** Follows `prefers-color-scheme` by default; force it per
subtree with `[data-theme="dark"]` / `[data-theme="light"]`.

**Accessibility.** The defaults are checked against WCAG 2 AA (text 4.5:1,
icon glyphs 3:1) by an automated test over `tokens.css`. If you change the brand
or feedback hues, re-verify contrast — white text sits on the brand/danger
fills and on the status icon boxes.

### Inverted (high-contrast) surface

`InlineNotification`/`Notification` accept `inverted`, which swaps the status tint for the
`--ds-color-emphasis-*` surface (foreground `--ds-color-on-emphasis`) — a
high-contrast box that flips with the theme. The status stays visible via the
colored FeedbackIcon. It's the recommended look for transient, self-dismissing
info notices (saved, back online, downtime…). The prop stays named `inverted`
(the API), while the token names the *role* it fills (high **emphasis**), not
its look.

## Accessibility: contrast

Whatever palette you choose, text/background combinations must meet
**WCAG AA**: a contrast ratio of **4.5:1** for normal text and **3:1** for
large text. This is a hard requirement for any styled output (examples and the
theme layer); the unstyled primitives carry no color and so impose none.

## Using the tokens

Style the primitives with their hooks, referencing the tokens above:

```css
.switch {
  font-family: var(--ds-font-sans);
  border: 1px solid var(--ds-color-grey-300);
}

.switch[data-state="checked"] {
  background: var(--ds-color-primary-500);
  color: var(--ds-color-grey-50);
}

.switch[data-disabled] {
  color: var(--ds-color-grey-500);
}
```

See also ADR 0001 (headless primitives) in the repository's `docs/adr/`.
