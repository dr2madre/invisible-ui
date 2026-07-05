# 5. Alert urgency is a modifier; the panel is a native `<dialog>`

- **Status:** Proposed
- **Date:** 2026-07-05

## Context

Two observations against the dialog family shipped in [ADR 0004](0004-dialog-family.md).

**Urgency is not a job.** WAI-ARIA APG defines the alert dialog as "a modal
dialog that interrupts the user's workflow to communicate an important message
and acquire a response" — and its canonical examples are *action confirmation
prompts*. In other words, an alert dialog is never a distinct job: it is always
at least a Confirm (and, with type-to-confirm, an input like a Prompt), raised
to interrupting urgency. The role changes (`alertdialog` makes screen readers
announce the content immediately); the job does not. The current family already
admits this informally — the AlertDialog demos are cross-labelled "same choice
as Confirm dialog" / "same input as Prompt dialog" — but the taxonomy still
presents `AlertDialog` as a sibling job next to Confirm and Prompt.

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

1. **Model urgency as a modifier, not a component.** `ConfirmDialog` and
   `PromptDialog` gain an `urgent` prop that switches the panel to
   `role="alertdialog"` (and nothing else — same focus, same buttons, same
   tokens). `AlertDialog` becomes a thin alias of `ConfirmDialog { urgent }`
   (with `confirmPhrase` mapping to the Prompt-style gate) and is eventually
   deprecated. The rule of thumb collapses to: arbitrary content → `Dialog`;
   yes/no → `ConfirmDialog`; ask a value → `PromptDialog`; add `urgent` when
   the action must interrupt.
2. **Replace the hand-rolled modality with native `<dialog>` + `showModal()`.**
   Delete `trapFocus`, `lockScroll`, the portal and the z-index token from the
   dialog path; keep the core `connect()` contract (roles, labelling,
   `data-*` hooks) unchanged. Map the existing options onto the platform:
   `closeOnEscape` → the `cancel` event; `closeOnOutsideClick` → light dismiss
   (`closedby="any"` where supported, with a pointer-coordinates fallback until
   support settles); `initialFocus` → `autofocus` or a post-`showModal()`
   focus call. Focus return to the trigger is native.

## Consequences

- The taxonomy matches the standard: `alertdialog` is a role/urgency choice on
  top of a job, which is how APG describes it.
- Less custom code to maintain and test; modality guarantees (top layer, inert
  background) come from the browser instead of a JS approximation.
- Breaking API change (`AlertDialog` deprecated, `urgent` added) — acceptable
  at alpha stage per project guidance.
- Visual snapshots re-baseline (`::backdrop` replaces the overlay div); e2e
  focus-trap tests become assertions on native behavior.
- `closedby` is recent; the fallback path must be tested until it can be
  dropped.
