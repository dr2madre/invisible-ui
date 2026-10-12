import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder get _slider => find.byType(RangeSlider);

/// The painted thumbs, lower first.
Finder get _thumbs => find.descendant(
  of: _slider,
  matching: find.byWidgetPredicate(
    (w) =>
        w is Container &&
        (w.decoration as BoxDecoration?)?.shape == BoxShape.circle,
  ),
);

Widget _price({
  (double, double)? initialValue,
  double minDistance = 0,
  double step = 1,
  ValueChanged<(double, double)>? onChanged,
  ValueChanged<(double, double)>? onChangeEnd,
  bool enabled = true,
}) => RangeSlider.uncontrolled(
  label: 'Price',
  thumbLabels: ('Minimum price', 'Maximum price'),
  initialValue: initialValue ?? (20, 80),
  minDistance: minDistance,
  step: step,
  onChanged: onChanged,
  onChangeEnd: onChangeEnd,
  enabled: enabled,
);

void main() {
  testWidgets('each thumb is a tab stop with the slider keys; the pair is '
      'reported whole, once per key', (tester) async {
    final changes = <(double, double)>[];
    final ends = <(double, double)>[];
    await tester.pumpWidget(
      harness(_price(onChanged: changes.add, onChangeEnd: ends.add)),
    );
    await focusOn(tester, _thumbs.first);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.pageUp);
    await tester.pump();
    await focusOn(tester, _thumbs.last);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(changes, [(21, 80), (31, 80), (31, 100), (31, 99)]);
    expect(ends, changes);
  });

  testWidgets('the thumbs never cross and keep the distance', (tester) async {
    final changes = <(double, double)>[];
    await tester.pumpWidget(
      harness(_price(minDistance: 10, onChanged: changes.add)),
    );
    await focusOn(tester, _thumbs.first);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(changes, [(70, 80)], reason: 'held back; a refused key is silent');
    await focusOn(tester, _thumbs.last);
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await tester.pump();
    expect(changes.last, (70, 80));
  });

  testWidgets('right to left: the left arrow increases and the lower thumb '
      'sits at the right', (tester) async {
    final changes = <(double, double)>[];
    await tester.pumpWidget(
      harness(_price(onChanged: changes.add), direction: TextDirection.rtl),
    );
    expect(
      tester.getCenter(_thumbs.first).dx,
      greaterThan(tester.getCenter(_thumbs.last).dx),
    );
    await focusOn(tester, _thumbs.first);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(changes, [(21, 80)]);
  });

  testWidgets('a press moves the nearer thumb and drags it; onChangeEnd '
      'once per gesture', (tester) async {
    final changes = <(double, double)>[];
    final ends = <(double, double)>[];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 224,
          child: _price(onChanged: changes.add, onChangeEnd: ends.add),
        ),
      ),
    );
    final box = tester.getRect(_slider);
    // The thumb centres travel 200 pixels, inset 12 from each end.
    Offset at(double fraction) => Offset(
      box.left + 12 + fraction * 200,
      tester.getCenter(_thumbs.first).dy,
    );
    final gesture = await tester.startGesture(at(0.9));
    await tester.pump();
    await gesture.moveTo(at(0.6));
    await tester.pump();
    await gesture.up();
    await tester.pump();
    expect(changes, [(20, 90), (20, 60)]);
    expect(ends, [(20, 60)]);
    expect(focusedOn(tester, _thumbs.last), isTrue);

    await tester.tapAt(at(0.1));
    await tester.pump();
    expect(changes.last, (10, 60));
    expect(ends.last, (10, 60));
  });

  testWidgets('semantics: a named group; each thumb a slider with its name '
      'and the bound it may not pass', (tester) async {
    final semantics = tester.ensureSemantics();
    final changes = <(double, double)>[];
    await tester.pumpWidget(
      harness(_price(minDistance: 10, onChanged: changes.add)),
    );
    final lower = tester.getSemantics(_thumbs.first);
    expect(
      lower,
      semanticsWith(
        label: 'Minimum price',
        value: '20, minimum; may not exceed 70',
        increasedValue: '21, minimum; may not exceed 70',
        isSlider: true,
        hasIncreaseAction: true,
        hasDecreaseAction: true,
      ),
    );
    expect(
      tester.getSemantics(_thumbs.last),
      semanticsWith(
        label: 'Maximum price',
        value: '80, maximum; may not go below 30',
      ),
    );
    expect(find.bySemanticsLabel('Price'), findsOneWidget);
    lower.owner!.performAction(lower.id, SemanticsAction.decrease);
    await tester.pump();
    expect(changes, [(19, 80)]);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    semantics.dispose();
  });

  testWidgets('controlled: an illegal pair is shown legal, never reported', (
    tester,
  ) async {
    final changes = <(double, double)>[];
    Widget build((double, double) value) => harness(
      RangeSlider(
        label: 'Price',
        thumbLabels: const ('Minimum', 'Maximum'),
        value: value,
        minDistance: 10,
        showValue: true,
        onChanged: changes.add,
      ),
    );
    await tester.pumpWidget(build((20, 80)));
    await tester.pumpWidget(build((95, 96)));
    expect(find.text('90 – 100'), findsOneWidget);
    expect(changes, isEmpty);
  });

  testWidgets('disabled: no focus and no drag', (tester) async {
    final changes = <(double, double)>[];
    await tester.pumpWidget(
      harness(_price(enabled: false, onChanged: changes.add)),
    );
    await tester.drag(_slider, const Offset(-100, 0));
    await tester.pump();
    expect(changes, isEmpty);
    expect(Focus.of(tester.element(_thumbs.first)).canRequestFocus, isFalse);
  });

  testWidgets('touch: 44 targets in a narrow column at text scale 2.0; '
      'vertical fills upward', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 180,
          child: RangeSlider.uncontrolled(
            label: 'Price',
            thumbLabels: const ('Minimum', 'Maximum'),
            max: 10,
            showValue: true,
            showRange: true,
            ticks: true,
          ),
        ),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));

    final changes = <(double, double)>[];
    await tester.pumpWidget(
      harness(
        RangeSlider.uncontrolled(
          label: 'Level',
          thumbLabels: const ('Low', 'High'),
          orientation: Axis.vertical,
          onChanged: changes.add,
        ),
      ),
    );
    expect(
      tester.getCenter(_thumbs.first).dy,
      greaterThan(tester.getCenter(_thumbs.last).dy),
    );
    await focusOn(tester, _thumbs.first);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.pump();
    expect(changes, [(1, 100)]);
  });

  testWidgets('a form reset restores the default pair without a report', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final changes = <(double, double)>[];
    (double, double)? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: RangeSlider.uncontrolled(
            label: 'Price',
            thumbLabels: const ('Minimum', 'Maximum'),
            initialValue: (20, 80),
            showValue: true,
            onChanged: changes.add,
            onSaved: (v) => saved = v,
          ),
        ),
      ),
    );
    await focusOn(tester, _thumbs.first);
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await tester.pump();
    form.currentState!.save();
    expect(saved, (0, 80));
    form.currentState!.reset();
    await tester.pump();
    expect(find.text('20 – 80'), findsOneWidget);
    expect(changes, [(0, 80)]);
  });
}
