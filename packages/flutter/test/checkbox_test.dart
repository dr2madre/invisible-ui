import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/checkbox/checkbox.dart' show CheckboxBox;
import 'package:invisible_ui/src/field/field.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

const List<ChoiceItem<String>> _days = [
  ChoiceItem(value: 'mon', label: 'Monday'),
  ChoiceItem(value: 'tue', label: 'Tuesday'),
  ChoiceItem(value: 'sat', label: 'Saturday', disabled: true),
];

/// A parent that holds the value, as a controlled consumer does.
class _Controlled extends StatefulWidget {
  const _Controlled({super.key, required this.reports, this.initial = false});

  final List<bool> reports;
  final bool? initial;

  @override
  State<_Controlled> createState() => _ControlledState();
}

class _ControlledState extends State<_Controlled> {
  late bool? value = widget.initial;

  void replace(bool? next) => setState(() => value = next);

  @override
  Widget build(BuildContext context) => Checkbox(
    label: 'Remember me',
    value: value,
    onChanged: (next) {
      widget.reports.add(next);
      setState(() => value = next);
    },
  );
}

final Finder _box = find.byType(CheckboxBox).first;
final Finder _node = find.byType(FieldSemantics);

Iterable<GlyphShape> _glyphs(WidgetTester tester) =>
    tester.widgetList<Glyph>(find.byType(Glyph)).map((g) => g.shape);

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  group('Checkbox value', () {
    testWidgets('a tap on the box or the label toggles and reports once', (
      tester,
    ) async {
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Checkbox.uncontrolled(label: 'Remember me', onChanged: reports.add),
        ),
      );
      await tester.tap(find.text('Remember me'));
      await tester.pump();
      expect(reports, [true]);
      expect(_glyphs(tester), [GlyphShape.check]);
      await tester.tap(_box);
      await tester.pump();
      expect(reports, [true, false]);
      expect(_glyphs(tester), isEmpty);
    });

    testWidgets('Space toggles; Enter does not, as on a native checkbox', (
      tester,
    ) async {
      final reports = <bool>[];
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Checkbox.uncontrolled(
            label: 'Remember me',
            focusNode: focus,
            onChanged: reports.add,
          ),
        ),
      );
      focus.requestFocus();
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(reports, isEmpty);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(reports, [true]);
    });

    testWidgets('mixed shows a bar and checks on activation', (tester) async {
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(_Controlled(reports: reports, initial: null)),
      );
      expect(_glyphs(tester), [GlyphShape.dash]);
      await tester.tap(_box);
      await tester.pump();
      expect(reports, [true]);
      expect(_glyphs(tester), [GlyphShape.check]);
    });

    testWidgets('a changed value is shown and never reported', (tester) async {
      final reports = <bool>[];
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(_Controlled(key: parent, reports: reports)),
      );
      parent.currentState!.replace(true);
      await tester.pump();
      expect(_glyphs(tester), [GlyphShape.check]);
      parent.currentState!.replace(null);
      await tester.pump();
      expect(_glyphs(tester), [GlyphShape.dash]);
      expect(reports, isEmpty);
    });

    testWidgets('the state moves before the report', (tester) async {
      final seen = <Iterable<GlyphShape>>[];
      await tester.pumpWidget(
        harness(
          Checkbox.uncontrolled(
            label: 'Remember me',
            onChanged: (_) => seen.add(_glyphs(tester).toList()),
          ),
        ),
      );
      await tester.tap(_box);
      await tester.pump();
      expect(_glyphs(tester), [GlyphShape.check]);
      expect(seen, hasLength(1));
    });

    testWidgets('the callback is read at the press', (tester) async {
      final calls = <String>[];
      Widget build(String name) => harness(
        Checkbox.uncontrolled(
          label: 'Remember me',
          onChanged: (_) => calls.add(name),
        ),
      );
      await tester.pumpWidget(build('first'));
      await tester.pumpWidget(build('second'));
      await tester.tap(_box);
      expect(calls, ['second']);
    });

    testWidgets('disabled: no focus, no change, reported disabled', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Checkbox.uncontrolled(
            label: 'Remember me',
            enabled: false,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.tap(_box);
      await tester.pump();
      expect(reports, isEmpty);
      expect(
        tester.getSemantics(_node),
        semanticsWith(
          label: 'Remember me',
          hasEnabledState: true,
          isEnabled: false,
          hasCheckedState: true,
          isChecked: false,
        ),
      );
      semantics.dispose();
    });
  });

  group('Checkbox semantics', () {
    testWidgets('one node: name, checked, mixed, description and error', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const Checkbox(
            label: 'All days',
            value: null,
            description: 'Applies to the week.',
            error: 'Pick a day.',
            required: true,
          ),
        ),
      );
      expect(
        tester.getSemantics(_node),
        semanticsWith(
          label: 'All days',
          hint: 'Applies to the week.\nPick a day.',
          hasCheckedState: true,
          isChecked: false,
          isCheckStateMixed: true,
          isFocusable: true,
          hasTapAction: true,
          isRequired: true,
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      expect(find.byType(HazardGlyph), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('a hidden label still names it', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const Checkbox.uncontrolled(label: 'Select row', hideLabel: true),
        ),
      );
      expect(find.text('Select row'), findsNothing);
      expect(
        tester.getSemantics(_node),
        semanticsWith(label: 'Select row', hasCheckedState: true),
      );
      semantics.dispose();
    });

    testWidgets('meets the tap target and contrast guidelines', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const Checkbox.uncontrolled(label: 'Remember me')),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });

  group('Checkbox focus and layout', () {
    testWidgets('the ring shows on keyboard focus only, around the box', (
      tester,
    ) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      useKeyboardHighlight();
      await tester.pumpWidget(
        harness(Checkbox.uncontrolled(label: 'Remember me', focusNode: focus)),
      );
      FocusRingPainter ring() =>
          tester.widget<FocusRingPainter>(find.byType(FocusRingPainter));
      expect(ring().visible, isFalse);
      focus.requestFocus();
      await pumpFocus(tester);
      expect(ring().visible, isTrue);
      expect(
        tester.getSize(find.byType(FocusRingPainter)),
        const Size(20, 20),
        reason: 'the ring follows the box, not the label',
      );
    });

    testWidgets('the row keeps 44 by 44 under touch', (tester) async {
      await tester.pumpWidget(
        harness(
          const Checkbox.uncontrolled(label: 'A', hideLabel: true),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      final size = tester.getSize(find.byType(GestureDetector).first);
      expect(size.width, greaterThanOrEqualTo(44));
      expect(size.height, greaterThanOrEqualTo(44));
    });

    testWidgets('right to left puts the box at the right; text scale 2.0 '
        'wraps a long label at a narrow width', (tester) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 200,
            child: Checkbox.uncontrolled(
              label: 'Send me the weekly summary by email every Monday',
            ),
          ),
          direction: TextDirection.rtl,
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      final box = tester.getRect(find.byType(FocusRingPainter));
      final label = tester.getRect(find.textContaining('weekly'));
      expect(box.left, greaterThan(label.left));
      expect(box.width, 40, reason: 'the box grows with the text');
    });
  });

  group('Checkbox form', () {
    testWidgets('a reset restores the current default without a report', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: Checkbox.uncontrolled(
              label: 'Remember me',
              initialValue: true,
              onChanged: reports.add,
            ),
          ),
        ),
      );
      await tester.tap(_box);
      await tester.pump();
      expect(_glyphs(tester), isEmpty);
      form.currentState!.reset();
      await tester.pump();
      expect(_glyphs(tester), [GlyphShape.check]);
      expect(reports, [false]);
    });

    testWidgets('a controlled reset restores the last value the parent set', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <bool>[];
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _Controlled(key: parent, reports: reports),
          ),
        ),
      );
      parent.currentState!.replace(null);
      await tester.pump();
      await tester.tap(_box);
      await tester.pump();
      expect(reports, [true]);
      form.currentState!.reset();
      await tester.pump();
      expect(_glyphs(tester), [GlyphShape.dash]);
      expect(reports, [true]);
    });

    testWidgets('the validator shows its message and saves the value', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      bool? saved;
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: Checkbox.uncontrolled(
              label: 'I agree',
              validator: (value) => value == true ? null : 'Agree to go on.',
              onSaved: (value) => saved = value,
            ),
          ),
        ),
      );
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Agree to go on.'), findsOneWidget);
      await tester.tap(_box);
      await tester.pump();
      expect(form.currentState!.validate(), isTrue);
      form.currentState!.save();
      expect(saved, isTrue);
    });
  });

  group('CheckboxGroup', () {
    testWidgets('each item toggles; the value keeps the order of checking '
        'and may be empty', (tester) async {
      final reports = <List<String>>[];
      await tester.pumpWidget(
        harness(
          CheckboxGroup<String>.uncontrolled(
            label: 'Working days',
            items: _days,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.tap(find.text('Tuesday'));
      await tester.pump();
      await tester.tap(find.text('Monday'));
      await tester.pump();
      await tester.tap(find.text('Tuesday'));
      await tester.pump();
      await tester.tap(find.text('Monday'));
      await tester.pump();
      expect(reports, [
        ['tue'],
        ['tue', 'mon'],
        ['mon'],
        <String>[],
      ]);
    });

    testWidgets('a disabled item and a disabled group take no change', (
      tester,
    ) async {
      final reports = <List<String>>[];
      await tester.pumpWidget(
        harness(
          CheckboxGroup<String>.uncontrolled(
            label: 'Working days',
            items: _days,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.tap(find.text('Saturday'));
      await tester.pump();
      expect(reports, isEmpty);
      await tester.pumpWidget(
        harness(
          CheckboxGroup<String>.uncontrolled(
            label: 'Working days',
            items: _days,
            enabled: false,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.tap(find.text('Monday'));
      await tester.pump();
      expect(reports, isEmpty);
    });

    testWidgets('every enabled item is a tab stop; Space toggles', (
      tester,
    ) async {
      final reports = <List<String>>[];
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) => harness(
            CheckboxGroup<String>.uncontrolled(
              label: 'Working days',
              items: _days,
              onChanged: reports.add,
            ),
          ),
        ),
      );
      await tester.tap(find.text('Working days'));
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(reports, [
        ['tue'],
      ]);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(reports.last, [
        'tue',
        'mon',
      ], reason: 'Tab skips the disabled item and wraps to the first');
    });

    testWidgets('a reordered value from the parent is the same selection', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      Widget build(List<String> value) => harness(
        Form(
          key: form,
          child: CheckboxGroup<String>(
            label: 'Working days',
            items: _days,
            value: value,
          ),
        ),
      );
      await tester.pumpWidget(build(['mon', 'tue']));
      await tester.tap(find.text('Monday'));
      await tester.pump();
      // The parent echoes nothing; a reordered copy of the first value is
      // no new default.
      await tester.pumpWidget(build(['tue', 'mon']));
      form.currentState!.reset();
      await tester.pump();
      final checked = tester
          .widgetList<Glyph>(find.byType(Glyph))
          .where((g) => g.shape == GlyphShape.check);
      expect(checked, hasLength(2));
    });

    testWidgets('semantics: a named group of checkbox nodes', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const CheckboxGroup<String>(
            label: 'Working days',
            items: _days,
            value: ['mon'],
            description: 'Days you log hours.',
          ),
        ),
      );
      expect(
        tester.getSemantics(_node),
        semanticsWith(label: 'Working days', hint: 'Days you log hours.'),
      );
      expect(
        tester.getSemantics(find.text('Monday')),
        semanticsWith(label: 'Monday', hasCheckedState: true, isChecked: true),
      );
      expect(
        tester.getSemantics(find.text('Saturday')),
        semanticsWith(
          label: 'Saturday',
          hasEnabledState: true,
          isEnabled: false,
          hasCheckedState: true,
          isChecked: false,
        ),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      semantics.dispose();
    });

    testWidgets('a reset restores the default; the validator can require one', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <List<String>>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: CheckboxGroup<String>.uncontrolled(
              label: 'Working days',
              items: _days,
              initialValue: const ['mon'],
              onChanged: reports.add,
              validator: (value) => value!.isEmpty ? 'Pick a day.' : null,
            ),
          ),
        ),
      );
      await tester.tap(find.text('Monday'));
      await tester.pump();
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Pick a day.'), findsOneWidget);
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('Pick a day.'), findsNothing);
      expect(reports, [<String>[]]);
      expect(_glyphs(tester), [GlyphShape.check]);
    });

    testWidgets('a tap on the group label focuses the first item; text scale '
        '2.0 right to left does not overflow', (tester) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 220,
            child: CheckboxGroup<String>.uncontrolled(
              label: 'Working days',
              items: _days,
            ),
          ),
          direction: TextDirection.rtl,
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Working days'));
      await tester.pump();
      expect(
        Focus.of(tester.element(find.text('Monday'))).hasPrimaryFocus,
        isTrue,
      );
    });
  });
}
