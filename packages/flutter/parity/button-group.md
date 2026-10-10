# ButtonGroup parity checklist

Reference commit: `6769c363dcefa3ea3e47fbe9a388d37dd5288597`

Reference paths: `core/src/button-group` `packages/svelte/src/lib/button-group`

The Flutter `ButtonGroup` checked against the Svelte `ButtonGroup`
(`packages/svelte/src/lib/button-group/ButtonGroup.svelte`) and the headless
button group in `core/src/button-group`: a named `role="group"` of action
buttons that holds no selection.
Docs page: [Button Group](https://dr2madre.github.io/invisible-ui/components/forms/button-group/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/button_group_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `ButtonGroup(semanticLabel:, children:)` | `label`, children | the group's name and its buttons |
| `attached`, `orientation` | the same names | as on the web |
| `crossAxisAlignment` | `align` | `start`, `center` (the default), `end`, `stretch` |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| No selection; each button is its own action and tab stop | matched | `a named group; each button stays its own action and tab stop` |

## Semantics

| Line | Status | Evidence or reason |
| --- | --- | --- |
| `role="group"` named by `label` | adapted | Flutter has no group role; a container named by `semanticLabel`, as the Toolbar: `a named group; each button stays its own action and tab stop` |
| Orientation as a styling hook only | matched | not announced on the web either |

## Look

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Attached: inner corners square, the group's ends rounded, neighbouring borders overlapping into one line | matched | `attached: square inner corners, rounded ends, borders overlapping into one line` |
| Attached: a focused button's ring stays above its neighbours | adapted | the web raises the focused button; Flutter paints later buttons over earlier ones, so a grouped button draws its ring inside its bounds |
| Attached: a composed control such as a Select joins too | out of scope | only `Button` reads the group's corners today |
| Spaced: 0.5rem apart, each button with its own corners; vertical stacks | matched | `spaced: buttons keep their own corners, 8 apart; vertical stacks` |
| Right to left mirrors the row and the rounded ends | matched | `right to left: the first button sits at the right with the rounded start corners` |

## Density, direction and text scaling

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A narrow group shrinks its buttons and wraps their labels instead of overflowing | matched | `a narrow group at text scale 2.0 wraps its labels instead of overflowing; 44 targets under touch`: flex shrinking, as on the web |
| Buttons keep the minimum target, 44 under touch | matched | same test |
