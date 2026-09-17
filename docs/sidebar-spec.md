# Sidebar

The application's side navigation: the component formerly called `Menu`, under
its own name, with collapsible sections, a rail and a drawer. Decided in
ADR 0013; this file is the design record behind it.

## What it composes, extends and replaces

- **Composes**: the headless collapsible (each section), Sheet Dialog (the
  drawer), Tooltip (names in the rail) and Icon. Destinations are plain `<a>`
  and `<button>` elements, not a Link component: a link here is whatever the
  application's router hands it.
- **Extends**: the `Menu` organism that already carried this pattern, which
  gains the sections, the rail and the drawer.
- **Replaces**: `Menu` as the name of that organism, freeing the word for the
  WAI-ARIA menu family it collides with.
- **Leaves untouched**: Navigation Menu (a horizontal site-navigation bar with
  hover panels), Menubar (the application menu bar), Dropdown Menu and Context
  Menu (actions over `core/menu`).

## The boundary

The application owns the routing, the current destination (`value`), the
breakpoint policy (`mode`), persistence of the rail and whatever the header
and footer slots hold. The component owns the landmark and its name, the list
structure, the disclosures, the rail toggle, the drawer's focus and dismissal,
the `data-*` hooks and the scroll region. It reads no media query.

## The comparison this was built against

Primary sources, read in September 2026:

- [shadcn/ui Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- [Carbon UI shell left panel](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/)
  and its maintainers' record of the rail's behaviour in
  [carbon#12323](https://github.com/carbon-design-system/carbon/issues/12323)
- [Adobe Spectrum side navigation](https://spectrum.adobe.com/page/side-navigation/)
  and [Spectrum Web Components sidenav](https://opensource.adobe.com/spectrum-web-components/components/sidenav/)
- [Atlassian Side Navigation](https://atlassian.design/components/side-navigation/examples),
  deprecated in favour of a whole navigation system, used only as an
  evolutionary counter-example

| Decision | Observed | Who | Principle | Ours |
| --- | --- | --- | --- | --- |
| Compound parts API | Provider, Header, Content, Footer, Group, Menu, Trigger, Rail, Inset | shadcn | Data-driven items with slots | Rejected: sections as data, slots for the rich parts |
| Icon-only rail | `collapsible="icon"`; `isRail` | shadcn, Carbon | Responsiveness; the name must survive | Adopted as `collapsed`, names kept in the accessibility tree |
| Rail expands on hover | Reveals on hover or focus, collapses on leave | Carbon | No hover-only affordance | Rejected: their own tracker records no Escape, unreachable second level, collapse on pointer leave |
| Mobile is a sheet | Mobile renders the sidebar as a Sheet | shadcn | Prefer behaviour the platform already gets right | Adopted (ADR 0013) |
| Persistence, global shortcut | Cookie, `cmd/ctrl+b` | shadcn | Policy belongs to the application | Rejected |
| Hierarchy depth | "does not support three tiers"; three via `multilevel` | Carbon, Spectrum | Intentionally narrow until evidence | Two tiers, Carbon's rule |
| Current item | `aria-current="page"`; `isActive` | Spectrum, shadcn | Accessibility first | `aria-current="page"` plus `data-current` |
| Ancestors of the current open | Selecting expands the path | Spectrum | Never hide where the user is | Adopted, uncontrolled only (ADR 0013) |
| Roving tabindex | `manage-tab-index` + arrows | Spectrum (opt-in) | Navigation is links | Rejected: plain Tab |
| Icon rules | Icons on the first level only | Spectrum | Guidance, not policing | Documented, not enforced |
| Long labels | `overflow-wrap: break-word` | Spectrum | Reflow and zoom | Adopted |
| RTL | `dir` plus data-attribute selectors | shadcn | Logical properties repo-wide | Rejected: `side="inline-start \| inline-end"` |
| Drag-resize, floating/inset | `SidebarRail`, `variant` | shadcn | Layout is the application's | Out of v1 |
| Who owns the breakpoint | The provider detects mobile | shadcn, Carbon | The application's policy | Rejected: `mode` |

## Migration contract

`Menu` keeps, until the removal one release cycle later:

| Surface | Kept |
| --- | --- |
| Import | `@design-system/svelte/Menu.svelte`; `Menu` from `@design-system/vue` |
| Props | `sections`, `value`, `label`, `onSelect`, with the same defaults |
| Types | `MenuItem` / `MenuEntry` and `MenuSection`, aliased to the Sidebar types |
| Slots | `logo`, `footer` |
| Behaviour | the landmark and its name, `aria-current="page"`, links for items with `href`, one `onSelect` per activation |
| i18n | an override of `menu.label` still answers for the landmark |
| Tokens | every `--ds-menu-*` the organism used still themes it |

Not kept: the class names, which the stability policy has never treated as
public surface.

## Tokens, one by one

| New | Legacy fallback | Legacy token's own future |
| --- | --- | --- |
| `--ds-sidebar-gap` | `--ds-menu-gap` | sidebar only, retired with the alias |
| `--ds-sidebar-width` | `--ds-menu-width` | sidebar only, retired with the alias |
| `--ds-sidebar-bg` | `--ds-menu-bg` | sidebar only, retired with the alias |
| `--ds-sidebar-border` | `--ds-menu-border` | sidebar only, retired with the alias |
| `--ds-sidebar-item-text` | `--ds-menu-item-text` | sidebar only, retired with the alias |
| `--ds-sidebar-padding` | `--ds-menu-padding` | **stays canonical** for Dropdown Menu, Context Menu, Menubar |
| `--ds-sidebar-radius` | `--ds-menu-radius` | **stays canonical** for Dropdown Menu, Menubar |
| `--ds-sidebar-rail-width` | none (new) | — |
| `--ds-sidebar-item-radius` | none (new) | — |

`--ds-menu-min-width`, `--ds-menu-popup-radius`, `--ds-menu-trigger-padding`
and `--ds-menu-z-index` belong to the ARIA menus alone and are untouched.

## i18n precedence

For the landmark name, in order: an override of `sidebar.label`, then an
override of the legacy `menu.label`, then the catalog's `sidebar.label`, then
the key. The legacy catalog entry never wins over the new one; only a
consumer's override does. `sidebar.collapse`, `sidebar.expand` and
`sidebar.open` are new and have no legacy spelling.

## State ownership

| State | Uncontrolled | Controlled |
| --- | --- | --- |
| `openGroups` | the component keeps the set; the section holding the current destination opens whenever that section changes, by `value` moving or by `sections` changing, silently | the application decides; a press reports and changes nothing; neither a `value` change nor a `sections` change moves anything or reports anything |
| `collapsed` | no toggle is rendered | `onCollapsedChange` given: the toggle appears and reports every press |
| `open` (drawer) | closed | the application drives it; `closeOnNavigate` reports a close when a destination is followed |

## Two contracts worth naming

**`openGroups` is a deliberate exception to ADR 0011.** Controlled, a press
reports the request and leaves the visible state alone. Every other control
here answers its own press; this one waits, because two sections opening at
once is worse than a press that waits.

**Handing the set back is supported.** The component's own copy follows
`openGroups` while the application controls it, so passing `undefined`
afterwards continues from the set on screen.

## Identity and the rail, in one line each

A collapsible section must carry an `id`: it is the name the section answers to
in `openGroups`, and a label is not an identity. Missing or repeated ids throw
in development; in production every section still ends up with a name of its
own, the first claim winning and anything else taking a numbered spelling of
what it asked for.

The rail is offered only when every destination carries an icon. Otherwise
collapsing would leave controls with an accessible name and nothing to see, so
the toggle is not rendered, `collapsed` keeps the labels, and development says
why.

## Excluded from v1

Flyouts in the rail, three tiers, drag-resize, hover-to-expand, persistence,
router integration, multi-sidebar coordination, an app-shell layout component.
