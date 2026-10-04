import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

double _fill(WidgetTester tester) => tester
    .widget<AnimatedFractionallySizedBox>(
      find.byType(AnimatedFractionallySizedBox),
    )
    .widthFactor!;

void main() {
  testWidgets('semantics: named by the label, the completion read as a '
      'percentage of the range; values out of range are clamped', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Progress(value: 7, max: 10, label: 'Achievements unlocked'),
            Progress(value: 140, label: 'Upload'),
          ],
        ),
      ),
    );
    expect(find.bySemanticsLabel('Achievements unlocked'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(Progress).first),
      semanticsWith(label: 'Achievements unlocked', value: '70%'),
    );
    expect(
      tester.getSemantics(find.byType(Progress).last),
      semanticsWith(label: 'Upload', value: '100%'),
    );
    semantics.dispose();
  });

  testWidgets('the bar fills from the inline-start, mirrored right to left', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: Progress(value: 25, label: 'Profile'),
        ),
        direction: TextDirection.rtl,
      ),
    );
    expect(_fill(tester), 0.25);
    final track = tester.getRect(find.byType(Progress));
    final fill = tester.getRect(
      find.descendant(
        of: find.byType(AnimatedFractionallySizedBox),
        matching: find.byType(DecoratedBox),
      ),
    );
    expect(fill.right, track.right);
    expect(fill.width, 50);
  });

  testWidgets('a new value slides over 200ms, and at once under reduced '
      'motion', (tester) async {
    Widget build(double value, {bool still = false}) => harness(
      Progress(value: value, label: 'Profile'),
      disableAnimations: still,
    );
    await tester.pumpWidget(build(10));
    await tester.pumpWidget(build(60));
    expect(
      tester
          .widget<AnimatedFractionallySizedBox>(
            find.byType(AnimatedFractionallySizedBox),
          )
          .duration,
      const Duration(milliseconds: 200),
    );
    await tester.pumpWidget(build(80, still: true));
    expect(
      tester
          .widget<AnimatedFractionallySizedBox>(
            find.byType(AnimatedFractionallySizedBox),
          )
          .duration,
      Duration.zero,
    );
  });

  testWidgets('the circle shows its percentage when asked, scaled with the '
      'text', (tester) async {
    await tester.pumpWidget(
      harness(
        const Progress(
          value: 82,
          label: 'Profile completeness',
          shape: ProgressShape.circle,
          showValue: true,
        ),
        textScale: 2,
      ),
    );
    expect(find.text('82%'), findsOneWidget);
    expect(tester.getSize(find.byType(Progress)).width, 96);
    expect(tester.takeException(), isNull);
  });

  testWidgets('a bar in an open width takes the default width; text scale '
      'and density leave it alone', (tester) async {
    await tester.pumpWidget(
      harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [Progress(value: 40, label: 'Profile')],
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.getSize(find.byType(Progress)), const Size(256, 8));
  });
}
