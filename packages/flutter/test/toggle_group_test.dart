import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<Widget> _formatting = [
  ToggleButton.uncontrolled(child: Text('Bold')),
  ToggleButton.uncontrolled(child: Text('Italic')),
  ToggleButton.uncontrolled(child: Text('Underline')),
];

BoxDecoration? _surface(WidgetTester tester, String label) =>
    tester
            .widget<AnimatedContainer>(
              find.ancestor(
                of: find.text(label),
                matching: find.byType(AnimatedContainer),
              ),
            )
            .decoration
        as BoxDecoration?;

void main() {
  testWidgets('separate: each toggle keeps its border; each is its own tab '
      'stop and keeps its own value', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const ToggleGroup(semanticLabel: 'Formatting', children: _formatting),
      ),
    );
    expect(_surface(tester, 'Bold')!.border, isNotNull);
    expect(find.bySemanticsLabel('Formatting'), findsOneWidget);
    for (final label in ['Bold', 'Italic', 'Underline']) {
      final node = Focus.of(tester.element(find.text(label)));
      expect(node.canRequestFocus && !node.skipTraversal, isTrue);
    }
    await focusOn(tester, find.text('Italic'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(
      tester.getSemantics(find.text('Italic')),
      semanticsWith(isChecked: true),
    );
    expect(
      tester.getSemantics(find.text('Bold')),
      semanticsWith(hasCheckedState: true, isChecked: false),
    );
    semantics.dispose();
  });

  testWidgets('segmented: the toggles drop their border and corners, the '
      'group draws one border and a line between each two', (tester) async {
    await tester.pumpWidget(
      harness(
        const ToggleGroup(
          variant: ToggleGroupVariant.segmented,
          children: _formatting,
        ),
      ),
    );
    expect(_surface(tester, 'Bold')!.border, isNull);
    expect(_surface(tester, 'Bold')!.borderRadius, BorderRadius.zero);
    expect(find.byType(ClipRRect), findsOneWidget);
    final bold = tester.getRect(find.text('Bold'));
    final italic = tester.getRect(find.text('Italic'));
    expect(italic.left, greaterThan(bold.right));
    expect(bold.top, moreOrLessEquals(italic.top));
  });

  testWidgets('vertical stacks; right to left mirrors the row', (tester) async {
    await tester.pumpWidget(
      harness(
        const ToggleGroup(orientation: Axis.vertical, children: _formatting),
      ),
    );
    expect(
      tester.getTopLeft(find.text('Italic')).dy,
      greaterThan(tester.getTopLeft(find.text('Bold')).dy),
    );
    await tester.pumpWidget(
      harness(
        const ToggleGroup(children: _formatting),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getCenter(find.text('Italic')).dx,
      lessThan(tester.getCenter(find.text('Bold')).dx),
    );
  });

  testWidgets('wrap: a narrow row of chips wraps at text scale 2.0 without '
      'overflow, and keeps 44 targets under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 220,
          child: ToggleGroup(wrap: true, children: _formatting),
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('Underline')).dy,
      greaterThan(tester.getTopLeft(find.text('Bold')).dy),
    );
    await expectLater(tester, meetsGuideline(targetGuideline44));
  });

  testWidgets('inside a toolbar, the arrows move between the toggles', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const Toolbar(
          semanticLabel: 'Editor',
          children: [ToggleGroup(children: _formatting)],
        ),
      ),
    );
    await focusOn(tester, find.text('Bold'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Italic')), isTrue);
  });
}
