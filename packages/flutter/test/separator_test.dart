import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

void main() {
  testWidgets('horizontal: a 1 pixel line as wide as its parent, in the '
      'border colour, with no semantics', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const SizedBox(width: 200, child: Separator())),
    );
    expect(tester.getSize(find.byType(Separator)), const Size(200, 1));
    final line = tester.widget<Container>(
      find.descendant(
        of: find.byType(Separator),
        matching: find.byType(Container),
      ),
    );
    expect(line.color, InvisibleColors.light.border);
    expect(
      tester.getSemantics(find.byType(Separator)).label,
      isEmpty,
      reason: 'no node of its own',
    );
    semantics.dispose();
  });

  testWidgets('vertical: at least a line of text tall, growing with the '
      'text scale, stretched by a stretching row', (tester) async {
    await tester.pumpWidget(
      harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [Separator(orientation: Axis.vertical)],
        ),
        textScale: 2,
      ),
    );
    expect(tester.getSize(find.byType(Separator)), const Size(1, 32));
    await tester.pumpWidget(
      harness(
        const SizedBox(
          height: 80,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [Separator(orientation: Axis.vertical)],
          ),
        ),
      ),
    );
    expect(tester.getSize(find.byType(Separator)).height, 80);
  });
}
