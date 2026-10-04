import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

final Finder _header = find.text('Details');

void main() {
  testWidgets('a tap toggles, reports each toggle once, and hides the content '
      'when collapsed', (tester) async {
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(
        Collapsible.uncontrolled(
          label: 'Details',
          onExpansionChanged: reports.add,
          child: const Text('Hidden details'),
        ),
      ),
    );
    expect(find.text('Hidden details'), findsNothing);
    await tester.tap(_header);
    await tester.pump();
    expect(find.text('Hidden details'), findsOneWidget);
    await tester.tap(_header);
    await tester.pump();
    expect(find.text('Hidden details'), findsNothing);
    expect(reports, [true, false]);
  });

  for (final (name, key) in [
    ('Enter', LogicalKeyboardKey.enter),
    ('Space', LogicalKeyboardKey.space),
  ]) {
    testWidgets('$name toggles the focused header', (tester) async {
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Collapsible.uncontrolled(
            label: 'Details',
            onExpansionChanged: reports.add,
            child: const Text('Hidden details'),
          ),
        ),
      );
      await focusOn(tester, _header);
      await tester.sendKeyEvent(key);
      await tester.pump();
      expect(reports, [true]);
      expect(find.text('Hidden details'), findsOneWidget);
    });
  }

  testWidgets('semantics: a button that reports expanded and collapsed; the '
      'label defaults to the catalog', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Collapsible.uncontrolled(child: Text('Hidden details'))),
    );
    final header = find.text('Toggle');
    expect(
      tester.getSemantics(header),
      semanticsWith(
        label: 'Toggle',
        isButton: true,
        hasExpandedState: true,
        isExpanded: false,
        hasTapAction: true,
        isFocusable: true,
      ),
    );
    await tester.tap(header);
    await tester.pump();
    expect(
      tester.getSemantics(header),
      semanticsWith(hasExpandedState: true, isExpanded: true),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('hidden content keeps its state and leaves the focus order', (
    tester,
  ) async {
    final inside = FocusNode();
    addTearDown(inside.dispose);
    await tester.pumpWidget(
      harness(
        Collapsible.uncontrolled(
          label: 'Details',
          initiallyExpanded: true,
          child: Focus(focusNode: inside, child: const Text('Inside')),
        ),
      ),
    );
    final focus = find.byWidgetPredicate(
      (widget) => widget is Focus && widget.focusNode == inside,
      skipOffstage: false,
    );
    final state = tester.state(focus);
    await tester.tap(_header);
    await tester.pump();
    inside.requestFocus();
    await tester.pump();
    expect(inside.hasFocus, isFalse);
    await tester.tap(_header);
    await tester.pump();
    expect(tester.state(focus), same(state));
  });

  testWidgets('a changed value is shown without a report', (tester) async {
    final reports = <bool>[];
    Widget build(bool expanded) => harness(
      Collapsible(
        label: 'Details',
        expanded: expanded,
        onExpansionChanged: reports.add,
        child: const Text('Hidden details'),
      ),
    );
    await tester.pumpWidget(build(false));
    await tester.pumpWidget(build(true));
    expect(find.text('Hidden details'), findsOneWidget);
    await tester.pumpWidget(build(false));
    expect(find.text('Hidden details'), findsNothing);
    expect(reports, isEmpty);
  });

  testWidgets('disabled: no focus, no toggle, reported disabled', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(
        Collapsible.uncontrolled(
          label: 'Details',
          enabled: false,
          onExpansionChanged: reports.add,
          child: const Text('Hidden details'),
        ),
      ),
    );
    await tester.tap(_header);
    await tester.pump();
    expect(reports, isEmpty);
    expect(Focus.of(tester.element(_header)).canRequestFocus, isFalse);
    expect(
      tester.getSemantics(_header),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    semantics.dispose();
  });

  testWidgets('the chevron turns at once under reduced motion', (tester) async {
    await tester.pumpWidget(
      harness(
        const Collapsible.uncontrolled(
          label: 'Details',
          child: Text('Hidden details'),
        ),
        disableAnimations: true,
      ),
    );
    await tester.tap(_header);
    await tester.pump();
    final rotation = tester.widget<AnimatedRotation>(
      find.byType(AnimatedRotation),
    );
    expect(rotation.turns, 0.5);
    expect(rotation.duration, Duration.zero);
  });

  testWidgets('right to left, text scale 2.0, narrow: the chevron sits at the '
      'inline-end and the label wraps', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: Collapsible.uncontrolled(
            label: 'Delivery and returns policy details',
            child: Text('Hidden details'),
          ),
        ),
        direction: TextDirection.rtl,
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    final label = tester.getRect(
      find.text('Delivery and returns policy details'),
    );
    final chevron = tester.getRect(find.byType(AnimatedRotation));
    expect(chevron.right, lessThan(label.left));
  });

  testWidgets('the header keeps 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        const Collapsible.uncontrolled(label: 'Details', child: Text('x')),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
