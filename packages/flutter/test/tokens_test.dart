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
        InvisibleBrandColors.primaryDefault,
      );
      expect(InvisibleColors.dark.danger, InvisibleFeedbackColors.dangerDefault);
    });

    test('translucent roles keep their alpha', () {
      expect(InvisibleColors.light.stateHover, const Color(0x0F000000));
      expect(InvisibleColors.dark.stateHover, const Color(0x17FFFFFF));
      expect(InvisibleColors.light.focusHalo.a, closeTo(0.3, 0.005));
    });

    test('the dark focus ring is its own role, mixed from the secondary', () {
      expect(InvisibleColors.dark.focusRing, const Color(0xFFA286DB));
      final mix = InvisibleColorMixes.dark['focusRing']!;
      expect(mix.base, InvisibleBrandColors.secondaryDefault);
      expect(mix.amount, 0.7);
      expect(mix.mixWith, InvisiblePalette.grey0);
    });

    test('the dialog overlay is a role with a value per theme', () {
      expect(InvisibleColors.light.dialogOverlay, const Color(0x801B1B1B));
      expect(InvisibleColors.dark.dialogOverlay, const Color(0x99000000));
    });

    test('each kind of component has its own background', () {
      const light = InvisibleColors.light;
      const dark = InvisibleColors.dark;
      for (final colour in [
        light.pageBackground,
        light.cardBackground,
        light.dialogBackground,
        light.popoverBackground,
        light.menuBackground,
        light.sidebarBackground,
      ]) {
        expect(colour, light.background);
      }
      expect(light.cardSecondaryBackground, light.neutralSurface);
      expect(light.codeBlockBackground, InvisiblePalette.grey50);
      expect(InvisiblePalette.black, const Color(0xFF121212));
      expect(dark.pageBackground, InvisiblePalette.black);
      expect(dark.sidebarBackground, InvisiblePalette.black);
      for (final colour in [
        dark.cardBackground,
        dark.dialogBackground,
        dark.popoverBackground,
        dark.menuBackground,
        dark.codeBlockBackground,
      ]) {
        expect(colour, InvisiblePalette.grey950);
      }
      expect(dark.cardSecondaryBackground, InvisiblePalette.grey900);
      // The semantic default stays where it was.
      expect(dark.background, InvisiblePalette.grey900);
    });

    test('the touch target is 44 at least', () {
      expect(InvisibleDensityTokens.touch.minTargetSize, 44);
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
      expect(InvisibleTypographyTokens.fontWeightHeading, FontWeight.w700);
    });

    test('colour sets compare by value', () {
      expect(InvisibleColors.light.copyWith(), InvisibleColors.light);
      expect(
        InvisibleColors.light.copyWith(primary: InvisiblePalette.cobaltBlue500),
        isNot(InvisibleColors.light),
      );
    });
  });
}
