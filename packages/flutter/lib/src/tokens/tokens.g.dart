// Generated from packages/tokens/tokens.json with the format in
// scripts/tokens-dart-format.mjs. Do not edit: run `pnpm tokens:build`.
// `pnpm tokens:check` fails when this file differs from what the source
// produces.

// Each constant is named after its token path.
// ignore_for_file: public_member_api_docs

import 'dart:ui';

/// The primitive palette. Components read the roles in [InvisibleColors], never
/// these.
abstract final class InvisiblePalette {
  static const Color purple500 = Color(0xFF7A52CC);
  static const Color purple600 = Color(0xFF6840B7);
  static const Color blue500 = Color(0xFF4067B6);
  static const Color orange500 = Color(0xFFC96422);
  static const Color green600 = Color(0xFF3E7523);
  static const Color red600 = Color(0xFFBE3B50);
  static const Color red700 = Color(0xFFAB2E42);
  static const Color grey0 = Color(0xFFFFFFFF);
  static const Color grey50 = Color(0xFFF4F2EF);
  static const Color grey100 = Color(0xFFE6E0D8);
  static const Color grey200 = Color(0xFFC7C1B7);
  static const Color grey300 = Color(0xFFA8A297);
  static const Color grey400 = Color(0xFF757067);
  static const Color grey500 = Color(0xFF5E5951);
  static const Color grey600 = Color(0xFF524C44);
  static const Color grey700 = Color(0xFF413C36);
  static const Color grey800 = Color(0xFF332F2A);
  static const Color grey900 = Color(0xFF282420);
  static const Color grey950 = Color(0xFF1C1915);
}

/// The semantic style tier: brand and feedback colours.
abstract final class InvisibleStyleColors {
  static const Color primaryDefault = Color(0xFF7A52CC);
  static const Color primaryHover = Color(0xFF6840B7);
  static const Color secondaryDefault = Color(0xFF7A52CC);
  static const Color secondaryHover = Color(0xFF6840B7);
  static const Color infoDefault = Color(0xFF4067B6);
  static const Color successDefault = Color(0xFF3E7523);
  static const Color warningDefault = Color(0xFFC96422);
  static const Color dangerDefault = Color(0xFFBE3B50);
  static const Color dangerHover = Color(0xFFAB2E42);

  /// Focus ring on dark surfaces: secondary mixed 70% with white, as
  /// --ds-color-focus-ring in dark mode. The primary reaches only 2.87:1 on
  /// grey 900.
  static const Color focusOnDark = Color(0xFFA286DB);
}

/// Corner radii, in logical pixels.
abstract final class InvisibleRadiusTokens {
  static const double control = 8.0;
  static const double surface = 12.0;
  static const double pill = 999.0;
}

/// The focus indicator: a solid ring and a translucent halo around it. The
/// colours are color-focus-ring and color-focus-halo in the role tier. Sizes in
/// logical pixels.
abstract final class InvisibleFocusTokens {
  static const double ringWidth = 2.0;
  static const double ringOffset = 2.0;
  static const double haloWidth = 3.0;
}

/// Line heights, heading weight and heading sizes, from a 100% root font size.
/// Font sizes in logical pixels.
abstract final class InvisibleTypographyTokens {
  static const double lineHeight = 1.4;
  static const double lineHeightTight = 1.2;
  static const FontWeight headingWeight = FontWeight.w700;
  static const double fontSizeH1 = 38.0;
  static const double fontSizeH2 = 32.0;
  static const double fontSizeH3 = 28.0;
  static const double fontSizeH4 = 24.0;
  static const double fontSizeH5 = 20.0;
  static const double fontSizeH6 = 16.0;
}

/// Control sizing per density level. regular is the default and matches
/// tokens.css. min-target-size is the side of the smallest square hit area a
/// control keeps, whatever its painted size: 24 by 24 under compact and regular
/// (WCAG 2.5.8), 44 by 44 under touch.
///
/// A size that the source leaves undefined for a level is null.
final class InvisibleDensityTokens {
  const InvisibleDensityTokens._({
    required this.minTargetSize,
    this.controlPaddingY,
    this.controlPaddingX,
  });

  static const compact = InvisibleDensityTokens._(minTargetSize: 24.0);
  static const regular = InvisibleDensityTokens._(
    controlPaddingY: 8.0,
    controlPaddingX: 14.0,
    minTargetSize: 24.0,
  );
  static const touch = InvisibleDensityTokens._(minTargetSize: 44.0);

  final double minTargetSize;

  final double? controlPaddingY;

  final double? controlPaddingX;
}

/// How a mixed colour role is made: [base] mixed with [mixWith] in sRGB,
/// [amount] of [base], as CSS `color-mix()` computes it. [value] is the
/// resolved colour the role holds.
final class InvisibleColorMix {
  const InvisibleColorMix({
    required this.base,
    required this.amount,
    required this.mixWith,
    required this.value,
  });

  final Color base;

  final double amount;

  final Color mixWith;

  final Color value;

  /// Computes the mix again, with premultiplied alpha as CSS does.
  Color resolve() {
    final a = base.a * amount + mixWith.a * (1 - amount);
    if (a == 0) return const Color(0x00000000);
    double channel(double b, double w) =>
        (b * base.a * amount + w * mixWith.a * (1 - amount)) / a;
    return Color.from(
      alpha: a,
      red: channel(base.r, mixWith.r),
      green: channel(base.g, mixWith.g),
      blue: channel(base.b, mixWith.b),
    );
  }
}

/// The colour roles the components read, per theme. Mixed roles hold the
/// resolved value; [InvisibleColorMixes] keeps their recipes.
final class InvisibleColors {
  const InvisibleColors({
    required this.background,
    required this.text,
    required this.textSecondary,
    required this.textDisabled,
    required this.border,
    required this.controlBorder,
    required this.surface,
    required this.surfaceHover,
    required this.disabled,
    required this.stateHover,
    required this.statePressed,
    required this.focusRing,
    required this.focusHalo,
    required this.primary,
    required this.primaryHover,
    required this.onPrimary,
    required this.secondary,
    required this.secondaryHover,
    required this.onSecondary,
    required this.info,
    required this.success,
    required this.warning,
    required this.danger,
    required this.dangerHover,
    required this.neutral,
    required this.onStatus,
    required this.onWarning,
    required this.infoSurface,
    required this.infoBorder,
    required this.successSurface,
    required this.successBorder,
    required this.warningSurface,
    required this.warningBorder,
    required this.dangerSurface,
    required this.dangerBorder,
    required this.destructiveSurface,
    required this.onDestructiveSurface,
    required this.secondarySurface,
    required this.onSecondarySurface,
    required this.neutralSurface,
    required this.neutralBorder,
    required this.infoText,
    required this.successText,
    required this.warningText,
    required this.dangerText,
    required this.selectedText,
    required this.neutralText,
    required this.secondaryBodyText,
    required this.dangerBodyText,
    required this.successBodyText,
    required this.emphasisSurface,
    required this.onEmphasis,
    required this.emphasisBorder,
    required this.selected,
    required this.onSelected,
  });

  static const InvisibleColors light = InvisibleColors(
    background: Color(0xFFFFFFFF),
    text: Color(0xFF282420),
    textSecondary: Color(0xFF524C44),
    textDisabled: Color(0xFF757067),
    border: Color(0xFFC7C1B7),
    controlBorder: Color(0xFF757067),
    surface: Color(0xFFE6E0D8),
    surfaceHover: Color(0xFFC7C1B7),
    disabled: Color(0xFFC7C1B7),
    stateHover: Color(0x0F000000),
    statePressed: Color(0x1F000000),
    focusRing: Color(0xFF8E6CD4),
    focusHalo: Color(0x4D8E6CD4),
    primary: Color(0xFF7A52CC),
    primaryHover: Color(0xFF6840B7),
    onPrimary: Color(0xFFFFFFFF),
    secondary: Color(0xFF7A52CC),
    secondaryHover: Color(0xFF6840B7),
    onSecondary: Color(0xFFFFFFFF),
    info: Color(0xFF4067B6),
    success: Color(0xFF3E7523),
    warning: Color(0xFFC96422),
    danger: Color(0xFFBE3B50),
    dangerHover: Color(0xFFAB2E42),
    neutral: Color(0xFF5E5951),
    onStatus: Color(0xFFFFFFFF),
    onWarning: Color(0xFF282420),
    infoSurface: Color(0xFFF0F3F9),
    infoBorder: Color(0xFFC6D1E9),
    successSurface: Color(0xFFF0F4ED),
    successBorder: Color(0xFFC5D6BD),
    warningSurface: Color(0xFFFBF3ED),
    warningBorder: Color(0xFFEFD1BD),
    dangerSurface: Color(0xFFFAEFF1),
    dangerBorder: Color(0xFFECC4CB),
    destructiveSurface: Color(0xFFF9EBEE),
    onDestructiveSurface: Color(0xFFAB2E42),
    secondarySurface: Color(0xFFEBE5F7),
    onSecondarySurface: Color(0xFF6840B7),
    neutralSurface: Color(0xFFF4F2EF),
    neutralBorder: Color(0xFFC7C1B7),
    infoText: Color(0xFF344468),
    successText: Color(0xFF334E22),
    warningText: Color(0xFF6C3F21),
    dangerText: Color(0xFF7F313C),
    selectedText: Color(0xFF553D7F),
    neutralText: Color(0xFF413C36),
    secondaryBodyText: Color(0xFF7A52CC),
    dangerBodyText: Color(0xFFBE3B50),
    successBodyText: Color(0xFF3E7523),
    emphasisSurface: Color(0xFF332F2A),
    onEmphasis: Color(0xFFF4F2EF),
    emphasisBorder: Color(0xFF413C36),
    selected: Color(0xFF7A52CC),
    onSelected: Color(0xFFFFFFFF),
  );

  static const InvisibleColors dark = InvisibleColors(
    background: Color(0xFF282420),
    text: Color(0xFFF4F2EF),
    textSecondary: Color(0xFFC7C1B7),
    textDisabled: Color(0xFF524C44),
    border: Color(0xFF413C36),
    controlBorder: Color(0xFFA8A297),
    surface: Color(0xFF413C36),
    surfaceHover: Color(0xFF524C44),
    disabled: Color(0xFF332F2A),
    stateHover: Color(0x17FFFFFF),
    statePressed: Color(0x29FFFFFF),
    focusRing: Color(0xFFA286DB),
    focusHalo: Color(0x4DA286DB),
    primary: Color(0xFF7A52CC),
    primaryHover: Color(0xFF6840B7),
    onPrimary: Color(0xFFFFFFFF),
    secondary: Color(0xFF7A52CC),
    secondaryHover: Color(0xFF6840B7),
    onSecondary: Color(0xFFFFFFFF),
    info: Color(0xFF4067B6),
    success: Color(0xFF3E7523),
    warning: Color(0xFFC96422),
    danger: Color(0xFFBE3B50),
    dangerHover: Color(0xFFAB2E42),
    neutral: Color(0xFF5E5951),
    onStatus: Color(0xFFFFFFFF),
    onWarning: Color(0xFF282420),
    infoSurface: Color(0xFF2D3341),
    infoBorder: Color(0xFF334264),
    successSurface: Color(0xFF2D3621),
    successBorder: Color(0xFF324821),
    warningSurface: Color(0xFF4B3220),
    warningBorder: Color(0xFF704121),
    dangerSurface: Color(0xFF49292B),
    dangerBorder: Color(0xFF6C2E36),
    destructiveSurface: Color(0xFF432829),
    onDestructiveSurface: Color(0xFFFFFFFF),
    secondarySurface: Color(0xFF342B3A),
    onSecondarySurface: Color(0xFFFFFFFF),
    neutralSurface: Color(0xFF332F2A),
    neutralBorder: Color(0xFF413C36),
    infoText: Color(0xFFA8B8D7),
    successText: Color(0xFF99B489),
    warningText: Color(0xFFDBA078),
    dangerText: Color(0xFFDA9AA3),
    selectedText: Color(0xFFA88FD9),
    neutralText: Color(0xFFC7C1B7),
    secondaryBodyText: Color(0xFFA88FD9),
    dangerBodyText: Color(0xFFDA9AA3),
    successBodyText: Color(0xFF99B489),
    emphasisSurface: Color(0xFFE6E0D8),
    onEmphasis: Color(0xFF282420),
    emphasisBorder: Color(0xFFA8A297),
    selected: Color(0xFF7A52CC),
    onSelected: Color(0xFFFFFFFF),
  );

  /// `color-background`.
  final Color background;

  /// `color-text`.
  final Color text;

  /// `color-text-secondary`.
  final Color textSecondary;

  /// `color-text-disabled`.
  final Color textDisabled;

  /// `color-border`.
  final Color border;

  /// `color-control-border`.
  final Color controlBorder;

  /// `color-surface`.
  final Color surface;

  /// `color-surface-hover`.
  final Color surfaceHover;

  /// `color-disabled`.
  final Color disabled;

  /// `state-hover`.
  final Color stateHover;

  /// `state-pressed`.
  final Color statePressed;

  /// `color-focus-ring`.
  final Color focusRing;

  /// `color-focus-halo`.
  final Color focusHalo;

  /// `color-primary`.
  final Color primary;

  /// `color-primary-hover`.
  final Color primaryHover;

  /// `color-on-primary`.
  final Color onPrimary;

  /// `color-secondary`.
  final Color secondary;

  /// `color-secondary-hover`.
  final Color secondaryHover;

  /// `color-on-secondary`.
  final Color onSecondary;

  /// `color-info`.
  final Color info;

  /// `color-success`.
  final Color success;

  /// `color-warning`.
  final Color warning;

  /// `color-danger`.
  final Color danger;

  /// `color-danger-hover`.
  final Color dangerHover;

  /// `color-neutral`.
  final Color neutral;

  /// `color-on-status`.
  final Color onStatus;

  /// `color-on-warning`.
  final Color onWarning;

  /// `color-info-surface`.
  final Color infoSurface;

  /// `color-info-border`.
  final Color infoBorder;

  /// `color-success-surface`.
  final Color successSurface;

  /// `color-success-border`.
  final Color successBorder;

  /// `color-warning-surface`.
  final Color warningSurface;

  /// `color-warning-border`.
  final Color warningBorder;

  /// `color-danger-surface`.
  final Color dangerSurface;

  /// `color-danger-border`.
  final Color dangerBorder;

  /// `color-destructive-surface`.
  final Color destructiveSurface;

  /// `color-on-destructive-surface`.
  final Color onDestructiveSurface;

  /// `color-secondary-surface`.
  final Color secondarySurface;

  /// `color-on-secondary-surface`.
  final Color onSecondarySurface;

  /// `color-neutral-surface`.
  final Color neutralSurface;

  /// `color-neutral-border`.
  final Color neutralBorder;

  /// `color-info-text`.
  final Color infoText;

  /// `color-success-text`.
  final Color successText;

  /// `color-warning-text`.
  final Color warningText;

  /// `color-danger-text`.
  final Color dangerText;

  /// `color-selected-text`.
  final Color selectedText;

  /// `color-neutral-text`.
  final Color neutralText;

  /// `color-secondary-body-text`.
  final Color secondaryBodyText;

  /// `color-danger-body-text`.
  final Color dangerBodyText;

  /// `color-success-body-text`.
  final Color successBodyText;

  /// `color-emphasis-surface`.
  final Color emphasisSurface;

  /// `color-on-emphasis`.
  final Color onEmphasis;

  /// `color-emphasis-border`.
  final Color emphasisBorder;

  /// `color-selected`.
  final Color selected;

  /// `color-on-selected`.
  final Color onSelected;

  /// A copy with the given roles replaced.
  InvisibleColors copyWith({
    Color? background,
    Color? text,
    Color? textSecondary,
    Color? textDisabled,
    Color? border,
    Color? controlBorder,
    Color? surface,
    Color? surfaceHover,
    Color? disabled,
    Color? stateHover,
    Color? statePressed,
    Color? focusRing,
    Color? focusHalo,
    Color? primary,
    Color? primaryHover,
    Color? onPrimary,
    Color? secondary,
    Color? secondaryHover,
    Color? onSecondary,
    Color? info,
    Color? success,
    Color? warning,
    Color? danger,
    Color? dangerHover,
    Color? neutral,
    Color? onStatus,
    Color? onWarning,
    Color? infoSurface,
    Color? infoBorder,
    Color? successSurface,
    Color? successBorder,
    Color? warningSurface,
    Color? warningBorder,
    Color? dangerSurface,
    Color? dangerBorder,
    Color? destructiveSurface,
    Color? onDestructiveSurface,
    Color? secondarySurface,
    Color? onSecondarySurface,
    Color? neutralSurface,
    Color? neutralBorder,
    Color? infoText,
    Color? successText,
    Color? warningText,
    Color? dangerText,
    Color? selectedText,
    Color? neutralText,
    Color? secondaryBodyText,
    Color? dangerBodyText,
    Color? successBodyText,
    Color? emphasisSurface,
    Color? onEmphasis,
    Color? emphasisBorder,
    Color? selected,
    Color? onSelected,
  }) {
    return InvisibleColors(
      background: background ?? this.background,
      text: text ?? this.text,
      textSecondary: textSecondary ?? this.textSecondary,
      textDisabled: textDisabled ?? this.textDisabled,
      border: border ?? this.border,
      controlBorder: controlBorder ?? this.controlBorder,
      surface: surface ?? this.surface,
      surfaceHover: surfaceHover ?? this.surfaceHover,
      disabled: disabled ?? this.disabled,
      stateHover: stateHover ?? this.stateHover,
      statePressed: statePressed ?? this.statePressed,
      focusRing: focusRing ?? this.focusRing,
      focusHalo: focusHalo ?? this.focusHalo,
      primary: primary ?? this.primary,
      primaryHover: primaryHover ?? this.primaryHover,
      onPrimary: onPrimary ?? this.onPrimary,
      secondary: secondary ?? this.secondary,
      secondaryHover: secondaryHover ?? this.secondaryHover,
      onSecondary: onSecondary ?? this.onSecondary,
      info: info ?? this.info,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      dangerHover: dangerHover ?? this.dangerHover,
      neutral: neutral ?? this.neutral,
      onStatus: onStatus ?? this.onStatus,
      onWarning: onWarning ?? this.onWarning,
      infoSurface: infoSurface ?? this.infoSurface,
      infoBorder: infoBorder ?? this.infoBorder,
      successSurface: successSurface ?? this.successSurface,
      successBorder: successBorder ?? this.successBorder,
      warningSurface: warningSurface ?? this.warningSurface,
      warningBorder: warningBorder ?? this.warningBorder,
      dangerSurface: dangerSurface ?? this.dangerSurface,
      dangerBorder: dangerBorder ?? this.dangerBorder,
      destructiveSurface: destructiveSurface ?? this.destructiveSurface,
      onDestructiveSurface: onDestructiveSurface ?? this.onDestructiveSurface,
      secondarySurface: secondarySurface ?? this.secondarySurface,
      onSecondarySurface: onSecondarySurface ?? this.onSecondarySurface,
      neutralSurface: neutralSurface ?? this.neutralSurface,
      neutralBorder: neutralBorder ?? this.neutralBorder,
      infoText: infoText ?? this.infoText,
      successText: successText ?? this.successText,
      warningText: warningText ?? this.warningText,
      dangerText: dangerText ?? this.dangerText,
      selectedText: selectedText ?? this.selectedText,
      neutralText: neutralText ?? this.neutralText,
      secondaryBodyText: secondaryBodyText ?? this.secondaryBodyText,
      dangerBodyText: dangerBodyText ?? this.dangerBodyText,
      successBodyText: successBodyText ?? this.successBodyText,
      emphasisSurface: emphasisSurface ?? this.emphasisSurface,
      onEmphasis: onEmphasis ?? this.onEmphasis,
      emphasisBorder: emphasisBorder ?? this.emphasisBorder,
      selected: selected ?? this.selected,
      onSelected: onSelected ?? this.onSelected,
    );
  }

  List<Color> get _values => [
    background,
    text,
    textSecondary,
    textDisabled,
    border,
    controlBorder,
    surface,
    surfaceHover,
    disabled,
    stateHover,
    statePressed,
    focusRing,
    focusHalo,
    primary,
    primaryHover,
    onPrimary,
    secondary,
    secondaryHover,
    onSecondary,
    info,
    success,
    warning,
    danger,
    dangerHover,
    neutral,
    onStatus,
    onWarning,
    infoSurface,
    infoBorder,
    successSurface,
    successBorder,
    warningSurface,
    warningBorder,
    dangerSurface,
    dangerBorder,
    destructiveSurface,
    onDestructiveSurface,
    secondarySurface,
    onSecondarySurface,
    neutralSurface,
    neutralBorder,
    infoText,
    successText,
    warningText,
    dangerText,
    selectedText,
    neutralText,
    secondaryBodyText,
    dangerBodyText,
    successBodyText,
    emphasisSurface,
    onEmphasis,
    emphasisBorder,
    selected,
    onSelected,
  ];

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! InvisibleColors) return false;
    final mine = _values;
    final theirs = other._values;
    for (var i = 0; i < mine.length; i++) {
      if (mine[i] != theirs[i]) return false;
    }
    return true;
  }

  @override
  int get hashCode => Object.hashAll(_values);
}

/// The recipes of the mixed colour roles, by [InvisibleColors] field name.
abstract final class InvisibleColorMixes {
  static const Map<String, InvisibleColorMix> light = {
    'focusRing': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.85,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFF8E6CD4),
    ),
    'focusHalo': InvisibleColorMix(
      base: Color(0xFF8E6CD4),
      amount: 0.3,
      mixWith: Color(0x00000000),
      value: Color(0x4D8E6CD4),
    ),
    'infoSurface': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.08,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFF0F3F9),
    ),
    'infoBorder': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.3,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFC6D1E9),
    ),
    'successSurface': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.08,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFF0F4ED),
    ),
    'successBorder': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.3,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFC5D6BD),
    ),
    'warningSurface': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.08,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFFBF3ED),
    ),
    'warningBorder': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.3,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFEFD1BD),
    ),
    'dangerSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.08,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFFAEFF1),
    ),
    'dangerBorder': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.3,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFECC4CB),
    ),
    'destructiveSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.1,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFF9EBEE),
    ),
    'secondarySurface': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.15,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFEBE5F7),
    ),
    'infoText': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.48,
      mixWith: Color(0xFF282420),
      value: Color(0xFF344468),
    ),
    'successText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.52,
      mixWith: Color(0xFF282420),
      value: Color(0xFF334E22),
    ),
    'warningText': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.42,
      mixWith: Color(0xFF282420),
      value: Color(0xFF6C3F21),
    ),
    'dangerText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.58,
      mixWith: Color(0xFF282420),
      value: Color(0xFF7F313C),
    ),
    'selectedText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.55,
      mixWith: Color(0xFF282420),
      value: Color(0xFF553D7F),
    ),
  };

  static const Map<String, InvisibleColorMix> dark = {
    'focusHalo': InvisibleColorMix(
      base: Color(0xFFA286DB),
      amount: 0.3,
      mixWith: Color(0x00000000),
      value: Color(0x4DA286DB),
    ),
    'infoSurface': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.22,
      mixWith: Color(0xFF282420),
      value: Color(0xFF2D3341),
    ),
    'infoBorder': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.45,
      mixWith: Color(0xFF282420),
      value: Color(0xFF334264),
    ),
    'successSurface': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.22,
      mixWith: Color(0xFF282420),
      value: Color(0xFF2D3621),
    ),
    'successBorder': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.45,
      mixWith: Color(0xFF282420),
      value: Color(0xFF324821),
    ),
    'warningSurface': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.22,
      mixWith: Color(0xFF282420),
      value: Color(0xFF4B3220),
    ),
    'warningBorder': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.45,
      mixWith: Color(0xFF282420),
      value: Color(0xFF704121),
    ),
    'dangerSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.22,
      mixWith: Color(0xFF282420),
      value: Color(0xFF49292B),
    ),
    'dangerBorder': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.45,
      mixWith: Color(0xFF282420),
      value: Color(0xFF6C2E36),
    ),
    'destructiveSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.18,
      mixWith: Color(0xFF282420),
      value: Color(0xFF432829),
    ),
    'secondarySurface': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.15,
      mixWith: Color(0xFF282420),
      value: Color(0xFF342B3A),
    ),
    'infoText': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.42,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFA8B8D7),
    ),
    'successText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.5,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFF99B489),
    ),
    'warningText': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.58,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFDBA078),
    ),
    'dangerText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.48,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFDA9AA3),
    ),
    'selectedText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.62,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFA88FD9),
    ),
    'secondaryBodyText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.62,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFA88FD9),
    ),
    'dangerBodyText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.48,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFFDA9AA3),
    ),
    'successBodyText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.5,
      mixWith: Color(0xFFF4F2EF),
      value: Color(0xFF99B489),
    ),
  };
}
