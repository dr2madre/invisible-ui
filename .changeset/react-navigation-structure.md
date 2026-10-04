---
"@design-system/react": minor
"@design-system/elements": patch
"@design-system/svelte": patch
"@design-system/vue": patch
---

The React adapter now ships navigation and structure: `Tabs`, `Accordion`,
`Collapsible`, `Breadcrumb`, `Pagination`, `Stepper`, `Sidebar`, `TreeView`,
`ButtonGroup` and `Separator`, with the markup, classes and behaviour of the
other adapters. Tabs, Pagination and TreeView follow the writing direction
of the element a key is pressed on, so in right-to-left text the arrows
follow the visual order. A tab's count is read as part of its name. The
accordion headers are headings at `headingLevel`, 3 by default. When a press
disables Previous or Next, focus moves to the page that is now current. The
Sidebar rail toggle keeps one name and reports its state through
`aria-pressed`; the open sections follow ADR 0013, and `mode="drawer"`
renders the navigation inside a SheetDialog. TreeView requests unloaded
children without fetching them (ADR 0014) and announces loading and failure
through one live region that stays in the page.

Each stateful prop works controlled and uncontrolled (ADR 0011). Labels come
from the catalog. All ten render on the server and hydrate without
mismatches.

Six hooks render the same behaviour in markup of your own: `useTabs`,
`useAccordion`, `useCollapsible`, `usePagination`, `useStepper` and
`useTreeView`. With `useTabs` the tab strip can sit apart from its panels.

`styles.css` now includes the tabs, accordion, collapsible, breadcrumb,
pagination, stepper, sidebar, tree view, button group and separator sheets.
They are the same files the Vue and custom element packages ship, now held
byte for byte to the React copies.
