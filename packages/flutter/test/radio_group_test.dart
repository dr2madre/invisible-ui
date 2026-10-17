import 'dart:ui' show SemanticsRole, SemanticsValidationResult;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' hide RadioGroup;
import 'package:flutter/widgets.dart' as widgets show RadioGroup;
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/radio/radio.dart' show RadioDot;

import 'harness.dart';

const List<ChoiceItem<String>> _scopes = [
  ChoiceItem(value: 'month', label: 'This month'),
  ChoiceItem(value: 'year', label: 'This year'),
  ChoiceItem(value: 'all', label: 'Everything', disabled: true),
  ChoiceItem(value: 'view', label: 'Filtered view'),
];

String? _checked(WidgetTester tester) {
  for (final item in _scopes) {
    final dot = tester.widget<RadioDot>(
      find.descendant(
        of: find.ancestor(
          of: find.text(item.label),
          matching: find.byType(Row),
        ),
        matching: find.byType(RadioDot),
      ),
    );
    if (dot.checked) return item.value;
  }
  return null;
}

bool _focused(WidgetTester tester, String label) =>
    Focus.of(tester.element(find.text(label))).hasPrimaryFocus;

class _Controlled extends StatefulWidget {
  const _Controlled({super.key, required this.reports});

  final List<String> reports;

  @override
  State<_Controlled> createState() => _ControlledState();
}

class _ControlledState extends State<_Controlled> {
  String? value = 'month';

  void replace(String? next) => setState(() => value = next);

  @override
  Widget build(BuildContext context) => RadioGroup<String>(
    label: 'Export',
    items: _scopes,
    value: value,
    onChanged: (next) {
      widget.reports.add(next);
      setState(() => value = next);
    },
  );
}

void main() {
  testWidgets('a tap chooses and reports once; the chosen one again reports '
      'nothing', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        RadioGroup<String>.uncontrolled(
          label: 'Export',
          items: _scopes,
          onChanged: reports.add,
        ),
      ),
    );
    expect(_checked(tester), isNull);
    await tester.tap(find.text('This year'));
    await tester.pump();
    await tester.tap(find.text('This year'));
    await tester.pump();
    expect(reports, ['year']);
    expect(_checked(tester), 'year');
  });

  testWidgets('the arrows move and choose, skip a disabled option and wrap', (
    tester,
  ) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        RadioGroup<String>.uncontrolled(
          label: 'Export',
          items: _scopes,
          initialValue: 'year',
          onChanged: reports.add,
        ),
      ),
    );
    await tester.tap(find.text('Export'));
    await tester.pump();
    expect(_focused(tester, 'This year'), isTrue, reason: 'the chosen option');
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(reports, ['view'], reason: 'Everything is disabled');
    expect(_focused(tester, 'Filtered view'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, ['view', 'month'], reason: 'wraps to the first');
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(reports, ['view', 'month', 'view', 'year']);
  });

  testWidgets('right to left: the left arrow moves forward', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        RadioGroup<String>.uncontrolled(
          label: 'Export',
          items: _scopes,
          initialValue: 'month',
          orientation: Axis.horizontal,
          onChanged: reports.add,
        ),
        direction: TextDirection.rtl,
      ),
    );
    await tester.tap(find.text('Export'));
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(reports, ['year']);
    expect(
      tester.getCenter(find.text('This year')).dx,
      lessThan(tester.getCenter(find.text('This month')).dx),
    );
  });

  testWidgets('one tab stop: the chosen option, else the first enabled', (
    tester,
  ) async {
    final before = FocusNode();
    addTearDown(before.dispose);
    Widget build(String? value) => WidgetsApp(
      color: const Color(0xFF000000),
      builder: (context, _) => harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Button(
              onPressed: () {},
              focusNode: before,
              child: const Text('Before'),
            ),
            RadioGroup<String>(label: 'Export', items: _scopes, value: value),
            Button(onPressed: () {}, child: const Text('After')),
          ],
        ),
      ),
    );
    await tester.pumpWidget(build(null));
    before.requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(_focused(tester, 'This month'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(
      Focus.of(tester.element(find.text('After'))).hasPrimaryFocus,
      isTrue,
      reason: 'Tab leaves the group',
    );

    await tester.pumpWidget(build('view'));
    before.requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(_focused(tester, 'Filtered view'), isTrue);

    // A disabled chosen option leaves the stop to the first enabled one.
    await tester.pumpWidget(build('all'));
    before.requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(_focused(tester, 'This month'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(
      Focus.of(tester.element(find.text('After'))).hasPrimaryFocus,
      isTrue,
    );
  });

  testWidgets('Space chooses the focused option; a disabled group takes '
      'nothing', (tester) async {
    final reports = <String>[];
    Widget build({required bool enabled}) => harness(
      RadioGroup<String>.uncontrolled(
        label: 'Export',
        items: _scopes,
        enabled: enabled,
        onChanged: reports.add,
      ),
    );
    await tester.pumpWidget(build(enabled: true));
    await tester.tap(find.text('Export'));
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['month']);
    await tester.pumpWidget(build(enabled: false));
    await tester.tap(find.text('This year'));
    await tester.pump();
    expect(reports, ['month']);
  });

  testWidgets('a changed value is shown, never reported; a controlled reset '
      'restores it', (tester) async {
    final form = GlobalKey<FormState>();
    final reports = <String>[];
    final parent = GlobalKey<_ControlledState>();
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: _Controlled(key: parent, reports: reports),
        ),
      ),
    );
    parent.currentState!.replace('view');
    await tester.pump();
    expect(_checked(tester), 'view');
    expect(reports, isEmpty);
    await tester.tap(find.text('This year'));
    await tester.pump();
    form.currentState!.reset();
    await tester.pump();
    expect(_checked(tester), 'view');
    expect(reports, ['year']);
  });

  testWidgets('an uncontrolled reset restores the default; the validator '
      'can require a choice', (tester) async {
    final form = GlobalKey<FormState>();
    String? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: RadioGroup<String>.uncontrolled(
            label: 'Export',
            items: _scopes,
            validator: (value) => value == null ? 'Choose a scope.' : null,
            onSaved: (value) => saved = value,
          ),
        ),
      ),
    );
    final semantics = tester.ensureSemantics();
    expect(form.currentState!.validate(), isFalse);
    await tester.pump();
    expect(find.text('Choose a scope.'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(widgets.RadioGroup<String>)),
      semanticsWith(
        label: 'Export',
        hint: 'Choose a scope.',
        validationResult: SemanticsValidationResult.invalid,
      ),
    );
    await tester.tap(find.text('This month'));
    await tester.pump();
    expect(form.currentState!.validate(), isTrue);
    form.currentState!.save();
    expect(saved, 'month');
    form.currentState!.reset();
    await tester.pump();
    expect(_checked(tester), isNull);
    expect(find.text('Choose a scope.'), findsNothing);
    semantics.dispose();
  });

  testWidgets('the focus ring shows around the focused option after keyboard '
      'use', (tester) async {
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(
        const RadioGroup<String>.uncontrolled(label: 'Export', items: _scopes),
      ),
    );
    List<bool> rings() => [
      for (final ring in tester.widgetList<FocusRingPainter>(
        find.byType(FocusRingPainter),
      ))
        ring.visible,
    ];
    expect(rings(), [false, false, false, false]);
    await tester.tap(find.text('Export'));
    await pumpFocus(tester);
    expect(rings(), [true, false, false, false]);
  });

  testWidgets('semantics: a named radio group of exclusive options', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const RadioGroup<String>(
          label: 'Export',
          items: _scopes,
          value: 'year',
          description: 'What the file holds.',
          required: true,
        ),
      ),
    );
    // One node: the native group's radio group role, with the field's name,
    // description and required state on it.
    final group = tester.getSemantics(find.byType(widgets.RadioGroup<String>));
    expect(group.getSemanticsData().role, SemanticsRole.radioGroup);
    expect(
      group,
      semanticsWith(
        label: 'Export',
        hint: 'What the file holds.',
        isRequired: true,
      ),
    );
    expect(
      tester.getSemantics(find.text('This year')),
      semanticsWith(
        label: 'This year',
        hasCheckedState: true,
        isChecked: true,
        isInMutuallyExclusiveGroup: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester.getSemantics(find.text('Everything')),
      semanticsWith(
        label: 'Everything',
        hasEnabledState: true,
        isEnabled: false,
        hasCheckedState: true,
        isChecked: false,
        isInMutuallyExclusiveGroup: true,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a horizontal group wraps at a narrow width at text scale 2.0; '
      'targets keep 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 240,
          child: RadioGroup<String>.uncontrolled(
            label: 'Export',
            items: _scopes,
            orientation: Axis.horizontal,
          ),
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('This year')).dy,
      greaterThan(tester.getTopLeft(find.text('This month')).dy),
    );
    final row = find.ancestor(
      of: find.text('Everything'),
      matching: find.byType(ConstrainedBox),
    );
    expect(tester.getSize(row.first).height, greaterThanOrEqualTo(44));
  });
}
