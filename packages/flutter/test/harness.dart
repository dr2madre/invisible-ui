import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// Wraps [child] the way an app would: media query, direction, theme and an
/// overlay for popups, without WidgetsApp, so the shortcuts under test are
/// the component's own.
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
        child: TapRegionSurface(
          child: _HarnessOverlay(child: Center(child: child)),
        ),
      ),
    ),
  );
}

/// An [Overlay] whose only entry shows the latest [child] on the theme
/// background, so a test can pump a changed tree and keep the overlay's
/// popups.
class _HarnessOverlay extends StatefulWidget {
  const _HarnessOverlay({required this.child});

  final Widget child;

  @override
  State<_HarnessOverlay> createState() => _HarnessOverlayState();
}

class _HarnessOverlayState extends State<_HarnessOverlay> {
  // The page paints the theme background and takes presses, as an app's
  // page does, so a press on empty space counts as outside a popup.
  late final OverlayEntry _entry = OverlayEntry(
    builder: (context) => ColoredBox(
      color: InvisibleTheme.of(context).colors.background,
      child: widget.child,
    ),
  );

  @override
  void didUpdateWidget(_HarnessOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    _entry.markNeedsBuild();
  }

  @override
  void dispose() {
    _entry
      ..remove()
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Overlay(initialEntries: [_entry]);
}

/// An announcement sent to assistive technology.
typedef Announcement = ({String message, bool assertive});

/// Records the announcements sent while the test runs.
List<Announcement> recordAnnouncements(WidgetTester tester) {
  final log = <Announcement>[];
  final messenger = tester.binding.defaultBinaryMessenger;
  messenger.setMockDecodedMessageHandler<dynamic>(
    SystemChannels.accessibility,
    (message) async {
      final event = message as Map<Object?, Object?>;
      if (event['type'] == 'announce') {
        final data = event['data']! as Map<Object?, Object?>;
        log.add((
          message: data['message']! as String,
          assertive: data['assertiveness'] == Assertiveness.assertive.index,
        ));
      }
      return null;
    },
  );
  addTearDown(
    () => messenger.setMockDecodedMessageHandler<dynamic>(
      SystemChannels.accessibility,
      null,
    ),
  );
  return log;
}

/// Pumps the frame that applies a focus change and the one its listeners
/// rebuild.
Future<void> pumpFocus(WidgetTester tester) async {
  await tester.pump();
  await tester.pump();
}

/// Every tap target is at least 24 by 24, the WCAG 2.5.8 minimum and the
/// target of the compact and regular densities.
const MinimumTapTargetGuideline targetGuideline24 = MinimumTapTargetGuideline(
  size: Size(24, 24),
  link: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
);

/// Every tap target is at least 44 by 44, the target of the touch density.
const MinimumTapTargetGuideline targetGuideline44 = MinimumTapTargetGuideline(
  size: Size(44, 44),
  link:
      'https://developer.apple.com/design/human-interface-guidelines/accessibility',
);

/// Gives focus to the focusable widget around [finder], as Tab or an arrow
/// would.
Future<void> focusOn(WidgetTester tester, Finder finder) async {
  Focus.of(tester.element(finder)).requestFocus();
  await pumpFocus(tester);
}

/// Whether the focusable widget around [finder] has focus.
bool focusedOn(WidgetTester tester, Finder finder) =>
    Focus.of(tester.element(finder)).hasPrimaryFocus;

/// Matches a semantics node that has at least the given properties.
///
/// One place for the matcher that Flutter 3.40 renamed to `isSemantics`, so
/// the tests run on the lower bound and on stable.
Matcher semanticsWith({
  String? label,
  String? value,
  String? hint,
  String? tooltip,
  bool? isButton,
  bool? hasEnabledState,
  bool? isEnabled,
  bool? isFocusable,
  bool? hasTapAction,
  bool? hasExpandedState,
  bool? isExpanded,
  bool? hasCheckedState,
  bool? isChecked,
  bool? isInMutuallyExclusiveGroup,
  bool? isCheckStateMixed,
  bool? hasToggledState,
  bool? isToggled,
  bool? hasSelectedState,
  bool? isSelected,
  bool? isLiveRegion,
  bool? isHeader,
  bool? namesRoute,
  bool? isFocused,
  bool? isTextField,
  bool? isReadOnly,
  bool? isMultiline,
  bool? isObscured,
  bool? isRequired,
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
    hint: hint,
    tooltip: tooltip,
    isButton: isButton,
    hasEnabledState: hasEnabledState,
    isEnabled: isEnabled,
    isFocusable: isFocusable,
    hasTapAction: hasTapAction,
    hasExpandedState: hasExpandedState,
    isExpanded: isExpanded,
    hasCheckedState: hasCheckedState,
    isChecked: isChecked,
    isInMutuallyExclusiveGroup: isInMutuallyExclusiveGroup,
    isCheckStateMixed: isCheckStateMixed,
    hasToggledState: hasToggledState,
    isToggled: isToggled,
    hasSelectedState: hasSelectedState,
    isSelected: isSelected,
    isLiveRegion: isLiveRegion,
    isHeader: isHeader,
    namesRoute: namesRoute,
    isFocused: isFocused,
    isTextField: isTextField,
    isReadOnly: isReadOnly,
    isMultiline: isMultiline,
    isObscured: isObscured,
    hasRequiredState: isRequired == null ? null : true,
    isRequired: isRequired,
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

/// Wraps [home] in a [WidgetsApp], for widgets that need a navigator, such
/// as dialogs. The app's own shortcuts apply (Tab, Escape), as in an app.
Widget appHarness(
  WidgetBuilder home, {
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
  List<NavigatorObserver> observers = const [],
  TransitionBuilder? wrap,
}) {
  return WidgetsApp(
    color: const Color(0xFF000000),
    navigatorObservers: observers,
    pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
      settings: settings,
      pageBuilder: (context, _, _) => builder(context),
    ),
    builder: (context, child) => MediaQuery(
      data: MediaQuery.of(
        context,
      ).copyWith(textScaler: TextScaler.linear(textScale)),
      child: Directionality(
        textDirection: direction,
        child: InvisibleTheme(
          data: theme ?? InvisibleThemeData.light(),
          child: wrap == null ? child! : wrap(context, child),
        ),
      ),
    ),
    home: Builder(builder: (context) => Center(child: home(context))),
  );
}
