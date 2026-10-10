import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

void main() {
  testWidgets('a tap on the label focuses the control', (tester) async {
    final control = FocusNode();
    addTearDown(control.dispose);
    await tester.pumpWidget(
      harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Label('Project', focusNode: control),
            Focus(
              focusNode: control,
              child: const SizedBox.square(dimension: 24),
            ),
          ],
        ),
      ),
    );
    await tester.tap(find.text('Project'));
    await pumpFocus(tester);
    expect(control.hasPrimaryFocus, isTrue);
  });

  testWidgets('a disabled label dims and focuses nothing', (tester) async {
    final control = FocusNode();
    addTearDown(control.dispose);
    await tester.pumpWidget(
      harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Label('Project', focusNode: control, enabled: false),
            Focus(
              focusNode: control,
              child: const SizedBox.square(dimension: 24),
            ),
          ],
        ),
      ),
    );
    await tester.tap(find.text('Project'));
    await pumpFocus(tester);
    expect(control.hasFocus, isFalse);
    final text = tester.widget<RichText>(find.byType(RichText));
    expect(
      text.text.style!.color,
      InvisibleThemeData.light().colors.textDisabled,
    );
  });

  testWidgets('the required asterisk shows in the danger colour and is not '
      'read', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(const Label('Hours', required: true)));
    final span = tester.widget<RichText>(find.byType(RichText)).text;
    expect(span.toPlainText(), 'Hours *');
    expect(find.bySemanticsLabel('Hours'), findsOneWidget);
    expect(find.bySemanticsLabel(RegExp(r'\*')), findsNothing);
    TextSpan? marker;
    span.visitChildren((child) {
      if (child is TextSpan && child.text == ' *') marker = child;
      return true;
    });
    expect(
      marker!.style!.color,
      InvisibleThemeData.light().colors.dangerBodyText,
    );
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a long label wraps at text scale 2.0 in a narrow parent, '
      'right to left', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 120,
          child: Label('Billable hours this week', required: true),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(Label)).height, greaterThan(40));
  });
}
