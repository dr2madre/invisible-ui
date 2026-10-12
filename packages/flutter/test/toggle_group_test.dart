import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<String> _labels = ['Bold', 'Italic', 'Underline', 'Strike'];

/// [count] keyed toggles, so each keeps its state when the list changes.
List<Widget> _toggles(int count, {List<String> labels = _labels}) => [
  for (final label in labels.take(count))
    ToggleButton.uncontrolled(key: ValueKey(label), child: Text(label)),
];

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

/// A focusable box before and after the group, to count tab stops.
Widget _between(Widget group) => Row(
  mainAxisSize: MainAxisSize.min,
  children: [
    const ToggleButton.uncontrolled(child: Text('Before')),
    group,
    const ToggleButton.uncontrolled(child: Text('After')),
  ],
);

/// The labels Tab visits from Before up to After.
Future<List<String>> _tabStops(WidgetTester tester, List<String> labels) async {
  await focusOn(tester, find.text('Before'));
  final stops = <String>[];
  for (var i = 0; i < labels.length + 2; i++) {
    final scope = FocusManager.instance.primaryFocus!;
    scope.nextFocus();
    await pumpFocus(tester);
    final label = [...labels, 'After'].where((l) {
      final text = find.text(l);
      return text.evaluate().isNotEmpty && focusedOn(tester, text);
    }).firstOrNull;
    if (label == null || label == 'After') break;
    stops.add(label);
  }
  return stops;
}

void main() {
  testWidgets('separate: each toggle keeps its border; the group is a named '
      'container, not a toolbar; each toggle keeps its own value', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const ToggleGroup(semanticLabel: 'Formatting', children: _formatting),
      ),
    );
    expect(_surface(tester, 'Bold')!.border, isNotNull);
    final group = tester.getSemantics(find.bySemanticsLabel('Formatting'));
    expect(group.getSemanticsData().role, SemanticsRole.none);
    expect(group, semanticsWith(label: 'Formatting', isButton: false));
    var ancestor = tester.getSemantics(find.text('Bold')).parent;
    while (ancestor != null && ancestor.label != 'Formatting') {
      ancestor = ancestor.parent;
    }
    expect(ancestor, group);
    await focusOn(tester, find.text('Italic'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(
      tester.getSemantics(find.text('Italic')),
      semanticsWith(isButton: true, hasToggledState: true, isToggled: true),
    );
    expect(
      tester.getSemantics(find.text('Bold')),
      semanticsWith(hasToggledState: true, isToggled: true),
    );
    expect(
      tester.getSemantics(find.text('Underline')),
      semanticsWith(hasToggledState: true, isToggled: false),
    );
    semantics.dispose();
  });

  group('tab stops', () {
    testWidgets('one toggle is its own tab stop', (tester) async {
      await tester.pumpWidget(
        harness(_between(ToggleGroup(children: _toggles(1)))),
      );
      expect(await _tabStops(tester, _labels), ['Bold']);
    });

    testWidgets('two toggles are two tab stops, and the arrows do not move '
        'between them', (tester) async {
      await tester.pumpWidget(
        harness(_between(ToggleGroup(children: _toggles(2)))),
      );
      expect(await _tabStops(tester, _labels), ['Bold', 'Italic']);
      await focusOn(tester, find.text('Bold'));
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Bold')), isTrue);
    });

    testWidgets('three or more toggles are one tab stop that returns to the '
        'toggle that had focus last', (tester) async {
      await tester.pumpWidget(
        harness(_between(ToggleGroup(children: _toggles(4)))),
      );
      expect(await _tabStops(tester, _labels), ['Bold']);
      await focusOn(tester, find.text('Bold'));
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
      FocusManager.instance.primaryFocus!.nextFocus();
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('After')), isTrue);
      FocusManager.instance.primaryFocus!.previousFocus();
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
    });

    testWidgets('a disabled toggle is skipped by the arrows', (tester) async {
      await tester.pumpWidget(
        harness(
          const ToggleGroup(
            children: [
              ToggleButton.uncontrolled(child: Text('Bold')),
              ToggleButton.uncontrolled(enabled: false, child: Text('Italic')),
              ToggleButton.uncontrolled(child: Text('Underline')),
            ],
          ),
        ),
      );
      await focusOn(tester, find.text('Bold'));
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
    });
  });

  group('arrow keys', () {
    for (final direction in TextDirection.values) {
      testWidgets('horizontal, ${direction.name}: the arrows follow the '
          'reading direction and wrap; Home and End jump to the ends; '
          'moving focus flips nothing', (tester) async {
        final semantics = tester.ensureSemantics();
        await tester.pumpWidget(
          harness(ToggleGroup(children: _toggles(4)), direction: direction),
        );
        final forward = direction == TextDirection.ltr
            ? LogicalKeyboardKey.arrowRight
            : LogicalKeyboardKey.arrowLeft;
        final backward = direction == TextDirection.ltr
            ? LogicalKeyboardKey.arrowLeft
            : LogicalKeyboardKey.arrowRight;
        Future<void> press(LogicalKeyboardKey key, String expected) async {
          await tester.sendKeyEvent(key);
          await pumpFocus(tester);
          expect(
            focusedOn(tester, find.text(expected)),
            isTrue,
            reason: '$key',
          );
        }

        await focusOn(tester, find.text('Bold'));
        await press(forward, 'Italic');
        await press(backward, 'Bold');
        await press(backward, 'Strike');
        await press(forward, 'Bold');
        await press(LogicalKeyboardKey.end, 'Strike');
        await press(LogicalKeyboardKey.home, 'Bold');
        await press(LogicalKeyboardKey.arrowDown, 'Bold');
        for (final label in _labels) {
          expect(
            tester.getSemantics(find.text(label)),
            semanticsWith(hasToggledState: true, isToggled: false),
            reason: label,
          );
        }
        semantics.dispose();
      });
    }

    testWidgets('vertical: up and down move, left and right do not', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(ToggleGroup(orientation: Axis.vertical, children: _toggles(3))),
      );
      await focusOn(tester, find.text('Bold'));
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Italic')), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Italic')), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
    });
  });

  testWidgets('inside a toolbar, the toolbar\'s keys and its one tab stop '
      'apply, also with one or two toggles', (tester) async {
    Widget build(int count) => harness(
      _between(
        Toolbar(
          semanticLabel: 'Editor',
          children: [
            const ToggleButton.uncontrolled(child: Text('Undo')),
            ToggleGroup(children: _toggles(count)),
          ],
        ),
      ),
    );
    await tester.pumpWidget(build(3));
    await focusOn(tester, find.text('Undo'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Bold')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Underline')), isTrue);
    // The toolbar wraps from its last control to its first.
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Undo')), isTrue);

    await tester.pumpWidget(build(2));
    expect(await _tabStops(tester, ['Undo', ..._labels]), ['Undo']);
    await focusOn(tester, find.text('Bold'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Italic')), isTrue);
  });

  group('a change in the number of toggles keeps focus', () {
    testWidgets('from three to two and back, the focused toggle keeps it', (
      tester,
    ) async {
      Widget build(int count) =>
          harness(_between(ToggleGroup(children: _toggles(count))));
      await tester.pumpWidget(build(3));
      await focusOn(tester, find.text('Italic'));
      await tester.pumpWidget(build(2));
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Italic')), isTrue);
      await tester.pumpWidget(build(3));
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Italic')), isTrue);
      // Three again: one tab stop, held by the focused toggle.
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
    });

    testWidgets('when the focused toggle is removed, the next one takes '
        'focus, or the previous one at the end', (tester) async {
      Widget build(List<String> labels) =>
          harness(_between(ToggleGroup(children: _toggles(4, labels: labels))));
      await tester.pumpWidget(build(_labels));
      await focusOn(tester, find.text('Italic'));
      await tester.pumpWidget(build(['Bold', 'Underline', 'Strike']));
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);

      await focusOn(tester, find.text('Strike'));
      await tester.pumpWidget(build(['Bold', 'Underline']));
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Underline')), isTrue);
    });

    testWidgets('focus moved elsewhere by the app is left alone', (
      tester,
    ) async {
      Widget build(List<String> labels) =>
          harness(_between(ToggleGroup(children: _toggles(4, labels: labels))));
      await tester.pumpWidget(build(_labels));
      await focusOn(tester, find.text('Italic'));
      await focusOn(tester, find.text('After'));
      await tester.pumpWidget(build(['Bold', 'Underline', 'Strike']));
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('After')), isTrue);
    });
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
      'overflow; the targets meet 24 by 24, and 44 by 44 under touch', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    Widget build(InvisibleThemeData theme) => harness(
      const SizedBox(
        width: 220,
        child: ToggleGroup(
          wrap: true,
          semanticLabel: 'Formatting',
          children: _formatting,
        ),
      ),
      textScale: 2,
      theme: theme,
    );
    await tester.pumpWidget(build(InvisibleThemeData.light()));
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('Underline')).dy,
      greaterThan(tester.getTopLeft(find.text('Bold')).dy),
    );
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await tester.pumpWidget(
      build(InvisibleThemeData.light(density: InvisibleDensity.touch)),
    );
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
