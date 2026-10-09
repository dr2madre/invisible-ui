// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../tokens/tokens.g.dart';

/// How tightly controls are laid out.
///
/// Density sets control padding. The minimum target size is a separate
/// setting, [InvisibleThemeData.minTargetSize], which density only defaults.
enum InvisibleDensity {
  /// Desktop pointer use.
  compact,

  /// The default, matching the web adapters.
  regular,

  /// Tablet and touch screens.
  touch;

  InvisibleDensityTokens get _tokens => switch (this) {
    InvisibleDensity.compact => InvisibleDensityTokens.compact,
    InvisibleDensity.regular => InvisibleDensityTokens.regular,
    InvisibleDensity.touch => InvisibleDensityTokens.touch,
  };
}

// The web's `--ds-font-mono` stack, from the stylesheet: the type families
// are not in tokens.json. The first installed one draws the text.
const List<String> _monoStack = [
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  'Liberation Mono',
  'Courier New',
  'monospace',
];

/// The focus indicator: a solid ring and a translucent halo around it.
@immutable
class InvisibleFocusRing {
  /// Creates a focus ring. Sizes default to the focus tokens.
  const InvisibleFocusRing({
    required this.color,
    required this.haloColor,
    this.width = InvisibleFocusTokens.ringWidth,
    this.haloWidth = InvisibleFocusTokens.haloWidth,
    this.offset = InvisibleFocusTokens.ringOffset,
  });

  /// The ring colour.
  final Color color;

  /// The halo colour, painted outside the ring.
  final Color haloColor;

  /// The ring width, in logical pixels.
  final double width;

  /// The halo width beyond the ring, in logical pixels.
  final double haloWidth;

  /// The gap between the control and the ring under high contrast, where the
  /// ring is drawn alone, as the web draws its forced-colours outline.
  final double offset;

  /// A copy with the given values replaced.
  InvisibleFocusRing copyWith({
    Color? color,
    Color? haloColor,
    double? width,
    double? haloWidth,
    double? offset,
  }) {
    return InvisibleFocusRing(
      color: color ?? this.color,
      haloColor: haloColor ?? this.haloColor,
      width: width ?? this.width,
      haloWidth: haloWidth ?? this.haloWidth,
      offset: offset ?? this.offset,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleFocusRing &&
      other.color == color &&
      other.haloColor == haloColor &&
      other.width == width &&
      other.haloWidth == haloWidth &&
      other.offset == offset;

  @override
  int get hashCode => Object.hash(color, haloColor, width, haloWidth, offset);
}

/// The values the components read: colour roles, focus ring, density,
/// target size, type and messages.
///
/// [InvisibleThemeData.light] and [InvisibleThemeData.dark] come from the
/// generated tokens. Override parts with [copyWith], or for a subtree with
/// [InvisibleTheme.merge].
@immutable
class InvisibleThemeData {
  /// Creates theme data from explicit parts. Most apps start from
  /// [InvisibleThemeData.light] or [InvisibleThemeData.dark] instead.
  const InvisibleThemeData({
    required this.brightness,
    required this.colors,
    required this.focusRing,
    this.density = InvisibleDensity.regular,
    Size? minTargetSize,
    this.fontFamily,
    this.monoFontFamily,
    this.controlRadius = InvisibleRadiusTokens.control,
    this.messages = const InvisibleMessages(),
  }) : _minTargetSize = minTargetSize;

  /// The light theme from the tokens.
  factory InvisibleThemeData.light({
    InvisibleDensity density = InvisibleDensity.regular,
    Size? minTargetSize,
    String? fontFamily,
    String? monoFontFamily,
    InvisibleMessages messages = const InvisibleMessages(),
  }) {
    return InvisibleThemeData(
      brightness: Brightness.light,
      colors: InvisibleColors.light,
      focusRing: InvisibleFocusRing(
        color: InvisibleColors.light.focusRing,
        haloColor: InvisibleColors.light.focusHalo,
      ),
      density: density,
      minTargetSize: minTargetSize,
      fontFamily: fontFamily,
      monoFontFamily: monoFontFamily,
      messages: messages,
    );
  }

  /// The dark theme from the tokens. The focus ring uses
  /// [InvisibleStyleColors.focusOnDark], which keeps its contrast on dark
  /// surfaces.
  factory InvisibleThemeData.dark({
    InvisibleDensity density = InvisibleDensity.regular,
    Size? minTargetSize,
    String? fontFamily,
    String? monoFontFamily,
    InvisibleMessages messages = const InvisibleMessages(),
  }) {
    return InvisibleThemeData(
      brightness: Brightness.dark,
      colors: InvisibleColors.dark,
      focusRing: InvisibleFocusRing(
        color: InvisibleStyleColors.focusOnDark,
        haloColor: InvisibleColors.dark.focusHalo,
      ),
      density: density,
      minTargetSize: minTargetSize,
      fontFamily: fontFamily,
      monoFontFamily: monoFontFamily,
      messages: messages,
    );
  }

  /// Whether the colours are the light or the dark set.
  final Brightness brightness;

  /// The colour roles.
  final InvisibleColors colors;

  /// The focus indicator.
  final InvisibleFocusRing focusRing;

  /// The control density.
  final InvisibleDensity density;

  final Size? _minTargetSize;

  /// The smallest hit area a control keeps, whatever its painted size.
  ///
  /// Defaults to the density's `min-target-size` token: 24 by 24 under
  /// compact and regular (WCAG 2.5.8), 44 by 44 under touch. Set it to
  /// `Size(44, 44)` for 44 by 44 targets at any density.
  Size get minTargetSize =>
      _minTargetSize ?? Size.square(density._tokens.minTargetSize);

  /// The font family of every component text. Null uses the platform font.
  final String? fontFamily;

  /// The font family of code and keys (Code, CodeBlock, Kbd). Null uses the
  /// first installed font of the web's monospace stack.
  final String? monoFontFamily;

  /// The corner radius of controls, in logical pixels.
  final double controlRadius;

  /// The text the components show or announce.
  final InvisibleMessages messages;

  /// The padding inside a control with a text label.
  ///
  /// Only the regular density defines control padding in the tokens today, so
  /// compact and touch use the regular values until the tokens define theirs.
  EdgeInsetsDirectional get controlPadding {
    const regular = InvisibleDensityTokens.regular;
    final level = density._tokens;
    return EdgeInsetsDirectional.symmetric(
      horizontal: level.controlPaddingX ?? regular.controlPaddingX!,
      vertical: level.controlPaddingY ?? regular.controlPaddingY!,
    );
  }

  /// The base text style: [fontFamily], a 16 pixel size (the web's 100% root
  /// size) and the body line height.
  TextStyle get textStyle => TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    height: InvisibleTypographyTokens.lineHeight,
  );

  /// The text style of code and keys: [monoFontFamily], or the web's
  /// monospace stack (`--ds-font-mono`), at the base size.
  TextStyle get monoTextStyle => TextStyle(
    fontFamily: monoFontFamily ?? _monoStack.first,
    fontFamilyFallback: _monoStack,
    fontSize: 16,
    height: InvisibleTypographyTokens.lineHeight,
  );

  /// A copy with the given parts replaced.
  InvisibleThemeData copyWith({
    Brightness? brightness,
    InvisibleColors? colors,
    InvisibleFocusRing? focusRing,
    InvisibleDensity? density,
    Size? minTargetSize,
    String? fontFamily,
    String? monoFontFamily,
    double? controlRadius,
    InvisibleMessages? messages,
  }) {
    return InvisibleThemeData(
      brightness: brightness ?? this.brightness,
      colors: colors ?? this.colors,
      focusRing: focusRing ?? this.focusRing,
      density: density ?? this.density,
      minTargetSize: minTargetSize ?? _minTargetSize,
      fontFamily: fontFamily ?? this.fontFamily,
      monoFontFamily: monoFontFamily ?? this.monoFontFamily,
      controlRadius: controlRadius ?? this.controlRadius,
      messages: messages ?? this.messages,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleThemeData &&
      other.brightness == brightness &&
      other.colors == colors &&
      other.focusRing == focusRing &&
      other.density == density &&
      other._minTargetSize == _minTargetSize &&
      other.fontFamily == fontFamily &&
      other.monoFontFamily == monoFontFamily &&
      other.controlRadius == controlRadius &&
      other.messages == messages;

  @override
  int get hashCode => Object.hash(
    brightness,
    colors,
    focusRing,
    density,
    _minTargetSize,
    fontFamily,
    monoFontFamily,
    controlRadius,
    messages,
  );
}

/// Provides [InvisibleThemeData] to the components below it.
///
/// A nested theme replaces the outer one for its subtree; [merge] changes
/// only some parts of it.
class InvisibleTheme extends InheritedWidget {
  /// Provides [data] to [child].
  const InvisibleTheme({super.key, required this.data, required super.child});

  /// The theme for this subtree.
  final InvisibleThemeData data;

  /// A theme that keeps the surrounding one and replaces the given parts.
  static Widget merge({
    Key? key,
    InvisibleColors? colors,
    InvisibleFocusRing? focusRing,
    InvisibleDensity? density,
    Size? minTargetSize,
    String? fontFamily,
    String? monoFontFamily,
    double? controlRadius,
    InvisibleMessages? messages,
    required Widget child,
  }) {
    return Builder(
      key: key,
      builder: (context) => InvisibleTheme(
        data: of(context).copyWith(
          colors: colors,
          focusRing: focusRing,
          density: density,
          minTargetSize: minTargetSize,
          fontFamily: fontFamily,
          monoFontFamily: monoFontFamily,
          controlRadius: controlRadius,
          messages: messages,
        ),
        child: child,
      ),
    );
  }

  /// The nearest theme, or null when there is none.
  static InvisibleThemeData? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<InvisibleTheme>()?.data;

  /// The nearest theme. Without one, the light or dark theme that matches the
  /// platform brightness.
  static InvisibleThemeData of(BuildContext context) {
    final data = maybeOf(context);
    if (data != null) return data;
    return switch (MediaQuery.maybePlatformBrightnessOf(context)) {
      Brightness.dark => InvisibleThemeData.dark(),
      _ => InvisibleThemeData.light(),
    };
  }

  @override
  bool updateShouldNotify(InvisibleTheme oldWidget) => data != oldWidget.data;
}
