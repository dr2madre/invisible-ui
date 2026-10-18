# 2. Semantic tokens are decoupled from style (role/state naming)

- **Status:** Accepted
- **Date:** 2026-06-21

The role/state naming rule remains in force. The concrete token paths and
two-tier model below describe the original decision and were superseded by
[ADR 0019](./0019-token-model.md). Use ADR 0019 for current paths and modes.

## Context

The optional theme layer (`tokens.css`, see
[`../foundations.md`](../foundations.md)) ships **semantic tokens**
(`--ds-color-*`) that the components consume. Some of the original names leaked
*appearance* into the token: `--ds-color-muted`, `--ds-color-muted-hover`. A
name like "muted" describes how a color *looks* (desaturated, low-contrast),
not what it *is for*. That couples the token to a visual treatment: a themer
who makes that surface vivid is left with a token whose name now lies.

This contradicts the headless philosophy recorded in
[ADR 0001](./0001-headless-primitives.md): the system ships
behavior and meaning, the consumer owns the look.

## Decision

A semantic token names a **role** or a **state** — never a style.

- **Role** — what the token is *for*: `primary`, `secondary`, `surface`,
  `border`, `text`, `danger`, `success`, `on-primary`, `emphasis-surface`…
- **State** — the interaction/lifecycle state it represents: `hover`,
  `pressed`, `focus-ring`, `disabled`, `selected`…

A token name must **not** contain a visual adjective (`muted`, `soft`,
`subtle`, `light`, `dark`, `tint`, `raised`…). A word that *looks* stylistic is
acceptable only when it is a genuine **state** — e.g. `mute`/`muted` for a
muted microphone or speaker — never as a description of appearance.

Consequences of applying the rule (the rename that landed with this ADR):

| Before (style) | After (role/state) |
| --- | --- |
| `--ds-color-muted` | `--ds-color-surface` |
| `--ds-color-muted-hover` | `--ds-color-surface-hover` |
| `--ds-color-hover` | `--ds-state-hover` |
| `--ds-color-active` | `--ds-state-pressed` |
| `--ds-color-inverse-surface` | `--ds-color-emphasis-surface` |
| `--ds-color-inverse-border` | `--ds-color-emphasis-border` |
| `--ds-color-inverse-text` | `--ds-color-on-emphasis` |

`inverse-*` was also reframed: it described a relationship to the page
("the opposite"); the role it actually plays is a **high-emphasis** surface, so
it becomes `emphasis-*` with the foreground following the existing `on-*`
convention (`on-primary`, `on-status` → `on-emphasis`).

Tier-1 **primitives** are exempt — they are the raw palette
(`--ds-neutral-100`, `--ds-feedback-danger`), addressed by scale/hue on
purpose; the rule governs the Tier-2 semantic layer the components read.

## Consequences

**Positive**
- Token names survive re-theming: a role can be restyled without the name
  becoming misleading.
- The vocabulary is predictable (role or state), so new tokens are easy to name
  and to find.
- Reinforces the headless boundary: meaning lives in the system, style lives
  with the consumer.

**Negative / trade-offs**
- Breaking rename for anyone who consumed the old `--ds-color-*` names; callers
  must update (the built-in components already do).
- "Role vs. state" needs judgment at the edges (e.g. `emphasis`); this ADR is
  the tie-breaker.

## Addendum, 2026-10-12: themes are not tokens

`role.light` and `role.dark` in `packages/tokens/tokens.json` identify
themes, not semantic tokens: `light` and `dark` there name the theme a role
belongs to, as `[data-theme="dark"]` does in the stylesheet. The constraint
is unchanged: a token name never says how its colour looks. So the dark
focus ring is `role.dark.color-focus-ring`, the same role as the light one,
and no token carries a name such as `onDark`. The dialog scrim follows the
same rule: `role.light.dialog-overlay` and `role.dark.dialog-overlay`, one
role in two themes, never a token named `overlay.light` or `overlay.dark`.

## References

- [ADR 0001 — Headless primitives](./0001-headless-primitives.md)
- [`../foundations.md`](../foundations.md) — the token layer and naming rule.
