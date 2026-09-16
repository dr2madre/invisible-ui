# 13. The side navigation is Sidebar, and a navigation drawer is a sheet

Date: 2026-09-16

## Status

Accepted. Implemented in Svelte and Vue; React and Elements gain it through
the adapter parity track, not here.

## Context

The component that carries an application's side navigation shipped as `Menu`.
That name already belongs to the WAI-ARIA menu family: `core/menu` is the menu
button pattern (`role="menu"`, roving focus, actions that run and close), and
Dropdown Menu, Context Menu and Menubar are built on it. The side navigation
never used that primitive. It renders a `<nav>` landmark of links and marks the
current destination with `aria-current="page"`, which is a different thing
under the same word, in the same package.

The backlog asked for a Sidebar as the next component. Building one beside the
existing `Menu` would have produced a third thing: the two would have differed
only in the parts nobody had got round to yet.

Three questions had to be settled before any of it could be written.

**Where the mobile presentation comes from.** A navigation drawer needs a focus
trap, Escape, a light dismiss and a return of focus. The dialog family already
has all four, and Sheet Dialog is anchored to an edge. Its documentation says a
sheet holds "a task the user finishes or cancels in context", which a drawer
stretches: going somewhere is a task, but not the kind that sentence had in
mind.

**Where the button that opens it lives.** Every dialog in this repository
renders its own trigger, and focus returns to it on close. An application
header is exactly where a hamburger belongs, and it is not inside the
navigation.

**Who owns which section is open.** The current destination belongs to the
application. A section holding the current destination should be open, or the
page hides where the user is. Both cannot be authorities over the same state.

## Decision

**The side navigation is `Sidebar`. `Menu` stays as a deprecated alias.** Same
props, same slots, same behaviour, same `--ds-menu-*` themes, until the removal
one release cycle later (`docs/api-stability.md`). The catalog keeps
`menu.label`, and an override of it still answers for `sidebar.label`, so a
consumer who translated the old key keeps its translation. New tokens are
`--ds-sidebar-*`, each falling back to its legacy name one by one:
`--ds-menu-padding` and `--ds-menu-radius` stay canonical for the ARIA menus,
which share them, and are read only as fallbacks here.

**A navigation drawer is a Sheet Dialog.** The alternative was a second
implementation of modality inside a `<nav>`, which is how drawers become
inaccessible. The sheet's purpose widens to include navigation; everything else
about it is unchanged.

**A Sheet Dialog can leave its trigger to the page.** `renderTrigger={false}`
renders no button, the consumer drives `open`, and `returnFocusTo` names the
element focus goes back to. Without that name focus returns to whatever held it
when the panel opened, which is right when a button opened it and wrong when
anything else did. The other dialog variants keep their trigger: this is the
one place the page owns that button.

**One authority per state.** Uncontrolled, the section holding the current
destination opens by itself, whenever the current destination moves, and no
callback is reported for it: it is not the user opening a section. Controlled
(`openGroups` given), the application decides everything: a press is reported
and changes nothing on its own, and a change of the current destination moves
nothing and reports nothing.

## Consequences

The word "menu" means one thing again. A consumer migrating changes an import
and nothing else; a consumer who does not migrate keeps working until the
removal, and the deprecation is recorded in the component's own declaration,
its documentation page and a changeset.

The dialog family now has one variant that can be driven entirely from
outside. That is a widening of its contract, so it is written here rather than
left as a prop nobody agreed to.

A sidebar that is told nothing about groups behaves well by default, and a
sidebar that is told everything never argues. The cost is that `openGroups`,
once given, must keep being given: handing it back as `undefined` returns the
component to its own set, which by then is whatever it last held.
