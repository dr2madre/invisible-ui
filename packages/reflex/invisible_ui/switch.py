"""Switch — wraps the React adapter's `Switch`."""

import reflex as rx

from .base import InvisibleUiComponent


class Switch(InvisibleUiComponent):
    """The styled switch on a native ``<input type="checkbox" role="switch">``.

    Prefer it over a checkbox for instant on/off settings. ``on_off`` shows
    ON/OFF text inside the track (``on_text`` / ``off_text`` override the
    catalog labels).
    """

    tag = "Switch"

    label: rx.Var[str]
    checked: rx.Var[bool]
    disabled: rx.Var[bool]
    name: rx.Var[str]
    value: rx.Var[str]
    required: rx.Var[bool]
    on_off: rx.Var[bool]
    on_text: rx.Var[str]
    off_text: rx.Var[str]

    on_checked_change: rx.EventHandler[lambda checked: [checked]]


switch = Switch.create
