import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

void main() {
  group('generated tokens', () {
    test('roles point at the palette and the style tier', () {
      expect(InvisibleColors.light.background, InvisiblePalette.grey0);
      expect(InvisibleColors.light.text, InvisiblePalette.grey900);
      expect(InvisibleColors.dark.background, InvisiblePalette.grey900);
      expect(
        InvisibleColors.light.primary,
        InvisibleStyleColors.primaryDefault,
      );
      expect(InvisibleColors.dark.danger, InvisibleStyleColors.dangerDefault);
    });

    test('translucent roles keep their alpha', () {
      expect(InvisibleColors.light.stateHover, const Color(0x0F000000));
      expect(InvisibleColors.dark.stateHover, const Color(0x17FFFFFF));
      expect(InvisibleColors.light.focusHalo.a, closeTo(0.3, 0.005));
    });

    test('the dark focus ring is style.focus.onDark', () {
      expect(InvisibleColors.dark.focusRing, InvisibleStyleColors.focusOnDark);
    });

    test('every mix recipe computes the value its role holds', () {
      final mixes = {
        ...InvisibleColorMixes.light,
        for (final e in InvisibleColorMixes.dark.entries)
          'dark.${e.key}': e.value,
      };
      expect(mixes, isNotEmpty);
      for (final MapEntry(:key, :value) in mixes.entries) {
        final computed = value.resolve();
        for (final (got, want) in [
          (computed.r, value.value.r),
          (computed.g, value.value.g),
          (computed.b, value.value.b),
          (computed.a, value.value.a),
        ]) {
          // The source rounds each channel to 8 bits.
          expect(got, closeTo(want, 1 / 255), reason: key);
        }
      }
    });

    test('density keeps the sizes the source leaves undefined as null', () {
      expect(InvisibleDensityTokens.regular.controlPaddingY, 8);
      expect(InvisibleDensityTokens.regular.controlPaddingX, 14);
      expect(InvisibleDensityTokens.compact.controlPaddingY, isNull);
      expect(InvisibleDensityTokens.touch.controlPaddingX, isNull);
      expect(InvisibleDensityTokens.compact.minTargetSize, 24);
      expect(InvisibleDensityTokens.regular.minTargetSize, 24);
      expect(InvisibleDensityTokens.touch.minTargetSize, 44);
    });

    test('dimensions are logical pixels from a 16 pixel root', () {
      expect(InvisibleRadiusTokens.control, 8);
      expect(InvisibleFocusTokens.ringWidth, 2);
      expect(InvisibleTypographyTokens.fontSizeH1, 38);
      expect(InvisibleTypographyTokens.headingWeight, FontWeight.w700);
    });

    test('colour sets compare by value', () {
      expect(InvisibleColors.light.copyWith(), InvisibleColors.light);
      expect(
        InvisibleColors.light.copyWith(primary: InvisiblePalette.blue500),
        isNot(InvisibleColors.light),
      );
    });
  });
}
