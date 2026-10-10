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

List<MenubarMenu<String>> _menus({bool withHelp = true}) => [
  const MenubarMenu(
    value: 'file',
    label: 'File',
    items: [
      MenuItem(value: 'new', label: 'New file'),
      MenuSubmenu(
        value: 'recent',
        label: 'Open recent',
        items: [
          MenuItem(value: 'alpha', label: 'Alpha'),
          MenuItem(value: 'beta', label: 'Beta'),
        ],
      ),
      MenuItem(value: 'quit', label: 'Quit'),
    ],
  ),
  const MenubarMenu(
    value: 'edit',
    label: 'Edit',
    items: [
      MenuItem(value: 'undo', label: 'Undo'),
      MenuItem(value: 'redo', label: 'Redo'),
    ],
  ),
  const MenubarMenu(
    value: 'view',
    label: 'View',
    disabled: true,
    items: [MenuItem(value: 'zoom', label: 'Zoom')],
  ),
  if (withHelp)
    const MenubarMenu(
      value: 'help',
      label: 'Help',
      items: [MenuItem(value: 'about', label: 'About')],
    ),
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

Widget _bar(
  _Fixture f, {
  List<MenubarMenu<String>>? menus,
  TextDirection direction = TextDirection.ltr,
  InvisibleThemeData? theme,
  double textScale = 1,
  void Function(String menu, String item)? onSelected,
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
            Menubar<String>(
              label: 'Application',
              menus: menus ?? _menus(),
              onSelected:
                  onSelected ?? (menu, item) => f.selected.add('$menu/$item'),
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

/// The focus node of the trigger labelled [label].
FocusNode _trigger(WidgetTester tester, String label) =>
    Focus.of(tester.element(_text(label)));

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

Future<void> _focus(WidgetTester tester, String label) async {
  _trigger(tester, label).requestFocus();
  await pumpFocus(tester);
}

Future<TestGesture> _mouse(WidgetTester tester) async {
  final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
  addTearDown(mouse.removePointer);
  await mouse.addPointer(location: Offset.zero);
  return mouse;
}

void main() {
  late _Fixture f;
  setUp(() => f = _Fixture());
  tearDown(() => f.dispose());

  group('triggers', () {
    testWidgets('the bar is one tab stop', (tester) async {
      await tester.pumpWidget(_bar(f));
      // Tab moves focus as nextFocus does; the bare harness has no Tab key.
      Future<void> tab(FocusNode from) async {
        from.requestFocus();
        await pumpFocus(tester);
        from.nextFocus();
        await pumpFocus(tester);
      }

      await tab(f.before);
      expect(_focusedLabel(), 'File');
      await tab(FocusManager.instance.primaryFocus!);
      expect(f.after.hasPrimaryFocus, isTrue);
      // The tab stop follows the trigger that had focus last.
      await _focus(tester, 'Edit');
      await tab(f.before);
      expect(_focusedLabel(), 'Edit');
    });

    for (final direction in TextDirection.values) {
      final rtl = direction == TextDirection.rtl;
      final forward = rtl
          ? LogicalKeyboardKey.arrowLeft
          : LogicalKeyboardKey.arrowRight;
      final backward = rtl
          ? LogicalKeyboardKey.arrowRight
          : LogicalKeyboardKey.arrowLeft;

      testWidgets('${direction.name}: the arrows move between triggers, '
          'wrapping, and reach a disabled one', (tester) async {
        await tester.pumpWidget(_bar(f, direction: direction));
        await _focus(tester, 'File');
        await _key(tester, forward);
        expect(_focusedLabel(), 'Edit');
        await _key(tester, forward);
        expect(_focusedLabel(), 'View');
        await _key(tester, forward);
        await _key(tester, forward);
        expect(_focusedLabel(), 'File');
        await _key(tester, backward);
        expect(_focusedLabel(), 'Help');
      });

      testWidgets('${direction.name}: in an open menu the arrows switch top '
          'menus unless an item opens a submenu', (tester) async {
        await tester.pumpWidget(_bar(f, direction: direction));
        await _focus(tester, 'File');
        await _key(tester, LogicalKeyboardKey.arrowDown);
        expect(_focusedLabel(), 'New file');
        // On a submenu trigger the arrow opens the submenu.
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(tester, forward);
        expect(_focusedLabel(), 'Alpha');
        // In a submenu the arrow away closes it, back on its trigger.
        await _key(tester, backward);
        expect(_focusedLabel(), 'Open recent');
        expect(_text('Alpha'), findsNothing);
        // On a plain item the arrow opens the next top menu.
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(tester, forward);
        expect(_text('Quit'), findsNothing);
        expect(_focusedLabel(), 'Undo');
        // The arrow away in a root menu opens the previous one.
        await _key(tester, backward);
        expect(_text('Undo'), findsNothing);
        expect(_focusedLabel(), 'New file');
        expect(f.selected, isEmpty);
      });
    }

    testWidgets('Home and End jump to the end triggers while closed', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'Edit');
      await _key(tester, LogicalKeyboardKey.end);
      expect(_focusedLabel(), 'Help');
      await _key(tester, LogicalKeyboardKey.home);
      expect(_focusedLabel(), 'File');
    });

    testWidgets('Home and End stay with an open menu', (tester) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'File');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.end);
      expect(_focusedLabel(), 'Quit');
      await _key(tester, LogicalKeyboardKey.home);
      expect(_focusedLabel(), 'New file');
    });

    for (final (name, key, first) in [
      ('ArrowDown', LogicalKeyboardKey.arrowDown, true),
      ('Enter', LogicalKeyboardKey.enter, true),
      ('Space', LogicalKeyboardKey.space, true),
      ('ArrowUp', LogicalKeyboardKey.arrowUp, false),
    ]) {
      testWidgets('$name opens a menu on its ${first ? 'first' : 'last'} '
          'item', (tester) async {
        await tester.pumpWidget(_bar(f));
        await _focus(tester, 'File');
        await _key(tester, key);
        expect(_focusedLabel(), first ? 'New file' : 'Quit');
      });
    }

    testWidgets('a switch onto a disabled menu closes the open one and '
        'focuses its trigger', (tester) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'Edit');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(_text('Undo'), findsNothing);
      expect(_text('Zoom'), findsNothing);
      expect(_focusedLabel(), 'View');
    });

    testWidgets('a disabled menu opens by no key or press', (tester) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'View');
      await _key(tester, LogicalKeyboardKey.enter);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await tester.tap(_text('View'));
      await pumpFocus(tester);
      expect(_text('Zoom'), findsNothing);
      expect(_focusedLabel(), 'View');
    });
  });

  group('closing and activation', () {
    testWidgets('Escape closes the menu and focus returns to its trigger', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'Edit');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_text('Undo'), findsNothing);
      expect(_focusedLabel(), 'Edit');
    });

    testWidgets('Tab closes the menu and moves on from the bar', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'Edit');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(_text('Undo'), findsNothing);
      expect(f.after.hasPrimaryFocus, isTrue);
    });

    testWidgets('Enter in a submenu closes every level, returns focus to the '
        'trigger, then reports the menu and the item once', (tester) async {
      String? focusedAtReport;
      await tester.pumpWidget(
        _bar(
          f,
          onSelected: (menu, item) {
            focusedAtReport = _focusedLabel();
            f.selected.add('$menu/$item');
          },
        ),
      );
      await _focus(tester, 'File');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(f.selected, ['file/beta']);
      expect(focusedAtReport, 'File');
      expect(_text('Beta'), findsNothing);
      expect(_text('New file'), findsNothing);
    });

    testWidgets('the callback is read when the item is chosen', (tester) async {
      final late = <String>[];
      await tester.pumpWidget(_bar(f));
      await tester.pumpWidget(
        _bar(f, onSelected: (menu, item) => late.add('$menu/$item')),
      );
      await _focus(tester, 'Help');
      await _key(tester, LogicalKeyboardKey.enter);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(f.selected, isEmpty);
      expect(late, ['help/about']);
    });

    testWidgets('a press on a trigger toggles its menu; a press on an item '
        'reports it', (tester) async {
      await tester.pumpWidget(_bar(f));
      await tester.tap(_text('Edit'));
      await pumpFocus(tester);
      expect(_text('Undo'), findsOneWidget);
      await tester.tap(_text('Edit'));
      await pumpFocus(tester);
      expect(_text('Undo'), findsNothing);
      await tester.tap(_text('Edit'));
      await pumpFocus(tester);
      await tester.tap(_text('Redo'));
      await pumpFocus(tester);
      expect(f.selected, ['edit/redo']);
      expect(_text('Redo'), findsNothing);
    });

    testWidgets('a press outside closes the menu and leaves focus', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await _focus(tester, 'Edit');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await tester.tapAt(const Offset(790, 590));
      await pumpFocus(tester);
      expect(_text('Undo'), findsNothing);
      expect(_trigger(tester, 'Edit').hasPrimaryFocus, isFalse);
      expect(f.selected, isEmpty);
    });

    testWidgets('a menu that goes away while open closes silently', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await tester.tap(_text('Help'));
      await pumpFocus(tester);
      expect(_text('About'), findsOneWidget);
      await tester.pumpWidget(_bar(f, menus: _menus(withHelp: false)));
      await pumpFocus(tester);
      expect(tester.takeException(), isNull);
      expect(_text('About'), findsNothing);
      expect(f.selected, isEmpty);
    });
  });

  group('pointer', () {
    testWidgets('while a menu is open, hovering another trigger opens that '
        'one instead', (tester) async {
      await tester.pumpWidget(_bar(f));
      await tester.tap(_text('File'));
      await pumpFocus(tester);
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_text('Edit')));
      await pumpFocus(tester);
      expect(_text('New file'), findsNothing);
      expect(_text('Undo'), findsOneWidget);
      expect(_focusedLabel(), 'Undo');
    });

    testWidgets('hovering a trigger opens nothing while every menu is '
        'closed', (tester) async {
      await tester.pumpWidget(_bar(f));
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_text('Edit')));
      await tester.pump(const Duration(milliseconds: 500));
      expect(_text('Undo'), findsNothing);
    });

    testWidgets('a press on another trigger switches the open menu', (
      tester,
    ) async {
      await tester.pumpWidget(_bar(f));
      await tester.tap(_text('File'));
      await pumpFocus(tester);
      await tester.tap(_text('Help'), kind: PointerDeviceKind.touch);
      await pumpFocus(tester);
      expect(_text('New file'), findsNothing);
      expect(_text('About'), findsOneWidget);
    });
  });

  group('semantics, targets and layout', () {
    testWidgets('a named menu bar of menu items that say whether their menu '
        'is open', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_bar(f));
      final bar = tester
          .getSemantics(find.byType(Menubar<String>))
          .getSemanticsData();
      expect(bar.role, SemanticsRole.menuBar);
      expect(bar.label, 'Application');

      SemanticsNode trigger(String label) => tester.getSemantics(_text(label));
      expect(trigger('File').getSemanticsData().role, SemanticsRole.menuItem);
      expect(
        trigger('File'),
        semanticsWith(
          label: 'File',
          hasExpandedState: true,
          isExpanded: false,
          isFocusable: true,
          hasTapAction: true,
        ),
      );
      expect(
        trigger('View'),
        semanticsWith(hasEnabledState: true, isEnabled: false),
      );
      await _focus(tester, 'File');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(trigger('File'), semanticsWith(isExpanded: true));
      final menu = tester
          .getSemantics(
            find
                .descendant(
                  of: find.byType(MenuPanel<String>),
                  matching: find.byType(DecoratedBox),
                )
                .first,
          )
          .getSemanticsData();
      expect(menu.role, SemanticsRole.menu);
      expect(menu.label, 'File');
      semantics.dispose();
    });

    testWidgets('every trigger and item is at least 24 by 24, and 44 by 44 '
        'under touch', (tester) async {
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
        await tester.pumpWidget(_bar(f, theme: theme));
        await _focus(tester, 'File');
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await expectLater(tester, meetsGuideline(guideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await _key(tester, LogicalKeyboardKey.escape);
      }
      semantics.dispose();
    });

    testWidgets('text scale 2.0 on a narrow screen wraps the bar and keeps '
        'the menu inside', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_bar(f, textScale: 2));
      expect(tester.takeException(), isNull);
      for (final label in ['File', 'Edit', 'View', 'Help']) {
        final rect = tester.getRect(_text(label));
        expect(rect.right, lessThanOrEqualTo(320), reason: label);
      }
      await tester.tap(_text('Help'));
      await pumpFocus(tester);
      final about = tester.getRect(_text('About'));
      expect(about.left, greaterThanOrEqualTo(0));
      expect(about.right, lessThanOrEqualTo(320));
    });

    testWidgets('a menu opens below its trigger at the inline-start edge', (
      tester,
    ) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(_bar(f, direction: direction));
        await tester.tap(_text('Edit'));
        await pumpFocus(tester);
        final trigger = tester.getRect(_text('Edit'));
        final panel = tester.getRect(find.byType(MenuPanel<String>));
        expect(panel.top, greaterThan(trigger.bottom));
        expect(
          direction == TextDirection.ltr
              ? panel.left <= trigger.left
              : panel.right >= trigger.right,
          isTrue,
          reason: direction.name,
        );
        await _key(tester, LogicalKeyboardKey.escape);
      }
    });
  });
}
