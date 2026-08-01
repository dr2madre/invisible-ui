"""Checkbox — wraps the React adapter's `Checkbox`."""

from typing import Union

import reflex as rx

from .base import InvisibleUiComponent


class Checkbox(InvisibleUiComponent):
    """The styled checkbox on a native ``<input type="checkbox">``.

    Tri-state: ``checked`` is ``True`` / ``False`` / ``"indeterminate"``. A
    ``label`` is required — a checkbox is meaningless without an accessible
    name.
    """

    tag = "Checkbox"

    label: rx.Var[str]
    checked: rx.Var[Union[bool, str]]
    disabled: rx.Var[bool]
    # Native form participation: submitted under `name` (as `value`) when checked.
    name: rx.Var[str]
    value: rx.Var[str]
    required: rx.Var[bool]

    on_checked_change: rx.EventHandler[lambda checked: [checked]]


checkbox = Checkbox.create
