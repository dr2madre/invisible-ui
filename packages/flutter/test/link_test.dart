import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

TextStyle _style(WidgetTester tester, String text) =>
    DefaultTextStyle.of(tester.element(find.text(text))).style;

void main() {
  testWidgets('a tap and Enter open the link through the callback; Space '
      'does not', (tester) async {
    var opened = 0;
    await tester.pumpWidget(
      harness(Link(onPressed: () => opened++, child: const Text('Docs'))),
    );
    await tester.tap(find.text('Docs'));
    await tester.pump();
    expect(opened, 1);
    await focusOn(tester, find.text('Docs'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(opened, 2);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(opened, 2);
  });

  testWidgets('semantics: a link with its address; the label replaces the '
      'text when given', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Link(
              onPressed: () {},
              uri: Uri.parse('https://example.com/docs'),
              child: const Text('Docs'),
            ),
            Link(
              onPressed: () {},
              semanticLabel: 'Pricing page',
              child: const Text('Pricing'),
            ),
          ],
        ),
      ),
    );
    final docs = tester.getSemantics(find.text('Docs'));
    expect(docs.label, 'Docs');
    expect(
      docs.getSemanticsData().linkUrl,
      Uri.parse('https://example.com/docs'),
    );
    // The flag API Flutter 3.32 has; later releases add flagsCollection.
    // ignore: deprecated_member_use
    expect(docs.getSemanticsData().hasFlag(SemanticsFlag.isLink), isTrue);
    expect(tester.getSemantics(find.text('Pricing')).label, 'Pricing page');
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('underlined in both variants; the subtle one keeps the text '
      'colour; hover deepens the colour', (tester) async {
    final colors = InvisibleThemeData.light().colors;
    await tester.pumpWidget(
      harness(
        DefaultTextStyle(
          style: const TextStyle(color: Color(0xFF123456), fontSize: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Link(onPressed: () {}, child: const Text('Primary')),
              Link(
                onPressed: () {},
                variant: LinkVariant.subtle,
                child: const Text('Subtle'),
              ),
            ],
          ),
        ),
      ),
    );
    final primary = _style(tester, 'Primary');
    expect(primary.decoration, TextDecoration.underline);
    expect(primary.color, colors.secondaryBodyText);
    expect(primary.fontSize, 20, reason: 'the surrounding size');
    final subtle = _style(tester, 'Subtle');
    expect(subtle.decoration, TextDecoration.underline);
    expect(subtle.color, const Color(0xFF123456));
    expect(subtle.decorationColor, colors.border);

    final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
    addTearDown(mouse.removePointer);
    await mouse.addPointer(location: Offset.zero);
    await mouse.moveTo(tester.getCenter(find.text('Primary')));
    await tester.pump();
    expect(_style(tester, 'Primary').color, colors.secondaryHover);
  });

  testWidgets('external adds a trailing arrow, at the inline-end right to '
      'left', (tester) async {
    await tester.pumpWidget(
      harness(
        Link(onPressed: () {}, external: true, child: const Text('Website')),
        direction: TextDirection.rtl,
      ),
    );
    expect(find.byType(Glyph), findsOneWidget);
    expect(
      tester.getCenter(find.byType(Glyph)).dx,
      lessThan(tester.getCenter(find.text('Website')).dx),
    );
  });

  testWidgets('a long link wraps at text scale 2.0 in a narrow column and '
      'keeps 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 160,
          child: Link(
            onPressed: () {},
            external: true,
            child: const Text('Read the full accessibility statement'),
          ),
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
