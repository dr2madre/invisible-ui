import 'package:flutter/semantics.dart';
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
  String? hint,
  bool? isTextField,
  bool? isReadOnly,
  bool? isMultiline,
  bool? isObscured,
  bool? isRequired,
  bool? isLiveRegion,
  bool? hasIncreaseAction,
  bool? hasDecreaseAction,
  String? increasedValue,
  String? decreasedValue,
  int? maxValueLength,
  int? currentValueLength,
  SemanticsValidationResult validationResult = SemanticsValidationResult.none,
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
    hint: hint,
    isTextField: isTextField,
    isReadOnly: isReadOnly,
    isMultiline: isMultiline,
    isObscured: isObscured,
    hasRequiredState: isRequired == null ? null : true,
    isRequired: isRequired,
    isLiveRegion: isLiveRegion,
    hasIncreaseAction: hasIncreaseAction,
    hasDecreaseAction: hasDecreaseAction,
    increasedValue: increasedValue,
    decreasedValue: decreasedValue,
    maxValueLength: maxValueLength,
    currentValueLength: currentValueLength,
    validationResult: validationResult,
  );
}

/// The semantics node of the editable text inside [of].
SemanticsNode editableSemantics(WidgetTester tester, Finder of) => tester
    .getSemantics(find.descendant(of: of, matching: find.byType(EditableText)));

/// Gives the editable text inside [of] focus, as a click on it would.
Future<void> focusEditable(WidgetTester tester, Finder of) async {
  final editable = find.descendant(of: of, matching: find.byType(EditableText));
  tester.widget<EditableText>(editable).focusNode.requestFocus();
  // One frame applies the focus, the next paints what depends on it.
  await tester.pump();
  await tester.pump();
}
