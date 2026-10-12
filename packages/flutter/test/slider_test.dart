import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder get _slider => find.byType(Slider);

/// The painted thumb: the circle the track positions.
Finder get _thumb => find.descendant(
  of: _slider,
  matching: find.byWidgetPredicate(
    (w) =>
        w is Container &&
        (w.decoration as BoxDecoration?)?.shape == BoxShape.circle,
  ),
);

Future<void> _focus(WidgetTester tester) => focusOn(tester, _thumb);

void main() {
  testWidgets('arrows, Page Up and Down, Home and End move the value and '
      'report each move once, with onChangeEnd per key', (tester) async {
    final changes = <double>[];
    final ends = <double>[];
    await tester.pumpWidget(
      harness(
        Slider.uncontrolled(
          label: 'Volume',
          initialValue: 50,
          onChanged: changes.add,
          onChangeEnd: ends.add,
        ),
      ),
    );
    await _focus(tester);
    for (final key in [
      LogicalKeyboardKey.arrowRight,
      LogicalKeyboardKey.arrowUp,
      LogicalKeyboardKey.arrowLeft,
      LogicalKeyboardKey.arrowDown,
      LogicalKeyboardKey.pageUp,
      LogicalKeyboardKey.pageDown,
      LogicalKeyboardKey.end,
      LogicalKeyboardKey.end,
      LogicalKeyboardKey.home,
    ]) {
      await tester.sendKeyEvent(key);
      await tester.pump();
    }
    expect(changes, [51, 52, 51, 50, 60, 50, 100, 0]);
    expect(ends, changes, reason: 'End at the maximum moves nothing');
  });

  testWidgets('right to left: the left arrow increases and the minimum sits '
      'at the right', (tester) async {
    final changes = <double>[];
    await tester.pumpWidget(
      harness(
        Slider.uncontrolled(
          label: 'Volume',
          initialValue: 0,
          onChanged: changes.add,
        ),
        direction: TextDirection.rtl,
      ),
    );
    final box = tester.getRect(_slider);
    expect(tester.getCenter(_thumb).dx, greaterThan(box.center.dx));
    await _focus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(changes, [1, 2, 1]);
  });

  testWidgets('a drag reports each value and onChangeEnd once; a tap on the '
      'track jumps there', (tester) async {
    final changes = <double>[];
    final ends = <double>[];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 216,
          child: Slider.uncontrolled(
            label: 'Volume',
            step: 10,
            onChanged: changes.add,
            onChangeEnd: ends.add,
          ),
        ),
      ),
    );
    final box = tester.getRect(_slider);
    // The thumb centres travel 200 pixels, inset 8 from each end.
    final gesture = await tester.startGesture(
      box.centerLeft + const Offset(8, 0),
    );
    await gesture.moveBy(const Offset(60, 0));
    await tester.pump();
    await gesture.moveBy(const Offset(40, 0));
    await tester.pump();
    await gesture.up();
    await tester.pump();
    expect(changes, [30, 50]);
    expect(ends, [50]);
    expect(focusedOn(tester, _thumb), isTrue, reason: 'a press focuses it');

    await tester.tapAt(box.centerLeft + const Offset(8 + 180, 0));
    await tester.pump();
    expect(changes.last, 90);
    expect(ends, [50, 90]);
  });

  testWidgets('vertical: up increases, a drag upward increases', (
    tester,
  ) async {
    final changes = <double>[];
    await tester.pumpWidget(
      harness(
        Slider.uncontrolled(
          label: 'Level',
          orientation: Axis.vertical,
          initialValue: 50,
          step: 10,
          onChanged: changes.add,
        ),
      ),
    );
    expect(tester.getSize(_slider).height, greaterThanOrEqualTo(224));
    await _focus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.pump();
    expect(changes, [60]);
    final thumb = tester.getCenter(_thumb);
    await tester.dragFrom(thumb, const Offset(0, -60));
    await tester.pump();
    expect(changes.last, greaterThan(60));
  });

  testWidgets('semantics: a slider named by its label, with the value and '
      'the next values as text; increase and decrease step', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <double>[];
    await tester.pumpWidget(
      harness(
        Slider.uncontrolled(
          label: 'Volume',
          initialValue: 30,
          step: 5,
          format: (v) => '${v.round()}%',
          onChanged: changes.add,
        ),
      ),
    );
    final node = tester.getSemantics(_thumb);
    expect(
      node,
      semanticsWith(
        label: 'Volume',
        value: '30%',
        increasedValue: '35%',
        decreasedValue: '25%',
        isSlider: true,
        isFocusable: true,
        hasIncreaseAction: true,
        hasDecreaseAction: true,
      ),
    );
    node.owner!.performAction(node.id, SemanticsAction.increase);
    await tester.pump();
    expect(changes, [35]);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    semantics.dispose();
  });

  testWidgets('the value text follows the locale digits without format', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Slider.uncontrolled(
          label: 'Hours',
          initialValue: 2.5,
          max: 10,
          step: 0.5,
          locale: Locale('it'),
          showValue: true,
        ),
      ),
    );
    expect(find.text('2,5'), findsOneWidget);
    expect(tester.getSemantics(_thumb), semanticsWith(value: '2,5'));
    semantics.dispose();
  });

  testWidgets('controlled: a changed value is shown snapped, never reported; '
      'the callback is read at the key', (tester) async {
    final first = <double>[];
    final second = <double>[];
    Widget build(double value, ValueChanged<double> onChanged) => harness(
      Slider(label: 'Volume', value: value, step: 10, onChanged: onChanged),
    );
    await tester.pumpWidget(build(20, first.add));
    await tester.pumpWidget(build(47, first.add));
    final semantics = tester.ensureSemantics();
    expect(tester.getSemantics(_thumb), semanticsWith(value: '50'));
    semantics.dispose();
    await tester.pumpWidget(build(47, second.add));
    await _focus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(first, isEmpty);
    expect(second, [60]);
  });

  testWidgets('a value that is not a number keeps the one shown', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    Widget build(double value) =>
        harness(Slider(label: 'Volume', value: value));
    await tester.pumpWidget(build(double.nan));
    expect(tester.getSemantics(_thumb), semanticsWith(value: '0'));
    await tester.pumpWidget(build(30));
    await tester.pumpWidget(build(double.infinity));
    expect(tester.getSemantics(_thumb), semanticsWith(value: '30'));
    semantics.dispose();
  });

  testWidgets('new bounds snap the value silently', (tester) async {
    final changes = <double>[];
    Widget build(double max) => harness(
      Slider.uncontrolled(
        label: 'Volume',
        initialValue: 80,
        max: max,
        onChanged: changes.add,
        showValue: true,
      ),
    );
    await tester.pumpWidget(build(100));
    await tester.pumpWidget(build(50));
    expect(find.text('50'), findsOneWidget);
    expect(changes, isEmpty);
  });

  testWidgets('disabled: no focus, no drag, no key, dimmed', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <double>[];
    await tester.pumpWidget(
      harness(
        Slider.uncontrolled(
          label: 'Volume',
          enabled: false,
          onChanged: changes.add,
        ),
      ),
    );
    await tester.drag(_slider, const Offset(100, 0));
    await tester.pump();
    expect(changes, isEmpty);
    expect(
      tester.getSemantics(_thumb),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    expect(Focus.of(tester.element(_thumb)).canRequestFocus, isFalse);
    expect(tester.widget<Opacity>(find.byType(Opacity).first).opacity, 0.5);
    semantics.dispose();
  });

  testWidgets('the focus ring shows around the thumb on keyboard focus', (
    tester,
  ) async {
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(const Slider.uncontrolled(label: 'Volume')),
    );
    await _focus(tester);
    final ring = tester.widget<CustomPaint>(
      find.ancestor(of: _thumb, matching: find.byType(CustomPaint)).first,
    );
    expect(ring.foregroundPainter, isNotNull);
  });

  testWidgets('touch: the hit area is 44 tall; ticks, range and value show '
      'in a narrow column at text scale 2.0', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 160,
          child: Slider.uncontrolled(
            label: 'Volume',
            max: 10,
            showValue: true,
            showRange: true,
            ticks: true,
            icon: SizedBox.square(dimension: 16),
          ),
        ),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('0'), findsNWidgets(2), reason: 'value and minimum');
    expect(find.text('10'), findsOneWidget);
    final track = find.descendant(
      of: _slider,
      matching: find.byType(GestureDetector),
    );
    expect(tester.getSize(track.first).height, greaterThanOrEqualTo(44));
    await expectLater(tester, meetsGuideline(targetGuideline44));
  });

  testWidgets('a form reset restores the default without a report; save '
      'reads the value', (tester) async {
    final form = GlobalKey<FormState>();
    final changes = <double>[];
    double? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: Slider.uncontrolled(
            label: 'Volume',
            initialValue: 40,
            onChanged: changes.add,
            onSaved: (v) => saved = v,
            showValue: true,
          ),
        ),
      ),
    );
    await _focus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.pump();
    form.currentState!.save();
    expect(saved, 100);
    form.currentState!.reset();
    await tester.pump();
    expect(find.text('40'), findsOneWidget);
    expect(changes, [100]);
  });
}
