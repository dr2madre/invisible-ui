---
"@invisible-ui/svelte": minor
"@invisible-ui/vue": minor
"@invisible-ui/react": minor
"@invisible-ui/elements": minor
---

Add a component tier of background tokens, so each kind of component can
change its background without touching the others. `tokens.css` defines
`--ds-page-background`, `--ds-card-background`,
`--ds-card-secondary-background`, `--ds-dialog-background`,
`--ds-popover-background`, `--ds-menu-background`,
`--ds-sidebar-background` and `--ds-code-block-background`, each pointing at
a role or a palette colour. Cards, dialogs (Dialog, Sheet, Alert, Confirm,
Prompt, Search), popovers (Popover, Hover Card, date picker popups,
Navigation Menu panel), menus and listboxes (Dropdown Menu, Context Menu,
Menubar menus, Combobox, Multi Select), the Sidebar and the Code Block read
them.

The palette gains Black, `--ds-black`, `#121212`, a near black beside White,
and `--ds-brand-black` now points at it. In the dark theme the page and the
sidebar take Black; cards, dialogs, popovers, menus and code blocks take
Grey 950; the secondary card takes Grey 900. `--ds-color-background` stays
Grey 900 in the dark theme for fields, buttons and the other controls.

The light theme keeps its look, except the Multi Select listbox, which now
takes White like the other listboxes instead of `--ds-color-surface`.

Breaking: `--ds-card-bg`, `--ds-card-secondary-bg`, `--ds-sidebar-bg` and
`--ds-code-block-surface` are renamed to `--ds-card-background`,
`--ds-card-secondary-background`, `--ds-sidebar-background` and
`--ds-code-block-background`. In Flutter, `InvisibleColors.codeBlockSurface`
is renamed to `codeBlockBackground`, and `InvisibleColors` gains
`pageBackground`, `cardBackground`, `cardSecondaryBackground`,
`dialogBackground`, `popoverBackground`, `menuBackground` and
`sidebarBackground`.
