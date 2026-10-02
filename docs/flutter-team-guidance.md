# Flutter team guidance

**Purpose:** provide only the Flutter-specific guidance that is not already covered by the existing Invisible UI ADRs, agents, design-system rules, and cross-framework review process.

## 1. Implementation principle

The Flutter implementation should be a native Dart/Flutter implementation of the same Invisible UI contract.

Share:

- design tokens;
- semantic roles;
- component behavior specifications;
- accessibility requirements;
- keyboard behavior;
- state models;
- acceptance criteria.

Do not try to share the Svelte/Vue/Elements/React implementation code with Flutter.

Parity means equivalent behavior and semantics, not identical internal code or pixel-for-pixel implementation.

## 2. Flutter foundation

Prefer Flutter's lower-level widget foundation rather than building Invisible UI on top of Material or Cupertino visual components.

Use Flutter primitives and platform APIs directly where appropriate, for example:

- `widgets.dart`;
- `Focus` / `FocusNode`;
- `Shortcuts` / `Actions`;
- `Semantics`;
- pointer, hover and gesture APIs;
- `RawMenuAnchor` for menu/submenu foundations where appropriate.

The goal is to keep Invisible UI visually independent while still using Flutter-native interaction and accessibility mechanisms.

## 3. Tokens

The shared source of truth is:

`packages/tokens/tokens.json`

Flutter should consume generated, typed Dart tokens from this source rather than performing ad-hoc runtime lookups.

The token pipeline should detect stale generated output in CI.

Keep visual density separate from minimum interaction target size.

Current minimum targets:

- desktop: 24 × 24 px;
- touch: 44 × 44 px.

`compact`, `regular`, and `touch` density values should be defined by Invisible UI itself, not independently by each consuming product.

Mixed colors should retain both:

- the resolved color value;
- the composition recipe needed to reproduce the value consistently across platforms.

## 4. Accessibility and interaction

Do not translate ARIA mechanically into Flutter. Preserve the same user-facing semantics using Flutter's accessibility model.

Use:

- `Semantics` for roles, labels, values, states and actions;
- `Shortcuts` / `Actions` for keyboard behavior;
- explicit focus management where interaction requires it.

Important limitation: Flutter does not expose every web accessibility role directly. Where no direct equivalent exists, preserve the interaction model, announced information and keyboard behavior rather than inventing a false one-to-one mapping.

Test accessibility at two levels:

1. automated semantics/widget tests;
2. manual assistive-technology verification on real applications.

Automated semantics tests do not replace VoiceOver, TalkBack or other screen-reader testing.

## 5. Component API design

Flutter APIs must be idiomatic Flutter APIs. Parity with the web adapters covers behavior and meaning, not necessarily property names ([ADR 0017](./adr/0017-flutter-adapter.md), decision 6).

Use the names Flutter's own widgets use, for example:

- `onChanged` for a value control, where the web adapters say `onValueChange`;
- `initialValue` for the uncontrolled default, where the web says `defaultValue`;
- `onSelected` for menus and segmented choices;
- `onPressed` for buttons.

Do not reproduce web prop names or DOM-specific patterns simply to make APIs look identical across frameworks. Each component's parity checklist maps its Flutter names to the ADR 0011 names, so the behavior stays comparable.

Cross-framework parity should be checked against:

- component states;
- keyboard behavior;
- focus behavior;
- semantics;
- disabled/read-only rules;
- error states;
- interaction outcomes;
- token usage.

The implementation details may differ.

## 6. State model

Every interactive component should explicitly account for applicable states such as:

- idle;
- hover;
- focused;
- pressed;
- selected;
- disabled;
- read-only;
- invalid/error;
- loading where relevant.

State behavior should follow the existing Invisible UI specifications and ADRs.

Avoid making visual state the only indication of semantic state.

## 7. Responsive behavior

Responsive behavior should be defined at component and composition level, not inferred from Material breakpoints.

Pay particular attention to:

- text scaling;
- narrow layouts;
- touch targets;
- reflow;
- RTL;
- localization;
- long labels;
- keyboard versus touch interaction.

Text scaling and RTL should be supported from the beginning rather than added after the component library is complete.

## 8. Recommended first validation set

Before scaling the Flutter library broadly, validate the architecture with a small set of components that cover different interaction problems:

- Button;
- TextField / Field;
- NumberField;
- Tooltip;
- Toolbar;
- Dropdown Menu with submenus;
- notifications and system states.

These components are sufficient to test:

- tokens;
- focus;
- keyboard navigation;
- overlays;
- semantics;
- hover;
- pointer/touch differences;
- density;
- error states;
- composition;
- theming.

Once these patterns are stable, the remaining components can reuse the same foundations.

## 9. Menus and submenus

Menus are a high-risk component family because they combine focus, keyboard navigation, overlays, pointer behavior and accessibility.

Define and test at least:

- opening and closing;
- focus entry and return;
- arrow-key navigation;
- submenu opening and closing;
- Escape behavior;
- pointer versus keyboard behavior;
- disabled items;
- focus movement between parent and submenu;
- screen-reader labels and states;
- outside-click behavior.

Use a shared keyboard-navigation layer for Menu, Submenu and Toolbar where the interaction model overlaps.

## 10. Cross-framework parity

Maintain a behavior-parity checklist between Svelte, Vue, Elements, React and Flutter.

The checklist should compare behavior, not pixels.

For each component compare at least:

- states;
- keyboard interactions;
- focus rules;
- semantics;
- disabled/read-only behavior;
- error handling;
- density behavior;
- minimum target behavior;
- token roles;
- RTL;
- text scaling.

A Flutter-specific implementation difference is acceptable if the user-facing behavior remains equivalent.

## 11. Official Flutter agent skills

Use official Flutter-maintained skills where they help implementation and testing. The four recommended below are installed for every agent in `.agents/skills/`.

Repository:

https://github.com/flutter/agent-plugins

Recommended:

### Widget tests

https://github.com/flutter/agent-plugins/blob/main/skills/flutter-add-widget-test/SKILL.md

Use for widget-level regression tests, states, keyboard behavior and semantics.

### Widget previews

https://github.com/flutter/agent-plugins/blob/main/skills/flutter-add-widget-preview/SKILL.md

Use to create isolated previews for component review.

### Responsive layouts

https://github.com/flutter/agent-plugins/blob/main/skills/flutter-build-responsive-layout/SKILL.md

Use when validating component behavior across available space and form factors.

### Layout issues

https://github.com/flutter/agent-plugins/blob/main/skills/flutter-fix-layout-issues/SKILL.md

Use when resolving overflow, constraint and layout problems.

### Architecture best practices

https://github.com/flutter/agent-plugins/blob/main/skills/flutter-apply-architecture-best-practices/SKILL.md

This can be read as an official Flutter reference, but should **not** be treated as the architecture specification for Invisible UI. It is oriented toward application architecture, while Invisible UI is a headless/component design-system library.

## 12. What not to add

Do not add Flutter-specific rules merely because they are common in Material applications.

Do not:

- introduce Material styling as a dependency of component behavior;
- make Material/Cupertino visual conventions part of Invisible UI defaults;
- duplicate shared tokens inside Flutter;
- copy Svelte/Vue/React APIs mechanically;
- hide accessibility differences behind visual parity;
- let consuming products independently redefine shared density semantics;
- make pixel parity the acceptance criterion.

## 13. Review criterion

Before a Flutter component is considered aligned with Invisible UI, verify:

1. it follows the existing Invisible UI behavior specification;
2. it consumes shared tokens correctly;
3. its Flutter API is idiomatic;
4. keyboard and focus behavior are complete;
5. semantics expose the intended meaning and state;
6. text scaling, RTL and narrow layouts do not break the essential task;
7. automated widget and semantics tests exist where appropriate;
8. no unnecessary Material/Cupertino visual dependency was introduced;
9. parity with the other Invisible UI implementations is checked at behavior level.

The team already has established component-review practices. This document is not intended to replace them. It only adds Flutter-specific constraints and reference material.
