import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

final Finder _editable = find.byType(EditableText);
final Finder _field = find.byType(NumberField);

String _shown(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).controller.text;

FocusNode _focusOf(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).focusNode;

NumberFieldState _state(WidgetTester tester) =>
    tester.state<NumberFieldState>(_field);

Finder _spin(String name) => find.byWidgetPredicate(
  (widget) => widget is Button && widget.semanticLabel == name,
);

/// Records every report of a field.
class _Reports {
  final List<double?> changes = [];
  final List<double?> commits = [];
}

NumberField _uncontrolled(
  _Reports reports, {
  Key? key,
  double? initialValue,
  double? min,
  double? max,
  double step = 1,
  Locale? locale,
  bool enabled = true,
  bool readOnly = false,
  bool changeOnWheel = false,
  String? error,
}) => NumberField.uncontrolled(
  key: key,
  label: 'Hours',
  initialValue: initialValue,
  min: min,
  max: max,
  step: step,
  locale: locale,
  enabled: enabled,
  readOnly: readOnly,
  changeOnWheel: changeOnWheel,
  error: error,
  onChanged: reports.changes.add,
  onChangeEnd: reports.commits.add,
);

Future<void> _blur(WidgetTester tester) async {
  _focusOf(tester).unfocus();
  await tester.pump();
}

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await tester.pump();
}

/// A parent that holds the number, as a controlled consumer does.
class _Controlled extends StatefulWidget {
  const _Controlled({super.key, required this.reports, this.initial});

  final _Reports reports;
  final double? initial;

  @override
  State<_Controlled> createState() => _ControlledState();
}

class _ControlledState extends State<_Controlled> {
  late double? number = widget.initial;

  void replace(double? next) => setState(() => number = next);

  @override
  Widget build(BuildContext context) => NumberField(
    label: 'Hours',
    value: number,
    step: 0.5,
    onChanged: (next) {
      widget.reports.changes.add(next);
      setState(() => number = next);
    },
    onChangeEnd: widget.reports.commits.add,
  );
}

void main() {
  group('draft and value', () {
    testWidgets('the number follows the draft, one report per change', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, step: 0.5)));
      await tester.enterText(_editable, '12');
      await tester.pump();
      expect(reports.changes, [12]);
      await tester.enterText(_editable, '12.');
      await tester.pump();
      expect(reports.changes, [12], reason: 'still the same number');
      expect(_state(tester).status, NumberInputStatus.incomplete);
      await tester.enterText(_editable, '12.5');
      await tester.pump();
      expect(reports.changes, [12, 12.5]);
      expect(_state(tester).status, NumberInputStatus.valid);
      expect(reports.commits, isEmpty, reason: 'typing never commits');
    });

    testWidgets('blur commits once; a repeat blur stays silent', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, step: 0.5)));
      await tester.enterText(_editable, '12.5');
      await tester.pump();
      await _blur(tester);
      expect(reports.commits, [12.5]);
      await focusEditable(tester, _field);
      await _blur(tester);
      expect(reports.commits, [12.5]);
      expect(reports.changes, [12.5]);
    });

    testWidgets('a commit reformats the text in the locale', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(
        harness(
          _uncontrolled(reports, step: 0.5, locale: const Locale('it', 'IT')),
        ),
      );
      await tester.enterText(_editable, '12345,5');
      await tester.pump();
      expect(_state(tester).value, 12345.5);
      await _blur(tester);
      expect(_shown(tester), '12.345,5');
      expect(reports.commits, [12345.5]);
      expect(_state(tester).status, NumberInputStatus.valid);
    });

    testWidgets('the locale comes from Localizations when none is given', (
      tester,
    ) async {
      await tester.pumpWidget(
        Localizations(
          locale: const Locale('ar', 'EG'),
          delegates: const [DefaultWidgetsLocalizations.delegate],
          child: harness(
            _uncontrolled(_Reports(), initialValue: 1234.5, step: 0.5),
          ),
        ),
      );
      expect(_shown(tester), '١٬٢٣٤٫٥');
      await tester.enterText(_editable, '١٥');
      await tester.pump();
      expect(_state(tester).value, 15);
    });

    testWidgets('a locale change reformats an idle display, not a draft', (
      tester,
    ) async {
      Widget build(Locale locale) => harness(
        _uncontrolled(_Reports(), initialValue: 12345.5, locale: locale),
      );
      await tester.pumpWidget(build(const Locale('en')));
      expect(_shown(tester), '12,345.5');
      await tester.pumpWidget(build(const Locale('it')));
      expect(_shown(tester), '12.345,5');
      await tester.enterText(_editable, 'abc');
      await tester.pump();
      await tester.pumpWidget(build(const Locale('de')));
      expect(_shown(tester), 'abc');
    });

    testWidgets('empty is null, distinct from 0', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, initialValue: 0)));
      expect(_shown(tester), '0');
      expect(_state(tester).value, 0);
      await tester.enterText(_editable, '');
      await tester.pump();
      expect(reports.changes, [null]);
      expect(_state(tester).status, NumberInputStatus.empty);
      await _blur(tester);
      expect(reports.commits, [null]);
      expect(_shown(tester), '');
    });

    testWidgets('text that does not parse stays, never commits, and says why', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, initialValue: 5)));
      await tester.enterText(_editable, '1..2');
      await tester.pump();
      expect(reports.changes, [null]);
      expect(_state(tester).validationError, NumberFieldError.parse);
      await _blur(tester);
      expect(_shown(tester), '1..2');
      expect(reports.commits, isEmpty);
      expect(find.text('Enter a number.'), findsOneWidget);
      expect(
        editableSemantics(tester, _field),
        semanticsWith(
          label: 'Hours',
          hint: 'Enter a number.',
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      semantics.dispose();
    });

    testWidgets('a typed number out of range is reported, never clamped', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, min: 1, max: 10)));
      await tester.enterText(_editable, '999');
      await tester.pump();
      expect(reports.changes, [999]);
      expect(_state(tester).validationError, NumberFieldError.rangeOverflow);
      expect(find.text('Enter a number that is at most 10.'), findsOneWidget);
      await _blur(tester);
      expect(reports.commits, [999]);
      expect(_shown(tester), '999');
      await tester.enterText(_editable, '0');
      await tester.pump();
      expect(find.text('Enter a number that is at least 1.'), findsOneWidget);
    });

    testWidgets('a typed step mismatch is reported in the locale', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          _uncontrolled(_Reports(), step: 0.5, locale: const Locale('de')),
        ),
      );
      await tester.enterText(_editable, '1,3');
      await tester.pump();
      expect(_state(tester).validationError, NumberFieldError.stepMismatch);
      expect(find.text('Enter a multiple of 0,5.'), findsOneWidget);
    });

    testWidgets('an explicit error replaces the validity message', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(_uncontrolled(_Reports(), error: 'Too many hours.')),
      );
      await tester.enterText(_editable, 'x');
      await tester.pump();
      expect(find.text('Too many hours.'), findsOneWidget);
      expect(find.text('Enter a number.'), findsNothing);
    });
  });

  group('keyboard', () {
    testWidgets('arrows step, and each step commits', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(
        harness(_uncontrolled(reports, initialValue: 2, step: 0.5)),
      );
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_state(tester).value, 2.5);
      expect(reports.changes, [2.5]);
      expect(reports.commits, [2.5]);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_shown(tester), '2');
      expect(reports.commits, [2.5, 2]);
    });

    testWidgets('a step starts from the draft and snaps to the grid', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_uncontrolled(_Reports(), step: 0.1)));
      await tester.enterText(_editable, '0.34');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_state(tester).value, 0.4);
      expect(_shown(tester), '0.4');
    });

    testWidgets('steps from empty land on the nearest bound to zero', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(_uncontrolled(_Reports(), min: 5, max: 10)),
      );
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_state(tester).value, 5);
    });

    testWidgets('Home and End go to the bounds only when both exist', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(
        harness(_uncontrolled(reports, initialValue: 5, min: 0, max: 10)),
      );
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.home);
      expect(_state(tester).value, 0);
      await _key(tester, LogicalKeyboardKey.end);
      expect(_state(tester).value, 10);
      expect(reports.commits, [0, 10]);

      final open = _Reports();
      await tester.pumpWidget(
        harness(_uncontrolled(open, key: UniqueKey(), initialValue: 5, min: 0)),
      );
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.home);
      expect(_state(tester).value, 5);
      expect(open.commits, isEmpty);
    });

    testWidgets('Enter commits', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports)));
      await tester.enterText(_editable, '7');
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();
      expect(reports.commits, [7]);
      expect(_focusOf(tester).hasFocus, isTrue, reason: 'Enter keeps focus');
    });

    testWidgets('Escape reverts a draft, and passes on when there is none', (
      tester,
    ) async {
      final reports = _Reports();
      var outer = 0;
      await tester.pumpWidget(
        harness(
          Shortcuts(
            shortcuts: const {
              SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
            },
            child: Actions(
              actions: {
                DismissIntent: CallbackAction<DismissIntent>(
                  onInvoke: (_) => outer++,
                ),
              },
              child: _uncontrolled(reports, initialValue: 5),
            ),
          ),
        ),
      );
      await tester.enterText(_editable, '99');
      await tester.pump();
      expect(reports.changes, [99]);
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_shown(tester), '5');
      expect(_state(tester).value, 5);
      expect(reports.changes, [99, 5]);
      expect(reports.commits, isEmpty);
      expect(outer, 0, reason: 'consumed: it undid something');
      await _key(tester, LogicalKeyboardKey.escape);
      expect(outer, 1, reason: 'nothing to undo: the dialog gets it');
    });

    testWidgets('read-only and disabled fields neither edit nor step', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(
        harness(_uncontrolled(reports, initialValue: 5, readOnly: true)),
      );
      await focusEditable(tester, _field);
      expect(_focusOf(tester).hasFocus, isTrue);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_state(tester).value, 5);
      expect(tester.widget<Button>(_spin('Increase Hours')).onPressed, isNull);

      await tester.pumpWidget(
        harness(
          _uncontrolled(
            reports,
            key: UniqueKey(),
            initialValue: 5,
            enabled: false,
          ),
        ),
      );
      await focusEditable(tester, _field);
      expect(_focusOf(tester).hasFocus, isFalse);
      expect(tester.widget<Button>(_spin('Decrease Hours')).onPressed, isNull);
      expect(reports.changes, isEmpty);
    });

    testWidgets('the callbacks are read at the action', (tester) async {
      final calls = <String>[];
      Widget build(String name) => harness(
        NumberField.uncontrolled(
          label: 'Hours',
          initialValue: 1,
          onChanged: (_) => calls.add(name),
        ),
      );
      await tester.pumpWidget(build('first'));
      await tester.pumpWidget(build('second'));
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(calls, ['second']);
    });
  });

  group('step buttons', () {
    testWidgets('step, commit and leave focus in the text', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, initialValue: 1)));
      await tester.tap(_spin('Increase Hours'));
      await tester.pump();
      expect(_state(tester).value, 2);
      expect(reports.commits, [2]);
      expect(_focusOf(tester).hasFocus, isTrue);
      await tester.tap(_spin('Decrease Hours'));
      await tester.pump();
      expect(_state(tester).value, 1);
    });

    testWidgets('a bound disables the matching button', (tester) async {
      final reports = _Reports();
      await tester.pumpWidget(
        harness(_uncontrolled(reports, initialValue: 10, min: 0, max: 10)),
      );
      expect(tester.widget<Button>(_spin('Increase Hours')).onPressed, isNull);
      expect(
        tester.widget<Button>(_spin('Decrease Hours')).onPressed,
        isNotNull,
      );
      await focusEditable(tester, _field);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(reports.changes, isEmpty);
    });

    testWidgets('stay out of the Tab order', (tester) async {
      final after = FocusNode();
      addTearDown(after.dispose);
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) => harness(
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _uncontrolled(_Reports(), initialValue: 1),
                Button(
                  onPressed: () {},
                  focusNode: after,
                  child: const Text('After'),
                ),
              ],
            ),
          ),
        ),
      );
      await focusEditable(tester, _field);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(after.hasFocus, isTrue);
    });

    testWidgets('are named from the theme messages', (tester) async {
      await tester.pumpWidget(
        harness(
          _uncontrolled(_Reports()),
          theme: InvisibleThemeData.light(
            messages: const InvisibleMessages(
              numberFieldIncrement: 'Aumenta {label}',
              numberFieldDecrement: 'Diminuisci {label}',
            ),
          ),
        ),
      );
      expect(_spin('Aumenta Hours'), findsOneWidget);
      expect(_spin('Diminuisci Hours'), findsOneWidget);
    });

    testWidgets('mirror in right to left', (tester) async {
      await tester.pumpWidget(
        harness(
          SizedBox(width: 300, child: _uncontrolled(_Reports())),
          direction: TextDirection.rtl,
        ),
      );
      final decrement = tester.getCenter(_spin('Decrease Hours')).dx;
      final increment = tester.getCenter(_spin('Increase Hours')).dx;
      expect(decrement, greaterThan(increment));
    });
  });

  group('wheel', () {
    Future<void> scroll(WidgetTester tester, double dy) async {
      final pointer = TestPointer(1, PointerDeviceKind.mouse);
      await tester.sendEventToBinding(
        pointer.hover(tester.getCenter(_editable)),
      );
      await tester.sendEventToBinding(pointer.scroll(Offset(0, dy)));
      await tester.pump();
    }

    testWidgets('steps only when opted in and focused', (tester) async {
      final off = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(off, initialValue: 5)));
      await focusEditable(tester, _field);
      await scroll(tester, -20);
      expect(_state(tester).value, 5);

      final on = _Reports();
      await tester.pumpWidget(
        harness(
          _uncontrolled(
            on,
            key: UniqueKey(),
            initialValue: 5,
            changeOnWheel: true,
          ),
        ),
      );
      await scroll(tester, -20);
      expect(_state(tester).value, 5, reason: 'not focused');
      await focusEditable(tester, _field);
      await scroll(tester, -20);
      expect(_state(tester).value, 6);
      await scroll(tester, 20);
      expect(_state(tester).value, 5);
      expect(on.commits, [6, 5]);
    });
  });

  group('semantics', () {
    testWidgets('a text field that can be increased and decreased', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          NumberField.uncontrolled(
            label: 'Hours',
            description: 'Per week.',
            initialValue: 12345.5,
            min: 0,
            max: 100000,
            step: 0.5,
            required: true,
            locale: const Locale('it'),
          ),
        ),
      );
      expect(
        editableSemantics(tester, _field),
        semanticsWith(
          label: 'Hours',
          value: '12.345,5',
          hint: 'Per week.',
          isTextField: true,
          isRequired: true,
          hasIncreaseAction: true,
          hasDecreaseAction: true,
          increasedValue: '12.346',
          decreasedValue: '12.345',
        ),
      );
      semantics.dispose();
    });

    testWidgets('the increase action steps', (tester) async {
      final semantics = tester.ensureSemantics();
      final reports = _Reports();
      await tester.pumpWidget(harness(_uncontrolled(reports, initialValue: 1)));
      final node = editableSemantics(tester, _field);
      node.owner!.performAction(node.id, SemanticsAction.increase);
      await tester.pump();
      expect(_state(tester).value, 2);
      expect(reports.commits, [2]);
      semantics.dispose();
    });

    testWidgets('meets the labeled tap target guideline', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(_uncontrolled(_Reports(), initialValue: 3)),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      semantics.dispose();
    });

    testWidgets('targets are at least 24 by 24, and 44 by 44 under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_uncontrolled(_Reports())));
      await expectLater(
        tester,
        meetsGuideline(
          const MinimumTapTargetGuideline(
            size: Size(24, 24),
            link:
                'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
          ),
        ),
      );
      await tester.pumpWidget(
        harness(
          _uncontrolled(_Reports(), key: UniqueKey()),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(
        tester,
        meetsGuideline(
          const MinimumTapTargetGuideline(
            size: Size(44, 44),
            link:
                'https://developer.apple.com/design/human-interface-guidelines/accessibility',
          ),
        ),
      );
      semantics.dispose();
    });
  });

  group('controlled', () {
    testWidgets('a changed value is shown and never reported', (tester) async {
      final reports = _Reports();
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(_Controlled(key: parent, reports: reports, initial: 1)),
      );
      parent.currentState!.replace(3.5);
      await tester.pump();
      expect(_shown(tester), '3.5');
      parent.currentState!.replace(null);
      await tester.pump();
      expect(_shown(tester), '');
      expect(reports.changes, isEmpty);
      expect(reports.commits, isEmpty);
    });

    testWidgets('a given-back value keeps the draft and the commit point', (
      tester,
    ) async {
      final reports = _Reports();
      await tester.pumpWidget(harness(_Controlled(reports: reports)));
      await tester.enterText(_editable, '2.');
      await tester.pump();
      expect(reports.changes, [2]);
      expect(_shown(tester), '2.', reason: 'the draft survives the echo');
      await _blur(tester);
      expect(reports.commits, [2], reason: 'the echo did not commit');
      expect(_shown(tester), '2');
    });

    testWidgets('a parent value while editing keeps the typed text', (
      tester,
    ) async {
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(_Controlled(key: parent, reports: _Reports(), initial: 1)),
      );
      await tester.enterText(_editable, '4.');
      await tester.pump();
      parent.currentState!.replace(9);
      await tester.pump();
      expect(_shown(tester), '4.');
      expect(_state(tester).value, 9);
    });
  });

  group('form', () {
    testWidgets('a reset restores the current default silently', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = _Reports();
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _Controlled(key: parent, reports: reports, initial: 1),
          ),
        ),
      );
      parent.currentState!.replace(2);
      await tester.pump();
      await tester.enterText(_editable, '7');
      await tester.pump();
      await _blur(tester);
      expect(reports.changes, [7]);
      expect(reports.commits, [7]);
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), '2');
      expect(_state(tester).value, 2);
      expect(reports.changes, [7]);
      expect(reports.commits, [7]);
    });

    testWidgets('an uncontrolled reset restores initialValue, even empty', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = _Reports();
      await tester.pumpWidget(
        harness(Form(key: form, child: _uncontrolled(reports))),
      );
      await tester.enterText(_editable, '3');
      await tester.pump();
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), '');
      expect(_state(tester).value, isNull);
      expect(reports.changes, [3]);
    });

    testWidgets('validation fails on the field validity, then the validator', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      double? saved = -1;
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: NumberField.uncontrolled(
              label: 'Hours',
              validator: (number) => number == null ? 'Enter the hours.' : null,
              onSaved: (number) => saved = number,
            ),
          ),
        ),
      );
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Enter the hours.'), findsOneWidget);
      await tester.enterText(_editable, 'abc');
      await tester.pump();
      expect(form.currentState!.validate(), isFalse);
      await tester.enterText(_editable, '8');
      await tester.pump();
      expect(form.currentState!.validate(), isTrue);
      form.currentState!.save();
      expect(saved, 8);
    });
  });

  group('layout', () {
    testWidgets('text scale 2.0 in a narrow column does not overflow', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(280, 1200);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 280,
            child: NumberField.uncontrolled(
              label: 'Hours worked on the project this week',
              description: 'Round to the nearest half hour.',
              initialValue: 12345.5,
              step: 0.5,
              max: 10,
            ),
          ),
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(tester.getSize(_field).width, 280);
    });
  });
}
