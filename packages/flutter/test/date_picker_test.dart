import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';
import 'package:invisible_ui/src/internal/field_button.dart';

import 'harness.dart';

Finder _day(int year, int month, int day) =>
    find.byKey(ValueKey(DateTime.utc(year, month, day)));

bool _dayFocused(WidgetTester tester, int year, int month, int day) => tester
    .widget<FocusableActionDetector>(
      find.descendant(
        of: _day(year, month, day),
        matching: find.byType(FocusableActionDetector),
      ),
    )
    .focusNode!
    .hasPrimaryFocus;

bool _open() => find.byType(Calendar).evaluate().isNotEmpty;

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await pumpFocus(tester);
}

void main() {
  group('DatePicker', () {
    testWidgets('a tap opens with focus on the picked day; a pick fills the '
        'field, closes, returns focus and reports once', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      final reports = <DateTime?>[];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(
              initialValue: DateTime(2026, 6, 10),
              focusNode: focus,
              onChanged: reports.add,
            ),
          ),
        ),
      );
      expect(find.text('Jun 10, 2026'), findsOneWidget);
      await tester.tap(find.text('Jun 10, 2026'));
      await pumpFocus(tester);
      expect(_open(), isTrue);
      expect(_dayFocused(tester, 2026, 6, 10), isTrue);
      await tester.tap(_day(2026, 6, 12));
      await pumpFocus(tester);
      expect(_open(), isFalse);
      expect(find.text('Jun 12, 2026'), findsOneWidget);
      expect(reports, [DateTime(2026, 6, 12)]);
      expect(focus.hasFocus, isTrue);
    });

    testWidgets('Enter, Space and Down open; the grid keys move; Enter '
        'picks; Escape closes without a pick and returns focus', (
      tester,
    ) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      final reports = <DateTime?>[];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(
              initialValue: DateTime(2026, 6, 10),
              focusNode: focus,
              onChanged: reports.add,
            ),
          ),
        ),
      );
      focus.requestFocus();
      await pumpFocus(tester);
      for (final key in [
        LogicalKeyboardKey.enter,
        LogicalKeyboardKey.space,
        LogicalKeyboardKey.arrowDown,
      ]) {
        await _key(tester, key);
        expect(_open(), isTrue, reason: '$key opens');
        await _key(tester, LogicalKeyboardKey.escape);
        expect(_open(), isFalse);
        expect(focus.hasFocus, isTrue);
      }
      expect(reports, isEmpty);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(_open(), isFalse);
      expect(reports, [DateTime(2026, 6, 11)]);
      expect(focus.hasFocus, isTrue);
    });

    testWidgets('a press outside closes and leaves focus where it lands', (
      tester,
    ) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 360,
                child: DatePicker.uncontrolled(focusNode: focus),
              ),
              const SizedBox(height: 400),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Select a date'));
      await pumpFocus(tester);
      expect(_open(), isTrue);
      await tester.tapAt(const Offset(4, 596));
      await pumpFocus(tester);
      expect(_open(), isFalse);
      expect(focus.hasFocus, isFalse);
    });

    testWidgets('the clear button empties the field, reports null and keeps '
        'focus in the control', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      final reports = <DateTime?>[];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(
              initialValue: DateTime(2026, 6, 10),
              focusNode: focus,
              clearable: true,
              onChanged: reports.add,
            ),
          ),
        ),
      );
      // The clear button is the next tab stop after the field.
      Focus.of(
        tester.element(
          find.descendant(
            of: find.byType(FieldButton),
            matching: find.byType(GestureDetector),
          ),
        ),
      ).requestFocus();
      await pumpFocus(tester);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(reports, [null]);
      expect(find.text('Select a date'), findsOneWidget);
      expect(focus.hasFocus, isTrue);
      expect(find.bySemanticsLabel('Clear date'), findsNothing);
    });

    testWidgets('semantics: the field is an expandable button with the date '
        'as its value; the popup is a dialog; targets and contrast', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(
              label: 'Start date',
              description: 'The first day you worked.',
              initialValue: DateTime(2026, 6, 10),
              clearable: true,
              required: true,
            ),
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Start date',
          value: 'Jun 10, 2026',
          hint: 'The first day you worked.',
          isButton: true,
          hasExpandedState: true,
          isExpanded: false,
          isRequired: true,
          hasTapAction: true,
        ),
      );
      expect(find.bySemanticsLabel('Clear date'), findsOneWidget);
      await tester.tap(find.text('Jun 10, 2026'));
      await pumpFocus(tester);
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(hasExpandedState: true, isExpanded: true),
      );
      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is Semantics &&
              widget.properties.role?.name == 'dialog' &&
              widget.properties.label == 'Start date',
        ),
        findsOneWidget,
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('disabled: no focus, no opening', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(focusNode: focus, enabled: false),
          ),
        ),
      );
      focus.requestFocus();
      await tester.pump();
      expect(focus.hasFocus, isFalse);
      await tester.tap(find.text('Select a date'));
      await tester.pump();
      expect(_open(), isFalse);
    });

    testWidgets('a form reset restores the default silently; a controlled '
        'value becomes the default; the validator shows its message', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <DateTime?>[];
      Widget build(DateTime? value) => harness(
        Form(
          key: form,
          child: SizedBox(
            width: 360,
            child: DatePicker(
              value: value,
              onChanged: reports.add,
              validator: (value) => value == null ? 'Pick a date.' : null,
            ),
          ),
        ),
      );
      await tester.pumpWidget(build(null));
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Pick a date.'), findsOneWidget);
      await tester.pumpWidget(build(DateTime(2026, 6, 10)));
      expect(find.text('Jun 10, 2026'), findsOneWidget);
      await tester.tap(find.text('Jun 10, 2026'));
      await pumpFocus(tester);
      await tester.tap(_day(2026, 6, 20));
      await pumpFocus(tester);
      expect(find.text('Jun 20, 2026'), findsOneWidget);
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('Jun 10, 2026'), findsOneWidget);
      expect(find.text('Pick a date.'), findsNothing);
      expect(reports, [DateTime(2026, 6, 20)]);
    });

    testWidgets('the locale names the field and the calendar', (tester) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: DatePicker.uncontrolled(
              initialValue: DateTime(2026, 6, 1),
              locale: const Locale('de'),
              weekStartsOn: DateTime.sunday,
            ),
          ),
        ),
      );
      expect(find.text('01.06.2026'), findsOneWidget);
      await tester.tap(find.text('01.06.2026'));
      await pumpFocus(tester);
      expect(find.text('Juni 2026'), findsOneWidget);
      expect(
        tester.getTopLeft(find.text('So')).dx,
        lessThan(tester.getTopLeft(find.text('Mo')).dx),
      );
    });

    testWidgets('right to left at text scale 2.0 in a narrow window, the '
        'popup fits, under touch with 44 by 44 days', (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          Align(
            alignment: Alignment.topCenter,
            child: DatePicker.uncontrolled(
              initialValue: DateTime(2026, 6, 10),
              clearable: true,
            ),
          ),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.tap(find.text('Jun 10, 2026'));
      await pumpFocus(tester);
      expect(tester.takeException(), isNull);
      final popup = tester.getRect(find.byType(Calendar));
      expect(popup.left, greaterThanOrEqualTo(0));
      expect(popup.right, lessThanOrEqualTo(360));
      final day = tester.getSize(_day(2026, 6, 10));
      expect(day.width, greaterThanOrEqualTo(44));
      expect(day.height, greaterThanOrEqualTo(44));
    });
  });

  group('DateRangePicker', () {
    testWidgets('the first pick starts, the second ends and closes; the field '
        'shows both; each pick reports', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      final reports = <DateRange?>[];
      tester.view.physicalSize = const Size(800, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          Align(
            alignment: Alignment.topCenter,
            child: SizedBox(
              width: 360,
              child: DateRangePicker.uncontrolled(
                focusNode: focus,
                onChanged: reports.add,
                clearable: true,
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Select a range'));
      await pumpFocus(tester);
      final today = DateTime.now();
      final first = DateTime(today.year, today.month, 4);
      final last = DateTime(today.year, today.month, 10);
      await tester.tap(_day(first.year, first.month, first.day));
      await pumpFocus(tester);
      expect(_open(), isTrue);
      final en = DateSymbols.english;
      expect(find.text('${en.formatMedium(first)} – …'), findsOneWidget);
      await tester.tap(_day(last.year, last.month, last.day));
      await pumpFocus(tester);
      expect(_open(), isFalse);
      expect(focus.hasFocus, isTrue);
      expect(
        find.text('${en.formatMedium(first)} – ${en.formatMedium(last)}'),
        findsOneWidget,
      );
      expect(reports, [DateRange(first), DateRange(first, last)]);
      await tester.tap(find.bySemanticsLabel('Clear range'));
      await tester.pump();
      expect(reports.last, isNull);
      expect(find.text('Select a range'), findsOneWidget);
    });

    testWidgets('semantics: the ends of the range are named in the popup', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      tester.view.physicalSize = const Size(800, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          Align(
            alignment: Alignment.topCenter,
            child: SizedBox(
              width: 360,
              child: DateRangePicker.uncontrolled(
                initialValue: DateRange(
                  DateTime(2026, 6, 4),
                  DateTime(2026, 6, 10),
                ),
              ),
            ),
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Date range',
          value: 'Jun 4, 2026 – Jun 10, 2026',
          isButton: true,
        ),
      );
      await tester.tap(find.text('Jun 4, 2026 – Jun 10, 2026'));
      await pumpFocus(tester);
      expect(
        tester.getSemantics(_day(2026, 6, 4)),
        semanticsWith(
          label: 'Thursday, June 4, 2026, range start',
          isSelected: true,
        ),
      );
      expect(find.text('July 2026'), findsOneWidget, reason: 'two months');
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('a form reset restores the default range silently', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <DateRange?>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: SizedBox(
              width: 360,
              child: DateRangePicker.uncontrolled(
                initialValue: DateRange(
                  DateTime(2026, 6, 4),
                  DateTime(2026, 6, 10),
                ),
                clearable: true,
                onChanged: reports.add,
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.bySemanticsLabel('Clear range'));
      await tester.pump();
      expect(find.text('Select a range'), findsOneWidget);
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('Jun 4, 2026 – Jun 10, 2026'), findsOneWidget);
      expect(reports, [null]);
    });
  });
}
