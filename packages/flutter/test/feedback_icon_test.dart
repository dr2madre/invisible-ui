import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

BoxDecoration _box(WidgetTester tester) =>
    tester.widget<Container>(find.byType(Container)).decoration!
        as BoxDecoration;

void main() {
  testWidgets('each status has its own glyph and colour', (tester) async {
    final c = InvisibleThemeData.light().colors;
    for (final (status, glyph, color) in [
      (NotificationStatus.info, GlyphShape.info, c.info),
      (NotificationStatus.success, GlyphShape.success, c.success),
      (NotificationStatus.warning, GlyphShape.warning, c.warning),
      (NotificationStatus.danger, GlyphShape.danger, c.danger),
      (NotificationStatus.neutral, GlyphShape.neutral, c.neutral),
    ]) {
      await tester.pumpWidget(harness(FeedbackIcon(status: status)));
      expect(tester.widget<Glyph>(find.byType(Glyph)).shape, glyph);
      expect(_box(tester).color, color.withValues(alpha: 0.15));
      expect(
        IconTheme.of(tester.element(find.byType(Glyph))).color,
        color,
        reason: '$status',
      );
    }
  });

  testWidgets('a transparent box drops the chip; a solid one fills it and '
      'turns the glyph to the colour on it; round is a circle', (tester) async {
    final c = InvisibleThemeData.light().colors;
    await tester.pumpWidget(
      harness(const FeedbackIcon(box: FeedbackIconBox.transparent)),
    );
    expect(_box(tester).color, isNull);
    expect(tester.getSize(find.byType(FeedbackIcon)), const Size(32, 32));
    await tester.pumpWidget(
      harness(
        const FeedbackIcon(
          status: NotificationStatus.danger,
          box: FeedbackIconBox.solid,
          shape: FeedbackIconShape.round,
        ),
      ),
    );
    expect(_box(tester).color, c.danger);
    expect(_box(tester).borderRadius, BorderRadius.circular(16));
    expect(IconTheme.of(tester.element(find.byType(Glyph))).color, c.onStatus);
  });

  testWidgets('decorative unless named; a custom glyph replaces the status '
      'one; the box grows with text scale 2.0', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(const FeedbackIcon()));
    expect(find.bySemanticsLabel(RegExp('.')), findsNothing);
    await tester.pumpWidget(
      harness(
        const FeedbackIcon(
          status: NotificationStatus.success,
          semanticLabel: 'Saved',
          icon: SizedBox.square(dimension: 20, key: Key('custom')),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(find.byType(Glyph), findsNothing);
    expect(find.byKey(const Key('custom')), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(FeedbackIcon)),
      semanticsWith(label: 'Saved'),
    );
    expect(tester.getSize(find.byType(FeedbackIcon)), const Size(64, 64));
    semantics.dispose();
  });
}
