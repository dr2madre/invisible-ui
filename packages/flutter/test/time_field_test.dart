import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';

import 'harness.dart';

Finder _segment(String name) => find.byWidgetPredicate(
  (widget) =>
      widget is Focus && widget.focusNode?.debugLabel == 'TimeField $name',
);

FocusNode _node(WidgetTester tester, String name) =>
    tester.widget<Focus>(_segment(name)).focusNode!;

Future<void> _focus(WidgetTester tester, String name) async {
  _node(tester, name).requestFocus();
  await pumpFocus(tester);
}

Future<void> _type(WidgetTester tester, List<LogicalKeyboardKey> keys) async {
  for (final key in keys) {
    await tester.sendKeyEvent(key);
    await pumpFocus(tester);
  }
}

const LogicalKeyboardKey _zero = LogicalKeyboardKey.digit0;
const LogicalKeyboardKey _two = LogicalKeyboardKey.digit2;
const LogicalKeyboardKey _three = LogicalKeyboardKey.digit3;
const LogicalKeyboardKey _five = LogicalKeyboardKey.digit5;
const LogicalKeyboardKey _nine = LogicalKeyboardKey.digit9;

void main() {
  group('typing and keys', () {
    testWidgets('digits type with auto-advance; an impossible digit is '
        'ignored; each change reports once', (tester) async {
      final reports = <String?>[];
      await tester.pumpWidget(
        harness(TimeField.uncontrolled(hourCycle: 24, onChanged: reports.add)),
      );
      expect(find.text('hh'), findsOneWidget);
      expect(find.text('AM'), findsNothing);
      await _focus(tester, 'hour');
      await _type(tester, [_two, _five]);
      expect(find.text('02'), findsOneWidget, reason: '25 is no hour');
      expect(_node(tester, 'hour').hasFocus, isTrue);
      await _type(tester, [_zero]);
      expect(find.text('20'), findsOneWidget);
      expect(_node(tester, 'minute').hasFocus, isTrue);
      await _type(tester, [_three, _zero]);
      expect(reports, ['20:03', '20:30']);
    });

    testWidgets('Up and Down step with wrapping; Left and Right move; '
        'Backspace clears and reports null', (tester) async {
      final reports = <String?>[];
      await tester.pumpWidget(
        harness(
          TimeField.uncontrolled(
            hourCycle: 24,
            initialValue: '23:59',
            onChanged: reports.add,
          ),
        ),
      );
      await _focus(tester, 'hour');
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      expect(find.text('00'), findsOneWidget);
      await _type(tester, [LogicalKeyboardKey.arrowRight]);
      expect(_node(tester, 'minute').hasFocus, isTrue);
      await _type(tester, [LogicalKeyboardKey.arrowDown]);
      expect(find.text('58'), findsOneWidget);
      await _type(tester, [LogicalKeyboardKey.backspace]);
      expect(find.text('mm'), findsOneWidget);
      await _type(tester, [LogicalKeyboardKey.arrowLeft]);
      expect(_node(tester, 'hour').hasFocus, isTrue);
      expect(reports, ['00:59', '00:58', null]);
    });

    testWidgets('Escape puts back the last finished value and is consumed '
        'only when it undid something', (tester) async {
      final reports = <String?>[];
      var outerEscapes = 0;
      await tester.pumpWidget(
        harness(
          Focus(
            onKeyEvent: (_, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.escape) {
                outerEscapes++;
                return KeyEventResult.handled;
              }
              return KeyEventResult.ignored;
            },
            child: TimeField.uncontrolled(
              hourCycle: 24,
              initialValue: '09:30',
              onChanged: reports.add,
            ),
          ),
        ),
      );
      await _focus(tester, 'hour');
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      expect(find.text('10'), findsOneWidget);
      await _type(tester, [LogicalKeyboardKey.escape]);
      expect(find.text('09'), findsOneWidget);
      expect(outerEscapes, 0);
      await _type(tester, [LogicalKeyboardKey.escape]);
      expect(outerEscapes, 1);
      expect(reports, ['10:30', '09:30']);
    });

    testWidgets('onChangeEnd reports when focus leaves the field or on '
        'Enter, once per change', (tester) async {
      final ends = <String?>[];
      final other = FocusNode();
      addTearDown(other.dispose);
      await tester.pumpWidget(
        harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TimeField.uncontrolled(
                hourCycle: 24,
                initialValue: '09:30',
                onChangeEnd: ends.add,
              ),
              Focus(focusNode: other, child: const SizedBox(width: 10)),
            ],
          ),
        ),
      );
      await _focus(tester, 'hour');
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      await _focus(tester, 'minute');
      expect(ends, isEmpty, reason: 'moving between segments is editing');
      await _type(tester, [LogicalKeyboardKey.enter]);
      expect(ends, ['10:30']);
      await _type(tester, [LogicalKeyboardKey.enter]);
      expect(ends, ['10:30']);
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      other.requestFocus();
      await pumpFocus(tester);
      expect(ends, ['10:30', '10:31']);
    });

    testWidgets('12 hours from the locale: AM or PM is never assumed; P '
        'sets PM; a tap toggles', (tester) async {
      final reports = <String?>[];
      await tester.pumpWidget(
        harness(TimeField.uncontrolled(onChanged: reports.add)),
      );
      expect(find.text('--'), findsOneWidget, reason: 'English is 12-hour');
      await _focus(tester, 'hour');
      await _type(tester, [_nine, _three, _zero]);
      expect(reports, isEmpty);
      expect(_node(tester, 'dayPeriod').hasFocus, isTrue);
      await _type(tester, [LogicalKeyboardKey.keyP]);
      expect(find.text('PM'), findsOneWidget);
      await tester.tap(find.text('PM'));
      await tester.pump();
      expect(find.text('AM'), findsOneWidget);
      expect(reports, ['21:30', '09:30']);
    });

    testWidgets('a 24-hour locale has no period; a new cycle keeps the time', (
      tester,
    ) async {
      Widget build(int? cycle) => harness(
        TimeField.uncontrolled(
          initialValue: '21:30',
          hourCycle: cycle,
          locale: const Locale('de'),
        ),
      );
      await tester.pumpWidget(build(null));
      expect(find.text('21'), findsOneWidget);
      expect(find.text('PM'), findsNothing);
      await tester.pumpWidget(build(12));
      expect(find.text('09'), findsOneWidget);
      expect(find.text('PM'), findsOneWidget);
    });
  });

  group('validation', () {
    testWidgets('a time past max is reported, never clamped; the callback '
        'fires for the edit only', (tester) async {
      final errors = <TimeFieldError?>[];
      final reports = <String?>[];
      await tester.pumpWidget(
        harness(
          TimeField.uncontrolled(
            hourCycle: 24,
            initialValue: '17:00',
            max: '17:00',
            onChanged: reports.add,
            onValidationChanged: errors.add,
          ),
        ),
      );
      expect(errors, isEmpty);
      await _focus(tester, 'minute');
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      expect(reports, ['17:01']);
      expect(find.text('Enter a time no later than 17:00.'), findsOneWidget);
      expect(errors, [TimeFieldError.rangeOverflow]);
      await _type(tester, [LogicalKeyboardKey.arrowDown]);
      expect(find.text('Enter a time no later than 17:00.'), findsNothing);
      expect(errors, [TimeFieldError.rangeOverflow, null]);
    });

    testWidgets('a malformed value from outside shows its error without a '
        'report; an edit clears it and reports', (tester) async {
      final errors = <TimeFieldError?>[];
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          TimeField(
            hourCycle: 24,
            value: '25:30',
            onValidationChanged: errors.add,
          ),
        ),
      );
      expect(
        find.text('Enter a time within the allowed range.'),
        findsOneWidget,
      );
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Time',
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      expect(errors, isEmpty);
      await _focus(tester, 'hour');
      await _type(tester, [LogicalKeyboardKey.arrowUp]);
      expect(errors, [null]);
      expect(find.text('Enter a time within the allowed range.'), findsNothing);
      semantics.dispose();
    });

    testWidgets('a form reset restores the default silently; a controlled '
        'value is shown without a report', (tester) async {
      final form = GlobalKey<FormState>();
      final reports = <String?>[];
      Widget build(String? value) => harness(
        Form(
          key: form,
          child: TimeField(
            hourCycle: 24,
            value: value,
            onChanged: reports.add,
            validator: (value) => value == null ? 'Enter a time.' : null,
          ),
        ),
      );
      await tester.pumpWidget(build('09:30'));
      await tester.pumpWidget(build('11:15'));
      expect(find.text('11'), findsOneWidget);
      expect(reports, isEmpty);
      await _focus(tester, 'minute');
      await _type(tester, [LogicalKeyboardKey.backspace]);
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Enter a time.'), findsOneWidget);
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('15'), findsOneWidget);
      expect(find.text('Enter a time.'), findsNothing);
      expect(reports, [null]);
    });
  });

  group('semantics and layout', () {
    testWidgets('a named group of segments, each with its value and step '
        'actions; targets and contrast', (tester) async {
      final reports = <String?>[];
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          TimeField.uncontrolled(
            label: 'Start',
            hourCycle: 12,
            initialValue: '09:05',
            onChanged: reports.add,
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(label: 'Start'),
      );
      expect(
        tester.getSemantics(_segment('hour')),
        semanticsWith(
          label: 'Hour',
          value: '09',
          increasedValue: '10',
          decreasedValue: '08',
          hasIncreaseAction: true,
          hasDecreaseAction: true,
        ),
      );
      expect(
        tester.getSemantics(_segment('dayPeriod')),
        semanticsWith(label: 'AM/PM', value: 'AM'),
      );
      tester.semantics.performAction(
        find.semantics.byLabel('Minute'),
        SemanticsAction.increase,
      );
      await tester.pump();
      expect(reports, ['09:06']);
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('an empty segment reads as empty', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(TimeField.uncontrolled(hourCycle: 24)));
      expect(
        tester.getSemantics(_segment('minute')),
        semanticsWith(label: 'Minute', value: 'Empty'),
      );
      semantics.dispose();
    });

    testWidgets('disabled: no focus, no edits, the value stays readable', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          TimeField.uncontrolled(
            hourCycle: 24,
            initialValue: '09:30',
            enabled: false,
          ),
        ),
      );
      _node(tester, 'hour').requestFocus();
      await tester.pump();
      expect(_node(tester, 'hour').hasFocus, isFalse);
      expect(find.text('09'), findsOneWidget);
    });

    testWidgets('right to left at text scale 2.0 in a narrow column: the '
        'time still reads left to right; 44 by 44 segments under touch', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 220,
            child: TimeField.uncontrolled(
              hourCycle: 12,
              withSeconds: true,
              initialValue: '21:30:15',
            ),
          ),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      expect(tester.takeException(), isNull);
      expect(
        tester.getCenter(find.text('09')).dx,
        lessThan(tester.getCenter(find.text('30')).dx),
      );
      final hour = tester.getSize(_segment('hour'));
      expect(hour.width, greaterThanOrEqualTo(44));
      expect(hour.height, greaterThanOrEqualTo(44));
    });
  });
}
