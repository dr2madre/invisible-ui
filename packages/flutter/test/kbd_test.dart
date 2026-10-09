import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

void main() {
  testWidgets('one key, or a chord joined by the separator; assistive '
      'technology reads the keys alone', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Kbd('Esc'),
            Kbd.chord(['⌘', 'K']),
            Kbd.chord(['Ctrl', 'Shift', 'P'], separator: '·'),
          ],
        ),
      ),
    );
    expect(find.text('Esc'), findsOneWidget);
    expect(find.text('+'), findsOneWidget);
    expect(find.text('·'), findsNWidgets(2));
    expect(find.bySemanticsLabel('Esc'), findsOneWidget);
    expect(find.bySemanticsLabel('⌘ K'), findsOneWidget);
    expect(find.bySemanticsLabel('Ctrl Shift P'), findsOneWidget);
    expect(find.bySemanticsLabel('+'), findsNothing);
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a monospaced keycap at 0.8125 of the surrounding size, at '
      'least 24 wide', (tester) async {
    await tester.pumpWidget(
      harness(
        const DefaultTextStyle(style: TextStyle(fontSize: 20), child: Kbd('K')),
        theme: InvisibleThemeData.light(monoFontFamily: 'Code Mono'),
      ),
    );
    final style = tester.widget<Text>(find.text('K')).style!;
    expect(style.fontFamily, 'Code Mono');
    expect(style.fontFamilyFallback, contains('monospace'));
    expect(style.fontSize, 20 * 0.8125);
    expect(
      tester.widget<Container>(find.byType(Container)).constraints!.minWidth,
      24,
    );
    expect(tester.getSize(find.byType(Container)).width, greaterThan(24));
  });

  testWidgets('a long chord wraps at text scale 2.0 in a narrow parent, '
      'right to left', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 120,
          child: Kbd.chord(['Ctrl', 'Shift', 'Alt', 'Delete']),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('Shift')).dy,
      greaterThan(tester.getTopLeft(find.text('Ctrl')).dy),
      reason: 'the chord wraps',
    );

    await tester.pumpWidget(
      harness(const Kbd.chord(['Ctrl', 'K']), direction: TextDirection.rtl),
    );
    expect(
      tester.getCenter(find.text('Ctrl')).dx,
      greaterThan(tester.getCenter(find.text('K')).dx),
      reason: 'the first key at the right',
    );
  });
}
