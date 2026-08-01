"""Invisible UI for Reflex — Python wrappers over `@design-system/react`.

Each component is a thin `rx.Component` subclass rendering the *same* React
component the React adapter ships (ADR 0006): behaviour, keyboard and ARIA come
from the TS core running in the browser; Python only wires state to props and
events back to handlers.

Usage::

    import invisible_ui as ui

    ui.button("Save", variant="primary", on_press=State.save)
    ui.checkbox(label="Subscribe", checked=State.subscribed,
                on_checked_change=State.set_subscribed)
"""

from .base import InvisibleUiComponent
from .button import Button, button
from .checkbox import Checkbox, checkbox
from .combobox import Combobox, combobox
from .dialog import Dialog, dialog
from .select import Select, select
from .switch import Switch, switch

__all__ = [
    "InvisibleUiComponent",
    "Button",
    "button",
    "Checkbox",
    "checkbox",
    "Combobox",
    "combobox",
    "Dialog",
    "dialog",
    "Select",
    "select",
    "Switch",
    "switch",
]
