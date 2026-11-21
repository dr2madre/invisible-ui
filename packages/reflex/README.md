# invisible-ui (Reflex adapter)

Python wrappers over [`@nozcadesign/invisible-ui-react`](../react) for
[Reflex](https://reflex.dev) apps.

**Status: proof-of-concept**, completing technical-roadmap item #6 Part B.
Seven wrappers — Button, Checkbox, Switch, Select, Combobox, MultiSelect,
Dialog — mirroring the React set.

## How it works — and the constraint

Reflex compiles Python to React, so each wrapper is a thin `rx.Component`
subclass (`library = "@nozcadesign/invisible-ui-react"`, `tag = "Button"`, typed vars for
the props, `rx.EventHandler` triggers for the callbacks). It renders the
**same component the React adapter ships**: nothing is re-implemented in
Python.

> **Constraint (ADR 0006).** All interactive behaviour — keyboard navigation,
> focus management, `aria-activedescendant`, popup positioning — lives in the
> TS core and runs in the browser as JavaScript. Python cannot supply that
> layer; it only wires state → props and events → handlers. That is exactly why
> this adapter wraps React instead of re-deriving `connect()` in Python.

Prop names are written in snake_case and reach React camelCased
(`footer_close` → `footerClose`); `button_type` maps to React's `type` (which
shadows the Python builtin). Every wrapper imports
`@nozcadesign/invisible-ui-react/styles.css`, so the `--ds-*` tokens and component styles
come along automatically.

## Usage

```python
import reflex as rx
import invisible_ui as ui

class State(rx.State):
    subscribed: bool = False

def index():
    return rx.vstack(
        ui.button("Save", variant="primary", on_press=State.save),
        ui.checkbox(label="Subscribe", checked=State.subscribed,
                    on_checked_change=State.set_subscribed),
        ui.dialog(rx.text("Anyone with the link can view it."),
                  title="Share this file", trigger="Share…"),
    )
```

A runnable app lives in [`examples/reflex`](../../examples/reflex).

## Resolving the npm package

`@nozcadesign/invisible-ui-react` is published on npm as an alpha release
(`0.1.0-alpha.1`, under the `alpha` dist-tag). The wrappers name it without a
version (`library = "@nozcadesign/invisible-ui-react"`), so the Reflex app's
JavaScript package manager resolves whatever version the `latest` dist-tag
points at. Today `latest` also points at `0.1.0-alpha.1`.

To try a React build that is not published yet, pack it from this repository
and make the Reflex project resolve the tarball (an npm override or
resolution to its path):

```sh
pnpm --filter @nozcadesign/invisible-ui-react build
cd packages/react && pnpm pack
```

This Python package itself is not published to PyPI.

## Tests

```sh
pip install -e "packages/reflex[dev]"
python -m pytest packages/reflex/tests
```

The tests run without Node or a browser: they assert each wrapper compiles to
the right React tag, camelCased props, event triggers and imports — the Python
layer's whole job. Behaviour itself is covered by the React package's own test
suite (89 tests); running the example app stays a manual smoke check.
