"""Button — wraps the React adapter's `Button`."""

from typing import ClassVar

import reflex as rx

from .base import InvisibleUiComponent


class Button(InvisibleUiComponent):
    """The styled, batteries-included button.

    Semantic variants: ``default`` | ``primary`` | ``secondary`` | ``ghost`` |
    ``danger`` (danger shows a hazard icon so meaning never rests on colour
    alone). Children are the visible label.
    """

    tag = "Button"

    variant: rx.Var[str]
    disabled: rx.Var[bool]
    # React's `type` prop; renamed because `type` shadows the Python builtin.
    button_type: rx.Var[str]
    # Show a leading icon (defaults on for `danger`) / a trailing icon.
    left_icon: rx.Var[bool]
    right_icon: rx.Var[bool]
    # Icon-only button: square, no text — requires `aria_label`.
    icon_only: rx.Var[bool]
    aria_label: rx.Var[str]

    # The core's onPress receives a DOM Event (not serialisable) — no args here.
    on_press: rx.EventHandler[lambda: []]

    _rename_props: ClassVar[dict[str, str]] = {"buttonType": "type"}


button = Button.create
