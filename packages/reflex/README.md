# invisible-ui (Reflex adapter)

Python wrappers over [`@design-system/react`](../react) for
[Reflex](https://reflex.dev) apps.

**Status: proof-of-concept**, completing technical-roadmap item #6 Part B. Six
wrappers — Button, Checkbox, Switch, Select, Combobox, Dialog — mirroring the
React PoC set.

## How it works — and the constraint

Reflex compiles Python to React, so each wrapper is a thin `rx.Component`
subclass (`library = "@design-system/react"`, `tag = "Button"`, typed vars for
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
`@design-system/react/styles.css`, so the `--ds-*` tokens and component styles
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

`@design-system/react` is currently **private/unpublished**, so the Reflex
app's JS package manager must be able to resolve it before `reflex run`:

```sh
# Build a tarball from this repo…
pnpm --filter @design-system/react build
cd packages/react && npm pack        # → design-system-react-0.1.0-alpha.0.tgz
```

…then make it resolvable in the Reflex project (an npm override / resolution to
the tarball path, a local registry, or simply publishing the package). Once
`@design-system/react` is on npm this section disappears.

## Tests

```sh
pip install -e "packages/reflex[dev]"
python -m pytest packages/reflex/tests
```

The tests run without Node or a browser: they assert each wrapper compiles to
the right React tag, camelCased props, event triggers and imports — the Python
layer's whole job. Behaviour itself is covered by the React package's own test
suite (89 tests); running the example app stays a manual smoke check.
