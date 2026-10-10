// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
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

    test('the focus ring follows the theme; dark uses style.focus.onDark', () {
      final light = InvisibleThemeData.light().focusRing;
      final dark = InvisibleThemeData.dark().focusRing;
      expect(light.color, InvisibleColors.light.focusRing);
      expect(light.haloColor, InvisibleColors.light.focusHalo);
      expect(dark.color, InvisibleStyleColors.focusOnDark);
      expect(dark.haloColor, InvisibleColors.dark.focusHalo);
      expect(light.width, InvisibleFocusTokens.ringWidth);
      expect(light.haloWidth, InvisibleFocusTokens.haloWidth);
      expect(light.offset, InvisibleFocusTokens.ringOffset);
    });

    test('the minimum target size is 24 by default and 44 under touch', () {
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
      expect(theme.textStyle.height, InvisibleTypographyTokens.lineHeight);
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
        colors: theme.colors.copyWith(primary: InvisiblePalette.blue500),
        messages: const InvisibleMessages(loadingLabel: 'Caricamento…'),
      );
      expect(changed.colors.primary, InvisiblePalette.blue500);
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

    test('dependants rebuild only when the data changes', () {
      final a = InvisibleTheme(
        data: InvisibleThemeData.light(),
        child: const SizedBox(),
      );
      final same = InvisibleTheme(
        data: InvisibleThemeData.light(),
        child: const SizedBox(),
      );
      final other = InvisibleTheme(
        data: InvisibleThemeData.dark(),
        child: const SizedBox(),
      );
      expect(same.updateShouldNotify(a), isFalse);
      expect(other.updateShouldNotify(a), isTrue);
    });
  });
}
