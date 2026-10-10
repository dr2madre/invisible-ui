import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

List<Size> _bars(WidgetTester tester) => [
  for (final element
      in find
          .descendant(
            of: find.byType(Skeleton),
            matching: find.byType(SizedBox),
          )
          .evaluate())
    if ((element.widget as SizedBox).height?.isFinite ?? false)
      tester.getSize(find.byWidget(element.widget)),
];

void main() {
  testWidgets('hidden from assistive technology; with a label, a live region '
      'named by it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(const Skeleton(lines: 3)));
    expect(find.bySemanticsLabel(RegExp('.')), findsNothing);
    await tester.pumpWidget(
      harness(const Skeleton(semanticLabel: 'Loading the report')),
    );
    expect(
      tester.getSemantics(find.byType(Skeleton)),
      semanticsWith(label: 'Loading the report', isLiveRegion: true),
    );
    semantics.dispose();
  });

  testWidgets('text lines take the width, the last one shorter, each 0.8 of '
      'the text size high', (tester) async {
    await tester.pumpWidget(
      harness(const SizedBox(width: 200, child: Skeleton(lines: 3))),
    );
    expect(_bars(tester), const [
      Size(200, 12.8),
      Size(200, 12.8),
      Size(120, 12.8),
    ]);
    // An open width, as in a row, gives 256.
    await tester.pumpWidget(
      harness(
        const Row(mainAxisSize: MainAxisSize.min, children: [Skeleton()]),
      ),
    );
    expect(_bars(tester), const [Size(256, 12.8)]);
  });

  testWidgets('a circle is 40 across, or its width; a rectangle takes its '
      'height', (tester) async {
    await tester.pumpWidget(
      harness(const Skeleton(variant: SkeletonVariant.circle)),
    );
    expect(_bars(tester), const [Size(40, 40)]);
    await tester.pumpWidget(
      harness(const Skeleton(variant: SkeletonVariant.circle, width: 64)),
    );
    expect(_bars(tester), const [Size(64, 64)]);
    await tester.pumpWidget(
      harness(
        const Skeleton(variant: SkeletonVariant.rect, width: 180, height: 90),
      ),
    );
    expect(_bars(tester), const [Size(180, 90)]);
  });

  testWidgets('the pulse moves; reduced motion and none hold it still', (
    tester,
  ) async {
    Color color() =>
        (tester
                    .widget<DecoratedBox>(
                      find
                          .descendant(
                            of: find.byType(Skeleton),
                            matching: find.byType(DecoratedBox),
                          )
                          .first,
                    )
                    .decoration
                as BoxDecoration)
            .color!;
    await tester.pumpWidget(harness(const Skeleton()));
    final start = color();
    await tester.pump(const Duration(milliseconds: 750));
    expect(color(), isNot(start));
    expect(tester.hasRunningAnimations, isTrue);

    await tester.pumpWidget(harness(const Skeleton(), disableAnimations: true));
    await tester.pump();
    expect(tester.hasRunningAnimations, isFalse);
    expect(color(), InvisiblePalette.grey200);

    await tester.pumpWidget(
      harness(const Skeleton(animation: SkeletonAnimation.none)),
    );
    await tester.pump();
    expect(tester.hasRunningAnimations, isFalse);
  });

  testWidgets('the wave sweeps a band; lines follow text scale 2.0 in a '
      'narrow parent, right to left', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 120,
          child: Skeleton(lines: 2, animation: SkeletonAnimation.wave),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));
    expect(tester.takeException(), isNull);
    expect(_bars(tester), const [Size(120, 25.6), Size(72, 25.6)]);
    final band = find.descendant(
      of: find.byType(Skeleton),
      matching: find.byWidgetPredicate(
        (w) =>
            w is DecoratedBox &&
            (w.decoration as BoxDecoration).gradient != null,
      ),
    );
    expect(band, findsNWidgets(2));
    // The shorter last line starts at the inline-start, the right.
    final lines = find.byWidgetPredicate(
      (w) => w is SizedBox && w.height == 25.6,
    );
    expect(
      tester.getTopRight(lines.last).dx,
      tester.getTopRight(lines.first).dx,
    );
    // Stop the loop before the test ends.
    await tester.pumpWidget(harness(const SizedBox()));
  });
}
