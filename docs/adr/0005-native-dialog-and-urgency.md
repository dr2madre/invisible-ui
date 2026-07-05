# 5. The dialog family maps to the platform's simple dialogs; the panel is a native `<dialog>`

- **Status:** Proposed
- **Date:** 2026-07-05

## Context

Two observations against the dialog family shipped in [ADR 0004](0004-dialog-family.md).

**The taxonomy has a better anchor than urgency.** The HTML Living Standard
already names the three modal jobs, and calls them *simple dialogs*:
`alert()` (show a message, one OK button), `confirm()` (verify or accept,
OK/Cancel) and `prompt()` (ask for a value, OK/Cancel plus an input). The
browser built-ins are unusable in practice — not stylable, not themeable, not
part of the page's accessibility tree control — but the *jobs* they name are
exactly the presets a design system needs. ADR 0004 instead presented
`AlertDialog` as a sibling job defined by urgency, which created two problems:
the family had no acknowledgement-only preset (the actual `alert()` job — a
message with nothing to cancel), and the current `AlertDialog` (two buttons,
optional type-to-confirm) is really a Confirm at interrupting urgency, as its
own demos admit ("same choice as Confirm dialog"). Per WAI-ARIA, `alertdialog`
is a *role* conveying urgency — screen readers announce the content
immediately — not a distinct job.

**The modal machinery re-implements the platform.** `createDialog` builds
modality by hand: a portalled `<div role="dialog">`, a JS focus trap, a JS
scroll lock, a `z-index` token, a backdrop element, an Escape handler. HTML has
a native `<dialog>` element whose `showModal()` provides all of this natively:
top-layer rendering (no portal, no z-index), inert background (a real focus
trap, enforced by the browser), Escape via the `cancel` event, and a stylable
`::backdrop`. Support is universal in evergreen browsers. The ARIA in HTML
specification permits `role="alertdialog"` on `<dialog>`, so the whole family
fits on one native element. This follows the same reasoning as
[ADR 0003](0003-native-select-advanced-combobox.md) (native `<select>`) and the
project rule to prefer native browser behavior where accessible and robust.

## Decision (proposed)

One primitive, three presets named after the platform's simple dialogs. All
presets are thin wrappers over `createDialog`, share the `--ds-dialog-*` tokens
and the [ADR 0004](0004-dialog-family.md) button-copy guideline (buttons name
outcomes, not gestures).

- **`Dialog`** — the generic modal (`role="dialog"`). Any content; the head of
  the family and the base everything else builds on.
- **`AlertDialog`** — the `alert()` job: an acknowledgement. A message the user
  takes note of, with **one** button and nothing to cancel. Default label "OK";
  docs recommend naming the outcome in context ("Done", "Close",
  "I understood"). `role="alertdialog"` (an interruption that acquires a
  response is precisely what the role conveys). Escape and backdrop press are
  equivalent to the button — there is no destructive path.
- **`ConfirmDialog`** — the `confirm()` job: verify or accept before
  proceeding. Two buttons: cancel stops the process, confirm proceeds. The
  delete-file demo is a recommendation, not the only shape — labels are always
  configurable and generic pairs (yes/no, cancel/submit) are discouraged by the
  copy guideline. `role="dialog"` by default; an `urgent` prop switches to
  `role="alertdialog"` and changes nothing else.
- **`PromptDialog`** — the `prompt()` job: everything Confirm has, plus an
  input (a single value today; a form slot is a possible extension). Cancel
  stops, submit proceeds; here "Cancel"/"Submit" are acceptable since the
  gesture *is* the outcome. The value is optional by default — `required`
  makes it mandatory, `confirmValue` turns it into a type-to-confirm gate —
  context decides. `urgent` available as on Confirm.

**Migration.** The current `AlertDialog` (two buttons, `confirmPhrase`) is a
Confirm in the new taxonomy: its jobs move to `ConfirmDialog { urgent }` and,
for type-to-confirm, `PromptDialog { urgent, confirmValue }`. `confirmPhrase`
and `confirmHint` are dropped (the Prompt gate is the single implementation, as
ADR 0004 already intended). The shared i18n keys move from the `alertDialog.*`
namespace to a family-level `dialog.*` namespace, making the reuse visible from
the catalog.

**Native element.** Replace the hand-rolled modality with native `<dialog>` +
`showModal()`: delete `trapFocus`, `lockScroll`, the portal and the z-index
token from the dialog path; keep the core `connect()` contract (roles,
labelling, `data-*` hooks) unchanged. Map the existing options onto the
platform: `closeOnEscape` → the `cancel` event; `closeOnOutsideClick` → light
dismiss (`closedby="any"` where supported, with a pointer-coordinates fallback
until support settles); `initialFocus` → a post-`showModal()` focus call. Focus
return to the trigger is native.

## Consequences

- The taxonomy is the platform's own: anyone who knows `alert`/`confirm`/
  `prompt` already knows which preset to reach for, and the docs can teach the
  family as "the accessible, stylable simple dialogs".
- The family gains the acknowledgement job it was missing; urgency becomes an
  orthogonal modifier instead of a component.
- Less custom code to maintain and test; modality guarantees (top layer, inert
  background) come from the browser instead of a JS approximation.
- Breaking API changes (`AlertDialog` re-scoped to one button, `confirmPhrase`
  removed, `urgent` added) — acceptable at alpha stage per project guidance.
- Visual snapshots re-baseline (`::backdrop` replaces the overlay div); e2e
  focus-trap tests become assertions on native behavior.
- `closedby` is recent; the fallback path must be tested until it can be
  dropped.
