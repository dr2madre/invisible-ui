---
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/core": minor
---

Sidebar: the application's side navigation under its own name, with collapsible sections, a rail and a drawer.

The component that carried this pattern shipped as `Menu`, a name the WAI-ARIA menu family already owns and which it never used: `core/menu` is the menu-button pattern behind Dropdown Menu, Context Menu and Menubar, while this renders a `<nav>` of links. It is `Sidebar` now (ADR 0013).

**`Menu` keeps working as a deprecated alias** until its removal one release cycle away: the same props (`sections`, `value`, `label`, `onSelect`), the same `logo` and `footer` slots, the same types under their old names, the same landmark and `aria-current="page"`, and the same `--ds-menu-*` themes. An override of the `menu.label` message still answers for the sidebar's landmark name. Only the internal class names changed, which the stability policy has never treated as public surface.

New in the component: sections that collapse (`collapsible: true`, each with its own `id`, which is the name it answers to in `openGroups`), a rail that hides labels from sight while leaving every name in the accessibility tree, and `mode="drawer"`, which puts the same navigation inside a Sheet Dialog. The routing, the current destination and the breakpoint policy stay with the application.

Two rules are worth knowing before you reach for them. The rail is offered only when every destination carries an `icon`: collapsing hides the labels, and a destination with nothing to show would be a control with a name and no face, so without icons no toggle is rendered and `collapsed` keeps the labels. And a collapsible section needs an `id`: sharing a label is fine, sharing a name would mean sharing an open state.

New tokens are `--ds-sidebar-*`, each falling back to its former `--ds-menu-*` name one by one. `--ds-menu-padding` and `--ds-menu-radius` stay canonical for the ARIA menus that share them.

Core gains the `sidebar.label`, `sidebar.collapse`, `sidebar.expand` and `sidebar.open` messages, and a renamed message key now answers to an override of its former spelling.
