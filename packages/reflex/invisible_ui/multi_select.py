"""MultiSelect — wraps the React adapter's `MultiSelect`."""

from typing import Any

import reflex as rx

from .base import InvisibleUiComponent


class MultiSelect(InvisibleUiComponent):
    """The multi-value picker: an editable input over a multiselectable list.

    A sibling of ``Combobox`` with its own contract: ``values`` is an ordered,
    unique, controlled list of strings reported through ``on_values_change``.
    Selected values render as removable tags; with ``name`` the form receives
    one hidden input per value (``FormData.getAll``). All interactive
    behaviour runs in the React bundle (ADR 0006); this layer only wires
    props and events.
    """

    tag = "MultiSelect"

    label: rx.Var[str]
    items: rx.Var[list[dict[str, Any]]]
    values: rx.Var[list[str]]
    placeholder: rx.Var[str]
    disabled: rx.Var[bool]
    read_only: rx.Var[bool]
    max: rx.Var[int]
    remove_on_backspace: rx.Var[bool]
    name: rx.Var[str]
    required: rx.Var[bool]
    empty_text: rx.Var[str]

    on_values_change: rx.EventHandler[lambda values: [values]]
    on_input_value_change: rx.EventHandler[lambda text: [text]]
    on_open_change: rx.EventHandler[lambda open: [open]]


multi_select = MultiSelect.create
