import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

/// Focus nodes for a field before the toolbar, the toolbar's controls and a
/// field after it.
class _Nodes {
  final before = FocusNode(debugLabel: 'before');
  final after = FocusNode(debugLabel: 'after');
  final controls = List.generate(4, (i) => FocusNode(debugLabel: 'c$i'));

  void dispose() {
    before.dispose();
    after.dispose();
    for (final node in controls) {
      node.dispose();
    }
  }
}

/// A page with a button, the toolbar and a button, inside WidgetsApp so Tab
/// moves focus as in an app.
Widget _page(
  _Nodes nodes, {
  Axis orientation = Axis.horizontal,
  TextDirection direction = TextDirection.ltr,
  Set<int> disabled = const {},
  double textScale = 1,
  double? width,
}) {
  Widget control(int i) => Button(
    onPressed: disabled.contains(i) ? null : () {},
    focusNode: nodes.controls[i],
    child: Text('Control $i'),
  );
  return WidgetsApp(
    color: const Color(0xFF000000),
    builder: (context, _) => harness(
      SizedBox(
        width: width,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Button(
              onPressed: () {},
              focusNode: nodes.before,
              child: const Text('Before'),
            ),
            Toolbar(
              semanticLabel: 'Formatting',
              orientation: orientation,
              children: [
                control(0),
                control(1),
                const ToolbarSeparator(),
                control(2),
                control(3),
              ],
            ),
            Button(
              onPressed: () {},
              focusNode: nodes.after,
              child: const Text('After'),
            ),
          ],
        ),
      ),
      direction: direction,
      textScale: textScale,
    ),
  );
}

Future<void> _press(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await tester.pump();
}

void main() {
  late _Nodes nodes;
  setUp(() => nodes = _Nodes());
  tearDown(() => nodes.dispose());

  int focused() => nodes.controls.indexWhere((n) => n.hasPrimaryFocus);

  group('tab stop', () {
    testWidgets('Tab enters the toolbar once and leaves it next', (
      tester,
    ) async {
      await tester.pumpWidget(_page(nodes));
      nodes.before.requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.tab);
      expect(focused(), 0);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(nodes.after.hasPrimaryFocus, isTrue);
      await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
      await _press(tester, LogicalKeyboardKey.tab);
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
      expect(focused(), 0, reason: 'Shift+Tab enters at the same stop');
    });

    testWidgets('focus returns to the control that had it last', (
      tester,
    ) async {
      await tester.pumpWidget(_page(nodes));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowRight);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 2);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(nodes.after.hasPrimaryFocus, isTrue);
      await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
      await _press(tester, LogicalKeyboardKey.tab);
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
      expect(focused(), 2);
    });

    testWidgets('the tab stop moves to the first enabled control when its '
        'holder is disabled', (tester) async {
      await tester.pumpWidget(_page(nodes));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.end);
      expect(focused(), 3);
      nodes.before.requestFocus();
      await tester.pump();
      await tester.pumpWidget(_page(nodes, disabled: {0, 3}));
      await _press(tester, LogicalKeyboardKey.tab);
      expect(focused(), 1);
    });
  });

  group('arrow keys', () {
    testWidgets('left and right move and wrap; Home and End jump', (
      tester,
    ) async {
      await tester.pumpWidget(_page(nodes));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 1);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(focused(), 3, reason: 'wraps to the end');
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 0, reason: 'wraps to the start');
      await _press(tester, LogicalKeyboardKey.end);
      expect(focused(), 3);
      await _press(tester, LogicalKeyboardKey.home);
      expect(focused(), 0);
    });

    testWidgets('right to left mirrors the arrows', (tester) async {
      await tester.pumpWidget(_page(nodes, direction: TextDirection.rtl));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(focused(), 1);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 0);
    });

    testWidgets('a vertical toolbar uses up and down', (tester) async {
      await tester.pumpWidget(_page(nodes, orientation: Axis.vertical));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowDown);
      expect(focused(), 1);
      await _press(tester, LogicalKeyboardKey.arrowUp);
      expect(focused(), 0);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 0, reason: 'the side arrows do nothing');
    });

    testWidgets('disabled controls are skipped', (tester) async {
      await tester.pumpWidget(_page(nodes, disabled: {1, 2}));
      nodes.controls[0].requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 3);
    });
  });

  group('semantics and layout', () {
    testWidgets('the toolbar is a group named by its label; separators are '
        'silent', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(nodes));
      expect(
        tester.getSemantics(find.byType(Toolbar)),
        semanticsWith(label: 'Formatting'),
      );
      expect(
        find.descendant(
          of: find.byType(ToolbarSeparator),
          matching: find.byType(Focus),
        ),
        findsNothing,
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      semantics.dispose();
    });

    testWidgets('targets are at least 44 by 44 under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Toolbar(
            semanticLabel: 'Formatting',
            children: [
              Button(onPressed: () {}, child: const Text('B')),
              const ToolbarSeparator(),
              Button(onPressed: () {}, child: const Text('I')),
            ],
          ),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(
        tester,
        meetsGuideline(
          const MinimumTapTargetGuideline(
            size: Size(44, 44),
            link:
                'https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced',
          ),
        ),
      );
      semantics.dispose();
    });

    testWidgets('a crowded toolbar wraps at text scale 2.0 in a narrow space', (
      tester,
    ) async {
      await tester.pumpWidget(_page(nodes, textScale: 2, width: 240));
      expect(tester.takeException(), isNull);
      final toolbar = tester.getRect(find.byType(Toolbar));
      expect(toolbar.width, lessThanOrEqualTo(240));
      final first = tester.getRect(find.text('Control 0'));
      final last = tester.getRect(find.text('Control 3'));
      expect(last.top, greaterThan(first.bottom), reason: 'on a later row');
    });
  });
}
