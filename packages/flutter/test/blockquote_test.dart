import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

void main() {
  testWidgets('the quote in italics, the attribution after a decorative em '
      'dash, read apart from the quote', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Blockquote(
          cite: Text('Grace Hopper'),
          child: Text(
            'The most dangerous phrase is: we have always done it '
            'this way.',
          ),
        ),
      ),
    );
    final quote = DefaultTextStyle.of(
      tester.element(find.textContaining('dangerous')),
    ).style;
    expect(quote.fontStyle, FontStyle.italic);
    expect(quote.color, InvisibleThemeData.light().colors.textSecondary);
    expect(find.text('— '), findsOneWidget);
    expect(find.bySemanticsLabel('Grace Hopper'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp('—')), findsNothing);
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('without a cite there is no attribution line', (tester) async {
    await tester.pumpWidget(harness(const Blockquote(child: Text('Quote'))));
    expect(find.text('— '), findsNothing);
  });

  testWidgets('the accent bar sits at the inline-start, right to left at '
      'text scale 2.0 in a narrow parent', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: Blockquote(
            cite: Text('Ada'),
            child: Text('A short quotation.'),
          ),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    final box = tester.widget<DecoratedBox>(
      find
          .descendant(
            of: find.byType(Blockquote),
            matching: find.byType(DecoratedBox),
          )
          .first,
    );
    final border = (box.decoration as BoxDecoration).border!;
    expect(border, isA<BorderDirectional>());
    expect((border as BorderDirectional).start.width, 3);
    final quote = tester.getRect(find.textContaining('quotation'));
    final block = tester.getRect(find.byType(Blockquote));
    expect(block.right - quote.right, greaterThanOrEqualTo(16));
  });
}
