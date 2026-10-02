# Flutter adapter: discovery

Findings collected on 2026-10-02 as input for
[ADR 0017](../adr/0017-flutter-adapter.md). They cover how other design
systems reach Flutter or keep several platforms consistent, the Flutter
platform facts that decide the ADR, the token pipeline options, and what
this repository has today. Sources are linked at the end of each section.

## How other design systems reach Flutter

- **shadcn/ui.** The project ships React only. Two community ports exist
  for Flutter, both written from scratch in Dart and unaffiliated with the
  original project. `shadcn_ui` (MIT) has its own theme object (`ShadTheme`)
  and runs without Material. `shadcn_flutter` (BSD-3-Clause) imports
  `package:flutter/widgets.dart` alone, neither Material nor Cupertino, and
  offers optional companion packages for apps that mix in Material or
  Cupertino widgets. It lists 84 components. Neither port shares runtime
  code with the web library: what they share is the visual language and the
  component names.
- **Carbon.** IBM maintains React and Web Components officially; Angular,
  Vue and Svelte are community packages. Carbon keeps them aligned through
  shared design guidance, shared tokens and a Figma kit, and publishes a
  Carbon Native Mobile design kit without an official Flutter package. Each
  framework package carries its own implementation.
- **Bits UI.** A headless component library for Svelte only, with
  architecture credited to Melt UI and API design credited to Radix. It
  makes no claim beyond Svelte. A headless library that targets one
  framework keeps behaviour in that framework's code, so a second platform
  starts from the specification and the tests, never from the code.
- **Adobe Spectrum.** Spectrum CSS, Spectrum Web Components and React
  Spectrum are separate implementations of one specification. What they
  share is the token data (`spectrum-tokens`, built with Style Dictionary)
  and the written component guidelines. Spectrum defines two platform
  scales as a token dimension: medium for desktop pointer use and large for
  touch, where sizes and type grow (for example a component height of 32 px
  in medium and 40 px in large).
- **Flutter's own layering.** Material and Cupertino sit on top of the
  widgets layer. As of Flutter 3.44 (May 2026) the in-framework Material and
  Cupertino libraries are frozen, and as of Flutter 3.47 (August 2026) they
  ship as standalone packages, `material_ui` and `cupertino_ui`, with a
  formal deprecation of the in-framework copies announced for an upcoming
  stable release. The widgets layer stays in the SDK.
- **forui.** Desktop and touch widgets for Flutter (MIT), with a theme
  builder and a CLI that generates theme code. Its current release depends
  on `material_ui`.
- **fluent_ui.** A community implementation of Windows UI for Flutter
  (BSD-3-Clause), written from Microsoft's public documentation, without a
  Material dependency.

What the ADR takes from this: every project that serves Flutter and the
web does it with two implementations held together by a shared
specification and shared token data. None runs one behaviour engine on
both.

Sources:
[shadcn_ui](https://pub.dev/packages/shadcn_ui) ·
[shadcn_flutter](https://pub.dev/packages/shadcn_flutter) ·
[Carbon community frameworks](https://carbondesignsystem.com/developing/community-frameworks/other-frameworks/) ·
[Carbon FAQ](https://carbondesignsystem.com/help/faq) ·
[Bits UI](https://bits-ui.com/docs/introduction) ·
[Spectrum platform scale](https://spectrum.adobe.com/page/platform-scale/) ·
[spectrum-tokens](https://www.npmjs.com/package/@adobe/spectrum-tokens) ·
[What's new in Flutter 3.44](https://flutter.dev/blog/whats-new-in-flutter-3-44) ·
[What's new in Flutter 3.47](https://flutter.dev/blog/whats-new-in-flutter-3-47) ·
[Migrate to material_ui and cupertino_ui](https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui) ·
[forui](https://pub.dev/packages/forui) ·
[fluent_ui](https://pub.dev/packages/fluent_ui)

## Flutter platform facts

### Semantics and announcements

- `Semantics` carries the name, value, hint, states (selected, checked,
  expanded, enabled, focused) and actions of a node. `SemanticsRole` maps a
  node to a native role on each platform. It has `menu`, `menuBar`,
  `menuItem`, `menuItemCheckbox`, `menuItemRadio`, `dialog`,
  `alertDialog`, `tab`, `tabBar`, `tabPanel`, `table`, `row`, `cell`,
  `columnHeader`, `comboBox`, `spinButton`, `radioGroup`, `tooltip`,
  `status`, `alert`, `list`, `listItem` and landmark roles. It has no
  `grid` or `gridcell` role, which matters for the editable grid.
- `SemanticsService.announce(message, textDirection, assertiveness:)`
  sends an announcement, polite by default. `sendAnnouncement` does the
  same for a given `FlutterView`, which a multi-window desktop app needs.
  `Semantics(liveRegion: true)` marks a region whose changes are announced.

### Keyboard and focus

- `Shortcuts` maps key combinations to intents, `Actions` maps intents to
  behaviour, and `FocusableActionDetector` combines focus, hover, shortcuts
  and actions in one widget. `FocusTraversalGroup` and traversal policies
  order Tab movement. `FocusManager.instance.highlightMode` tells keyboard
  use from pointer use, the equivalent of `:focus-visible`.

### Menus, overlays and tooltips

- `RawMenuAnchor` (widgets layer, since Flutter 3.32) anchors an unstyled
  floating menu to a child, through a `MenuController` and an
  `overlayBuilder`. Its documentation includes a nested submenu example.
  `RawMenuAnchorGroup` builds an always-visible group such as a menu bar,
  and defines no default focus or keyboard traversal.
- Flutter 3.44 changed the close order: closing an anchor now closes its
  descendants first and calls their `onClose` callbacks. Behaviour before
  and after 3.44 differs.
- `MenuAnchor`, `MenuBar` and `SubmenuButton` are Material. They add
  styling and keyboard traversal on top of the same anchor.
  `PlatformMenuBar` (widgets layer) renders the native macOS menu bar.
- `OverlayPortal` (widgets layer) shows a child in the nearest `Overlay`
  while it stays a child of the portal in the widget tree, so it inherits
  the same theme and locale and never outlives its owner.
  `overlayChildLayoutBuilder` (3.32) positions the child against the
  overlay's size. Popovers, tooltips and menus build on it.
- Dialog routes exist in the widgets layer (`showGeneralDialog`,
  `RawDialogRoute`), so a modal needs no Material import. `Form` and
  `FormField` are also widgets-layer classes; `FormState.reset()` puts
  every field back to its initial value without calling `onChanged`.

### Density, target size, text scale and direction

- `VisualDensity` and `ThemeExtension` belong to the Material library.
  Material's adaptive density is compact on macOS, Windows and Linux and
  standard on mobile platforms.
- Target sizes from the three references: WCAG 2.2 success criterion 2.5.8
  (AA) asks for 24 by 24 CSS pixels or enough spacing; Apple's Human
  Interface Guidelines give 44 by 44 pt as the default for iOS and iPadOS
  (28 by 28 pt minimum) and 28 by 28 pt as the default for macOS (20 by
  20 pt minimum); Material asks for 48 by 48 dp.
- `flutter_test` ships `meetsGuideline` with `androidTapTargetGuideline`
  (48 by 48), `iOSTapTargetGuideline` (44 by 44),
  `labeledTapTargetGuideline` (every tappable node has a label) and
  `textContrastGuideline` (WCAG text contrast). `MinimumTapTargetGuideline`
  takes any size, so a 24 by 24 check is possible.
- `MediaQuery.textScalerOf` gives the user's text scale; a test can pump
  with `TextScaler.linear(2.0)`. `MediaQuery.highContrastOf` and
  `MediaQuery.disableAnimationsOf` carry the contrast and reduced-motion
  preferences.
- `Directionality` sets the text direction for a subtree. Directional
  geometry (`EdgeInsetsDirectional`, `AlignmentDirectional`) mirrors under
  right-to-left.

### Tests

- Widget tests drive keyboard input (`sendKeyEvent`), read the semantics
  tree (`tester.getSemantics`, `matchesSemantics`) and run accessibility
  guidelines. Golden tests (`matchesGoldenFile`) compare rendered pixels;
  font rendering differs between operating systems, so golden baselines
  belong to one pinned platform.

### Versions and git dependencies

- Flutter 3.32 shipped with Dart 3.8 (May 2025). Flutter 3.44 shipped with
  Dart 3.12 (May 2026). Flutter 3.47 shipped with Dart 3.13 (August 2026).
- A pub git dependency takes `url`, an optional `path` inside the
  repository and a `ref` that can be any commit, branch or tag. The
  resolved commit goes into the consumer's lockfile.
  `dependency_overrides` in the consumer's own pubspec replaces it with a
  local path; overrides inside a dependency are ignored.

Sources:
[SemanticsRole](https://api.flutter.dev/flutter/dart-ui/SemanticsRole.html) ·
[SemanticsService](https://api.flutter.dev/flutter/semantics/SemanticsService-class.html) ·
[Actions and shortcuts](https://docs.flutter.dev/ui/interactivity/actions-and-shortcuts) ·
[FocusableActionDetector](https://api.flutter.dev/flutter/widgets/FocusableActionDetector-class.html) ·
[RawMenuAnchor](https://api.flutter.dev/flutter/widgets/RawMenuAnchor-class.html) ·
[RawMenuAnchorGroup](https://api.flutter.dev/flutter/widgets/RawMenuAnchorGroup-class.html) ·
[RawMenuAnchor close order](https://docs.flutter.dev/release/breaking-changes/raw-menu-anchor-close-order) ·
[Flutter 3.32.0 release notes](https://docs.flutter.dev/release/release-notes/release-notes-3.32.0) ·
[OverlayPortal](https://api.flutter.dev/flutter/widgets/OverlayPortal-class.html) ·
[VisualDensity](https://api.flutter.dev/flutter/material/VisualDensity-class.html) ·
[ThemeExtension](https://api.flutter.dev/flutter/material/ThemeExtension-class.html) ·
[WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) ·
[Apple HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) ·
[Material accessibility design](https://m3.material.io/foundations/designing/structure) ·
[AccessibilityGuideline](https://api.flutter.dev/flutter/flutter_test/AccessibilityGuideline-class.html) ·
[Announcing Dart 3.12](https://dart.dev/blog/announcing-dart-3-12) ·
[Announcing Dart 3.13](https://dart.dev/blog/announcing-dart-3-13) ·
[Pub dependencies](https://dart.dev/tools/pub/dependencies)

## Token pipeline options for Dart

- **Style Dictionary `flutter/class.dart`.** The repository already runs
  Style Dictionary 5.5. Its Flutter format writes one class of static
  constants; in 5.5 the template imports `dart:ui` only, and the `flutter`
  transform group turns colours into `Color(0x…)` and rem sizes into
  doubles. It writes one flat set of values: no light and dark pair and no
  theme object.
- **Style Dictionary with a custom format.** The same build, transforms
  and source, with a format written in this repository that emits typed
  light and dark token classes. The CSS build and the Dart build then read
  one configuration.
- **A standalone generator script.** Full control, and one more code path
  to maintain beside Style Dictionary.
- **Theme object.** `ThemeExtension` is Material, so a widgets-only package
  carries its own `InheritedWidget` with a theme data class, a `copyWith`
  and a `merge` for partial overrides. A nested theme overrides a subtree,
  the way a `--ds-*` variable set on an element overrides its descendants.

## What this repository has today

- `packages/svelte/tokens/tokens.json` holds the palette, the semantic
  `style` tier (primary, secondary, info, success, warning, danger with
  hover states) and three radii. The Style Dictionary configuration builds
  CSS only; the Dart output is a transform group Style Dictionary offers,
  with no Dart platform configured.
- The roles components consume (surfaces, text, borders, the
  `color-mix` tints, light and dark remapping, control padding, type scale,
  focus ring width, offset and halo) live in `tokens.css`, outside the DTCG
  source. The docs token registry resolves 535 entries with light and dark
  values from that stylesheet.
- `style.focus.onDark` (`#a286db`, the dark-mode focus ring colour) is in
  review on the `fix/dark-focus-token` branch and not yet on `main`.
- No spacing scale, density tier or target-size token exists.
- No component in `core/` supports submenus. The catalog has Dropdown
  Menu, Context Menu, Menubar, Toolbar and Tooltip. It has no section
  header, colour swatch or inspector component, and the Data Table defers
  grid semantics and editing on purpose.
- `pnpm-workspace.yaml` includes `packages/*`; pnpm skips a folder without
  a `package.json`, so a Dart package in `packages/flutter` stays outside
  the JavaScript workspace. `scripts/gate.test.mjs` holds `ci.yml` to one
  job, so Flutter checks need their own workflow file, as `e2e.yml` and
  `visual.yml` already have.
