// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart'
    show Brightness, TargetPlatform, defaultTargetPlatform;
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../tokens/tokens.g.dart';

/// How tightly controls are laid out.
///
/// Density sets control padding. The minimum target size is a separate
/// setting, [InvisibleThemeData.minTargetSize], which density only defaults:
/// on a touch platform it is 44 by 44 at every density.
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
/// target size, dialog overlay, type and messages.
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
    Color? dialogOverlay,
  }) : _minTargetSize = minTargetSize,
       _dialogOverlay = dialogOverlay;

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

  /// The dark theme from the tokens. The focus ring is the dark theme's own
  /// `color-focus-ring` role, which keeps its contrast on dark surfaces.
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
        color: InvisibleColors.dark.focusRing,
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
  /// The density's `min-target-size` token: 24 by 24 under compact and
  /// regular (WCAG 2.5.8), 44 by 44 under touch, and 44 by 44 at every
  /// density on a [touchPlatform]. A larger size passed to the theme, such
  /// as `Size(44, 44)` for 44 by 44 targets at any density, replaces it; a
  /// smaller one never lowers it below the token.
  Size get minTargetSize {
    final floor = touchPlatform
        ? InvisibleDensityTokens.touch.minTargetSize
        : density._tokens.minTargetSize;
    final size = _minTargetSize;
    if (size == null) return Size.square(floor);
    return Size(
      size.width < floor ? floor : size.width,
      size.height < floor ? floor : size.height,
    );
  }

  /// Whether the app runs where touch is the main input: Android, iOS and
  /// Fuchsia, read from [defaultTargetPlatform], the platform Material also
  /// adapts its tap targets to. The web reads the same fact from
  /// `@media (pointer: coarse)`.
  bool get touchPlatform => switch (defaultTargetPlatform) {
    TargetPlatform.android ||
    TargetPlatform.iOS ||
    TargetPlatform.fuchsia => true,
    TargetPlatform.linux ||
    TargetPlatform.macOS ||
    TargetPlatform.windows => false,
  };

  final Color? _dialogOverlay;

  /// The scrim behind a modal dialog: the `dialog-overlay` role of [colors],
  /// unless a colour was passed to the theme.
  ///
  /// How far it sets the dialog apart from the screen is a theme choice, not
  /// an accessibility requirement.
  Color get dialogOverlay => _dialogOverlay ?? colors.dialogOverlay;

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
  EdgeInsetsDirectional get controlPadding {
    return EdgeInsetsDirectional.symmetric(
      horizontal: InvisibleSpacingTokens.controlPaddingX,
      vertical: InvisibleSpacingTokens.controlPaddingY,
    );
  }

  /// The base text style: [fontFamily], a 16 pixel size (the web's 100% root
  /// size) and the body line height.
  TextStyle get textStyle => TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    height: InvisibleTypographyTokens.lineHeightDefault,
  );

  /// The text style of code and keys: [monoFontFamily], or the web's
  /// monospace stack (`--ds-font-mono`), at the base size.
  TextStyle get monoTextStyle => TextStyle(
    fontFamily: monoFontFamily ?? _monoStack.first,
    fontFamilyFallback: _monoStack,
    fontSize: 16,
    height: InvisibleTypographyTokens.lineHeightDefault,
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
    Color? dialogOverlay,
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
      dialogOverlay: dialogOverlay ?? _dialogOverlay,
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
      other.messages == messages &&
      other._dialogOverlay == _dialogOverlay;

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
    _dialogOverlay,
  );
}

/// Provides [InvisibleThemeData] to the components below it.
///
/// A nested theme replaces the outer one for its subtree; [merge] changes
/// only some parts of it. It also sets the [IconTheme] of its subtree from
/// the tokens: the text colour and the base text size, scaled with the
/// text, so an SDK [Icon] matches the text around it.
class InvisibleTheme extends StatelessWidget {
  /// Provides [data] to [child].
  const InvisibleTheme({super.key, required this.data, required this.child});

  /// The theme for this subtree.
  final InvisibleThemeData data;

  /// The subtree.
  final Widget child;

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
    Color? dialogOverlay,
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
          dialogOverlay: dialogOverlay,
        ),
        child: child,
      ),
    );
  }

  /// The nearest theme, or null when there is none.
  static InvisibleThemeData? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_InvisibleThemeScope>()?.data;

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
  Widget build(BuildContext context) {
    return _InvisibleThemeScope(
      data: data,
      child: IconTheme.merge(
        data: IconThemeData(
          color: data.colors.text,
          size: data.textStyle.fontSize,
          applyTextScaling: true,
        ),
        child: child,
      ),
    );
  }
}

class _InvisibleThemeScope extends InheritedWidget {
  const _InvisibleThemeScope({required this.data, required super.child});

  final InvisibleThemeData data;

  @override
  bool updateShouldNotify(_InvisibleThemeScope oldWidget) =>
      data != oldWidget.data;
}
