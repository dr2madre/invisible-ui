import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/code_block/code_block.dart'
    show copiedDuration;
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

const String _sample = 'final a = 1;\n  <b>not markup</b> & \$x';

/// Records what the clipboard receives; [refuse] makes it fail.
List<String> _clipboard(WidgetTester tester, {bool refuse = false}) {
  final copied = <String>[];
  tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
    SystemChannels.platform,
    (call) async {
      if (call.method == 'Clipboard.setData') {
        if (refuse) throw PlatformException(code: 'denied');
        copied.add(
          (call.arguments as Map<Object?, Object?>)['text']! as String,
        );
      }
      return null;
    },
  );
  addTearDown(
    () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    ),
  );
  return copied;
}

void main() {
  group('Code', () {
    testWidgets('monospaced text at 0.875 of the surrounding size, on the '
        'neutral surface; it wraps in a narrow parent', (tester) async {
      final semantics = tester.ensureSemantics();
      final colors = InvisibleThemeData.light().colors;
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 120,
            child: DefaultTextStyle(
              style: TextStyle(fontSize: 16),
              child: Code('pnpm --filter @design-system/docs dev'),
            ),
          ),
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      final text = tester.widget<Text>(find.byType(Text));
      expect(text.style!.fontSize, 14);
      expect(text.style!.fontFamilyFallback, contains('monospace'));
      final box = tester.widget<Container>(find.byType(Container));
      expect((box.decoration! as BoxDecoration).color, colors.neutralSurface);
      expect(
        find.bySemanticsLabel('pnpm --filter @design-system/docs dev'),
        findsOneWidget,
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });

  group('CodeBlock', () {
    testWidgets('the code shows as written text, white space kept, in a '
        'group named with the caption', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const CodeBlock(code: _sample, language: 'Dart')),
      );
      expect(find.text(_sample), findsOneWidget);
      expect(find.text('dart'), findsOneWidget);
      expect(find.bySemanticsLabel('Code: Dart'), findsOneWidget);
      expect(find.bySemanticsLabel('Code sample, Dart'), findsOneWidget);
      expect(find.bySemanticsLabel('Copy code'), findsOneWidget);
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline24));

      await tester.pumpWidget(
        harness(const CodeBlock(code: 'x', copyable: false)),
      );
      expect(find.bySemanticsLabel('Code'), findsOneWidget);
      expect(find.bySemanticsLabel('Code sample'), findsOneWidget);
      expect(find.bySemanticsLabel('Copy code'), findsNothing);
      semantics.dispose();
    });

    testWidgets('copy writes the code, shows Copied for two seconds and '
        'announces it politely; Enter copies too', (tester) async {
      final copied = _clipboard(tester);
      final announced = recordAnnouncements(tester);
      await tester.pumpWidget(harness(const CodeBlock(code: _sample)));
      await tester.tap(find.text('Copy'));
      await tester.pump();
      expect(copied, [_sample]);
      expect(find.text('Copied'), findsOneWidget);
      expect(announced, [(message: 'Copied to clipboard', assertive: false)]);
      await tester.pump(copiedDuration);
      expect(find.text('Copy'), findsOneWidget);

      await focusOn(tester, find.text('Copy'));
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(copied, hasLength(2));
      await tester.pump(copiedDuration);
    });

    testWidgets('a refused copy shows and announces nothing', (tester) async {
      _clipboard(tester, refuse: true);
      final announced = recordAnnouncements(tester);
      await tester.pumpWidget(harness(const CodeBlock(code: _sample)));
      await tester.tap(find.text('Copy'));
      await tester.pump();
      expect(find.text('Copied'), findsNothing);
      expect(announced, isEmpty);
    });

    testWidgets('a copy that ends after the block is gone starts no timer', (
      tester,
    ) async {
      _clipboard(tester);
      await tester.pumpWidget(harness(const CodeBlock(code: _sample)));
      await tester.tap(find.text('Copy'));
      await tester.pumpWidget(harness(const SizedBox()));
      await tester.pump(copiedDuration);
      expect(tester.takeException(), isNull);
    });

    testWidgets('the scroller takes focus with the ring inside and scrolls '
        'a wide sample with the arrows', (tester) async {
      useKeyboardHighlight();
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 240,
            child: CodeBlock(code: 'const wide = "${'x' * 200}";'),
          ),
          disableAnimations: true,
        ),
      );
      final scroller = find.byType(SingleChildScrollView);
      await focusOn(tester, scroller);
      final ring = tester.widget<FocusRingPainter>(
        find
            .ancestor(of: scroller, matching: find.byType(FocusRingPainter))
            .first,
      );
      expect(ring.visible, isTrue);
      expect(ring.inside, isTrue);
      final position = Scrollable.of(
        tester.element(find.textContaining('const wide')),
      ).position;
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();
      expect(position.pixels, 40);
    });

    testWidgets('highlighted text replaces the code and the copy still uses '
        'the code; text scale 2.0 right to left', (tester) async {
      final copied = _clipboard(tester);
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 280,
            child: CodeBlock(
              code: 'print(1)',
              language: 'Python',
              child: Text.rich(TextSpan(text: 'print(1)  # highlighted')),
            ),
          ),
          textScale: 2,
          direction: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.text('print(1)  # highlighted'), findsOneWidget);
      await tester.tap(find.text('Copy'));
      await tester.pump();
      expect(copied, ['print(1)']);
      await tester.pump(copiedDuration);
    });
  });
}
