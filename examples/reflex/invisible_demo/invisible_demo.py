"""Minimal Reflex app exercising every Invisible UI wrapper.

Python state drives the React components; their behaviour (keyboard, focus,
ARIA) runs in the browser as the TS core's JavaScript. See the package README
for how to make `@design-system/react` resolvable before `reflex run`.
"""

import reflex as rx

import invisible_ui as ui

FRUIT = [
    {"value": "apple", "label": "Apple"},
    {"value": "banana", "label": "Banana"},
    {"value": "cherry", "label": "Cherry", "disabled": True},
]

PRIORITY = [
    {"value": "high", "label": "High", "icon": "M12 19V5m-7 7 7-7 7 7"},
    {"value": "low", "label": "Low", "icon": "M12 5v14m7-7-7 7-7-7"},
]


class State(rx.State):
    subscribed: bool = False
    notifications: bool = True
    fruit: str = ""
    priority: str = "high"
    saves: int = 0

    def save(self):
        self.saves += 1


def index() -> rx.Component:
    return rx.container(
        rx.vstack(
            rx.heading("Invisible UI × Reflex"),
            ui.button("Save", variant="primary", on_press=State.save),
            rx.text(f"Saved {State.saves} times"),
            ui.checkbox(
                label="Subscribe to the newsletter",
                checked=State.subscribed,
                on_checked_change=State.set_subscribed,
            ),
            ui.switch(
                label="Notifications",
                checked=State.notifications,
                on_checked_change=State.set_notifications,
                on_off=True,
            ),
            ui.select(
                label="Fruit",
                items=FRUIT,
                value=State.fruit,
                on_value_change=State.set_fruit,
            ),
            ui.combobox(
                label="Priority",
                items=PRIORITY,
                value=State.priority,
                searchable=False,
                on_value_change=State.set_priority,
            ),
            ui.dialog(
                rx.text("Anyone with the link can view it."),
                title="Share this file",
                trigger="Share…",
                footer_close=True,
            ),
            spacing="4",
            padding="2rem",
        )
    )


app = rx.App()
app.add_page(index)
