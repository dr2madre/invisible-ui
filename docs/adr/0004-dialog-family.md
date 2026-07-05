# 4. The dialog family: one primitive, three presets, shared wording

- **Status:** Accepted
- **Date:** 2026-07-05

## Context

Modal dialogs cover several jobs that look alike but carry different intent and
accessibility semantics: show arbitrary content, ask a routine yes/no, interrupt
for a consequential action, or ask for a single value. WAI-ARIA names only two
of these as roles — `dialog` and `alertdialog`. The rest are *patterns* on top of
`dialog`.

Left unmanaged this invites duplication: an `AlertDialog` grows a type-to-confirm
input, then a `PromptDialog` re-implements the same input, and each demo invents
its own "delete file" copy. The result is two things that are the same but
worded differently — the opposite of a system.

All four share the same headless machinery already: `createDialog` (portal, focus
trap, scroll lock, Escape, backdrop dismiss, `initialFocus`) and the
`--ds-dialog-*` tokens.

## Decision

- **`Dialog`** — the generic modal (`role="dialog"`). Any content; the base
  everything else builds on.
- **`ConfirmDialog`** — a routine yes/no (`role="dialog"`). Focus lands on the
  safe choice.
- **`AlertDialog`** — an *urgent* or *destructive* action to acknowledge
  (`role="alertdialog"`). No ✕ button; optional type-to-confirm via
  `confirmPhrase`.
- **`PromptDialog`** — asks for a single value (`role="dialog"`), the accessible
  equivalent of `window.prompt`. Optional type-to-confirm gate via `confirmValue`
  (the same safety as AlertDialog's `confirmPhrase`, on the value input the
  component already has — not a re-implementation).

The presets are thin wrappers over `createDialog`, differing only in role,
focus target, and which props they expose. The difference a user sees is intent
and urgency, not divergent behavior.

**Button copy guideline.** Buttons name outcomes, not gestures: the confirming
button names the action ("Delete file"), the negative button names what staying
does ("Keep file"). The reason is the classic confirmation trap: a dialog asking
*"Do you want to cancel the order?"* answered by **Cancel** / **OK** is
ambiguous — "Cancel" reads both as "cancel the order" and "dismiss this dialog".
Naming outcomes removes the ambiguity for everyone, and especially for
screen-reader users, who hear the button label on its own, outside the visual
layout. This is a copy guideline, not an API constraint: the labels stay
overridable and the defaults stay the platform-conventional "Confirm"/"Cancel"
(a generic fallback the guideline exists to improve on). Every example in docs
and demos must follow the guideline.

**Shared wording.** The presets reuse one canonical example rather than each
inventing copy: the AlertDialog "delete file" text — *"Do you want to delete
"report-q3.pdf"? The file will be permanently deleted."*, buttons *Delete file* /
*Keep file*. ConfirmDialog shows it as a plain yes/no; PromptDialog shows it
gated by typing the file name; AlertDialog shows both. The AlertDialog demo
cross-labels its two examples ("same choice as Confirm dialog" / "same input as
Prompt dialog") so the relationship is discoverable.

Rule of thumb: arbitrary content → `Dialog`; routine yes/no → `ConfirmDialog`;
urgent/destructive acknowledgement → `AlertDialog`; ask for a value →
`PromptDialog`.

## Consequences

- No behavioral duplication: type-to-confirm exists once as a pattern (input +
  match gate), surfaced as `confirmPhrase` (AlertDialog) and `confirmValue`
  (PromptDialog) over the input each already renders.
- Copy is written once and reused, so the family reads consistently and the
  choice between dialogs is about intent, not phrasing.
- Four component pages cross-link under "When to use which dialog", keeping the
  taxonomy visible from any entry point.
- A future dialog job should first ask whether it is a new *role* or just another
  preset/prop over `createDialog` before adding a component.
