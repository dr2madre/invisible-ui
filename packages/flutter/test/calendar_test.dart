import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

Finder _day(int year, int month, int day) =>
    find.byKey(ValueKey(DateTime.utc(year, month, day)));

FocusNode _dayNode(WidgetTester tester, int year, int month, int day) => tester
    .widget<FocusableActionDetector>(
      find.descendant(
        of: _day(year, month, day),
        matching: find.byType(FocusableActionDetector),
      ),
    )
    .focusNode!;

bool _focused(WidgetTester tester, int year, int month, int day) =>
    _dayNode(tester, year, month, day).hasPrimaryFocus;

Future<void> _press(
  WidgetTester tester,
  LogicalKeyboardKey key, {
  bool shift = false,
}) async {
  if (shift) await tester.sendKeyDownEvent(LogicalKeyboardKey.shiftLeft);
  await tester.sendKeyEvent(key);
  if (shift) await tester.sendKeyUpEvent(LogicalKeyboardKey.shiftLeft);
  await pumpFocus(tester);
}

Future<void> _focusDay(
  WidgetTester tester,
  int year,
  int month,
  int day,
) async {
  _dayNode(tester, year, month, day).requestFocus();
  await pumpFocus(tester);
}

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  group('pointer and values', () {
    testWidgets('shows the value\'s month; a tap picks, reports local '
        'midnight once; the same day reports nothing', (tester) async {
      final reports = <DateTime>[];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              initialValue: DateTime(2026, 6, 10, 15, 30),
              onChanged: reports.add,
            ),
          ),
        ),
      );
      expect(find.text('June 2026'), findsOneWidget);
      await tester.tap(_day(2026, 6, 12));
      await tester.pump();
      expect(reports, [DateTime(2026, 6, 12)]);
      expect(reports.single.isUtc, isFalse);
      await tester.tap(_day(2026, 6, 12));
      await tester.pump();
      expect(reports, hasLength(1));
    });

    testWidgets('a controlled value is shown without a report', (tester) async {
      final reports = <DateTime>[];
      Widget build(DateTime value) => harness(
        SizedBox(
          width: 360,
          child: Calendar(
            value: value,
            focusedDate: value,
            onChanged: reports.add,
          ),
        ),
      );
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(build(DateTime(2026, 6, 10)));
      await tester.pumpWidget(build(DateTime(2026, 7, 3)));
      expect(find.text('July 2026'), findsOneWidget);
      expect(
        tester.getSemantics(_day(2026, 7, 3)),
        semanticsWith(isSelected: true, hasSelectedState: true),
      );
      expect(reports, isEmpty);
      semantics.dispose();
    });

    testWidgets('min and max disable the days outside; a tap there does '
        'nothing', (tester) async {
      final reports = <DateTime>[];
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              focusedDate: DateTime(2026, 6, 15),
              min: DateTime(2026, 6, 10),
              max: DateTime(2026, 6, 20),
              onChanged: reports.add,
            ),
          ),
        ),
      );
      expect(
        tester.getSemantics(_day(2026, 6, 9)),
        semanticsWith(hasEnabledState: true, isEnabled: false),
      );
      expect(
        tester.getSemantics(_day(2026, 6, 10)),
        semanticsWith(hasEnabledState: true, isEnabled: true),
      );
      await tester.tap(_day(2026, 6, 21));
      await tester.pump();
      expect(reports, isEmpty);
      semantics.dispose();
    });

    testWidgets('weekStartsOn sets the first column', (tester) async {
      Future<String> firstHeader(int weekStartsOn) async {
        await tester.pumpWidget(
          harness(
            SizedBox(
              width: 360,
              child: Calendar.uncontrolled(
                focusedDate: DateTime(2026, 6, 15),
                weekStartsOn: weekStartsOn,
              ),
            ),
          ),
        );
        final headers = ['Sun', 'Mon', 'Sat'];
        return headers.reduce(
          (a, b) =>
              tester.getTopLeft(find.text(a)).dx <
                  tester.getTopLeft(find.text(b)).dx
              ? a
              : b,
        );
      }

      expect(await firstHeader(DateTime.monday), 'Mon');
      expect(await firstHeader(DateTime.sunday), 'Sun');
      expect(await firstHeader(DateTime.saturday), 'Sat');
    });
  });

  group('keyboard', () {
    testWidgets('one tab stop: the picked day; the arrows, Home, End, Page '
        'Up and Page Down move focus; Enter picks', (tester) async {
      final reports = <DateTime>[];
      final moves = <DateTime>[];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              initialValue: DateTime(2026, 6, 10),
              onChanged: reports.add,
              onFocusChanged: moves.add,
            ),
          ),
        ),
      );
      expect(_dayNode(tester, 2026, 6, 10).skipTraversal, isFalse);
      expect(_dayNode(tester, 2026, 6, 11).skipTraversal, isTrue);
      await _focusDay(tester, 2026, 6, 10);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester, 2026, 6, 11), isTrue);
      await _press(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester, 2026, 6, 18), isTrue);
      await _press(tester, LogicalKeyboardKey.home);
      expect(_focused(tester, 2026, 6, 15), isTrue, reason: 'Monday');
      await _press(tester, LogicalKeyboardKey.end);
      expect(_focused(tester, 2026, 6, 21), isTrue, reason: 'Sunday');
      await _press(tester, LogicalKeyboardKey.arrowUp);
      expect(_focused(tester, 2026, 6, 14), isTrue);
      await _press(tester, LogicalKeyboardKey.pageDown);
      expect(find.text('July 2026'), findsOneWidget);
      expect(_focused(tester, 2026, 7, 14), isTrue);
      await _press(tester, LogicalKeyboardKey.pageUp, shift: true);
      expect(find.text('July 2025'), findsOneWidget);
      expect(_focused(tester, 2025, 7, 14), isTrue);
      await _press(tester, LogicalKeyboardKey.enter);
      expect(reports, [DateTime(2025, 7, 14)]);
      expect(moves.last, DateTime(2025, 7, 14));
      expect(_dayNode(tester, 2025, 7, 14).skipTraversal, isFalse);
    });

    testWidgets('right to left: the left arrow is the next day', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(initialValue: DateTime(2026, 6, 10)),
          ),
          direction: TextDirection.rtl,
        ),
      );
      await _focusDay(tester, 2026, 6, 10);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focused(tester, 2026, 6, 11), isTrue);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester, 2026, 6, 9), isTrue);
      // The 11th sits to the left of the 10th.
      expect(
        tester.getCenter(_day(2026, 6, 11)).dx,
        lessThan(tester.getCenter(_day(2026, 6, 10)).dx),
      );
    });

    testWidgets('focus stays within min and max', (tester) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              initialValue: DateTime(2026, 6, 18),
              max: DateTime(2026, 6, 20),
              min: DateTime(2026, 6, 10),
            ),
          ),
        ),
      );
      await _focusDay(tester, 2026, 6, 18);
      await _press(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester, 2026, 6, 20), isTrue);
      await _press(tester, LogicalKeyboardKey.pageUp);
      expect(_focused(tester, 2026, 6, 10), isTrue);
    });

    testWidgets('the previous, next and Today buttons move focus', (
      tester,
    ) async {
      final today = DateTime.now();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              focusedDate: DateTime(today.year - 1, 1, 31),
            ),
          ),
        ),
      );
      await tester.tap(find.bySemanticsLabel('Next'));
      await pumpFocus(tester);
      expect(_focused(tester, today.year - 1, 2, 28), isTrue);
      await tester.tap(find.bySemanticsLabel('Previous'));
      await pumpFocus(tester);
      expect(_focused(tester, today.year - 1, 1, 28), isTrue);
      await tester.tap(find.text('Today'));
      await pumpFocus(tester);
      expect(_focused(tester, today.year, today.month, today.day), isTrue);
    });

    testWidgets('keyboard focus shows the ring on the day', (tester) async {
      FocusManager.instance.highlightStrategy =
          FocusHighlightStrategy.alwaysTraditional;
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(initialValue: DateTime(2026, 6, 10)),
          ),
        ),
      );
      await _focusDay(tester, 2026, 6, 10);
      final ring = tester.widget<FocusRingPainter>(
        find.descendant(
          of: _day(2026, 6, 10),
          matching: find.byType(FocusRingPainter),
        ),
      );
      expect(ring.visible, isTrue);
    });
  });

  group('range', () {
    testWidgets('a pick starts, the next ends, one before the start moves '
        'it; every day is selected and the ends say so', (tester) async {
      final reports = <DateRange>[];
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.rangeUncontrolled(
              focusedDate: DateTime(2026, 6, 15),
              onRangeChanged: reports.add,
            ),
          ),
        ),
      );
      await tester.tap(_day(2026, 6, 10));
      await tester.pump();
      await tester.tap(_day(2026, 6, 4));
      await tester.pump();
      expect(reports, [
        DateRange(DateTime(2026, 6, 10)),
        DateRange(DateTime(2026, 6, 4), DateTime(2026, 6, 10)),
      ]);
      expect(
        tester.getSemantics(_day(2026, 6, 4)),
        semanticsWith(
          label: 'Thursday, June 4, 2026, range start',
          isSelected: true,
        ),
      );
      expect(
        tester.getSemantics(_day(2026, 6, 7)),
        semanticsWith(label: 'Sunday, June 7, 2026', isSelected: true),
      );
      expect(
        tester.getSemantics(_day(2026, 6, 10)),
        semanticsWith(
          label: 'Wednesday, June 10, 2026, range end',
          isSelected: true,
        ),
      );
      expect(
        tester.getSemantics(_day(2026, 6, 11)),
        semanticsWith(hasSelectedState: true, isSelected: false),
      );
      // The days between show a band closed by lines, not only a tint.
      final band = tester
          .widgetList<DecoratedBox>(
            find.descendant(
              of: _day(2026, 6, 7),
              matching: find.byType(DecoratedBox),
            ),
          )
          .map((box) => box.decoration as BoxDecoration)
          .firstWhere((decoration) => decoration.border != null);
      expect((band.border! as Border).top.width, greaterThan(0));
      semantics.dispose();
    });

    testWidgets('two months sit side by side when wide and stack when '
        'narrow; each day shows once', (tester) async {
      Widget build(double width) => harness(
        SingleChildScrollView(
          child: SizedBox(
            width: width,
            child: Calendar.rangeUncontrolled(
              focusedDate: DateTime(2026, 6, 15),
              view: CalendarView.twoMonth,
            ),
          ),
        ),
      );
      await tester.pumpWidget(build(640));
      expect(find.text('June 2026 – July 2026'), findsOneWidget);
      expect(_day(2026, 7, 1), findsOneWidget);
      expect(
        tester.getTopLeft(find.text('July 2026')).dy,
        tester.getTopLeft(find.text('June 2026')).dy,
      );
      await tester.pumpWidget(build(320));
      expect(
        tester.getTopLeft(find.text('July 2026')).dy,
        greaterThan(tester.getTopLeft(find.text('June 2026')).dy),
      );
      expect(tester.takeException(), isNull);
    });
  });

  group('semantics and layout', () {
    testWidgets('each day is a button named by its full date; today says '
        'so; the grid is named; targets and contrast', (tester) async {
      final today = DateTime.now();
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              initialValue: DateTime(today.year, today.month, today.day),
            ),
          ),
        ),
      );
      final name = DateSymbols.english.formatDay(today);
      expect(
        tester.getSemantics(_day(today.year, today.month, today.day)),
        semanticsWith(
          label: '$name, today',
          isButton: true,
          isSelected: true,
          hasTapAction: true,
          isFocusable: true,
        ),
      );
      expect(find.bySemanticsLabel('Calendar'), findsOneWidget);
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('names follow the locale and never the time zone', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 360,
            child: Calendar.uncontrolled(
              // A late local time is still the 1st.
              initialValue: DateTime(2026, 6, 1, 23, 30),
              locale: const Locale('it'),
            ),
          ),
        ),
      );
      expect(find.text('giugno 2026'), findsOneWidget);
      expect(find.text('lun'), findsOneWidget);
      expect(
        tester.getSemantics(_day(2026, 6, 1)),
        semanticsWith(label: 'lunedì 1 giugno 2026'),
      );
      semantics.dispose();
    });

    testWidgets('right to left at text scale 2.0 in a narrow window, with '
        '24 by 24 days, and 44 by 44 under touch', (tester) async {
      Widget build(InvisibleThemeData theme) => harness(
        SizedBox(
          width: 320,
          child: Calendar.uncontrolled(initialValue: DateTime(2026, 6, 10)),
        ),
        direction: TextDirection.rtl,
        textScale: 2,
        theme: theme,
      );
      tester.view.physicalSize = const Size(360, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(build(InvisibleThemeData.light()));
      expect(tester.takeException(), isNull);
      final regular = tester.getSize(_day(2026, 6, 10));
      expect(regular.width, greaterThanOrEqualTo(24));
      expect(regular.height, greaterThanOrEqualTo(24));
      await tester.pumpWidget(
        build(InvisibleThemeData.light(density: InvisibleDensity.touch)),
      );
      expect(tester.takeException(), isNull);
      final touch = tester.getSize(_day(2026, 6, 10));
      expect(touch.width, greaterThanOrEqualTo(44));
      expect(touch.height, greaterThanOrEqualTo(44));
    });
  });
}
