// Generated from packages/tokens/tokens.json with the format in
// scripts/tokens-dart-format.mjs. Do not edit: run `pnpm tokens:build`.
// `pnpm tokens:check` fails when this file differs from what the source
// produces.

// Each constant is named after its token path.
// ignore_for_file: public_member_api_docs

import 'dart:ui';

/// Button dimensions and typography.
abstract final class InvisibleButtonTokens {
  static const double radius = 8.0;
  static const double spacingX = 14.0;
  static const double spacingY = 8.0;
  static const double spacingGap = 8.0;
  static const double typographyLineHeight = 1.2;
  static const FontWeight typographyFontWeight = FontWeight.w500;
  static const double opacityDisabled = 0.5;
}

/// The primitive palette. Components read the roles in [InvisibleColors], never
/// these.
abstract final class InvisiblePalette {
  static const Color dioxazinePurple50 = Color(0xFFF1ECFA);
  static const Color dioxazinePurple100 = Color(0xFFD4C7EF);
  static const Color dioxazinePurple200 = Color(0xFFB8A1E6);
  static const Color dioxazinePurple300 = Color(0xFFA284DD);
  static const Color dioxazinePurple400 = Color(0xFF8D6AD4);
  static const Color dioxazinePurple500 = Color(0xFF7A52CC);
  static const Color dioxazinePurple600 = Color(0xFF6840B7);
  static const Color dioxazinePurple700 = Color(0xFF563795);
  static const Color dioxazinePurple800 = Color(0xFF442780);
  static const Color dioxazinePurple900 = Color(0xFF34186E);
  static const Color dioxazinePurple950 = Color(0xFF230A56);
  static const Color cobaltBlue50 = Color(0xFFE9EEFA);
  static const Color cobaltBlue100 = Color(0xFFBCCDF1);
  static const Color cobaltBlue200 = Color(0xFF8FACE8);
  static const Color cobaltBlue300 = Color(0xFF6B8FD7);
  static const Color cobaltBlue400 = Color(0xFF527ACC);
  static const Color cobaltBlue500 = Color(0xFF4067B6);
  static const Color cobaltBlue600 = Color(0xFF3A5CA0);
  static const Color cobaltBlue700 = Color(0xFF324D83);
  static const Color cobaltBlue800 = Color(0xFF273B65);
  static const Color cobaltBlue900 = Color(0xFF1D2D4D);
  static const Color cobaltBlue950 = Color(0xFF0F1B34);
  static const Color burntOrange50 = Color(0xFFFAEBE1);
  static const Color burntOrange100 = Color(0xFFF7DDCC);
  static const Color burntOrange200 = Color(0xFFEEBB99);
  static const Color burntOrange300 = Color(0xFFE7A071);
  static const Color burntOrange400 = Color(0xFFDD7734);
  static const Color burntOrange500 = Color(0xFFC96422);
  static const Color burntOrange600 = Color(0xFFBC5716);
  static const Color burntOrange700 = Color(0xFFA4460A);
  static const Color burntOrange800 = Color(0xFF873602);
  static const Color burntOrange900 = Color(0xFF582200);
  static const Color burntOrange950 = Color(0xFF3E1800);
  static const Color sapGreen50 = Color(0xFFEAF5E4);
  static const Color sapGreen100 = Color(0xFFC6E3B7);
  static const Color sapGreen200 = Color(0xFFAAD693);
  static const Color sapGreen300 = Color(0xFF94C37D);
  static const Color sapGreen400 = Color(0xFF73A958);
  static const Color sapGreen500 = Color(0xFF508B32);
  static const Color sapGreen600 = Color(0xFF3E7523);
  static const Color sapGreen700 = Color(0xFF306217);
  static const Color sapGreen800 = Color(0xFF224D0C);
  static const Color sapGreen900 = Color(0xFF143404);
  static const Color sapGreen950 = Color(0xFF0D2301);
  static const Color alizarinRed50 = Color(0xFFFAECEE);
  static const Color alizarinRed100 = Color(0xFFEFC7CD);
  static const Color alizarinRed200 = Color(0xFFE5A1AC);
  static const Color alizarinRed300 = Color(0xFFE67F90);
  static const Color alizarinRed400 = Color(0xFFE65C73);
  static const Color alizarinRed500 = Color(0xFFD54D63);
  static const Color alizarinRed600 = Color(0xFFBE3B50);
  static const Color alizarinRed700 = Color(0xFFAB2E42);
  static const Color alizarinRed800 = Color(0xFF881A2B);
  static const Color alizarinRed900 = Color(0xFF6A0F1D);
  static const Color alizarinRed950 = Color(0xFF4E0410);
  static const Color grey0 = Color(0xFFFFFFFF);
  static const Color grey50 = Color(0xFFF5F5F5);
  static const Color grey100 = Color(0xFFE0E0E0);
  static const Color grey200 = Color(0xFFBDBDBD);
  static const Color grey300 = Color(0xFF9E9E9E);
  static const Color grey400 = Color(0xFF757575);
  static const Color grey500 = Color(0xFF616161);
  static const Color grey600 = Color(0xFF515151);
  static const Color grey700 = Color(0xFF414141);
  static const Color grey800 = Color(0xFF323232);
  static const Color grey900 = Color(0xFF272727);
  static const Color grey950 = Color(0xFF1B1B1B);
  static const Color black = Color(0xFF121212);
  static const Color magentaPink50 = Color(0xFFFAECF5);
  static const Color magentaPink100 = Color(0xFFEFC7E2);
  static const Color magentaPink200 = Color(0xFFE5A1CE);
  static const Color magentaPink300 = Color(0xFFE67FC4);
  static const Color magentaPink400 = Color(0xFFE65CB8);
  static const Color magentaPink500 = Color(0xFFD54DA8);
  static const Color magentaPink600 = Color(0xFFBE3B92);
  static const Color magentaPink700 = Color(0xFFAB2E82);
  static const Color magentaPink800 = Color(0xFF881A63);
  static const Color magentaPink900 = Color(0xFF6A0F4C);
  static const Color magentaPink950 = Color(0xFF500537);
  static const Color naplesYellow50 = Color(0xFFFFFAE7);
  static const Color naplesYellow100 = Color(0xFFFEF0B6);
  static const Color naplesYellow200 = Color(0xFFFEE285);
  static const Color naplesYellow300 = Color(0xFFF9D574);
  static const Color naplesYellow400 = Color(0xFFE8BA4F);
  static const Color naplesYellow500 = Color(0xFFDFA124);
  static const Color naplesYellow600 = Color(0xFFC8830C);
  static const Color naplesYellow700 = Color(0xFFAD6B08);
  static const Color naplesYellow800 = Color(0xFF915200);
  static const Color naplesYellow900 = Color(0xFF633501);
  static const Color naplesYellow950 = Color(0xFF432400);
  static const Color limeGreen50 = Color(0xFFF9FBE7);
  static const Color limeGreen100 = Color(0xFFF0F4C3);
  static const Color limeGreen200 = Color(0xFFE6EE9C);
  static const Color limeGreen300 = Color(0xFFDCE775);
  static const Color limeGreen400 = Color(0xFFC8D547);
  static const Color limeGreen500 = Color(0xFFADBB23);
  static const Color limeGreen600 = Color(0xFF8A9613);
  static const Color limeGreen700 = Color(0xFF6F790B);
  static const Color limeGreen800 = Color(0xFF545C05);
  static const Color limeGreen900 = Color(0xFF363D02);
  static const Color limeGreen950 = Color(0xFF262B00);
  static const Color viridianGreen50 = Color(0xFFE6F5F3);
  static const Color viridianGreen100 = Color(0xFFB3E0DC);
  static const Color viridianGreen200 = Color(0xFF80CBC4);
  static const Color viridianGreen300 = Color(0xFF4DB6AC);
  static const Color viridianGreen400 = Color(0xFF26A69A);
  static const Color viridianGreen500 = Color(0xFF00897B);
  static const Color viridianGreen600 = Color(0xFF007265);
  static const Color viridianGreen700 = Color(0xFF005D50);
  static const Color viridianGreen800 = Color(0xFF014439);
  static const Color viridianGreen900 = Color(0xFF00352C);
  static const Color viridianGreen950 = Color(0xFF00241E);
  static const Color ceruleanBlue50 = Color(0xFFE1F5FE);
  static const Color ceruleanBlue100 = Color(0xFFB2DEF2);
  static const Color ceruleanBlue200 = Color(0xFF8ACCEA);
  static const Color ceruleanBlue300 = Color(0xFF63B9E1);
  static const Color ceruleanBlue400 = Color(0xFF3DA4D4);
  static const Color ceruleanBlue500 = Color(0xFF2790C1);
  static const Color ceruleanBlue600 = Color(0xFF197AA7);
  static const Color ceruleanBlue700 = Color(0xFF0E668F);
  static const Color ceruleanBlue800 = Color(0xFF054664);
  static const Color ceruleanBlue900 = Color(0xFF033349);
  static const Color ceruleanBlue950 = Color(0xFF00202E);
  static const Color warmGrey50 = Color(0xFFF4F2EF);
  static const Color warmGrey100 = Color(0xFFE6E0D8);
  static const Color warmGrey200 = Color(0xFFC7C1B7);
  static const Color warmGrey300 = Color(0xFFA8A297);
  static const Color warmGrey400 = Color(0xFF757067);
  static const Color warmGrey500 = Color(0xFF5E5951);
  static const Color warmGrey600 = Color(0xFF524C44);
  static const Color warmGrey700 = Color(0xFF413C36);
  static const Color warmGrey800 = Color(0xFF332F2A);
  static const Color warmGrey900 = Color(0xFF282420);
  static const Color warmGrey950 = Color(0xFF1C1915);
}

/// Tenant brand colours.
abstract final class InvisibleBrandColors {
  static const Color primaryDefault = Color(0xFF7A52CC);
  static const Color primaryHover = Color(0xFF6840B7);
  static const Color secondaryDefault = Color(0xFF7A52CC);
  static const Color secondaryHover = Color(0xFF6840B7);
}

/// Tenant feedback colours.
abstract final class InvisibleFeedbackColors {
  static const Color infoDefault = Color(0xFF4067B6);
  static const Color successDefault = Color(0xFF3E7523);
  static const Color warningDefault = Color(0xFFC96422);
  static const Color dangerDefault = Color(0xFFBE3B50);
  static const Color dangerHover = Color(0xFFAB2E42);
}

/// Corner radii, in logical pixels.
abstract final class InvisibleRadiusTokens {
  static const double control = 8.0;
  static const double container = 12.0;
  static const double pill = 999.0;
}

/// Focus dimensions in logical pixels.
abstract final class InvisibleFocusTokens {
  static const double ringWidth = 2.0;
  static const double ringOffset = 2.0;
  static const double haloWidth = 3.0;
}

/// Typography. Font sizes in logical pixels.
abstract final class InvisibleTypographyTokens {
  static const double lineHeightDefault = 1.4;
  static const double lineHeightHeading = 1.2;
  static const FontWeight fontWeightHeading = FontWeight.w700;
  static const double fontSizeH1 = 38.0;
  static const double fontSizeH2 = 32.0;
  static const double fontSizeH3 = 28.0;
  static const double fontSizeH4 = 24.0;
  static const double fontSizeH5 = 20.0;
  static const double fontSizeH6 = 16.0;
}

/// Control dimensions by density.
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

/// The colour roles and the component backgrounds the components read, per
/// theme. Mixed roles hold the resolved value; [InvisibleColorMixes] keeps
/// their recipes.
final class InvisibleColors {
  const InvisibleColors({
    required this.background,
    required this.text,
    required this.textSecondary,
    required this.textDisabled,
    required this.border,
    required this.controlBorder,
    required this.actionBorder,
    required this.selectedBorder,
    required this.avatarBackground,
    required this.switchBackground,
    required this.stepperBackground,
    required this.navigationBarBackground,
    required this.buttonBackground,
    required this.buttonHover,
    required this.buttonForeground,
    required this.buttonBorder,
    required this.buttonPrimaryBackground,
    required this.buttonPrimaryHover,
    required this.buttonPrimaryForeground,
    required this.buttonPrimaryBorder,
    required this.buttonSecondaryBackground,
    required this.buttonSecondaryHover,
    required this.buttonSecondaryForeground,
    required this.buttonSecondaryBorder,
    required this.buttonGhostBackground,
    required this.buttonGhostHover,
    required this.buttonGhostForeground,
    required this.buttonGhostBorder,
    required this.buttonDangerBackground,
    required this.buttonDangerHover,
    required this.buttonDangerForeground,
    required this.buttonDangerBorder,
    required this.toggleButtonBorder,
    required this.toggleButtonSelectedBorder,
    required this.toggleGroupBorder,
    required this.segmentedControlBorder,
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
    required this.warningLabelSurface,
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
    required this.dialogOverlay,
    required this.navigationBarCurrentIndicator,
    required this.gridCellSecondarySurface,
    required this.pageBackground,
    required this.cardBackground,
    required this.cardSecondaryBackground,
    required this.dialogBackground,
    required this.popoverBackground,
    required this.menuBackground,
    required this.sidebarBackground,
    required this.codeBlockBackground,
  });

  static const InvisibleColors light = InvisibleColors(
    background: Color(0xFFFFFFFF),
    text: Color(0xFF272727),
    textSecondary: Color(0xFF515151),
    textDisabled: Color(0xFF757575),
    border: Color(0xFFBDBDBD),
    controlBorder: Color(0xFF757575),
    actionBorder: Color(0xFF9E9E9E),
    selectedBorder: Color(0xFFA286DB),
    avatarBackground: Color(0xFFE0E0E0),
    switchBackground: Color(0xFFE0E0E0),
    stepperBackground: Color(0xFFE0E0E0),
    navigationBarBackground: Color(0xFFE0E0E0),
    buttonBackground: Color(0xFFFFFFFF),
    buttonHover: Color(0x0F000000),
    buttonForeground: Color(0xFF272727),
    buttonBorder: Color(0xFF9E9E9E),
    buttonPrimaryBackground: Color(0xFF7A52CC),
    buttonPrimaryHover: Color(0xFF6840B7),
    buttonPrimaryForeground: Color(0xFFFFFFFF),
    buttonPrimaryBorder: Color(0x00000000),
    buttonSecondaryBackground: Color(0xFFEBE5F7),
    buttonSecondaryHover: Color.from(
      alpha: 1.0,
      red: 0.8748235294117648,
      green: 0.8371764705882353,
      blue: 0.952,
    ),
    buttonSecondaryForeground: Color(0xFF6840B7),
    buttonSecondaryBorder: Color.from(
      alpha: 0.55,
      red: 0.47843137254901963,
      green: 0.3215686274509804,
      blue: 0.8,
    ),
    buttonGhostBackground: Color(0x00000000),
    buttonGhostHover: Color(0x0F000000),
    buttonGhostForeground: Color(0xFF272727),
    buttonGhostBorder: Color(0x00000000),
    buttonDangerBackground: Color(0xFFF9EBEE),
    buttonDangerHover: Color.from(
      alpha: 1.0,
      red: 0.9541176470588236,
      green: 0.8616470588235294,
      blue: 0.8764705882352942,
    ),
    buttonDangerForeground: Color(0xFFAB2E42),
    buttonDangerBorder: Color.from(
      alpha: 0.35,
      red: 0.7450980392156864,
      green: 0.23137254901960785,
      blue: 0.3137254901960784,
    ),
    toggleButtonBorder: Color(0xFF9E9E9E),
    toggleButtonSelectedBorder: Color(0xFFA286DB),
    toggleGroupBorder: Color(0xFF9E9E9E),
    segmentedControlBorder: Color(0xFF9E9E9E),
    disabled: Color(0xFFBDBDBD),
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
    neutral: Color(0xFF616161),
    onStatus: Color(0xFFFFFFFF),
    onWarning: Color(0xFF272727),
    warningLabelSurface: Color(0xFFD17B43),
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
    neutralSurface: Color(0xFFF5F5F5),
    neutralBorder: Color(0xFFBDBDBD),
    infoText: Color(0xFF33466C),
    successText: Color(0xFF335025),
    warningText: Color(0xFF6B4125),
    dangerText: Color(0xFF7F333F),
    selectedText: Color(0xFF553F82),
    neutralText: Color(0xFF414141),
    secondaryBodyText: Color(0xFF7A52CC),
    dangerBodyText: Color(0xFFBE3B50),
    successBodyText: Color(0xFF3E7523),
    emphasisSurface: Color(0xFF323232),
    onEmphasis: Color(0xFFF5F5F5),
    emphasisBorder: Color(0xFF414141),
    selected: Color(0xFF7A52CC),
    onSelected: Color(0xFFFFFFFF),
    dialogOverlay: Color(0x801B1B1B),
    navigationBarCurrentIndicator: Color(0xFF8763D1),
    gridCellSecondarySurface: Color(0xFFF5F5F5),
    pageBackground: Color(0xFFFFFFFF),
    cardBackground: Color(0xFFFFFFFF),
    cardSecondaryBackground: Color(0xFFF5F5F5),
    dialogBackground: Color(0xFFFFFFFF),
    popoverBackground: Color(0xFFFFFFFF),
    menuBackground: Color(0xFFFFFFFF),
    sidebarBackground: Color(0xFFFFFFFF),
    codeBlockBackground: Color(0xFFF5F5F5),
  );

  static const InvisibleColors dark = InvisibleColors(
    background: Color(0xFF272727),
    text: Color(0xFFF5F5F5),
    textSecondary: Color(0xFFBDBDBD),
    textDisabled: Color(0xFF515151),
    border: Color(0xFF414141),
    controlBorder: Color(0xFF9E9E9E),
    actionBorder: Color(0xFF7A7A7A),
    selectedBorder: Color(0xFF61459B),
    avatarBackground: Color(0xFF414141),
    switchBackground: Color(0xFF414141),
    stepperBackground: Color(0xFF414141),
    navigationBarBackground: Color(0xFF414141),
    buttonBackground: Color(0xFF272727),
    buttonHover: Color(0x17FFFFFF),
    buttonForeground: Color(0xFFF5F5F5),
    buttonBorder: Color(0xFF7A7A7A),
    buttonPrimaryBackground: Color(0xFF7A52CC),
    buttonPrimaryHover: Color(0xFF6840B7),
    buttonPrimaryForeground: Color(0xFFFFFFFF),
    buttonPrimaryBorder: Color(0x00000000),
    buttonSecondaryBackground: Color(0xFF332D40),
    buttonSecondaryHover: Color.from(
      alpha: 1.0,
      red: 0.2310588235294118,
      green: 0.19341176470588237,
      blue: 0.30823529411764705,
    ),
    buttonSecondaryForeground: Color(0xFFFFFFFF),
    buttonSecondaryBorder: Color.from(
      alpha: 0.55,
      red: 0.47843137254901963,
      green: 0.3215686274509804,
      blue: 0.8,
    ),
    buttonGhostBackground: Color(0x00000000),
    buttonGhostHover: Color(0x17FFFFFF),
    buttonGhostForeground: Color(0xFFF5F5F5),
    buttonGhostBorder: Color(0x00000000),
    buttonDangerBackground: Color(0xFF422B2E),
    buttonDangerHover: Color.from(
      alpha: 1.0,
      red: 0.2595294117647059,
      green: 0.16705882352941176,
      blue: 0.18188235294117647,
    ),
    buttonDangerForeground: Color(0xFFFFFFFF),
    buttonDangerBorder: Color.from(
      alpha: 0.35,
      red: 0.7450980392156864,
      green: 0.23137254901960785,
      blue: 0.3137254901960784,
    ),
    toggleButtonBorder: Color(0xFF7A7A7A),
    toggleButtonSelectedBorder: Color(0xFF61459B),
    toggleGroupBorder: Color(0xFF7A7A7A),
    segmentedControlBorder: Color(0xFF7A7A7A),
    disabled: Color(0xFF323232),
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
    neutral: Color(0xFF616161),
    onStatus: Color(0xFFFFFFFF),
    onWarning: Color(0xFF272727),
    warningLabelSurface: Color(0xFFD17B43),
    infoSurface: Color(0xFF2D3546),
    infoBorder: Color(0xFF324467),
    successSurface: Color(0xFF2C3826),
    successBorder: Color(0xFF314A25),
    warningSurface: Color(0xFF4B3426),
    warningBorder: Color(0xFF704225),
    dangerSurface: Color(0xFF482B30),
    dangerBorder: Color(0xFF6B3039),
    destructiveSurface: Color(0xFF422B2E),
    onDestructiveSurface: Color(0xFFFFFFFF),
    secondarySurface: Color(0xFF332D40),
    onSecondarySurface: Color(0xFFFFFFFF),
    neutralSurface: Color(0xFF323232),
    neutralBorder: Color(0xFF414141),
    infoText: Color(0xFFA9B9DB),
    successText: Color(0xFF9AB58C),
    warningText: Color(0xFFDBA17B),
    dangerText: Color(0xFFDB9CA6),
    selectedText: Color(0xFFA990DC),
    neutralText: Color(0xFFBDBDBD),
    secondaryBodyText: Color(0xFFA990DC),
    dangerBodyText: Color(0xFFDB9CA6),
    successBodyText: Color(0xFF9AB58C),
    emphasisSurface: Color(0xFFE0E0E0),
    onEmphasis: Color(0xFF272727),
    emphasisBorder: Color(0xFF9E9E9E),
    selected: Color(0xFF7A52CC),
    onSelected: Color(0xFFFFFFFF),
    dialogOverlay: Color(0x99000000),
    navigationBarCurrentIndicator: Color(0xFF9A7CD7),
    gridCellSecondarySurface: Color(0xFF323232),
    pageBackground: Color(0xFF121212),
    cardBackground: Color(0xFF1B1B1B),
    cardSecondaryBackground: Color(0xFF272727),
    dialogBackground: Color(0xFF1B1B1B),
    popoverBackground: Color(0xFF1B1B1B),
    menuBackground: Color(0xFF1B1B1B),
    sidebarBackground: Color(0xFF121212),
    codeBlockBackground: Color(0xFF1B1B1B),
  );

  /// `components.general.background.default`.
  final Color background;

  /// `components.general.foreground.default`.
  final Color text;

  /// `components.general.foreground.secondary`.
  final Color textSecondary;

  /// `components.general.foreground.disabled`.
  final Color textDisabled;

  /// `components.general.border.default`.
  final Color border;

  /// `components.general.border.control`.
  final Color controlBorder;

  /// `components.general.border.action`.
  final Color actionBorder;

  /// `components.general.border.selected`.
  final Color selectedBorder;

  /// `components.avatar.background.default`.
  final Color avatarBackground;

  /// `components.switch.background.default`.
  final Color switchBackground;

  /// `components.stepper.background.default`.
  final Color stepperBackground;

  /// `components.navigation-bar.background.default`.
  final Color navigationBarBackground;

  /// `components.button.background.default`.
  final Color buttonBackground;

  /// `components.button.background.hover`.
  final Color buttonHover;

  /// `components.button.foreground.default`.
  final Color buttonForeground;

  /// `components.button.border.default`.
  final Color buttonBorder;

  /// `components.button.background.primary.default`.
  final Color buttonPrimaryBackground;

  /// `components.button.background.primary.hover`.
  final Color buttonPrimaryHover;

  /// `components.button.foreground.primary.default`.
  final Color buttonPrimaryForeground;

  /// `components.button.border.primary.default`.
  final Color buttonPrimaryBorder;

  /// `components.button.background.secondary.default`.
  final Color buttonSecondaryBackground;

  /// `components.button.background.secondary.hover`.
  final Color buttonSecondaryHover;

  /// `components.button.foreground.secondary.default`.
  final Color buttonSecondaryForeground;

  /// `components.button.border.secondary.default`.
  final Color buttonSecondaryBorder;

  /// `components.button.background.ghost.default`.
  final Color buttonGhostBackground;

  /// `components.button.background.ghost.hover`.
  final Color buttonGhostHover;

  /// `components.button.foreground.ghost.default`.
  final Color buttonGhostForeground;

  /// `components.button.border.ghost.default`.
  final Color buttonGhostBorder;

  /// `components.button.background.danger.default`.
  final Color buttonDangerBackground;

  /// `components.button.background.danger.hover`.
  final Color buttonDangerHover;

  /// `components.button.foreground.danger.default`.
  final Color buttonDangerForeground;

  /// `components.button.border.danger.default`.
  final Color buttonDangerBorder;

  /// `components.toggle-button.border.default`.
  final Color toggleButtonBorder;

  /// `components.toggle-button.border.selected`.
  final Color toggleButtonSelectedBorder;

  /// `components.toggle-group.border.default`.
  final Color toggleGroupBorder;

  /// `components.segmented-control.border.default`.
  final Color segmentedControlBorder;

  /// `components.general.background.disabled`.
  final Color disabled;

  /// `components.general.background.hover`.
  final Color stateHover;

  /// `components.general.background.pressed`.
  final Color statePressed;

  /// `components.general.focus.ring.color`.
  final Color focusRing;

  /// `components.general.focus.halo.color`.
  final Color focusHalo;

  /// `components.general.action.primary.background.default`.
  final Color primary;

  /// `components.general.action.primary.background.hover`.
  final Color primaryHover;

  /// `components.general.action.primary.foreground.default`.
  final Color onPrimary;

  /// `components.general.action.secondary.background.default`.
  final Color secondary;

  /// `components.general.action.secondary.background.hover`.
  final Color secondaryHover;

  /// `components.general.action.secondary.foreground.default`.
  final Color onSecondary;

  /// `components.general.feedback.info.solid.background.default`.
  final Color info;

  /// `components.general.feedback.success.solid.background.default`.
  final Color success;

  /// `components.general.feedback.warning.solid.background.default`.
  final Color warning;

  /// `components.general.feedback.danger.solid.background.default`.
  final Color danger;

  /// `components.general.feedback.danger.solid.background.hover`.
  final Color dangerHover;

  /// `components.general.feedback.neutral.solid.background.default`.
  final Color neutral;

  /// `components.general.feedback.solid.foreground.default`.
  final Color onStatus;

  /// `components.general.feedback.warning.solid.foreground.default`.
  final Color onWarning;

  /// `components.general.feedback.warning.label.background.default`.
  final Color warningLabelSurface;

  /// `components.general.feedback.info.background.default`.
  final Color infoSurface;

  /// `components.general.feedback.info.border.default`.
  final Color infoBorder;

  /// `components.general.feedback.success.background.default`.
  final Color successSurface;

  /// `components.general.feedback.success.border.default`.
  final Color successBorder;

  /// `components.general.feedback.warning.background.default`.
  final Color warningSurface;

  /// `components.general.feedback.warning.border.default`.
  final Color warningBorder;

  /// `components.general.feedback.danger.background.default`.
  final Color dangerSurface;

  /// `components.general.feedback.danger.border.default`.
  final Color dangerBorder;

  /// `components.general.action.danger.background.default`.
  final Color destructiveSurface;

  /// `components.general.action.danger.foreground.default`.
  final Color onDestructiveSurface;

  /// `components.general.action.secondary.contextual.background.default`.
  final Color secondarySurface;

  /// `components.general.action.secondary.contextual.foreground.default`.
  final Color onSecondarySurface;

  /// `components.general.feedback.neutral.background.default`.
  final Color neutralSurface;

  /// `components.general.feedback.neutral.border.default`.
  final Color neutralBorder;

  /// `components.general.feedback.info.foreground.default`.
  final Color infoText;

  /// `components.general.feedback.success.foreground.default`.
  final Color successText;

  /// `components.general.feedback.warning.foreground.default`.
  final Color warningText;

  /// `components.general.feedback.danger.foreground.default`.
  final Color dangerText;

  /// `components.general.selection.contextual.foreground.default`.
  final Color selectedText;

  /// `components.general.feedback.neutral.foreground.default`.
  final Color neutralText;

  /// `components.general.action.secondary.body.foreground.default`.
  final Color secondaryBodyText;

  /// `components.general.feedback.danger.body.foreground.default`.
  final Color dangerBodyText;

  /// `components.general.feedback.success.body.foreground.default`.
  final Color successBodyText;

  /// `components.general.emphasis.background.default`.
  final Color emphasisSurface;

  /// `components.general.emphasis.foreground.default`.
  final Color onEmphasis;

  /// `components.general.emphasis.border.default`.
  final Color emphasisBorder;

  /// `components.general.selection.background.default`.
  final Color selected;

  /// `components.general.selection.foreground.default`.
  final Color onSelected;

  /// `components.dialog.overlay.default`.
  final Color dialogOverlay;

  /// `components.navigation-bar.current-indicator.background.default`.
  final Color navigationBarCurrentIndicator;

  /// `components.data-grid.cell.secondary.background.default`.
  final Color gridCellSecondarySurface;

  /// `components.page.background.default`.
  final Color pageBackground;

  /// `components.card.background.default`.
  final Color cardBackground;

  /// `components.card.secondary.background.default`.
  final Color cardSecondaryBackground;

  /// `components.dialog.background.default`.
  final Color dialogBackground;

  /// `components.popover.background.default`.
  final Color popoverBackground;

  /// `components.menu.background.default`.
  final Color menuBackground;

  /// `components.sidebar.background.default`.
  final Color sidebarBackground;

  /// `components.code-block.background.default`.
  final Color codeBlockBackground;

  /// A copy with the given roles replaced.
  InvisibleColors copyWith({
    Color? background,
    Color? text,
    Color? textSecondary,
    Color? textDisabled,
    Color? border,
    Color? controlBorder,
    Color? actionBorder,
    Color? selectedBorder,
    Color? avatarBackground,
    Color? switchBackground,
    Color? stepperBackground,
    Color? navigationBarBackground,
    Color? buttonBackground,
    Color? buttonHover,
    Color? buttonForeground,
    Color? buttonBorder,
    Color? buttonPrimaryBackground,
    Color? buttonPrimaryHover,
    Color? buttonPrimaryForeground,
    Color? buttonPrimaryBorder,
    Color? buttonSecondaryBackground,
    Color? buttonSecondaryHover,
    Color? buttonSecondaryForeground,
    Color? buttonSecondaryBorder,
    Color? buttonGhostBackground,
    Color? buttonGhostHover,
    Color? buttonGhostForeground,
    Color? buttonGhostBorder,
    Color? buttonDangerBackground,
    Color? buttonDangerHover,
    Color? buttonDangerForeground,
    Color? buttonDangerBorder,
    Color? toggleButtonBorder,
    Color? toggleButtonSelectedBorder,
    Color? toggleGroupBorder,
    Color? segmentedControlBorder,
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
    Color? warningLabelSurface,
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
    Color? dialogOverlay,
    Color? navigationBarCurrentIndicator,
    Color? gridCellSecondarySurface,
    Color? pageBackground,
    Color? cardBackground,
    Color? cardSecondaryBackground,
    Color? dialogBackground,
    Color? popoverBackground,
    Color? menuBackground,
    Color? sidebarBackground,
    Color? codeBlockBackground,
  }) {
    return InvisibleColors(
      background: background ?? this.background,
      text: text ?? this.text,
      textSecondary: textSecondary ?? this.textSecondary,
      textDisabled: textDisabled ?? this.textDisabled,
      border: border ?? this.border,
      controlBorder: controlBorder ?? this.controlBorder,
      actionBorder: actionBorder ?? this.actionBorder,
      selectedBorder: selectedBorder ?? this.selectedBorder,
      avatarBackground: avatarBackground ?? this.avatarBackground,
      switchBackground: switchBackground ?? this.switchBackground,
      stepperBackground: stepperBackground ?? this.stepperBackground,
      navigationBarBackground:
          navigationBarBackground ?? this.navigationBarBackground,
      buttonBackground: buttonBackground ?? this.buttonBackground,
      buttonHover: buttonHover ?? this.buttonHover,
      buttonForeground: buttonForeground ?? this.buttonForeground,
      buttonBorder: buttonBorder ?? this.buttonBorder,
      buttonPrimaryBackground:
          buttonPrimaryBackground ?? this.buttonPrimaryBackground,
      buttonPrimaryHover: buttonPrimaryHover ?? this.buttonPrimaryHover,
      buttonPrimaryForeground:
          buttonPrimaryForeground ?? this.buttonPrimaryForeground,
      buttonPrimaryBorder: buttonPrimaryBorder ?? this.buttonPrimaryBorder,
      buttonSecondaryBackground:
          buttonSecondaryBackground ?? this.buttonSecondaryBackground,
      buttonSecondaryHover: buttonSecondaryHover ?? this.buttonSecondaryHover,
      buttonSecondaryForeground:
          buttonSecondaryForeground ?? this.buttonSecondaryForeground,
      buttonSecondaryBorder:
          buttonSecondaryBorder ?? this.buttonSecondaryBorder,
      buttonGhostBackground:
          buttonGhostBackground ?? this.buttonGhostBackground,
      buttonGhostHover: buttonGhostHover ?? this.buttonGhostHover,
      buttonGhostForeground:
          buttonGhostForeground ?? this.buttonGhostForeground,
      buttonGhostBorder: buttonGhostBorder ?? this.buttonGhostBorder,
      buttonDangerBackground:
          buttonDangerBackground ?? this.buttonDangerBackground,
      buttonDangerHover: buttonDangerHover ?? this.buttonDangerHover,
      buttonDangerForeground:
          buttonDangerForeground ?? this.buttonDangerForeground,
      buttonDangerBorder: buttonDangerBorder ?? this.buttonDangerBorder,
      toggleButtonBorder: toggleButtonBorder ?? this.toggleButtonBorder,
      toggleButtonSelectedBorder:
          toggleButtonSelectedBorder ?? this.toggleButtonSelectedBorder,
      toggleGroupBorder: toggleGroupBorder ?? this.toggleGroupBorder,
      segmentedControlBorder:
          segmentedControlBorder ?? this.segmentedControlBorder,
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
      warningLabelSurface: warningLabelSurface ?? this.warningLabelSurface,
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
      dialogOverlay: dialogOverlay ?? this.dialogOverlay,
      navigationBarCurrentIndicator:
          navigationBarCurrentIndicator ?? this.navigationBarCurrentIndicator,
      gridCellSecondarySurface:
          gridCellSecondarySurface ?? this.gridCellSecondarySurface,
      pageBackground: pageBackground ?? this.pageBackground,
      cardBackground: cardBackground ?? this.cardBackground,
      cardSecondaryBackground:
          cardSecondaryBackground ?? this.cardSecondaryBackground,
      dialogBackground: dialogBackground ?? this.dialogBackground,
      popoverBackground: popoverBackground ?? this.popoverBackground,
      menuBackground: menuBackground ?? this.menuBackground,
      sidebarBackground: sidebarBackground ?? this.sidebarBackground,
      codeBlockBackground: codeBlockBackground ?? this.codeBlockBackground,
    );
  }

  List<Color> get _values => [
    background,
    text,
    textSecondary,
    textDisabled,
    border,
    controlBorder,
    actionBorder,
    selectedBorder,
    avatarBackground,
    switchBackground,
    stepperBackground,
    navigationBarBackground,
    buttonBackground,
    buttonHover,
    buttonForeground,
    buttonBorder,
    buttonPrimaryBackground,
    buttonPrimaryHover,
    buttonPrimaryForeground,
    buttonPrimaryBorder,
    buttonSecondaryBackground,
    buttonSecondaryHover,
    buttonSecondaryForeground,
    buttonSecondaryBorder,
    buttonGhostBackground,
    buttonGhostHover,
    buttonGhostForeground,
    buttonGhostBorder,
    buttonDangerBackground,
    buttonDangerHover,
    buttonDangerForeground,
    buttonDangerBorder,
    toggleButtonBorder,
    toggleButtonSelectedBorder,
    toggleGroupBorder,
    segmentedControlBorder,
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
    warningLabelSurface,
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
    dialogOverlay,
    navigationBarCurrentIndicator,
    gridCellSecondarySurface,
    pageBackground,
    cardBackground,
    cardSecondaryBackground,
    dialogBackground,
    popoverBackground,
    menuBackground,
    sidebarBackground,
    codeBlockBackground,
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
    'actionBorder': InvisibleColorMix(
      base: Color(0xFF757575),
      amount: 0.7,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFF9E9E9E),
    ),
    'selectedBorder': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.7,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFA286DB),
    ),
    'buttonSecondaryHover': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.24,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFDFD5F3),
    ),
    'buttonSecondaryBorder': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.55,
      mixWith: Color(0x00000000),
      value: Color(0x8C7A52CC),
    ),
    'buttonDangerHover': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.18,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFF3DCE0),
    ),
    'buttonDangerBorder': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.35,
      mixWith: Color(0x00000000),
      value: Color(0x59BE3B50),
    ),
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
    'warningLabelSurface': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.85,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFD17B43),
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
      mixWith: Color(0xFF272727),
      value: Color(0xFF33466C),
    ),
    'successText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.52,
      mixWith: Color(0xFF272727),
      value: Color(0xFF335025),
    ),
    'warningText': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.42,
      mixWith: Color(0xFF272727),
      value: Color(0xFF6B4125),
    ),
    'dangerText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.58,
      mixWith: Color(0xFF272727),
      value: Color(0xFF7F333F),
    ),
    'selectedText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.55,
      mixWith: Color(0xFF272727),
      value: Color(0xFF553F82),
    ),
    'navigationBarCurrentIndicator': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.9,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFF8763D1),
    ),
  };

  static const Map<String, InvisibleColorMix> dark = {
    'actionBorder': InvisibleColorMix(
      base: Color(0xFF9E9E9E),
      amount: 0.7,
      mixWith: Color(0xFF272727),
      value: Color(0xFF7A7A7A),
    ),
    'selectedBorder': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.7,
      mixWith: Color(0xFF272727),
      value: Color(0xFF61459B),
    ),
    'buttonSecondaryHover': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.24,
      mixWith: Color(0xFF272727),
      value: Color(0xFF3B314F),
    ),
    'buttonSecondaryBorder': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.55,
      mixWith: Color(0x00000000),
      value: Color(0x8C7A52CC),
    ),
    'buttonDangerHover': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.18,
      mixWith: Color(0xFF272727),
      value: Color(0xFF422B2E),
    ),
    'buttonDangerBorder': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.35,
      mixWith: Color(0x00000000),
      value: Color(0x59BE3B50),
    ),
    'focusRing': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.7,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFA286DB),
    ),
    'focusHalo': InvisibleColorMix(
      base: Color(0xFFA286DB),
      amount: 0.3,
      mixWith: Color(0x00000000),
      value: Color(0x4DA286DB),
    ),
    'warningLabelSurface': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.85,
      mixWith: Color(0xFFFFFFFF),
      value: Color(0xFFD17B43),
    ),
    'infoSurface': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.22,
      mixWith: Color(0xFF272727),
      value: Color(0xFF2D3546),
    ),
    'infoBorder': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.45,
      mixWith: Color(0xFF272727),
      value: Color(0xFF324467),
    ),
    'successSurface': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.22,
      mixWith: Color(0xFF272727),
      value: Color(0xFF2C3826),
    ),
    'successBorder': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.45,
      mixWith: Color(0xFF272727),
      value: Color(0xFF314A25),
    ),
    'warningSurface': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.22,
      mixWith: Color(0xFF272727),
      value: Color(0xFF4B3426),
    ),
    'warningBorder': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.45,
      mixWith: Color(0xFF272727),
      value: Color(0xFF704225),
    ),
    'dangerSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.22,
      mixWith: Color(0xFF272727),
      value: Color(0xFF482B30),
    ),
    'dangerBorder': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.45,
      mixWith: Color(0xFF272727),
      value: Color(0xFF6B3039),
    ),
    'destructiveSurface': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.18,
      mixWith: Color(0xFF272727),
      value: Color(0xFF422B2E),
    ),
    'secondarySurface': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.15,
      mixWith: Color(0xFF272727),
      value: Color(0xFF332D40),
    ),
    'infoText': InvisibleColorMix(
      base: Color(0xFF4067B6),
      amount: 0.42,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFA9B9DB),
    ),
    'successText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.5,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFF9AB58C),
    ),
    'warningText': InvisibleColorMix(
      base: Color(0xFFC96422),
      amount: 0.58,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFDBA17B),
    ),
    'dangerText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.48,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFDB9CA6),
    ),
    'selectedText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.62,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFA990DC),
    ),
    'secondaryBodyText': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.62,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFA990DC),
    ),
    'dangerBodyText': InvisibleColorMix(
      base: Color(0xFFBE3B50),
      amount: 0.48,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFFDB9CA6),
    ),
    'successBodyText': InvisibleColorMix(
      base: Color(0xFF3E7523),
      amount: 0.5,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFF9AB58C),
    ),
    'navigationBarCurrentIndicator': InvisibleColorMix(
      base: Color(0xFF7A52CC),
      amount: 0.74,
      mixWith: Color(0xFFF5F5F5),
      value: Color(0xFF9A7CD7),
    ),
  };
}
