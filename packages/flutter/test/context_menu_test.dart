// semantics.dart exports SemanticsRole from Flutter 3.35 on.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/menu/menu_layer.dart';

import 'harness.dart';

const List<MenuEntry<String>> _items = [
  MenuItem(value: 'cut', label: 'Cut'),
  MenuItem(value: 'copy', label: 'Copy'),
  MenuItem(value: 'paste', label: 'Paste', disabled: true),
  MenuItem(value: 'grid', label: 'Show grid', kind: MenuItemKind.checkbox),
  MenuSeparator(),
  MenuSubmenu(
    value: 'arrange',
    label: 'Arrange',
    items: [
      MenuItem(value: 'front', label: 'Bring to front'),
      MenuItem(value: 'back', label: 'Send to back'),
    ],
  ),
  MenuItem(value: 'delete', label: 'Delete'),
];

class _Fixture {
  final before = FocusNode(debugLabel: 'before');
  final after = FocusNode(debugLabel: 'after');
  final selected = <String>[];

  void dispose() {
    before.dispose();
    after.dispose();
  }
}

Widget _page(
  _Fixture f, {
  TextDirection direction = TextDirection.ltr,
  bool enabled = true,
  String? label,
  InvisibleThemeData? theme,
  double textScale = 1,
  double width = 300,
  ValueChanged<String>? onSelected,
}) {
  return harness(
    Padding(
      padding: const EdgeInsets.all(16),
      child: Align(
        alignment: AlignmentDirectional.topStart,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Button(
              onPressed: () {},
              focusNode: f.before,
              child: const Text('Before'),
            ),
            ContextMenu<String>(
              items: _items,
              enabled: enabled,
              label: label,
              onSelected: onSelected ?? f.selected.add,
              child: SizedBox(
                width: width,
                height: 200,
                child: const Center(child: Text('Canvas')),
              ),
            ),
            Button(
              onPressed: () {},
              focusNode: f.after,
              child: const Text('After'),
            ),
          ],
        ),
      ),
    ),
    direction: direction,
    theme: theme,
    textScale: textScale,
  );
}

Finder _text(String label) => find.text(label);

Finder get _region => find.byType(ContextMenu<String>);

FocusNode _regionNode(WidgetTester tester) => Focus.of(
  tester.element(
    find.descendant(of: _region, matching: find.byType(Listener)).first,
  ),
);

/// The label of the text under the widget that has focus, or null.
String? _focusedLabel() {
  final context = FocusManager.instance.primaryFocus?.context;
  if (context == null) return null;
  String? label;
  void visit(Element element) {
    if (label != null) return;
    final widget = element.widget;
    if (widget is Text) {
      label = widget.data;
    } else {
      element.visitChildren(visit);
    }
  }

  context.visitChildElements(visit);
  return label;
}

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await pumpFocus(tester);
}

/// A secondary click at [at], offset from the region's top-left corner.
Future<Offset> _rightClick(WidgetTester tester, Offset at) async {
  final point = tester.getTopLeft(_region) + at;
  await tester.tapAt(
    point,
    buttons: kSecondaryMouseButton,
    kind: PointerDeviceKind.mouse,
  );
  await pumpFocus(tester);
  return point;
}

Rect _panel(WidgetTester tester) =>
    tester.getRect(find.byType(MenuPanel<String>));

void main() {
  late _Fixture f;
  setUp(() => f = _Fixture());
  tearDown(() => f.dispose());

  group('opening', () {
    testWidgets('a secondary click opens the menu at the pointer, on its '
        'first item', (tester) async {
      await tester.pumpWidget(_page(f));
      final point = await _rightClick(tester, const Offset(40, 30));
      expect(_text('Cut'), findsOneWidget);
      expect(_focusedLabel(), 'Cut');
      final panel = _panel(tester);
      expect(panel.left, moreOrLessEquals(point.dx + 2));
      expect(panel.top, moreOrLessEquals(point.dy));
    });

    testWidgets('rtl: the menu opens toward the inline-end of the pointer', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f, direction: TextDirection.rtl));
      final point = await _rightClick(tester, const Offset(260, 30));
      expect(_panel(tester).right, moreOrLessEquals(point.dx - 2));
    });

    testWidgets('near the edge the menu flips toward the inline-start', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(400, 600);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_page(f));
      final point = await _rightClick(tester, const Offset(290, 30));
      final panel = _panel(tester);
      expect(panel.right, moreOrLessEquals(point.dx - 2));
      expect(panel.right, lessThanOrEqualTo(400 - 8));
    });

    testWidgets('opening again moves the menu to the new point', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(20, 20));
      // Outside the open menu, which covers the region below the first point.
      final point = await _rightClick(tester, const Offset(250, 10));
      expect(_text('Cut'), findsOneWidget);
      expect(_panel(tester).topLeft, Offset(point.dx + 2, point.dy));
      expect(_focusedLabel(), 'Cut');
    });

    testWidgets('a long press with a finger opens the menu at the press', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f));
      final point = tester.getTopLeft(_region) + const Offset(50, 40);
      final finger = await tester.startGesture(point);
      await tester.pump(const Duration(milliseconds: 400));
      expect(_text('Cut'), findsNothing);
      await tester.pump(const Duration(milliseconds: 100));
      await pumpFocus(tester);
      expect(_text('Cut'), findsOneWidget);
      expect(_panel(tester).left, moreOrLessEquals(point.dx + 2));
      await finger.up();
      await pumpFocus(tester);
      expect(_text('Cut'), findsOneWidget);
    });

    testWidgets('a finger that moves more than 10 px or lifts early opens '
        'nothing', (tester) async {
      await tester.pumpWidget(_page(f));
      final point = tester.getTopLeft(_region) + const Offset(50, 40);
      final moved = await tester.startGesture(point);
      await tester.pump(const Duration(milliseconds: 100));
      await moved.moveBy(const Offset(12, 0));
      await tester.pump(const Duration(milliseconds: 600));
      await moved.up();
      final lifted = await tester.startGesture(point);
      await tester.pump(const Duration(milliseconds: 300));
      await lifted.up();
      await tester.pump(const Duration(milliseconds: 600));
      expect(_text('Cut'), findsNothing);
    });

    for (final direction in TextDirection.values) {
      for (final (name, keys) in [
        ('Shift+F10', [LogicalKeyboardKey.shiftLeft, LogicalKeyboardKey.f10]),
        ('the context menu key', [LogicalKeyboardKey.contextMenu]),
      ]) {
        testWidgets('${direction.name}: $name opens the menu at the '
            "region's inline-start top corner", (tester) async {
          await tester.pumpWidget(_page(f, direction: direction));
          _regionNode(tester).requestFocus();
          await pumpFocus(tester);
          for (final key in keys) {
            await tester.sendKeyDownEvent(key);
          }
          for (final key in keys.reversed) {
            await tester.sendKeyUpEvent(key);
          }
          await pumpFocus(tester);
          expect(_focusedLabel(), 'Cut');
          final region = tester.getRect(_region);
          final panel = _panel(tester);
          expect(panel.top, moreOrLessEquals(region.top));
          if (direction == TextDirection.ltr) {
            expect(panel.left, moreOrLessEquals(region.left + 2));
          } else {
            expect(panel.right, moreOrLessEquals(region.right - 2));
          }
        });
      }
    }

    testWidgets('a disabled region opens by nothing', (tester) async {
      await tester.pumpWidget(_page(f, enabled: false));
      await _rightClick(tester, const Offset(40, 30));
      _regionNode(tester).requestFocus();
      await pumpFocus(tester);
      await _key(tester, LogicalKeyboardKey.contextMenu);
      expect(_text('Cut'), findsNothing);
    });
  });

  group('keys, focus return and activation', () {
    testWidgets('arrows skip disabled items and submenus open by the arrow '
        'toward the inline-end', (tester) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Show grid');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Arrange');
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(_focusedLabel(), 'Bring to front');
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focusedLabel(), 'Arrange');
      expect(_text('Bring to front'), findsNothing);
      // The arrow toward the inline-start in the root menu does nothing.
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focusedLabel(), 'Arrange');
    });

    testWidgets('typeahead finds an item of the focused level', (tester) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await tester.sendKeyEvent(LogicalKeyboardKey.keyD, character: 'd');
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Delete');
    });

    testWidgets('Escape closes the menu and returns focus to the control '
        'that had it before', (tester) async {
      await tester.pumpWidget(_page(f));
      f.before.requestFocus();
      await pumpFocus(tester);
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.end);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_focusedLabel(), 'Arrange');
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_text('Cut'), findsNothing);
      expect(f.before.hasPrimaryFocus, isTrue);
    });

    testWidgets('with nothing focused before, focus returns to the region', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_regionNode(tester).hasPrimaryFocus, isTrue);
    });

    testWidgets('activation closes every level, returns focus, then reports '
        'once', (tester) async {
      bool? focusBackAtReport;
      await tester.pumpWidget(
        _page(
          f,
          onSelected: (value) {
            focusBackAtReport = f.before.hasPrimaryFocus;
            f.selected.add(value);
          },
        ),
      );
      f.before.requestFocus();
      await pumpFocus(tester);
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.end);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      await _key(tester, LogicalKeyboardKey.enter);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(f.selected, ['front']);
      expect(focusBackAtReport, isTrue);
      expect(_text('Bring to front'), findsNothing);
      expect(_text('Cut'), findsNothing);
    });

    testWidgets('Space on a checkable item reports it and keeps the menu '
        'open', (tester) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.space);
      expect(f.selected, ['grid']);
      expect(_focusedLabel(), 'Show grid');
    });

    testWidgets('a press on an item reports it', (tester) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await tester.tap(_text('Copy'));
      await pumpFocus(tester);
      expect(f.selected, ['copy']);
      expect(_text('Copy'), findsNothing);
    });

    testWidgets('the callback is read when the item is chosen', (tester) async {
      final late = <String>[];
      await tester.pumpWidget(_page(f));
      await tester.pumpWidget(_page(f, onSelected: late.add));
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.enter);
      expect(f.selected, isEmpty);
      expect(late, ['cut']);
    });

    testWidgets('Tab closes the menu and moves on from the region', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      await _key(tester, LogicalKeyboardKey.tab);
      expect(_text('Cut'), findsNothing);
      expect(f.after.hasPrimaryFocus, isTrue);
    });

    testWidgets('a press outside closes the menu and leaves focus', (
      tester,
    ) async {
      await tester.pumpWidget(_page(f));
      f.before.requestFocus();
      await pumpFocus(tester);
      await _rightClick(tester, const Offset(40, 30));
      await tester.tapAt(const Offset(790, 590));
      await pumpFocus(tester);
      expect(_text('Cut'), findsNothing);
      expect(f.before.hasPrimaryFocus, isFalse);
      expect(f.selected, isEmpty);
    });
  });

  group('semantics, targets and layout', () {
    testWidgets('a menu named from the catalog, or by its label', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      SemanticsData menu() => tester
          .getSemantics(
            find
                .descendant(
                  of: find.byType(MenuPanel<String>),
                  matching: find.byType(DecoratedBox),
                )
                .first,
          )
          .getSemanticsData();

      await tester.pumpWidget(_page(f));
      await _rightClick(tester, const Offset(40, 30));
      expect(menu().role, SemanticsRole.menu);
      expect(menu().label, 'Context menu');
      expect(
        tester.getSemantics(_text('Arrange')),
        semanticsWith(hint: 'submenu', hasExpandedState: true),
      );
      await _key(tester, LogicalKeyboardKey.escape);

      await tester.pumpWidget(
        _page(
          f,
          theme: InvisibleThemeData.light(
            messages: const InvisibleMessages(contextMenuLabel: 'Menu'),
          ),
        ),
      );
      await _rightClick(tester, const Offset(40, 30));
      expect(menu().label, 'Menu');
      await _key(tester, LogicalKeyboardKey.escape);

      await tester.pumpWidget(_page(f, label: 'Canvas actions'));
      await _rightClick(tester, const Offset(40, 30));
      expect(menu().label, 'Canvas actions');
      semantics.dispose();
    });

    testWidgets('assistive technology opens it with a long press', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(f));
      final region = tester.getSemantics(_text('Canvas'));
      expect(
        region.getSemanticsData().hasAction(SemanticsAction.longPress),
        isTrue,
      );
      region.owner!.performAction(region.id, SemanticsAction.longPress);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Cut');
      semantics.dispose();
    });

    testWidgets('every item is at least 24 by 24, and 44 by 44 under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      for (final (theme, guideline) in [
        (
          InvisibleThemeData.light(density: InvisibleDensity.compact),
          targetGuideline24,
        ),
        (
          InvisibleThemeData.light(density: InvisibleDensity.touch),
          targetGuideline44,
        ),
      ]) {
        await tester.pumpWidget(_page(f, theme: theme));
        await _rightClick(tester, const Offset(40, 30));
        await expectLater(tester, meetsGuideline(guideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await _key(tester, LogicalKeyboardKey.escape);
      }
      semantics.dispose();
    });

    testWidgets('text scale 2.0 on a narrow screen keeps the menu inside', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_page(f, textScale: 2, width: 280));
      await _rightClick(tester, const Offset(200, 150));
      expect(tester.takeException(), isNull);
      final panel = _panel(tester);
      expect(panel.left, greaterThanOrEqualTo(8));
      expect(panel.right, lessThanOrEqualTo(312));
      expect(panel.top, greaterThanOrEqualTo(8));
      expect(panel.bottom, lessThanOrEqualTo(632));
    });

    testWidgets('the region shows a focus ring for keyboard focus', (
      tester,
    ) async {
      useKeyboardHighlight();
      await tester.pumpWidget(_page(f));
      _regionNode(tester).requestFocus();
      await pumpFocus(tester);
      final ring = tester.widget<CustomPaint>(
        find.descendant(of: _region, matching: find.byType(CustomPaint)).first,
      );
      expect(ring.foregroundPainter, isNotNull);
    });
  });
}
