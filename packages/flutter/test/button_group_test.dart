import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

List<Widget> _buttons(List<String> pressed) => [
  for (final label in ['Undo', 'Redo', 'History'])
    Button(onPressed: () => pressed.add(label), child: Text(label)),
];

BorderRadiusGeometry? _corners(WidgetTester tester, String label) =>
    (tester
                .widget<AnimatedContainer>(
                  find.ancestor(
                    of: find.text(label),
                    matching: find.byType(AnimatedContainer),
                  ),
                )
                .decoration!
            as BoxDecoration)
        .borderRadius;

void main() {
  testWidgets('a named group; each button stays its own action and tab stop', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final pressed = <String>[];
    await tester.pumpWidget(
      harness(
        ButtonGroup(semanticLabel: 'Edit history', children: _buttons(pressed)),
      ),
    );
    expect(find.bySemanticsLabel('Edit history'), findsOneWidget);
    await tester.tap(find.text('Redo'));
    await tester.pump();
    expect(pressed, ['Redo']);
    for (final label in ['Undo', 'Redo']) {
      final node = Focus.of(tester.element(find.text(label)));
      expect(node.canRequestFocus && !node.skipTraversal, isTrue);
      expect(
        tester.getSemantics(find.text(label)),
        semanticsWith(label: label, isButton: true),
      );
    }
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    semantics.dispose();
  });

  testWidgets('attached: square inner corners, rounded ends, borders '
      'overlapping into one line', (tester) async {
    await tester.pumpWidget(
      harness(
        ButtonGroup(semanticLabel: 'Edit history', children: _buttons([])),
      ),
    );
    const r = Radius.circular(8);
    expect(
      _corners(tester, 'Undo'),
      const BorderRadiusDirectional.only(topStart: r, bottomStart: r),
    );
    expect(_corners(tester, 'Redo'), BorderRadiusDirectional.zero);
    expect(
      _corners(tester, 'History'),
      const BorderRadiusDirectional.only(topEnd: r, bottomEnd: r),
    );
    Rect surface(String label) => tester.getRect(
      find.ancestor(
        of: find.text(label),
        matching: find.byType(AnimatedContainer),
      ),
    );
    expect(surface('Redo').left, moreOrLessEquals(surface('Undo').right - 1));
  });

  testWidgets('right to left: the first button sits at the right with the '
      'rounded start corners', (tester) async {
    await tester.pumpWidget(
      harness(
        ButtonGroup(semanticLabel: 'Edit history', children: _buttons([])),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getCenter(find.text('Undo')).dx,
      greaterThan(tester.getCenter(find.text('Redo')).dx),
    );
  });

  testWidgets('spaced: buttons keep their own corners, 8 apart; vertical '
      'stacks', (tester) async {
    await tester.pumpWidget(
      harness(
        ButtonGroup(
          semanticLabel: 'Edit history',
          attached: false,
          orientation: Axis.vertical,
          children: _buttons([]),
        ),
      ),
    );
    expect(_corners(tester, 'Redo'), BorderRadius.circular(8));
    expect(
      tester.getTopLeft(find.text('Redo')).dy,
      greaterThan(tester.getTopLeft(find.text('Undo')).dy),
    );
  });

  testWidgets('a narrow group at text scale 2.0 wraps its labels instead of '
      'overflowing; 44 targets under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 220,
          child: ButtonGroup(
            semanticLabel: 'Edit history',
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: _buttons([]),
          ),
        ),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));
  });
}
