# 12. Form reset restores the current default, silently

Date: 2026-09-09

## Status

Accepted. Binding for every adapter, present and future: Svelte and Vue
implement it now; React and Elements must implement it before their form
controls are called equivalent.

## Context

`form.reset()`, a reset button, and every native reset path restored nothing
in any adapter except NumberField: values written as DOM properties leave no
default behind them, and composite controls keep their payload in hidden
inputs the reset algorithm cannot touch. The investigation, the reference
behaviour and the options are in `docs/form-reset-contract.md`; the decision
was taken there and is recorded here.

## Decision

A form reset restores each control to its **current default** and reports
nothing.

- The current default is the last value the consumer passed through the
  public `value` prop, reflected into the DOM default. Never the user's edit,
  never a snapshot taken at mount. One rule keeps that true under the
  adapters' two-way idiom: a prop change that only gives back what the control
  itself reported does not move the default, the same give-back test the state
  conventions already apply to callbacks. Without it, `bind:value` would drag
  the default along with every keystroke and a reset would restore the edit it
  was meant to undo. A controlled parent that holds its own copy still goes
  stale on reset; its own `reset` handler on the form is where its state comes
  back.
- No change callback fires, and no per-control reset callback exists. The
  standard says reset changes are not user changes; ADR 0011 says only a user
  action reports. The form's own bubbling, cancelable `reset` event is the one
  notification, and it already belongs to the consumer.
- The event arrives before the browser restores anything. A consumer restores
  their own state in the handler; they read the form's restored values only in
  a later task; `preventDefault()` replaces the native restore, and the
  components' restore honours it too.
- Two layers implement it. The DOM carries real defaults (`value` and
  `checked` attributes, option `selected`, textarea content) so the browser's
  own algorithm works and server-rendered markup is correct with no script.
  And each stateful control listens for its owner's `reset` through one shared
  helper (`core`'s `formReset.onFormReset`) and puts its machine back with the
  same no-notify writes the state conventions already use.

## Consequences

Uncontrolled consumers get working resets with no code. Controlled consumers
add one `reset` handler per form. A control whose machine was not told would
show the restored value and hold the old one, so every form-participating
control registers the listener, and tests hold payload, visible state and
callback silence together.
