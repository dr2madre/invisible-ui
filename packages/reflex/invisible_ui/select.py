"""Select — wraps the React adapter's `Select`."""

from typing import Any

import reflex as rx

from .base import InvisibleUiComponent


class Select(InvisibleUiComponent):
    """A styled **native** ``<select>`` (ADR 0003).

    The browser owns the popup, keyboard, typeahead and the mobile picker;
    options are plain text by design. ``items`` is a list of
    ``{"value": ..., "label": ..., "disabled": ...}`` dicts. For rich or
    searchable options use :class:`~invisible_ui.combobox.Combobox`.
    """

    tag = "Select"

    label: rx.Var[str]
    hide_label: rx.Var[bool]
    items: rx.Var[list[dict[str, Any]]]
    value: rx.Var[str]
    placeholder: rx.Var[str]
    disabled: rx.Var[bool]
    # `wrap` fits the longest option, `fill` takes 100%, `fixed` uses the token.
    width: rx.Var[str]
    name: rx.Var[str]
    required: rx.Var[bool]
    # Error message; when non-empty the select becomes invalid and announces it.
    error: rx.Var[str]

    on_value_change: rx.EventHandler[lambda value: [value]]


select = Select.create
