import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<AccordionItem<String>> _items = [
  AccordionItem(
    value: 'shipping',
    label: 'Shipping',
    child: Text('Ships in 2-3 days.'),
  ),
  AccordionItem(
    value: 'gift',
    label: 'Gift wrap',
    disabled: true,
    child: Text('Not offered.'),
  ),
  AccordionItem(
    value: 'returns',
    label: 'Returns',
    child: Text('30-day returns.'),
  ),
  AccordionItem(
    value: 'warranty',
    label: 'Warranty',
    child: Text('Two years.'),
  ),
];

Widget _accordion({
  Set<String> initialValue = const {},
  bool multiple = false,
  bool collapsible = true,
  bool enabled = true,
  ValueChanged<Set<String>>? onChanged,
}) => Accordion<String>.uncontrolled(
  items: _items,
  initialValue: initialValue,
  multiple: multiple,
  collapsible: collapsible,
  enabled: enabled,
  onChanged: onChanged,
);

void main() {
  testWidgets('single: opening one closes the other; reported once per '
      'toggle', (tester) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(harness(_accordion(onChanged: reports.add)));
    await tester.tap(find.text('Shipping'));
    await tester.pump();
    expect(find.text('Ships in 2-3 days.'), findsOneWidget);
    await tester.tap(find.text('Returns'));
    await tester.pump();
    expect(find.text('Ships in 2-3 days.'), findsNothing);
    expect(find.text('30-day returns.'), findsOneWidget);
    await tester.tap(find.text('Returns'));
    await tester.pump();
    expect(find.text('30-day returns.'), findsNothing);
    expect(reports, [
      {'shipping'},
      {'returns'},
      <String>{},
    ]);
  });

  testWidgets('single, not collapsible: the open section stays open, with no '
      'report', (tester) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(
      harness(
        _accordion(
          initialValue: {'shipping'},
          collapsible: false,
          onChanged: reports.add,
        ),
      ),
    );
    await tester.tap(find.text('Shipping'));
    await tester.pump();
    expect(find.text('Ships in 2-3 days.'), findsOneWidget);
    expect(reports, isEmpty);
  });

  testWidgets('multiple: sections open on their own', (tester) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(
      harness(_accordion(multiple: true, onChanged: reports.add)),
    );
    await tester.tap(find.text('Shipping'));
    await tester.pump();
    await tester.tap(find.text('Returns'));
    await tester.pump();
    expect(find.text('Ships in 2-3 days.'), findsOneWidget);
    expect(find.text('30-day returns.'), findsOneWidget);
    expect(reports.last, {'shipping', 'returns'});
  });

  testWidgets('arrows move focus between enabled headers, wrapping; Home and '
      'End jump; Enter and Space toggle; left and right do nothing', (
    tester,
  ) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(harness(_accordion(onChanged: reports.add)));
    await focusOn(tester, find.text('Shipping'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Returns')), isTrue, reason: 'skips');
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Shipping')), isTrue, reason: 'wraps');
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Warranty')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Shipping')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Warranty')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Warranty')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, [
      {'warranty'},
      <String>{},
    ]);
    expect(reports.length, 2, reason: 'arrows never toggle');
  });

  testWidgets('every header is in the Tab order; a disabled one is not', (
    tester,
  ) async {
    final before = FocusNode();
    addTearDown(before.dispose);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Button(
                onPressed: () {},
                focusNode: before,
                child: const Text('Before'),
              ),
              _accordion(),
            ],
          ),
        ),
      ),
    );
    before.requestFocus();
    await pumpFocus(tester);
    final order = <String>[];
    for (var i = 0; i < 3; i++) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      order.add(
        [
          'Shipping',
          'Gift wrap',
          'Returns',
          'Warranty',
        ].firstWhere((label) => focusedOn(tester, find.text(label))),
      );
    }
    expect(order, ['Shipping', 'Returns', 'Warranty']);
  });

  testWidgets('semantics: headers are buttons and level 3 headings that '
      'report expanded; a disabled one reports disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(_accordion(initialValue: {'shipping'})));
    expect(
      tester.getSemantics(find.text('Shipping')),
      semanticsWith(
        label: 'Shipping',
        isButton: true,
        isHeader: true,
        hasExpandedState: true,
        isExpanded: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester
          .getSemantics(find.text('Shipping'))
          .getSemanticsData()
          .headingLevel,
      3,
    );
    expect(
      tester.getSemantics(find.text('Returns')),
      semanticsWith(hasExpandedState: true, isExpanded: false),
    );
    expect(
      tester.getSemantics(find.text('Gift wrap')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a disabled accordion takes no taps', (tester) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(
      harness(_accordion(enabled: false, onChanged: reports.add)),
    );
    await tester.tap(find.text('Shipping'));
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      Focus.of(tester.element(find.text('Shipping'))).canRequestFocus,
      isFalse,
    );
  });

  testWidgets('a changed value is shown without a report', (tester) async {
    final reports = <Set<String>>[];
    Widget build(Set<String> value) => harness(
      Accordion<String>(items: _items, value: value, onChanged: reports.add),
    );
    await tester.pumpWidget(build({'returns'}));
    expect(find.text('30-day returns.'), findsOneWidget);
    await tester.pumpWidget(build({'warranty'}));
    expect(find.text('30-day returns.'), findsNothing);
    expect(find.text('Two years.'), findsOneWidget);
    expect(reports, isEmpty);
  });

  testWidgets('right to left: the chevron sits at the inline-end and turns '
      'toward the content; text scale 2.0 in a narrow column', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(width: 220, child: _accordion(initialValue: {'returns'})),
        direction: TextDirection.rtl,
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    final label = tester.getRect(find.text('Returns'));
    final chevrons = find.byType(AnimatedRotation);
    final chevron = tester.getRect(chevrons.at(2));
    expect(chevron.right, lessThanOrEqualTo(label.left));
    expect(tester.widget<AnimatedRotation>(chevrons.at(2)).turns, -0.25);
  });

  testWidgets('headers keep 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        _accordion(),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
