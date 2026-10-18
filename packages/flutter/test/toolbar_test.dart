import 'package:flutter/gestures.dart';
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

  group('text fields', () {
    Widget page(
      FocusNode field, {
      Axis orientation = Axis.horizontal,
      bool readOnly = false,
      bool multiline = false,
    }) => WidgetsApp(
      color: const Color(0xFF000000),
      builder: (context, _) => harness(
        SizedBox(
          width: 400,
          child: Toolbar(
            semanticLabel: 'Search',
            orientation: orientation,
            children: [
              Button(
                onPressed: () {},
                focusNode: nodes.controls[0],
                child: const Text('Back'),
              ),
              SizedBox(
                width: 200,
                child: multiline
                    ? Textarea.uncontrolled(
                        label: 'Notes',
                        initialValue: 'one\ntwo',
                        readOnly: readOnly,
                        focusNode: field,
                      )
                    : TextField.uncontrolled(
                        label: 'Query',
                        initialValue: 'abc',
                        readOnly: readOnly,
                        focusNode: field,
                      ),
              ),
              Button(
                onPressed: () {},
                focusNode: nodes.controls[2],
                child: const Text('Go'),
              ),
            ],
          ),
        ),
      ),
    );

    TextSelection selection(WidgetTester tester) => tester
        .widget<EditableText>(find.byType(EditableText))
        .controller
        .selection;

    testWidgets('a focused text field keeps Left, Right, Home and End for '
        'its caret', (tester) async {
      final field = FocusNode();
      addTearDown(field.dispose);
      await tester.pumpWidget(page(field));
      field.requestFocus();
      await tester.pump();
      final start = selection(tester);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(field.hasPrimaryFocus, isTrue);
      expect(selection(tester), isNot(start), reason: 'the caret moved');
      for (final key in [
        LogicalKeyboardKey.arrowRight,
        LogicalKeyboardKey.home,
        LogicalKeyboardKey.end,
      ]) {
        await _press(tester, key);
        expect(field.hasPrimaryFocus, isTrue, reason: key.keyLabel);
      }
      expect(focused(), -1);
    });

    testWidgets('in a vertical toolbar a text field keeps Up and Down; a '
        'multi-line one keeps every arrow', (tester) async {
      final field = FocusNode();
      addTearDown(field.dispose);
      for (final multiline in [false, true]) {
        await tester.pumpWidget(
          page(field, orientation: Axis.vertical, multiline: multiline),
        );
        field.requestFocus();
        await tester.pump();
        for (final key in [
          LogicalKeyboardKey.arrowUp,
          LogicalKeyboardKey.arrowDown,
          LogicalKeyboardKey.arrowLeft,
          LogicalKeyboardKey.arrowRight,
          LogicalKeyboardKey.home,
          LogicalKeyboardKey.end,
        ]) {
          await _press(tester, key);
          expect(field.hasPrimaryFocus, isTrue, reason: key.keyLabel);
        }
      }
    });

    testWidgets('a read-only field leaves the arrows to the toolbar', (
      tester,
    ) async {
      final field = FocusNode();
      addTearDown(field.dispose);
      await tester.pumpWidget(page(field, readOnly: true));
      field.requestFocus();
      await tester.pump();
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(focused(), 2);
      await _press(tester, LogicalKeyboardKey.home);
      expect(focused(), 0);
    });
  });

  group('flat', () {
    BoxDecoration surface(WidgetTester tester, String label) =>
        tester
                .widget<AnimatedContainer>(
                  find.ancestor(
                    of: find.text(label),
                    matching: find.byType(AnimatedContainer),
                  ),
                )
                .decoration!
            as BoxDecoration;

    testWidgets('a flat toolbar draws its toggle buttons without border and '
        'fill at rest, with the hover tint; a toggle that is on keeps its '
        'look', (tester) async {
      final colors = InvisibleThemeData.light().colors;
      Widget build({required bool flat}) => harness(
        Toolbar(
          semanticLabel: 'Formatting',
          flat: flat,
          children: [
            ToggleButton.uncontrolled(child: const Text('B')),
            ToggleButton.uncontrolled(
              initialValue: true,
              child: const Text('I'),
            ),
          ],
        ),
      );
      await tester.pumpWidget(build(flat: false));
      expect(surface(tester, 'B').color, colors.background);
      expect(
        (surface(tester, 'B').border! as Border).top.color,
        colors.toggleButtonBorder,
      );
      final on = surface(tester, 'I');

      await tester.pumpWidget(build(flat: true));
      await tester.pumpAndSettle();
      expect(surface(tester, 'B').color, const Color(0x00000000));
      expect(
        (surface(tester, 'B').border! as Border).top.color,
        const Color(0x00000000),
      );
      expect(surface(tester, 'I'), on, reason: 'on keeps its tint and border');

      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(find.text('B')));
      await tester.pumpAndSettle();
      expect(surface(tester, 'B').color, colors.stateHover);
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
