// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// The family `flutter_test_config.dart` loads: Roboto from the Flutter SDK.
const String goldenFontFamily = 'Roboto';

/// The theme of a golden: the tokens of [brightness], with the loaded font
/// for text. Code keeps the theme's monospace stack, which resolves to the
/// system's default monospace font.
InvisibleThemeData goldenTheme(Brightness brightness) =>
    brightness == Brightness.dark
    ? InvisibleThemeData.dark(fontFamily: goldenFontFamily)
    : InvisibleThemeData.light(fontFamily: goldenFontFamily);

/// Pumps [home] on a page of [size] in [brightness]: an app with a navigator
/// for dialogs and menus, the page background and text colour of the theme,
/// and animations off, as with reduced motion.
Future<void> pumpGolden(
  WidgetTester tester,
  Widget home, {
  required Brightness brightness,
  Size size = const Size(480, 320),
}) async {
  tester.view
    ..physicalSize = size
    ..devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final theme = goldenTheme(brightness);
  await tester.pumpWidget(
    WidgetsApp(
      color: theme.colors.pageBackground,
      debugShowCheckedModeBanner: false,
      pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
        settings: settings,
        pageBuilder: (context, _, _) => builder(context),
      ),
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: InvisibleTheme(
          data: theme,
          child: ColoredBox(
            color: theme.colors.pageBackground,
            child: DefaultTextStyle(
              style: theme.textStyle.copyWith(color: theme.colors.text),
              child: child!,
            ),
          ),
        ),
      ),
      home: Padding(padding: const EdgeInsets.all(16), child: home),
    ),
  );
}

/// Compares the whole page, popups included, with `goldens/<name>.png`.
Future<void> expectGolden(String name) => expectLater(
  find.byType(WidgetsApp),
  matchesGoldenFile('goldens/$name.png'),
);

/// Runs [body] once per brightness, as `<description>, light` and
/// `<description>, dark`.
void goldenTest(
  String description,
  Future<void> Function(WidgetTester tester, Brightness brightness) body,
) {
  for (final brightness in Brightness.values) {
    testWidgets(
      '$description, ${brightness.name}',
      (tester) => body(tester, brightness),
    );
  }
}

/// A plus sign drawn from the icon theme, since the package bundles no icon
/// font.
class GoldenGlyph extends StatelessWidget {
  /// Creates the glyph.
  const GoldenGlyph({super.key});

  @override
  Widget build(BuildContext context) {
    final icons = IconTheme.of(context);
    final side = icons.size ?? 18;
    final bar = side / 8;
    return SizedBox.square(
      dimension: side,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: side * 0.6,
            height: bar,
            child: ColoredBox(color: icons.color!),
          ),
          SizedBox(
            width: bar,
            height: side * 0.6,
            child: ColoredBox(color: icons.color!),
          ),
        ],
      ),
    );
  }
}
