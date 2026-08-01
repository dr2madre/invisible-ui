"""Dialog — wraps the React adapter's `Dialog`."""

import reflex as rx

from .base import InvisibleUiComponent


class Dialog(InvisibleUiComponent):
    """A styled modal window on the native ``<dialog>`` element (ADR 0005).

    Modality — top layer, inert background, a real focus trap — is the
    browser's via ``showModal()``. Children are the body; ``trigger`` is the
    trigger button's label. Bind ``open`` + ``on_open_change`` to drive it from
    Python state.
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
    # CSS selector (within the panel) for the element to focus on open.
    initial_focus: rx.Var[str]
    close_on_outside_click: rx.Var[bool]

    on_open_change: rx.EventHandler[lambda is_open: [is_open]]


dialog = Dialog.create
