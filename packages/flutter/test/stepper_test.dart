import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

const List<StepItem> _steps = [
  StepItem(label: 'Account'),
  StepItem(label: 'Profile', description: 'Name and photo'),
  StepItem(label: 'Review'),
];

Widget _wide(Widget child) => SizedBox(width: 700, child: child);

void main() {
  testWidgets('linear: completed and current steps can be chosen, upcoming '
      'ones are disabled; a choice is reported once', (tester) async {
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        _wide(
          Stepper.uncontrolled(
            steps: _steps,
            initialStep: 1,
            onStepChanged: reports.add,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Review'));
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      Focus.of(tester.element(find.text('Review'))).canRequestFocus,
      isFalse,
    );
    await tester.tap(find.text('Profile'));
    await tester.pump();
    expect(reports, isEmpty, reason: 'the current step is no change');
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(reports, [0]);
  });

  testWidgets('non-linear: any step; disabled: none', (tester) async {
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        _wide(
          Stepper.uncontrolled(
            steps: _steps,
            linear: false,
            onStepChanged: reports.add,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Review'));
    await tester.pump();
    expect(reports, [2]);
    await tester.pumpWidget(
      harness(
        _wide(
          Stepper.uncontrolled(
            steps: _steps,
            initialStep: 2,
            enabled: false,
            onStepChanged: reports.add,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Account'));
    await tester.pump();
    expect(reports, [2]);
  });

  testWidgets('semantics: named steps, the current one read as current, the '
      'completed ones as completed with a tick', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(_wide(const Stepper(steps: _steps, currentStep: 1))),
    );
    expect(find.bySemanticsLabel('Progress'), findsOneWidget);
    expect(
      tester.getSemantics(find.text('Account')),
      semanticsWith(label: 'Account', value: 'Completed', isButton: true),
    );
    expect(
      tester.getSemantics(find.text('Profile')),
      semanticsWith(
        label: 'Profile',
        value: 'current step',
        hint: 'Name and photo',
      ),
    );
    expect(
      tester.getSemantics(find.text('Review')),
      semanticsWith(label: 'Review', hasEnabledState: true, isEnabled: false),
    );
    expect(find.byType(Glyph), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('controlled: a changed step is shown, never reported', (
    tester,
  ) async {
    final reports = <int>[];
    Widget build(int step) => harness(
      _wide(
        Stepper(steps: _steps, currentStep: step, onStepChanged: reports.add),
      ),
    );
    await tester.pumpWidget(build(0));
    await tester.pumpWidget(build(2));
    expect(find.byType(Glyph), findsNWidgets(2));
    expect(reports, isEmpty);
  });

  testWidgets('a row when wide; stacked when narrow or vertical; mirrored '
      'right to left', (tester) async {
    await tester.pumpWidget(
      harness(_wide(const Stepper.uncontrolled(steps: _steps))),
    );
    expect(
      tester.getTopLeft(find.text('Review')).dy,
      moreOrLessEquals(tester.getTopLeft(find.text('Account')).dy),
    );
    await tester.pumpWidget(
      harness(
        _wide(const Stepper.uncontrolled(steps: _steps)),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getCenter(find.text('Review')).dx,
      lessThan(tester.getCenter(find.text('Account')).dx),
    );
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 320, child: Stepper.uncontrolled(steps: _steps)),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('Review')).dy,
      greaterThan(tester.getTopLeft(find.text('Account')).dy),
    );
  });

  testWidgets('the ring shows on keyboard focus; 44 targets under touch', (
    tester,
  ) async {
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(
        _wide(const Stepper.uncontrolled(steps: _steps)),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await focusOn(tester, find.text('Account'));
    final ring = tester.widget<CustomPaint>(
      find
          .ancestor(
            of: find.text('Account'),
            matching: find.byType(CustomPaint),
          )
          .first,
    );
    expect(ring.foregroundPainter, isNotNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));
  });
}
