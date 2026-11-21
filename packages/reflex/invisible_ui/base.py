"""Shared base for every Invisible UI wrapper.

Reflex compiles Python to React, so each wrapper is a thin `rx.Component`
subclass pointing at the npm package built in `packages/react` — it renders the
*same* component the React adapter ships, rather than re-deriving any behaviour
in Python (ADR 0006). All interactive behaviour (keyboard, focus, dynamic ARIA)
therefore runs in the browser as the TS core's JavaScript; Python only wires
state to props and events back to event handlers.
"""

import reflex as rx


class InvisibleUiComponent(rx.Component):
    """Base component: the shared npm library and the design-system stylesheet.

    The library carries no version, so the consuming app's JS package manager
    resolves `@nozcadesign/invisible-ui-react` from npm's `latest` dist-tag
    unless the app points it at a packed tarball or a workspace/file link (see
    the package README).
    """

    library = "@nozcadesign/invisible-ui-react"

    def add_imports(self):
        # A bare import: the styled components read every colour/radius/spacing
        # from the --ds-* custom properties this stylesheet defines.
        return {"": ["@nozcadesign/invisible-ui-react/styles.css"]}
