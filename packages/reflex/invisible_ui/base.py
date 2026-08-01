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

    The library is intentionally unpinned while `@design-system/react` is
    private/unpublished: the consuming app must make the package resolvable to
    its JS package manager (a published version, an `npm pack` tarball or a
    workspace/file link — see the package README).
    """

    library = "@design-system/react"

    def add_imports(self):
        # A bare import: the styled components read every colour/radius/spacing
        # from the --ds-* custom properties this stylesheet defines.
        return {"": ["@design-system/react/styles.css"]}
