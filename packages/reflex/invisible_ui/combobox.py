"""Combobox — wraps the React adapter's `Combobox`."""

from typing import Any

import reflex as rx

from .base import InvisibleUiComponent


class Combobox(InvisibleUiComponent):
    """The editable autocomplete — and the design system's advanced select.

    Typing filters the list; the highlight travels via `aria-activedescendant`
    while DOM focus stays on the input. With ``searchable=False`` the input
    becomes a read-only trigger and the list never filters: a select-only
    combobox with a styled popup and per-option icons (an ``icon`` SVG path on
    an item).
    """

    tag = "Combobox"

    label: rx.Var[str]
    items: rx.Var[list[dict[str, Any]]]
    value: rx.Var[str]
    searchable: rx.Var[bool]
    width: rx.Var[str]
    placeholder: rx.Var[str]
    disabled: rx.Var[bool]
    clear_label: rx.Var[str]
    empty_text: rx.Var[str]
    name: rx.Var[str]

    on_value_change: rx.EventHandler[lambda value: [value]]
    on_input_value_change: rx.EventHandler[lambda text: [text]]


combobox = Combobox.create
