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
destination opens by itself, and no callback is reported for it: it is not the
user opening a section. That section is recomputed whenever the current
destination moves **and** whenever the sections themselves change, because a
destination hidden inside a closed section is the same problem either way.
Controlled (`openGroups` given), the application decides everything: a press is
reported and changes nothing on its own, and neither a change of the current
destination nor a change of the sections moves anything or reports anything.

**`openGroups` is a deliberate exception to ADR 0011's controllable mirror.**
Every other control here answers its own press and reports it once. This one
does not: while the set is controlled, a press emits the request and leaves the
visible state alone, because two sections opening at once is worse than a press
that waits for an answer. The exception is written here so it is a decision and
not an inconsistency.

**Handing the set back is supported.** While the application controls
`openGroups`, the component keeps its own copy in step with it, so passing
`undefined` afterwards continues from the set that was on screen rather than
from whatever the component held before the application took over. That is a
contract, not an accident, and it has a test.

**A collapsible section needs an id.** The id is the name the section answers
to in `openGroups`; a label is not an identity, and two sections that share one
would open together. The type requires it for `collapsible: true` and leaves
plain sections exactly as they were, which is what the former name shipped.
A missing or repeated id is a consumer mistake: development throws, and
production falls back deterministically and never shares. A section with no id
answers to its position, a name already claimed stays with the section that
claimed it first, and anything else takes a numbered spelling of what it asked
for. Plain sections claim their names too, because the rendered list is keyed
by them.

**The rail is only offered when every destination shows something.** Collapsing
hides the labels, so a destination with no icon would be an empty control with
an accessible name and nothing to see. Rather than invent a glyph or an
initial, the component declines: with any destination lacking an icon no rail
toggle is rendered, a `collapsed` sidebar stays open with its labels, and
development says why.

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
