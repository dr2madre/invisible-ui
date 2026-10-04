import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Color _fill(WidgetTester tester, Finder meter) {
  final box = tester.widget<DecoratedBox>(
    find.descendant(
      of: find.descendant(
        of: meter,
        matching: find.byType(AnimatedFractionallySizedBox),
      ),
      matching: find.byType(DecoratedBox),
    ),
  );
  return (box.decoration as BoxDecoration).color!;
}

void main() {
  testWidgets('semantics: named by the label, the level read as a percentage '
      'of the range', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Meter(value: 100, min: 50, max: 150, label: 'Disk usage')),
    );
    expect(
      tester.getSemantics(find.byType(Meter)),
      semanticsWith(label: 'Disk usage', value: '50%'),
    );
    semantics.dispose();
  });

  testWidgets('the fill is coloured by how good the value is: the same '
      'reading means opposite things for battery and disk', (tester) async {
    final colors = InvisibleThemeData.light().colors;
    await tester.pumpWidget(
      harness(
        const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Meter(
              key: Key('battery'),
              value: 90,
              low: 20,
              high: 80,
              label: 'Battery',
            ),
            Meter(
              key: Key('disk'),
              value: 90,
              low: 20,
              high: 80,
              optimum: 0,
              label: 'Disk',
            ),
            Meter(
              key: Key('half'),
              value: 50,
              low: 20,
              high: 80,
              label: 'Half',
            ),
          ],
        ),
      ),
    );
    expect(_fill(tester, find.byKey(const Key('battery'))), colors.success);
    expect(_fill(tester, find.byKey(const Key('disk'))), colors.danger);
    expect(_fill(tester, find.byKey(const Key('half'))), colors.warning);
  });

  testWidgets('the fill starts at the inline-start right to left and moves '
      'at once under reduced motion', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 200, child: Meter(value: 30, label: 'Battery')),
        direction: TextDirection.rtl,
        disableAnimations: true,
      ),
    );
    final track = tester.getRect(find.byType(Meter));
    final fill = tester.getRect(
      find.descendant(
        of: find.byType(AnimatedFractionallySizedBox),
        matching: find.byType(DecoratedBox),
      ),
    );
    expect(fill.right, track.right);
    expect(fill.width, closeTo(60, 0.01));
    expect(
      tester
          .widget<AnimatedFractionallySizedBox>(
            find.byType(AnimatedFractionallySizedBox),
          )
          .duration,
      Duration.zero,
    );
  });

  testWidgets('a narrow parent narrows the track at text scale 2.0', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 120, child: Meter(value: 30, label: 'Battery')),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(Meter)).width, 120);
  });
}
