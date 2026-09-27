---
"@design-system/core": minor
"@design-system/svelte": minor
"@design-system/vue": minor
"@design-system/react": minor
"@design-system/elements": minor
---

Breaking: every deprecated name is removed. The packages are unpublished and have no consumers yet, so the old names go now instead of before 1.0. The catalog is 80 components.

**`Menu` is removed; use `Sidebar`** (ADR 0013). Same props, slots and behaviour.

- Svelte: `import Menu from "@design-system/svelte/Menu.svelte"` becomes `import Sidebar from "@design-system/svelte/Sidebar.svelte"`. The `MenuItem` and `MenuSection` types become `SidebarItem` and `SidebarSection`.
- Vue: `Menu`, `MenuProps`, `MenuEntry` and `MenuSection` become `Sidebar`, `SidebarProps`, `SidebarItem` and `SidebarSection`.
- The sidebar no longer reads its former theme names. Rename each one: `--ds-menu-gap` to `--ds-sidebar-gap`, `--ds-menu-width` to `--ds-sidebar-width`, `--ds-menu-bg` to `--ds-sidebar-bg`, `--ds-menu-border` to `--ds-sidebar-border`, `--ds-menu-item-text` to `--ds-sidebar-item-text`. `--ds-menu-padding` and `--ds-menu-radius` stay: the ARIA menus use them.

**The `-soft` color tokens are removed; use the role names.**

- `--ds-color-primary-soft` becomes `--ds-color-secondary-surface`.
- `--ds-color-on-primary-soft` becomes `--ds-color-on-secondary-surface`.
- `--ds-color-danger-soft` becomes `--ds-color-destructive-surface`.
- `--ds-color-on-danger-soft` becomes `--ds-color-on-destructive-surface`.

**Former message keys are removed from core's catalog, and an override of them no longer answers for the new key.**

- `menu.label` becomes `sidebar.label`.
- `searchDialog.resultOne` and `searchDialog.resultMany` become one plural message, `searchDialog.results`: `{ one: "{count} result available", other: "{count} results available" }`.
- `rating.star` (with `rating.stars` as its plural pair) becomes one plural message, `rating.stars`: `{ one: "{count} star", other: "{count} stars" }`.
