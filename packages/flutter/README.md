# invisible_ui

Invisible UI for Flutter: accessible components built on Flutter's widgets
layer, themed from the Invisible UI design tokens. The package reimplements
the behaviour of the web adapters in Dart and is held to the same
specification ([ADR 0017](https://github.com/dr2madre/invisible-ui/blob/main/docs/adr/0017-flutter-adapter.md)).

**Status: alpha.** The package carries the tokens, the theme (light and
dark, density, minimum target size, focus ring, messages) and the
components listed below. Names and APIs can still change. It is not
published to pub.dev.

The package depends on the Flutter SDK only: no Material, no Cupertino, no
bundled icon font. An app that uses it can set `uses-material-design: false`.

## Depend on it

Depend on the package by git, pinned to a commit:

```yaml
dependencies:
  invisible_ui:
    git:
      url: https://github.com/dr2madre/invisible-ui.git
      path: packages/flutter
      ref: <commit>
```

It needs Dart 3.8 (Flutter 3.32) or later. The generated token file is
committed, so a checkout needs no build step.

## Use it

```dart
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

class Editor extends StatelessWidget {
  const Editor({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    return InvisibleTheme(
      data: dark
          ? InvisibleThemeData.dark(fontFamily: 'Inter')
          : InvisibleThemeData.light(fontFamily: 'Inter'),
      child: Row(
        children: [
          Button(
            onPressed: () {},
            variant: ButtonVariant.primary,
            child: const Text('Save'),
          ),
          Button.icon(
            onPressed: () {},
            icon: const Icon(IconData(0xe145, fontFamily: 'AppIcons')),
            semanticLabel: 'Add',
          ),
        ],
      ),
    );
  }
}
```

- **Light and dark.** `InvisibleThemeData.light()` and `.dark()` come from
  the generated tokens. The app picks one, or follows
  `MediaQuery.platformBrightnessOf`; without an `InvisibleTheme`, components
  follow the platform brightness.
- **Overrides.** `copyWith` replaces parts of a theme;
  `InvisibleTheme.merge` does it for a subtree.
- **Density and target size.** `density` is `compact`, `regular` (the
  default) or `touch`. The minimum hit area is a separate setting,
  `minTargetSize`: 24 by 24 by default, 44 by 44 under `touch`, and
  `Size(44, 44)` gives 44 by 44 at any density. The tokens define control
  padding for `regular` only today, so `compact` and `touch` use the regular
  padding until the tokens define theirs.
- **Messages.** `InvisibleMessages` holds the text the components announce,
  English by default. Pass translated text through the theme's `messages`.
- **Direction.** Components follow the ambient `Directionality`.

## Components

| Component | Parity | Checklist | Docs |
| --- | --- | --- | --- |
| Button | Matched, with adaptations listed | [parity/button.md](parity/button.md) | [Button](https://dr2madre.github.io/invisible-ui/components/forms/button/) |
| Tooltip | Matched, with adaptations listed | [parity/tooltip.md](parity/tooltip.md) | [Tooltip](https://dr2madre.github.io/invisible-ui/components/data-layout/tooltip/) |
| Toolbar | Matched, with adaptations listed | [parity/toolbar.md](parity/toolbar.md) | [Toolbar](https://dr2madre.github.io/invisible-ui/components/patterns/toolbar/) |
| Dropdown Menu, with submenus | Matched against the Svelte menu and the submenu spec, with adaptations listed | [parity/dropdown-menu.md](parity/dropdown-menu.md) | [Dropdown Menu](https://dr2madre.github.io/invisible-ui/components/data-layout/dropdown-menu/) |
| Inline Notification | Matched, with adaptations listed | [parity/inline-notification.md](parity/inline-notification.md) | [Inline Notification](https://dr2madre.github.io/invisible-ui/components/feedback/inline-notification/) |
| Notification, Notification Region | Matched, with adaptations listed | [parity/notification.md](parity/notification.md) | [Notification](https://dr2madre.github.io/invisible-ui/components/feedback/notification/), [Notification Region](https://dr2madre.github.io/invisible-ui/components/feedback/notification-region/) |

Each checklist compares the Flutter widget with the Svelte reference, line
by line, and names the reference commit it was checked against. The menus
also run the shared test vectors in `core/src/menu/__vectors__`, which the
`core/` tests run too.

The overlays (Tooltip, Dropdown Menu) need an `Overlay` above them, as
`WidgetsApp` provides. The notification region wraps the app's navigator
and waits while a modal is open:

```dart
final notices = NotificationController();
final modals = ModalObserver();

WidgetsApp(
  navigatorObservers: [modals],
  builder: (context, child) => NotificationRegion(
    controller: notices,
    modals: modals,
    child: child!,
  ),
  // ...
);

notices.success('Saved', duration: const Duration(seconds: 5));
```

An app that also imports Material hides its widgets of the same name:
`import 'package:flutter/material.dart' hide DropdownMenu, Tooltip;`.

## Tokens

`lib/src/tokens/tokens.g.dart` is generated from
[`packages/tokens/tokens.json`](https://github.com/dr2madre/invisible-ui/blob/main/packages/tokens/tokens.json) by the repository's
token build (`pnpm tokens:build`, Node only). Do not edit it by hand:
`pnpm tokens:check` fails when it differs from the source.

## Develop

```sh
flutter pub get
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter widget-preview start   # previews in preview/, Flutter 3.35 or later
```

Screen reader behaviour on macOS, Windows and Linux is a manual check and is
not yet verified.

## License

[MIT](LICENSE).
