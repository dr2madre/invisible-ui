# 18. Components follow platform conventions and claim only verified accessibility

Date: 2026-10-17

## Status

Accepted by the maintainer. The principles were approved on 2026-10-11 and
completed during the decision review that ended on 2026-10-17. It applies to
every platform the project supports: core, the Svelte, Vue, React and custom
elements adapters, and the Flutter adapter. It extends decision 6 of
[ADR 0017](./0017-flutter-adapter.md), on idiomatic API names, from Flutter
to every adapter. The Flutter SDK lower bound it sets is recorded in ADR 0017
as decision 7.

## Context

While the React adapter reached the full catalog and the Flutter adapter
grew past half of it, five problems showed that "match the reference
implementation" is not enough as a rule:

- **A pattern that is not the standard one.** The web Toggle Button is a
  checkbox styled as a button. A screen reader announces "checkbox, checked"
  for a control that looks like a button. The WAI-ARIA Authoring Practices
  (APG) define a toggle button as a button with `aria-pressed`.
- **A failure copied for parity.** The solid warning Tag and Count pair text
  `#282420` with `#c96422`, a contrast of 3.9:1 for 13 px text where WCAG
  1.4.3 asks for 4.5:1. The Flutter adapter reproduced the pair to match the
  web.
- **A custom implementation where a native one exists.** Flutter radios
  group by a name inside a focus scope, because `RadioGroup` and `RawRadio`
  need Flutter 3.35 and the lower bound was 3.32. Timelog, the reason for
  that bound, already resolves dependencies that need Flutter 3.44.
- **A barrier on one input.** On the web, a Tree View branch has no way to
  expand or collapse under a touch screen reader, which sends a single
  activation per item.
- **Claims without the matching check.** Automated tests prove roles,
  states and keyboard paths. They do not prove what VoiceOver or TalkBack
  announce, and no manual session with assistive technology has run yet
  (see the A1 session in [`docs/evidence-register.md`](../evidence-register.md)).

## Decision

### 1. The user's experience comes first

When the goals conflict, the order is: correct behaviour for the person
using the component, then parity between platforms, then less code. Parity
never justifies a behaviour that is less accessible or harder to use. A
failure found in one adapter is fixed in every adapter, not copied into a
new one.

### 2. Platform conventions, native first

- A component follows the semantics, interaction model and conventions of
  the platform it runs on.
- A native component or API is preferred when it meets the functional and
  accessibility requirements. Flutter's own `Icon` and `AspectRatio` are
  examples: the package does not wrap them.
- A custom implementation needs a recorded reason: the requirement the
  native option does not meet.
- Platforms may differ where the platform's conventions differ, for example
  a navigation bar announced as a tab bar on iOS and Android and as a `nav`
  with `aria-current="page"` on the web. Each difference is stated and
  explained in the component's parity checklist or docs.

### 3. The shared specification is the reference

The normative source of a component's behaviour is its shared specification,
not the Svelte implementation or any other adapter. Svelte was the first
implementation, and many decisions taken while building it were meant for the
whole design system:

- general decisions on behaviour, interaction, state, semantics and
  accessibility that are recorded (ADRs, specs, docs pages, comments that state
  a rule with its reason) are shared requirements for every adapter, without a
  new approval, unless they conflict with an accessibility standard, another
  approved decision or this record;
- framework-specific details (API shape, runes, snippets, prop names) are not
  requirements;
- behaviour present in code but never recorded is not a requirement until the
  maintainer approves it.

Specifications are written progressively: a change to a component writes or
updates its shared specification in the same pull request. A limitation of one
adapter is never carried into another.

### 4. Behavioural parity, idiomatic names

Every adapter meets the same functional and accessibility requirements.
Property and method names follow each framework's conventions: `htmlFor`
and `useSyncExternalStore` in React, `onChanged` and `initialValue` in
Flutter. Parity covers behaviour and meaning, not names.

Where Flutter names clash with the widgets library or with Material, the
documented convention is a prefixed import,
`import 'package:invisible_ui/invisible_ui.dart' as iu;`, and every Flutter
example uses `iu.` so that it can be copied into an app that also imports
Material.

### 5. Accessible defaults, application-controlled behaviour

Invisible UI provides accessible, standards-based defaults and leaves
product decisions and user preferences to the application. Components
accept configuration, and no configuration removes an accessibility
guarantee.

- Defaults come from recognised standards, for example the first day of the
  week from Unicode CLDR for the locale and region, and the application can
  override them.
- The design system does not manage user preferences on its own. It
  respects the ones the application passes.
- A guarantee holds under every configuration. For example, the minimum
  touch target size does not depend on visual density: a compact component
  can look smaller, but its touch area keeps `min-target-size-touch`.

### 6. Acceptance criteria

A component is accepted against WCAG 2.2 AA and the APG pattern that
applies, with keyboard tests and, where relevant, tests with assistive
technology. An APG recommendation is followed unless a recorded reason says
otherwise. An optional APG feature is added when a need is identified.

### 7. Implementation and verification are separate

Each component records two things per platform:

- **Level of work:** implemented; automatically tested (semantics and
  interaction tests pass); accessibility verified (checked with real
  assistive technology on that platform).
- **Outcome of the assistive technology check:** not tested, passed or
  failed, with the version tested and the date. Known issues are listed,
  including suspected ones that are not yet tested.

An implemented component is not a verified component, and an automatically
tested component is not an accessibility verified one. A check that has not
run is recorded as not tested, never as failed or passed.

Release rule: a component is declared stable only on the platforms where it
passed the required checks. It is stable overall only when it passed them on
every platform the project declares as supported. A failure on one platform
does not block the platforms that passed.

The checks with assistive technology are run by people, with a checklist
for each component. Code can be merged while its check is pending, marked as
such.

### 8. Flutter SDK lower bound

The lower bound is Flutter 3.35 and Dart 3.9, the first release with
`RadioGroup` and `RawRadio` in the widgets library (ADR 0017, decision 7). The
bound rises again only when the package needs an API from a later release, and
that change names the API. The version an application uses, 3.44 for Timelog,
is not the package's lower bound.

## Consequences

- The evidence register gains a status per component and per platform, with
  the level of work, the outcome of the check, the version and the date. The
  frameworks page and each component page show it. Until a check runs, every
  component reads "not tested" for assistive technology.
- Parity checklists record each platform difference with its reason.
- Fixes found under this rule land in every adapter. The first ones landed in
  #462 and #463: the Toggle Button is a `<button aria-pressed>`, the solid
  warning label reaches 4.5:1 in both themes, Flutter radios use `RadioGroup`
  and `RawRadio`, and the dialog overlay and touch target size come from
  `packages/tokens/tokens.json`.
- Each component's shared specification grows as the component is changed;
  until it exists, the recorded decisions listed in decision 3 are the
  reference.
- Every pull request that adds or changes a component states its level of
  work and does not describe it as verified beyond the checks it ran.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Unicode CLDR](https://cldr.unicode.org/)
- [ADR 0011](./0011-state-and-callback-conventions.md),
  [ADR 0012](./0012-form-reset.md),
  [ADR 0016](./0016-feedback-while-a-dialog-is-open.md),
  [ADR 0017](./0017-flutter-adapter.md)
- [`docs/evidence-register.md`](../evidence-register.md)
