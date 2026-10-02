# 17. A Flutter adapter reimplements behaviour in Dart, held to the spec

Date: 2026-10-02

## Status

Accepted on 2026-10-02, with the maintainer's decisions recorded under
"Decisions taken" below. It supersedes the "Flutter: tokens only" row of
[`docs/next-adapter-strategy.md`](../next-adapter-strategy.md) and adds a
scoped exception to the rule "adapters stay thin, shared behaviour stays in
`core/`" in [AGENTS.md](../../AGENTS.md).

## Context

`core/` produces DOM-shaped prop bags: ARIA attributes and DOM event
handlers. Flutter paints its own pixels and has no DOM, so `core/` cannot
run there. Every adapter so far (Svelte, Vue, React, custom elements) is a
thin layer over `core/`; a Flutter adapter would be the first that carries
its own behaviour code.

Two Flutter desktop apps ask for it:

- **Timelog** (macOS, Windows, Linux; Italian, English and Arabic) moves
  its whole UI onto Invisible UI one component at a time. Its proposal,
  [`docs/proposals/flutter-adapter.md`](../proposals/flutter-adapter.md),
  lists the topics this record settles, the components in three waves, the
  editable grid requirements and an accessibility definition of done with
  44 by 44 targets.
- **Wireframe** replaces its own token generator and chrome widgets. It
  needs desktop density, 44 pt targets on tablet, a toolbar, menus with
  submenus and heavy keyboard use. Its first components are tokens, button,
  text field, menu and dropdown menu, toolbar, section header, tooltip,
  colour swatch and inspector blocks.

A third app, **Markdown Funk**, reads the token source directly and uses no
components. The source now lives at `packages/tokens/tokens.json`.

The discovery behind the decisions below, with sources, is in
[`docs/proposals/flutter-discovery.md`](../proposals/flutter-discovery.md).
In short: the design systems that serve Flutter and the web (the shadcn
ports, Carbon's framework packages, Spectrum's three implementations) keep
two implementations aligned through a shared specification and shared token
data; Flutter's Material and Cupertino libraries now ship as separate
packages, and the widgets layer has the primitives a headless adapter needs
(`Semantics`, `Shortcuts` and `Actions`, `OverlayPortal`, `RawMenuAnchor`,
`Form`).

The working guidance for the Flutter team, which adds the Flutter-specific
constraints and review criteria to this record, is in
[`docs/flutter-team-guidance.md`](../flutter-team-guidance.md).

## Decision

### 1. Behaviour parity without `core/`

The Svelte adapter is the reference implementation; the custom elements
adapter is complete too and serves as a second reading of the same
behaviour. A Flutter component is equivalent when it matches the reference
in states, variants, keyboard map, semantics, focus behaviour and
callbacks.

- **Spec first.** Each component ported to Flutter has a written behaviour
  spec: the APG pattern, the keyboard map, the focus rules, the states and
  the callbacks. Where a spec exists on the docs site or in `docs/` it is
  reused; where it is missing it is written once, for every platform, and
  reviewed with the web adapters in mind.
- **Parity checklist.** Each Flutter component ships a checklist in
  `packages/flutter/parity/<component>.md`: one line per state, variant,
  key, semantic property and callback of the reference, each marked as
  matched, adapted (with the platform reason) or out of scope. The
  checklist names the reference commit it was checked against.
- **Behaviour tests from the spec.** Every checklist line marked as
  matched has a widget test. Pure logic with a defined result (number
  parsing and normalization, calendar grids, typeahead matching, keyboard
  map tables) is also written as language-neutral JSON test vectors, read
  by the `core/` tests and by the Flutter tests, so both implementations
  answer the same cases.
- **Drift.** A check in the Flutter workflow compares each checklist's
  reference commit with the last commit that touched the reference
  component in `core/` and `packages/svelte`. A newer change marks the
  checklist as out of date in the workflow summary, and the component is
  reviewed against it. Changed test vectors fail the Flutter tests
  directly.

**Recommendation:** spec plus checklist plus shared test vectors, with the
drift check reporting rather than blocking.

Alternatives considered: running `core/` in Flutter through a JavaScript
engine or a web view (adds a runtime and a bridge to every interaction, and
the core still produces DOM props); compiling the core to Dart (no
maintained TypeScript to Dart compiler, and the output would still be
DOM-shaped); parity by review alone (no record of what was compared).

### 2. State and callbacks

The rules of [ADR 0011](./0011-state-and-callback-conventions.md) apply to
behaviour unchanged; the wiring and the names are idiomatic Dart and Flutter.
Parity with the web adapters covers behaviour and meaning, not necessarily
property names.

- **Controlled and uncontrolled.** A stateful widget has a controlled
  constructor, `Switch(value: …, onChanged: …)`, and an uncontrolled
  named constructor, `Switch.uncontrolled(initialValue: …, onChanged: …)`. Two constructors keep `null` usable as a value: an empty
  `NumberField` is `value: null`, distinct from `0`, in both modes.
- **Reflection never emits.** `didUpdateWidget` applies a changed `value`
  to the internal state and calls no callback. It compares the new value
  with the previous widget's value, never with the internal state, which is
  the give-back guard of ADR 0011 (the same rule as Svelte's `lastX`).
- **Report after commit, once per action.** The widget calls `setState`
  first and the callback afterwards. One user action calls each callback at
  most once, and only when its own piece of state moved. A menu is closed
  before it reports the chosen item.
- **Live replacement.** Callbacks are read from `widget` at call time,
  never stored in `initState`.
- **Names.** Idiomatic Flutter names, not the web prop names: `onChanged`
  for a value control (where the web says `onValueChange`), `initialValue`
  for the uncontrolled default (`defaultValue`), `onSelected` for menus and
  segmented choices, `onPressed` for buttons, and the names Flutter's own
  widgets use for open state and enabled state. Each component's parity
  checklist maps its Flutter names to the ADR 0011 names, so the behaviour
  stays comparable.
- **Text and values.** Draft and committed value stay apart; the draft
  commits on blur, Enter or a step action; Escape reverts it and is
  consumed only when it undid something, so an enclosing dialog still
  receives it. Typed input is reported with its validity, never clamped.
- **Form reset.** [ADR 0012](./0012-form-reset.md) maps to Flutter's
  `Form`. Each value control is usable as a `FormField`; `FormState.reset()`
  restores the current default (the last `value` passed, under the same
  give-back rule) and calls no change callback.

**Decision:** two constructors per stateful widget, idiomatic Flutter names
mapped to ADR 0011 in each parity checklist, form reset in scope through
`FormField`.

Alternatives considered: the ADR 0011 names in Dart (one vocabulary across
adapters, but foreign to Flutter developers, who expect `onChanged`);
controller
objects for every value, in the style of `TextEditingController` (more
code for each consumer and a second source of truth; text widgets may
accept a controller as well, see the open questions); declaring form reset
out of scope (ADR 0012 binds every future adapter before its form controls
are called equivalent).

### 3. Semantics, keyboard and announcements

- **Roles and states.** Each ARIA role and state of the reference maps to
  `Semantics` (`SemanticsRole`, `label`, `value`, `hint`, `selected`,
  `checked`, `expanded`, `enabled`, `focused`). Label, description and
  error of a `Field` are part of the control's semantics node. The parity
  checklist records each mapping. Where Flutter has no role (`grid`,
  `gridcell`) the spec says which roles and announcements replace it.
- **Keyboard.** The APG keyboard map of the reference is implemented with
  `Shortcuts`, `Actions` and `FocusableActionDetector`. Arrow keys follow
  `Directionality`, so they mirror under right-to-left. Escape closes an
  overlay and focus returns to the element that had it when the overlay
  opened, falling back to the trigger.
- **Focus visibility.** The focus ring shows when
  `FocusManager.instance.highlightMode` is `traditional` (keyboard), the
  equivalent of `:focus-visible`, and is never removed.
- **Live regions.** Announcements go through `SemanticsService` with the
  polite or assertive level of the reference, using `sendAnnouncement` with
  the widget's `View` so a multi-window app announces in the right window.
  Persistent regions use `Semantics(liveRegion: true)`.
- **Dialogs and feedback.** [ADR 0016](./0016-feedback-while-a-dialog-is-open.md)
  applies as written: a status area in every dialog with `notify`,
  `dismissNotice` and `clearNotices`; the notification region holds new
  notifications while a modal is open; a dialog opened on top returns focus
  to the element in the dialog below.
- **Preferences.** Text scale (`MediaQuery.textScalerOf`), high contrast
  (`MediaQuery.highContrastOf`) and reduced motion
  (`MediaQuery.disableAnimationsOf`) map to the same behaviour as the web
  media queries.

Screen reader behaviour on macOS, Windows and Linux is a manual check. Per
[`docs/evidence-register.md`](../evidence-register.md), it is written as
not yet verified until a dated session exists.

**Recommendation:** adopt the mapping above as the accessibility contract,
with Timelog's definition of done (keyboard paths, semantics, RTL, text
scale 2.0, `meetsGuideline`) as the test floor for every component.

### 4. Dependencies: the widgets layer only

The package imports `package:flutter/widgets.dart` and the libraries below
it (`services`, `semantics`, `painting`, `foundation`), never Material or
Cupertino. Icons are passed in as widgets; no icon font is bundled.
Consumers can set `uses-material-design: false`.

The cost is highest for menus and the toolbar:

- `RawMenuAnchor` gives anchoring, overlay placement, open and close
  through `MenuController`, and nested anchors for submenus.
  `RawMenuAnchorGroup` gives a menu bar container. Neither defines keyboard
  traversal: arrow keys between items, opening a submenu with the arrow
  toward it and closing it with the arrow away, typeahead, Home and End,
  and focus return. The adapter writes that, once, in a shared menu
  keyboard layer used by Dropdown Menu, Context Menu, Menubar and
  submenus.
- The toolbar needs roving focus within a `FocusTraversalGroup` and the
  APG toolbar keys; no Material widget would remove that work.
- Material's `MenuAnchor` and `SubmenuButton` bring that traversal, with
  Material styling and focus rules that would then need to match the
  reference anyway.

**Recommendation:** widgets layer only. Material and Cupertino now ship as
separate packages (`material_ui`, `cupertino_ui`), so depending on them adds
a package with its own release schedule to every consumer, and the menu
traversal written for the adapter follows the APG map of the reference
directly.

Alternatives considered: build menus on Material and the rest on widgets
(Material styles and behaviours leak into a headless package, and every
consumer installs `material_ui`); a third-party headless kit (adds an
external release schedule and its own behaviour rules).

### 5. Tokens and theme

- **Source.** Dart tokens are generated from `tokens.json` in this
  repository. Today that file holds the palette, the `style` tier and the
  radii; the roles components use (surfaces, text, borders, tints, light
  and dark remapping, control sizing, type scale, focus ring) live in
  `tokens.css`. Before the Flutter tokens are generated, those roles move
  into `tokens.json` as a role tier with light and dark modes, in their own
  pull request, with the parity test extended to cover them. Existing token
  paths keep their names, since Markdown Funk reads them.
- **Generator.** The Style Dictionary build already in the repository gains
  a Dart platform with a format written here. The format writes typed light
  and dark token classes to `packages/flutter/lib/src/tokens/` and imports
  `dart:ui` only. The generated file is committed, because git consumers
  get no build step.
- **Staleness.** `pnpm tokens:check` regenerates the Dart output and fails
  when it differs from the committed file. It runs in `pnpm gate` and needs
  no Flutter.
- **Theme.** `InvisibleTheme` is an `InheritedWidget` holding
  `InvisibleThemeData`: colours, radius, type, density, focus ring and
  messages. `InvisibleThemeData.light()` and `.dark()` come from the
  generated tokens; `copyWith` and `merge` take partial overrides; a nested
  `InvisibleTheme` overrides a subtree, as a `--ds-*` variable set on an
  element does on the web. The consumer picks light or dark, or follows
  `MediaQuery.platformBrightnessOf`. The consumer sets the font family.
- **Density.** Density is a theme dimension with three levels: `compact`
  (desktop pointer use, Wireframe), `regular` (the default, matching the
  web) and `touch` (tablet). It sets control height, padding and gaps from
  a density tier in `tokens.json`. Target size is a separate rule:
  `minTargetSize` is 24 by 24 under `compact` and `regular` (WCAG 2.5.8)
  and 44 by 44 under `touch` (Apple's default for iPadOS). The hit area is
  never smaller than `minTargetSize`, even when the painted control is
  smaller, and every control sizes with minimum constraints only, so it
  grows with its content and with text scale. Timelog's 44 by 44 rule on
  desktop is a theme setting (`minTargetSize: Size(44, 44)`), applied
  without changing density.
- **Focus ring.** Width, offset and halo come from the role tier; the ring
  colour is `style.focus.onDark` in dark mode and the light-mode role in
  light mode, as in `tokens.css`.

**Recommendation:** Style Dictionary with a custom Dart format, the role
tier and a density tier added to `tokens.json` first, `InvisibleTheme` as
an `InheritedWidget`, density and minimum target size as two settings.

Alternatives considered: Style Dictionary's stock `flutter/class.dart`
format (one flat class, no light and dark pair, no theme object); a
standalone generator script (a second token pipeline to maintain); reading
the docs token registry, which already resolves light and dark values (it
is a docs artifact derived from the stylesheet, so the stylesheet would
become the source for Flutter); `ThemeExtension` (Material); a single
density setting that also sets the target size (one of the two consumers
would get the wrong size).

### 6. Scope and order

- **On demand, never app-specific.** A component is ported when a
  consumer needs it, and only in a form any app can use. App strings, data
  and logic stay in the app.
- **Specified once.** A component missing on the web (the editable grid,
  submenus, a section header, a colour swatch) gets one spec for every
  platform before any Flutter code. Submenus extend the shared menu spec
  in `core/`, so the web menus gain them too.
- **Inspector blocks.** These look like a composition of Collapsible or
  Accordion, Field and value controls. They stay in Wireframe unless the
  spec work finds a generic pattern.
- **One merged first wave**, from what both teams need first:

  | Group | Components |
  | --- | --- |
  | Foundations | Tokens, `InvisibleTheme` (light and dark, density, target size), focus ring, messages and locale, directionality |
  | Controls | Button (including icon-only with a required name, for the toolbar), Field, TextField, Textarea, NumberField |
  | Overlays and chrome | Tooltip, Toolbar, Dropdown Menu with submenus |
  | Feedback | InlineNotification, Notification, Loading, EmptyState, ErrorState |

  Card, Collapsible and the spec work for section header and colour swatch
  follow; then Timelog's wave 2 and wave 3 in its order. The editable grid
  spec is written once for every platform and the web Data Table gains it
  when the maintainer schedules it.
- **Roadmap.** React's full catalog (item 14) and Flutter (item 15) run in
  parallel. The shared groundwork comes first: the token file in a neutral
  path, the role, sizing, focus and density tiers in it, and the submenu
  spec. Then the two implementations proceed separately.

**Recommendation:** the merged first wave above, with the token tiers and
the submenu spec as prerequisites.

### 7. Package and distribution

- `packages/flutter`, Dart package `invisible_ui`, MIT, with its own
  `LICENSE` and `README.md` so a git checkout of the folder stands alone.
- Consumers depend on it by git, pinned to a commit:

  ```yaml
  dependencies:
    invisible_ui:
      git:
        url: https://github.com/<owner>/invisible-ui.git
        path: packages/flutter
        ref: <commit>
  ```

  A local `dependency_overrides` path is used only while a component and a
  consumer screen are developed together, and is never committed.
- No path dependency outside `packages/flutter` and no pub workspace
  setting the package needs to resolve. Generated files are committed.
- No pub.dev publishing: the project publishes no packages today.
- **SDK constraint.** `sdk: ^3.8.0`, so Timelog is not excluded. It is
  raised only when the package needs an API available in a later release,
  and that change names the API. The menus are tested on both sides of the
  Flutter 3.44 change to the close order of `RawMenuAnchor` while the lower
  bound sits below it.

Alternatives considered: `sdk: ^3.12.0` with `flutter: ">=3.44.0"` (one menu
behaviour to test, but it excludes Timelog with no API need); a separate
repository (loses the shared review, token source and spec in one pull
request).

### 8. Contribution model

- This record belongs to the Invisible UI team.
- After acceptance, Timelog and Wireframe contributors work only inside
  `packages/flutter`, under AGENTS.md and CONTRIBUTING.md: a branch per
  change, Conventional Commits, a human author who owns each change, one
  component per pull request naming the screen it unblocks, with tests and
  the parity checklist.
- Changes outside `packages/flutter` (specs, `tokens.json`, the generator,
  CI, docs, ADRs) are requested from the maintainer as issues.
- The maintainer reviews and merges every pull request. `CODEOWNERS` names
  the maintainer for `packages/flutter`.
- Bugs and missing states come back as issues against the adapter, never
  as patches inside a consumer app.

**Recommendation:** as above. CONTRIBUTING.md, which keeps code changes
with the maintainer during the alpha, gains a section for this scoped
exception when the record is accepted.

### 9. CI

- **Token staleness** runs in `pnpm gate` (Node only), so every
  contributor gets it without installing Flutter.
- **A separate workflow**, `.github/workflows/flutter.yml`, runs on pull
  requests that touch `packages/flutter/**`, `tokens.json` or the
  generator: `dart format --set-exit-if-changed`, `flutter analyze` and
  `flutter test` (widget tests for keyboard paths, semantics, RTL, text
  scale 2.0 and `meetsGuideline`), plus the parity drift report. It pins
  the Flutter version to the SDK lower bound. `scripts/gate.test.mjs` holds
  `ci.yml` to one job, so this check needs its own file, as `e2e.yml` and
  `visual.yml` do. It becomes a required check for pull requests that touch
  the package.
- **Golden tests** start later, for the focus ring and the density levels,
  in a pinned Linux container and dispatched by hand like `visual.yml`,
  because font rendering differs between operating systems.
- **Locally,** Flutter is opt-in: only contributors to `packages/flutter`
  need it.

**Recommendation:** staleness in the gate, Flutter checks in their own
path-filtered workflow, goldens later and opt-in.

### 10. Docs

- Each public widget carries dartdoc comments that follow the code-comment
  rules of CONTRIBUTING.md.
- `packages/flutter/README.md` lists the shipped components, each with its
  parity status and a link to its checklist and to the component's page on
  the docs site.
- The frameworks page of the docs site lists Flutter with the same table.
  A Flutter tab in the component pages' API tables needs a Dart extractor
  in `scripts/generate-api.mjs`; it is listed as an open question.

**Recommendation:** dartdoc plus the package README now, a frameworks-page
entry, and the docs-site tab when the extractor exists.

## Consequences

- The project carries a second implementation of behaviour. Every change to
  a ported component's behaviour now has a Flutter side: the drift report
  names it, and the checklist is updated in a follow-up pull request.
- `tokens.json` moves to `packages/tokens/tokens.json` and becomes the
  source for the role, sizing, focus and density tiers, which the web
  adapters use as well. Markdown Funk updates its path in the same change.
- The shared menu spec gains submenus and the project gains an editable
  grid spec, both for every platform.
- ADR 0011, 0012 and 0016 bind the Flutter adapter. A Flutter component is
  not called equivalent until its checklist shows them.
- CI gains a workflow that only contributors to `packages/flutter` need to
  run locally.
- Product looks stay with the products: a consumer's visual choices
  (Markdown Funk's selection band, borderless buttons, light field borders)
  ship as a theme or preset, not as new defaults.

## Decisions taken

Recorded by the maintainer on 2026-10-02:

1. **Order.** React and Flutter run in parallel. The shared work on tokens,
   roles and submenus comes first; then the two implementations proceed
   separately.
2. **Token tiers.** The roles, sizes, focus ring and density move into
   `tokens.json`. When the values stay the same this is not a visual design
   change: it corrects the source of truth.
3. **Token file location.** `tokens.json` moves to a neutral path,
   `packages/tokens/tokens.json`, because several implementations use it.
   Markdown Funk updates its path in the same change.
4. **SDK lower bound.** `^3.8.0`, until the package needs an API that only
   a later release has. Timelog is not excluded without a reason.
5. **Product looks.** Markdown Funk's choices (a selected item with a fill,
   a 2 px band and bold text; borderless buttons; light field borders) ship
   as a theme or preset, not as new global defaults. Invisible UI shares
   behaviour, accessibility and semantic tokens; it does not impose one look
   on every product.

Recorded by the maintainer on 2026-10-03:

6. **API names.** Flutter APIs are idiomatic Flutter APIs. Parity with the
   web adapters covers behaviour and meaning, not necessarily property names
   (for example `onChanged` where the web says `onValueChange`).

## Open questions, not blocking

1. **Desktop target size.** Is 24 by 24 under compact and regular density
   the right floor for desktop, with 44 by 44 under touch and as Timelog's
   explicit setting?
2. **New components.** Is a section header a catalog component or a
   heading plus actions in the app? Is a colour swatch a component on its
   own now, ahead of the Color Picker the backlog lists as later?
3. **Text controllers.** Should text widgets accept a
   `TextEditingController` beside `value` and `defaultValue`?
4. **Docs site.** Is a Flutter tab in the component pages wanted, and
   when?
5. **Golden tests.** Wanted at all, and on which platform?
6. **Contributor access.** Do Timelog and Wireframe contributors open pull
    requests from forks or from branches in this repository?

## References

- [`docs/proposals/flutter-adapter.md`](../proposals/flutter-adapter.md):
  the Timelog proposal.
- [`docs/proposals/flutter-discovery.md`](../proposals/flutter-discovery.md):
  discovery and sources.
- [`docs/next-adapter-strategy.md`](../next-adapter-strategy.md) and
  [`docs/technical-roadmap.md`](../technical-roadmap.md), items 14 and 15.
- [ADR 0011](./0011-state-and-callback-conventions.md),
  [ADR 0012](./0012-form-reset.md),
  [ADR 0016](./0016-feedback-while-a-dialog-is-open.md).
- [RawMenuAnchor](https://api.flutter.dev/flutter/widgets/RawMenuAnchor-class.html),
  [RawMenuAnchor close order](https://docs.flutter.dev/release/breaking-changes/raw-menu-anchor-close-order),
  [OverlayPortal](https://api.flutter.dev/flutter/widgets/OverlayPortal-class.html),
  [SemanticsRole](https://api.flutter.dev/flutter/dart-ui/SemanticsRole.html),
  [SemanticsService](https://api.flutter.dev/flutter/semantics/SemanticsService-class.html),
  [Actions and shortcuts](https://docs.flutter.dev/ui/interactivity/actions-and-shortcuts),
  [AccessibilityGuideline](https://api.flutter.dev/flutter/flutter_test/AccessibilityGuideline-class.html).
- [Migrate to material_ui and cupertino_ui](https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui),
  [What's new in Flutter 3.44](https://flutter.dev/blog/whats-new-in-flutter-3-44).
- [WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility),
  [Spectrum platform scale](https://spectrum.adobe.com/page/platform-scale/).
- [Style Dictionary formats](https://styledictionary.com/reference/hooks/formats/predefined/),
  [Pub dependencies](https://dart.dev/tools/pub/dependencies).
- [shadcn_flutter](https://pub.dev/packages/shadcn_flutter),
  [shadcn_ui](https://pub.dev/packages/shadcn_ui),
  [Carbon community frameworks](https://carbondesignsystem.com/developing/community-frameworks/other-frameworks/),
  [Bits UI](https://bits-ui.com/docs/introduction).
