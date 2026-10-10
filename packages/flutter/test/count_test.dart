import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

BoxDecoration _decoration(WidgetTester tester) =>
    tester
            .widget<Container>(
              find.descendant(
                of: find.byType(Count),
                matching: find.byType(Container),
              ),
            )
            .decoration!
        as BoxDecoration;

void main() {
  testWidgets('past max it shows N+; at 0 nothing unless showZero', (
    tester,
  ) async {
    await tester.pumpWidget(harness(const Count(count: 120)));
    expect(find.text('99+'), findsOneWidget);
    await tester.pumpWidget(harness(const Count(count: 12, max: 9)));
    expect(find.text('9+'), findsOneWidget);
    await tester.pumpWidget(harness(const Count(count: 7)));
    expect(find.text('7'), findsOneWidget);
    await tester.pumpWidget(harness(const Count()));
    expect(find.text('0'), findsNothing);
    expect(tester.getSize(find.byType(Count)), Size.zero);
    await tester.pumpWidget(harness(const Count(showZero: true)));
    expect(find.text('0'), findsOneWidget);
  });

  testWidgets('semantics: a live region named by the label, or by the digits; '
      'the digits themselves are hidden', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Count(count: 3, semanticLabel: '3 unread messages')),
    );
    expect(
      tester.getSemantics(find.byType(Count)),
      semanticsWith(label: '3 unread messages', isLiveRegion: true),
    );
    expect(find.bySemanticsLabel('3'), findsNothing);
    await tester.pumpWidget(harness(const Count(count: 120)));
    expect(
      tester.getSemantics(find.byType(Count)),
      semanticsWith(label: '99+', isLiveRegion: true),
    );
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a dot has no number: named by its label, or decorative', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Count(dot: true, semanticLabel: 'Online')),
    );
    expect(find.byType(Text), findsNothing);
    expect(
      tester.getSemantics(find.byType(Count)),
      semanticsWith(label: 'Online', isLiveRegion: true),
    );
    expect(tester.getSize(find.byType(Count)), const Size(8.8, 8.8));
    await tester.pumpWidget(harness(const Count(dot: true)));
    expect(find.bySemanticsLabel(RegExp('.')), findsNothing);
    semantics.dispose();
  });

  testWidgets('each status takes its colour and the text that reads on it', (
    tester,
  ) async {
    final colors = InvisibleThemeData.light().colors;
    for (final (status, background, foreground) in [
      (NotificationStatus.danger, colors.danger, colors.onStatus),
      (NotificationStatus.neutral, colors.neutral, colors.onStatus),
      (NotificationStatus.info, colors.info, colors.onStatus),
      (NotificationStatus.success, colors.success, colors.onStatus),
      (NotificationStatus.warning, colors.warning, colors.onWarning),
    ]) {
      await tester.pumpWidget(harness(Count(count: 5, status: status)));
      expect(_decoration(tester).color, background, reason: '$status');
      expect(
        tester.widget<Text>(find.text('5')).style!.color,
        foreground,
        reason: '$status',
      );
    }
  });

  testWidgets('grows with the text at scale 2.0, right to left', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const Count(count: 120),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    final size = tester.getSize(find.byType(Count));
    expect(size.height, greaterThanOrEqualTo(40));
    expect(size.width, greaterThan(size.height));
  });
}
