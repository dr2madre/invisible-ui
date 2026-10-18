// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart'
    show
        Brightness,
        TargetPlatform,
        debugDefaultTargetPlatformOverride,
        defaultTargetPlatform;
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

void main() {
  group('InvisibleThemeData', () {
    test('light and dark come from the tokens', () {
      final light = InvisibleThemeData.light();
      final dark = InvisibleThemeData.dark();
      expect(light.brightness, Brightness.light);
      expect(light.colors, InvisibleColors.light);
      expect(dark.brightness, Brightness.dark);
      expect(dark.colors, InvisibleColors.dark);
      expect(light.controlRadius, InvisibleRadiusTokens.control);
    });

    test('the focus ring follows the theme roles', () {
      final light = InvisibleThemeData.light().focusRing;
      final dark = InvisibleThemeData.dark().focusRing;
      expect(light.color, InvisibleColors.light.focusRing);
      expect(light.haloColor, InvisibleColors.light.focusHalo);
      expect(dark.color, InvisibleColors.dark.focusRing);
      expect(dark.haloColor, InvisibleColors.dark.focusHalo);
      expect(light.width, InvisibleFocusTokens.ringWidth);
      expect(light.haloWidth, InvisibleFocusTokens.haloWidth);
      expect(light.offset, InvisibleFocusTokens.ringOffset);
    });

    test('the dialog overlay follows the colour roles unless set', () {
      expect(
        InvisibleThemeData.light().dialogOverlay,
        InvisibleColors.light.dialogOverlay,
      );
      expect(
        InvisibleThemeData.dark().dialogOverlay,
        InvisibleColors.dark.dialogOverlay,
      );
      expect(
        InvisibleThemeData.light()
            .copyWith(colors: InvisibleColors.dark)
            .dialogOverlay,
        InvisibleColors.dark.dialogOverlay,
      );
      const custom = Color(0x40000000);
      final set = InvisibleThemeData.light().copyWith(dialogOverlay: custom);
      expect(set.dialogOverlay, custom);
      expect(set.copyWith(brightness: Brightness.dark).dialogOverlay, custom);
      expect(set, isNot(InvisibleThemeData.light()));
    });

    test('the minimum target size is 24 by default and 44 under touch', () {
      debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);
      expect(InvisibleThemeData.light().minTargetSize, const Size(24, 24));
      expect(
        InvisibleThemeData.light(
          density: InvisibleDensity.compact,
        ).minTargetSize,
        const Size(24, 24),
      );
      expect(
        InvisibleThemeData.light(density: InvisibleDensity.touch).minTargetSize,
        const Size(44, 44),
      );
    });

    testWidgets(
      'Android, iOS and Fuchsia keep 44 by 44 targets at every density, as a '
      'coarse pointer does on the web; desktop keeps the density token',
      (tester) async {
        final touch = {
          TargetPlatform.android,
          TargetPlatform.iOS,
          TargetPlatform.fuchsia,
        }.contains(defaultTargetPlatform);
        for (final density in InvisibleDensity.values) {
          final theme = InvisibleThemeData.light(density: density);
          expect(theme.touchPlatform, touch);
          expect(
            theme.minTargetSize,
            touch || density == InvisibleDensity.touch
                ? const Size(44, 44)
                : const Size(24, 24),
            reason: '$density',
          );
        }
        // A larger size from the app still wins.
        expect(
          InvisibleThemeData.light(
            minTargetSize: const Size(48, 48),
          ).minTargetSize,
          const Size(48, 48),
        );
      },
      variant: TargetPlatformVariant.all(),
    );

    test('an explicit target size wins over density, and survives copies', () {
      final theme = InvisibleThemeData.light(minTargetSize: const Size(44, 44));
      expect(theme.density, InvisibleDensity.regular);
      expect(theme.minTargetSize, const Size(44, 44));
      expect(
        theme.copyWith(density: InvisibleDensity.compact).minTargetSize,
        const Size(44, 44),
      );
    });

    test('a density change moves the default target size with it', () {
      final theme = InvisibleThemeData.light().copyWith(
        density: InvisibleDensity.touch,
      );
      expect(theme.minTargetSize, const Size(44, 44));
    });

    test('compact and touch padding fall back to regular', () {
      const regular = EdgeInsetsDirectional.symmetric(
        horizontal: 14,
        vertical: 8,
      );
      for (final density in InvisibleDensity.values) {
        expect(
          InvisibleThemeData.light(density: density).controlPadding,
          regular,
          reason: density.name,
        );
      }
    });

    test('the consumer sets the font family', () {
      final theme = InvisibleThemeData.light(fontFamily: 'Inter');
      expect(theme.textStyle.fontFamily, 'Inter');
      expect(theme.textStyle.fontSize, 16);
      expect(theme.textStyle.height, InvisibleTypographyTokens.lineHeightDefault);
      expect(InvisibleThemeData.light().textStyle.fontFamily, isNull);
    });

    test('code takes the monospace family, or the web monospace stack', () {
      final stack = InvisibleThemeData.light().monoTextStyle;
      expect(stack.fontFamily, 'SFMono-Regular');
      expect(stack.fontFamilyFallback, [
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace',
      ]);
      final chosen = InvisibleThemeData.dark(monoFontFamily: 'JetBrains Mono');
      expect(chosen.monoTextStyle.fontFamily, 'JetBrains Mono');
      expect(chosen.copyWith().monoFontFamily, 'JetBrains Mono');
      expect(chosen, isNot(InvisibleThemeData.dark()));
    });

    test('copyWith replaces only what it is given; equality is by value', () {
      final theme = InvisibleThemeData.light();
      expect(theme.copyWith(), theme);
      expect(theme.hashCode, InvisibleThemeData.light().hashCode);
      final changed = theme.copyWith(
        colors: theme.colors.copyWith(primary: InvisiblePalette.cobaltBlue500),
        messages: const InvisibleMessages(loadingLabel: 'Caricamento…'),
      );
      expect(changed.colors.primary, InvisiblePalette.cobaltBlue500);
      expect(changed.colors.text, theme.colors.text);
      expect(changed.messages.loadingLabel, 'Caricamento…');
      expect(changed.focusRing, theme.focusRing);
      expect(changed, isNot(theme));
    });
  });

  group('InvisibleTheme', () {
    testWidgets('of reads the nearest theme', (tester) async {
      late InvisibleThemeData seen;
      await tester.pumpWidget(
        harness(
          Builder(
            builder: (context) {
              seen = InvisibleTheme.of(context);
              return const SizedBox();
            },
          ),
          theme: InvisibleThemeData.dark(),
        ),
      );
      expect(seen, InvisibleThemeData.dark());
    });

    testWidgets('without a theme, of follows the platform brightness', (
      tester,
    ) async {
      late InvisibleThemeData seen;
      Widget probe(Brightness brightness) => MediaQuery(
        data: MediaQueryData(platformBrightness: brightness),
        child: Builder(
          builder: (context) {
            seen = InvisibleTheme.of(context);
            return const SizedBox();
          },
        ),
      );
      await tester.pumpWidget(probe(Brightness.dark));
      expect(seen.brightness, Brightness.dark);
      await tester.pumpWidget(probe(Brightness.light));
      expect(seen.brightness, Brightness.light);
    });

    testWidgets('merge overrides parts of the surrounding theme', (
      tester,
    ) async {
      late InvisibleThemeData seen;
      await tester.pumpWidget(
        harness(
          InvisibleTheme.merge(
            density: InvisibleDensity.touch,
            fontFamily: 'Inter',
            monoFontFamily: 'Code Mono',
            child: Builder(
              builder: (context) {
                seen = InvisibleTheme.of(context);
                return const SizedBox();
              },
            ),
          ),
          theme: InvisibleThemeData.dark(),
        ),
      );
      expect(seen.brightness, Brightness.dark);
      expect(seen.colors, InvisibleColors.dark);
      expect(seen.density, InvisibleDensity.touch);
      expect(seen.minTargetSize, const Size(44, 44));
      expect(seen.fontFamily, 'Inter');
      expect(seen.monoFontFamily, 'Code Mono');
    });

    testWidgets('dependants rebuild only when the data changes', (
      tester,
    ) async {
      _Probe.builds = 0;
      Widget themed(InvisibleThemeData data) => Directionality(
        textDirection: TextDirection.ltr,
        child: InvisibleTheme(data: data, child: const _Probe()),
      );
      await tester.pumpWidget(themed(InvisibleThemeData.light()));
      await tester.pumpWidget(themed(InvisibleThemeData.light()));
      expect(_Probe.builds, 1);
      await tester.pumpWidget(themed(InvisibleThemeData.dark()));
      expect(_Probe.builds, 2);
    });

    test('a smaller target size never goes below the token', () {
      debugDefaultTargetPlatformOverride = TargetPlatform.linux;
      addTearDown(() => debugDefaultTargetPlatformOverride = null);
      expect(
        InvisibleThemeData.light(
          minTargetSize: const Size(10, 30),
        ).minTargetSize,
        const Size(24, 30),
      );
      expect(
        InvisibleThemeData.light(
          density: InvisibleDensity.touch,
          minTargetSize: const Size(24, 24),
        ).minTargetSize,
        const Size(44, 44),
      );
    });

    testWidgets('sets the icon theme from the tokens, scaled with the text', (
      tester,
    ) async {
      late IconThemeData icons;
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: InvisibleTheme(
            data: InvisibleThemeData.dark(),
            child: Builder(
              builder: (context) {
                icons = IconTheme.of(context);
                return const SizedBox();
              },
            ),
          ),
        ),
      );
      expect(icons.color, InvisibleColors.dark.text);
      expect(icons.size, 16);
      expect(icons.applyTextScaling, isTrue);
    });

    testWidgets('a decorative icon adds nothing to the semantics tree; a '
        'named one is an image with its name', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: InvisibleTheme(
            data: InvisibleThemeData.light(),
            child: const Row(
              children: [
                Icon(IconData(0xe145)),
                Icon(IconData(0xe146), semanticLabel: 'Add'),
              ],
            ),
          ),
        ),
      );
      expect(find.bySemanticsLabel('Add'), findsOneWidget);
      expect(
        tester.getSemantics(find.byType(Icon).first).label,
        isNot(contains('Add')),
      );
      semantics.dispose();
    });
  });
}

class _Probe extends StatelessWidget {
  const _Probe();

  static int builds = 0;

  @override
  Widget build(BuildContext context) {
    InvisibleTheme.of(context);
    builds++;
    return const SizedBox();
  }
}
