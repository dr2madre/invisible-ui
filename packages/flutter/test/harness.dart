import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// Wraps [child] the way an app would: media query, direction and theme,
/// without WidgetsApp, so the shortcuts under test are the component's own.
Widget harness(
  Widget child, {
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
  bool highContrast = false,
  bool disableAnimations = false,
}) {
  return MediaQuery(
    data: MediaQueryData(
      textScaler: TextScaler.linear(textScale),
      highContrast: highContrast,
      disableAnimations: disableAnimations,
    ),
    child: Directionality(
      textDirection: direction,
      child: InvisibleTheme(
        data: theme ?? InvisibleThemeData.light(),
        child: Center(child: child),
      ),
    ),
  );
}

/// Matches a semantics node that has at least the given properties.
///
/// One place for the matcher that Flutter 3.40 renamed to `isSemantics`, so
/// the tests run on the lower bound and on stable.
Matcher semanticsWith({
  String? label,
  String? value,
  bool? isButton,
  bool? hasEnabledState,
  bool? isEnabled,
  bool? isFocusable,
  bool? hasTapAction,
}) {
  // ignore: deprecated_member_use
  return containsSemantics(
    label: label,
    value: value,
    isButton: isButton,
    hasEnabledState: hasEnabledState,
    isEnabled: isEnabled,
    isFocusable: isFocusable,
    hasTapAction: hasTapAction,
  );
}
