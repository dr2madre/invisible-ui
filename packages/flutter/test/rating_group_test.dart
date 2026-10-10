import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder _star(String label) => find.bySemanticsLabel(label);

/// The painted star [n], from 1, inside the focusable star.
Finder _paint(int n) => find
    .descendant(
      of: find.byType(RatingGroup),
      matching: find.byWidgetPredicate(
        (w) => w is CustomPaint && w.painter != null,
      ),
    )
    .at(n - 1);

/// The colours of the painted stars, in order.
List<Color> _colors(WidgetTester tester) => [
  for (final paint in tester.widgetList<CustomPaint>(
    find.descendant(
      of: find.byType(RatingGroup),
      matching: find.byWidgetPredicate(
        (w) => w is CustomPaint && w.painter != null,
      ),
    ),
  ))
    (paint.painter! as dynamic).color as Color,
];

void main() {
  testWidgets('a tap chooses and reports once; Space chooses the focused '
      'star', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        RatingGroup.uncontrolled(label: 'Rating', onChanged: reports.add),
      ),
    );
    await tester.tap(_star('3 stars'));
    await tester.pump();
    await tester.tap(_star('3 stars'));
    await tester.pump();
    await focusOn(tester, _paint(5));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, [3, 5]);
    semantics.dispose();
  });

  testWidgets('arrows move and choose, wrapping, mirrored right to left; one '
      'tab stop on the chosen star', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        RatingGroup.uncontrolled(
          label: 'Rating',
          initialValue: 1,
          onChanged: reports.add,
        ),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getCenter(_star('2 stars')).dx,
      lessThan(tester.getCenter(_star('1 star')).dx),
    );
    await tester.tap(find.text('Rating'));
    await tester.pump();
    expect(focusedOn(tester, _paint(1)), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, [2, 1, 5]);
    semantics.dispose();
  });

  testWidgets('semantics: a radio group of stars named by count, chosen '
      'one checked; 24 targets; max sets the count', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const RatingGroup(label: 'Quality', value: 2, max: 3)),
    );
    expect(find.bySemanticsLabel('Quality'), findsOneWidget);
    expect(
      tester.getSemantics(_star('2 stars')),
      semanticsWith(
        label: '2 stars',
        hasCheckedState: true,
        isChecked: true,
        isInMutuallyExclusiveGroup: true,
      ),
    );
    expect(_star('4 stars'), findsNothing);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    semantics.dispose();
  });

  testWidgets('the chosen stars fill; hovering previews in grey', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const RatingGroup(label: 'Rating', value: 2)),
    );
    final filled = InvisibleColors.light.secondary;
    expect(_colors(tester).take(3), [filled, filled, InvisiblePalette.grey400]);
    final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
    await mouse.addPointer(location: Offset.zero);
    addTearDown(mouse.removePointer);
    await mouse.moveTo(tester.getCenter(_star('4 stars')));
    await tester.pump();
    expect(_colors(tester), [
      for (var i = 0; i < 4; i++) InvisiblePalette.grey300,
      InvisiblePalette.grey400,
    ]);
    await mouse.moveTo(Offset.zero);
    await tester.pump();
    expect(_colors(tester).first, filled);
    semantics.dispose();
  });

  testWidgets('controlled: a changed value is shown, never reported', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    Widget build(int? value) => harness(
      RatingGroup(label: 'Rating', value: value, onChanged: reports.add),
    );
    await tester.pumpWidget(build(null));
    await tester.pumpWidget(build(4));
    expect(
      tester.getSemantics(_star('4 stars')),
      semanticsWith(isChecked: true),
    );
    expect(reports, isEmpty);
    semantics.dispose();
  });

  testWidgets('disabled: no choice, no focus; touch keeps 44 targets at text '
      'scale 2.0', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        RatingGroup.uncontrolled(
          label: 'Rating',
          enabled: false,
          onChanged: reports.add,
        ),
      ),
    );
    await tester.tap(_star('2 stars'));
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      tester.getSemantics(_star('2 stars')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    await tester.pumpWidget(
      harness(
        const RatingGroup.uncontrolled(label: 'Rating'),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });

  testWidgets('a form reset restores the default without a report', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final form = GlobalKey<FormState>();
    final reports = <int>[];
    int? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: RatingGroup.uncontrolled(
            label: 'Rating',
            initialValue: 3,
            onChanged: reports.add,
            onSaved: (v) => saved = v,
          ),
        ),
      ),
    );
    await tester.tap(_star('5 stars'));
    await tester.pump();
    form.currentState!.save();
    expect(saved, 5);
    form.currentState!.reset();
    await tester.pump();
    expect(
      tester.getSemantics(_star('3 stars')),
      semanticsWith(isChecked: true),
    );
    expect(reports, [5]);
    semantics.dispose();
  });
}
