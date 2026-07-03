# 3. Select is a native `<select>`; the Combobox is the advanced select

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

The styled `Select` started as a custom ARIA "select-only combobox": a trigger
button opening a styled `role="listbox"` popup, positioned with Floating UI,
submitting through a mirrored hidden input. That bought full visual control
(selection tint, check mark, per-option icons) at the cost of re-implementing
what the platform already does well — and of losing the native mobile picker.

The native `<select>` cannot render markup inside its options (per-option
icons, rich layouts) and its popup is OS-drawn. But everything else is free
and bulletproof: keyboard, typeahead, screen-reader semantics, `required`
validation, form participation, and the platform picker on touch devices. The
project pillar is "prefer native browser behavior where it is accessible and
robust" — and once the option icons are questioned ("is an icon worth giving
up the native picker?"), the custom popup no longer pays for itself.

Meanwhile the `Combobox` must be custom regardless (a filterable text input
has no native equivalent), so it already owns a styled popup.

## Decision

- **`Select` is a styled native `<select>`.** The browser owns the popup and
  behavior; the styled layer owns the closed control (`appearance: none`,
  custom chevron, shared control metrics so it matches `Button`), the label,
  placeholder (hidden disabled option), width modes (`wrap`/`fill`/`fixed`)
  and the announced invalid state. Options are plain text by design.
- **`Combobox` is the advanced select.** With `searchable={false}` its input
  becomes read-only and the list never filters (identity filter) — the ARIA
  select-only combobox pattern. It hosts everything the native popup can't:
  per-option icons (mirrored on the control), rich option content, the styled
  listbox, and the width modes.
- The headless `core/select` primitive remains for consumers who build their
  own custom select.

Rule of thumb: plain text options → `Select`; options that need to be *drawn*
→ `Combobox` (with or without search); items that run commands →
`DropdownMenu`.

## Consequences

- Mobile UX improves (platform picker) and a chunk of behavioral surface moves
  from our code to the browser.
- The popup of `Select` is not themeable — that is the trade, documented on
  the component page. Anything needing a themed popup upgrades to the
  Combobox.
- `Select` drops item icons, the option/icon slots and `onOpenChange`
  (breaking, alpha-stage). The docs cross-link the three components so the
  choice stays discoverable.
