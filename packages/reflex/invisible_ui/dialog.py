"""Dialog — wraps the React adapter's `Dialog`."""

import reflex as rx

from .base import InvisibleUiComponent


class Dialog(InvisibleUiComponent):
    """A styled modal window on the native ``<dialog>`` element (ADR 0005).

    Modality — top layer, inert background, a real focus trap — is the
    browser's via ``showModal()``. Children are the body; ``trigger`` is the
    trigger button's label. Bind ``open`` + ``on_open_change`` to drive it from
    Python state.

    Multi-step workflows are a composition: ``header_meta`` holds the step
    context, ``footer_lead`` holds Back, ``footer`` holds the primary action and
    ``body_layout="stack"`` spaces the body sections. The step state stays in
    Python; the dialog never learns about steps.
    """

    tag = "Dialog"

    title: rx.Var[str]
    # The trigger Button's label. (The React prop takes any ReactNode; the
    # wrapper keeps it to text — enough for the PoC.)
    trigger: rx.Var[str]
    trigger_variant: rx.Var[str]
    open: rx.Var[bool]
    hide_title: rx.Var[bool]
    description: rx.Var[str]
    close_label: rx.Var[str]
    footer_close: rx.Var[bool]
    # "plain" (default) or "stack": "stack" spaces the body's direct children
    # by --ds-dialog-body-gap.
    body_layout: rx.Var[str]

    # Composition regions. Reflex compiles a component-valued prop to a JSX
    # element, so these take any Reflex component, e.g. rx.text("Step 1 of 2").
    # Context above the title; carries no progress semantics.
    header_meta: rx.Var[rx.Component]
    # Leading footer actions, e.g. Back.
    footer_lead: rx.Var[rx.Component]
    # Trailing footer actions.
    footer: rx.Var[rx.Component]
    # CSS selector (within the panel) for the element to focus on open.
    initial_focus: rx.Var[str]
    close_on_outside_click: rx.Var[bool]

    on_open_change: rx.EventHandler[lambda is_open: [is_open]]


dialog = Dialog.create
