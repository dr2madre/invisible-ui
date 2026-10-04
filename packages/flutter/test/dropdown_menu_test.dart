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

/// The tree of the shared vectors (core/src/menu/__vectors__/menu-tree.json).
List<MenuEntry<String>> _tree({bool wrap = true, bool withRecent = true}) => [
  const MenuItem(value: 'new', label: 'New file'),
  if (withRecent)
    const MenuSubmenu(
      value: 'recent',
      label: 'Open recent',
      items: [
        MenuItem(value: 'alpha', label: 'Alpha'),
        MenuItem(value: 'beta', label: 'Beta', kind: MenuItemKind.checkbox),
        MenuSubmenu(
          value: 'more',
          label: 'More',
          items: [MenuItem(value: 'older', label: 'Older')],
        ),
      ],
    ),
  const MenuSubmenu(
    value: 'share',
    label: 'Share',
    disabled: true,
    items: [MenuItem(value: 'mail', label: 'Mail')],
  ),
  const MenuSeparator(),
  MenuGroup(
    label: 'View',
    items: [
      MenuItem(
        value: 'wrap',
        label: 'Word wrap',
        kind: MenuItemKind.checkbox,
        checked: wrap,
      ),
      const MenuItem(
        value: 'theme-dark',
        label: 'Dark theme',
        kind: MenuItemKind.radio,
      ),
    ],
  ),
  const MenuItem(value: 'quit', label: 'Quit'),
];

class _Fixture {
  final trigger = FocusNode(debugLabel: 'trigger');
  final after = FocusNode(debugLabel: 'after');
  final selected = <String>[];

  void dispose() {
    after.dispose();
  }
}

Widget _menu(
  _Fixture f, {
  List<MenuEntry<String>>? items,
  TextDirection direction = TextDirection.ltr,
  bool enabled = true,
  InvisibleThemeData? theme,
  double textScale = 1,
  bool disableAnimations = false,
  AlignmentGeometry alignment = AlignmentDirectional.topStart,
  ValueChanged<String>? onSelected,
}) {
  return harness(
    Padding(
      padding: const EdgeInsets.all(40),
      child: Align(
        alignment: alignment,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownMenu<String>(
              label: 'File',
              items: items ?? _tree(),
              enabled: enabled,
              onSelected: onSelected ?? f.selected.add,
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
    disableAnimations: disableAnimations,
  );
}

Finder _item(String label) => find.text(label);

/// The focus node the trigger uses.
FocusNode _triggerNode(WidgetTester tester) => Focus.of(
  tester.element(
    find
        .descendant(
          of: find.byType(DropdownMenu<String>),
          matching: find.byType(GestureDetector),
        )
        .first,
  ),
);

/// The label of the item that has focus, or null.
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

/// Opens the menu from the keyboard, on its first item.
Future<void> _open(WidgetTester tester) async {
  _triggerNode(tester).requestFocus();
  await tester.pump();
  await _key(tester, LogicalKeyboardKey.arrowDown);
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

  group('trigger', () {
    for (final (name, key, first) in [
      ('ArrowDown', LogicalKeyboardKey.arrowDown, true),
      ('Enter', LogicalKeyboardKey.enter, true),
      ('Space', LogicalKeyboardKey.space, true),
      ('ArrowUp', LogicalKeyboardKey.arrowUp, false),
    ]) {
      testWidgets('$name opens the menu on its ${first ? 'first' : 'last'} '
          'item', (tester) async {
        await tester.pumpWidget(_menu(f));
        _triggerNode(tester).requestFocus();
        await tester.pump();
        await _key(tester, key);
        expect(_item('New file'), findsOneWidget);
        expect(_focusedLabel(), first ? 'New file' : 'Quit');
      });
    }

    testWidgets('a press opens the menu; a second press closes it', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      expect(_item('New file'), findsOneWidget);
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      expect(_item('New file'), findsNothing);
      expect(_triggerNode(tester).hasPrimaryFocus, isTrue);
    });

    testWidgets('a disabled trigger stays focusable and opens by nothing', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_menu(f, enabled: false));
      await tester.tap(find.text('File'));
      _triggerNode(tester).requestFocus();
      await tester.pump();
      expect(_triggerNode(tester).hasPrimaryFocus, isTrue);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(_item('New file'), findsNothing);
      expect(
        tester.getSemantics(find.text('File')),
        semanticsWith(isButton: true, hasEnabledState: true, isEnabled: false),
      );
      semantics.dispose();
    });

    testWidgets('the trigger says whether the menu is open', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_menu(f));
      SemanticsNode trigger() => tester.getSemantics(find.text('File'));
      expect(
        trigger(),
        semanticsWith(
          isButton: true,
          hasExpandedState: true,
          isExpanded: false,
        ),
      );
      await _open(tester);
      expect(trigger(), semanticsWith(isExpanded: true));
      semantics.dispose();
    });
  });

  group('keyboard in the menu', () {
    testWidgets('up and down move within the level, wrapping and skipping '
        'disabled items', (tester) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Open recent');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Word wrap', reason: 'Share is disabled');
      await _key(tester, LogicalKeyboardKey.end);
      expect(_focusedLabel(), 'Quit');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'New file');
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_focusedLabel(), 'Quit');
      await _key(tester, LogicalKeyboardKey.home);
      expect(_focusedLabel(), 'New file');
    });

    for (final direction in TextDirection.values) {
      final rtl = direction == TextDirection.rtl;
      final toEnd = rtl
          ? LogicalKeyboardKey.arrowLeft
          : LogicalKeyboardKey.arrowRight;
      final toStart = rtl
          ? LogicalKeyboardKey.arrowRight
          : LogicalKeyboardKey.arrowLeft;
      testWidgets('${direction.name}: the arrow toward the inline-end opens a '
          'submenu, the one toward the inline-start closes it', (tester) async {
        await tester.pumpWidget(_menu(f, direction: direction));
        await _open(tester);
        await _key(tester, toEnd);
        expect(_item('Alpha'), findsNothing, reason: 'New file has no submenu');
        expect(_focusedLabel(), 'New file');
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(tester, toEnd);
        expect(_focusedLabel(), 'Alpha');
        await _key(tester, LogicalKeyboardKey.end);
        await _key(tester, toEnd);
        expect(_focusedLabel(), 'Older');
        await _key(tester, toStart);
        expect(_item('Older'), findsNothing);
        expect(_focusedLabel(), 'More');
        await _key(tester, toStart);
        expect(_item('Alpha'), findsNothing);
        expect(_focusedLabel(), 'Open recent');
        await _key(tester, toStart);
        expect(_item('New file'), findsOneWidget, reason: 'the root stays');
      });
    }

    testWidgets('Enter and Space open a submenu on its first item', (
      tester,
    ) async {
      for (final key in [LogicalKeyboardKey.enter, LogicalKeyboardKey.space]) {
        await tester.pumpWidget(_menu(f));
        await _open(tester);
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(tester, key);
        expect(_focusedLabel(), 'Alpha', reason: key.keyLabel);
        await _key(tester, LogicalKeyboardKey.escape);
        await _key(tester, LogicalKeyboardKey.escape);
      }
    });

    testWidgets('Escape closes one level, then the menu, and focus returns '
        'to the trigger', (tester) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_item('Alpha'), findsNothing);
      expect(_focusedLabel(), 'Open recent');
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_item('New file'), findsNothing);
      expect(_triggerNode(tester).hasPrimaryFocus, isTrue);
      expect(f.selected, isEmpty);
    });

    testWidgets('keys skip a disabled submenu, so no key opens it', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.end);
      for (final expected in ['Dark theme', 'Word wrap', 'Open recent']) {
        await _key(tester, LogicalKeyboardKey.arrowUp);
        expect(_focusedLabel(), expected, reason: 'Share is skipped');
      }
      await tester.sendKeyEvent(LogicalKeyboardKey.keyS);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Open recent', reason: 'typeahead skips it too');
      expect(_item('Mail'), findsNothing);
    });

    testWidgets('Tab closes every level and moves on from the trigger', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(_item('New file'), findsNothing);
      expect(_item('Alpha'), findsNothing);
      expect(f.after.hasPrimaryFocus, isTrue);
    });

    testWidgets('typeahead finds an item of the focused level only', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.keyQ);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Quit');
      await tester.sendKeyEvent(LogicalKeyboardKey.keyS);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Quit', reason: 'Share is disabled');
      await tester.pump(const Duration(milliseconds: 500));
      await tester.sendKeyEvent(LogicalKeyboardKey.keyO);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Open recent');
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await tester.sendKeyEvent(LogicalKeyboardKey.keyB);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Beta');
      await tester.pump(const Duration(milliseconds: 500));
      await tester.sendKeyEvent(LogicalKeyboardKey.keyN);
      await pumpFocus(tester);
      expect(_focusedLabel(), 'Beta', reason: 'New file is a root item');
    });
  });

  group('activation', () {
    testWidgets('Enter inside a submenu closes every level, returns focus, '
        'then reports once', (tester) async {
      late bool closedWhenReported;
      late bool triggerFocusedWhenReported;
      await tester.pumpWidget(
        _menu(
          f,
          onSelected: (value) {
            f.selected.add(value);
            closedWhenReported = find.text('New file').evaluate().isEmpty;
            triggerFocusedWhenReported = _triggerNode(tester).hasPrimaryFocus;
          },
        ),
      );
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.end);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(f.selected, ['older']);
      expect(closedWhenReported, isTrue);
      expect(triggerFocusedWhenReported, isTrue);
      expect(_item('Alpha'), findsNothing);
      expect(_item('More'), findsNothing);
    });

    testWidgets('a press on an item closes the menu and reports it', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      await tester.tap(_item('Quit'));
      await pumpFocus(tester);
      expect(f.selected, ['quit']);
      expect(_item('Quit'), findsNothing);
      expect(_triggerNode(tester).hasPrimaryFocus, isTrue);
    });

    testWidgets('Space on a checkable item reports it and keeps the menu '
        'open', (tester) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Beta');
      await _key(tester, LogicalKeyboardKey.space);
      expect(f.selected, ['beta']);
      expect(_item('Beta'), findsOneWidget);
      expect(_focusedLabel(), 'Beta');
      await _key(tester, LogicalKeyboardKey.escape);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focusedLabel(), 'Word wrap');
      await _key(tester, LogicalKeyboardKey.space);
      expect(f.selected, ['beta', 'wrap']);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.space);
      expect(f.selected, ['beta', 'wrap', 'theme-dark']);
      expect(_item('Word wrap'), findsOneWidget);
    });

    testWidgets('Enter on a checkable item closes the menu, then reports', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.keyW);
      await pumpFocus(tester);
      await _key(tester, LogicalKeyboardKey.enter);
      await tester.pump();
      expect(f.selected, ['wrap']);
      expect(_item('Word wrap'), findsNothing);
    });

    testWidgets('the callback is read when the item is chosen', (tester) async {
      final calls = <String>[];
      await tester.pumpWidget(_menu(f, onSelected: (v) => calls.add('a:$v')));
      await _open(tester);
      await tester.pumpWidget(_menu(f, onSelected: (v) => calls.add('b:$v')));
      await _key(tester, LogicalKeyboardKey.enter);
      await tester.pump();
      expect(calls, ['b:new']);
    });
  });

  group('pointer', () {
    testWidgets('a press outside closes every level and leaves focus', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      await tester.tapAt(const Offset(790, 590));
      await pumpFocus(tester);
      expect(_item('New file'), findsNothing);
      expect(_item('Alpha'), findsNothing);
      expect(_triggerNode(tester).hasPrimaryFocus, isFalse);
      expect(f.selected, isEmpty);
    });

    testWidgets('hover opens a submenu after 100 ms; a sibling closes it '
        'after 100 ms', (tester) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_item('Open recent')));
      await tester.pump(const Duration(milliseconds: 99));
      expect(_item('Alpha'), findsNothing);
      await tester.pump(const Duration(milliseconds: 1));
      await tester.pump();
      expect(_item('Alpha'), findsOneWidget);
      expect(_focusedLabel(), 'Open recent', reason: 'focus stays');

      await mouse.moveTo(tester.getCenter(_item('New file')));
      await tester.pump(const Duration(milliseconds: 400));
      await tester.pump();
      expect(_item('Alpha'), findsNothing);
      expect(_focusedLabel(), 'New file');
    });

    testWidgets('the grace area keeps the submenu open on the way to it', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      final mouse = await _mouse(tester);
      final trigger = tester.getRect(
        find
            .ancestor(
              of: _item('Open recent'),
              matching: find.byType(GestureDetector),
            )
            .first,
      );
      await mouse.moveTo(trigger.center);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump();
      // Leave the trigger at its lower edge and cross the item below (Share)
      // on the way to the submenu. Without the grace area, hovering Share
      // would close the submenu after 100 ms.
      final exit = Offset(trigger.right - 4, trigger.bottom - 1);
      await mouse.moveTo(exit);
      await mouse.moveTo(Offset(trigger.right - 1, trigger.bottom + 4));
      await tester.pump(const Duration(milliseconds: 150));
      expect(_item('Alpha'), findsOneWidget, reason: 'still open in the area');
      expect(_focusedLabel(), 'Open recent');

      // Resting for 300 ms ends the grace; the item under the pointer takes
      // over and closes the submenu after the hover delay.
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump();
      expect(_item('Alpha'), findsNothing);
    });

    testWidgets('moving the pointer out of every level closes nothing', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_item('Open recent')));
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump();
      await mouse.moveTo(const Offset(790, 590));
      await tester.pump(const Duration(seconds: 1));
      expect(_item('Alpha'), findsOneWidget);
      expect(_item('New file'), findsOneWidget);
    });

    testWidgets('a tap with a finger opens a submenu; a second tap closes it', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      await tester.tap(_item('Open recent'));
      await pumpFocus(tester);
      expect(_item('Alpha'), findsOneWidget);
      await tester.tap(_item('Open recent'));
      await pumpFocus(tester);
      expect(_item('Alpha'), findsNothing);
      expect(_item('New file'), findsOneWidget);
    });

    testWidgets('a mouse press on an open submenu trigger keeps it open', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      await tester.tap(_item('Open recent'), kind: PointerDeviceKind.mouse);
      await pumpFocus(tester);
      expect(_item('Alpha'), findsOneWidget);
      await tester.tap(_item('Open recent'), kind: PointerDeviceKind.mouse);
      await pumpFocus(tester);
      expect(_item('Alpha'), findsOneWidget);
    });

    testWidgets('a disabled submenu opens by no hover or press', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await tester.tap(find.text('File'));
      await pumpFocus(tester);
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_item('Share')));
      await tester.pump(const Duration(milliseconds: 200));
      await tester.tap(_item('Share'));
      await pumpFocus(tester);
      expect(_item('Mail'), findsNothing);
    });
  });

  group('semantics', () {
    testWidgets('roles and states of the menu and its items', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);

      SemanticsNode node(String label) => tester.getSemantics(_item(label));
      SemanticsRole role(String label) => node(label).getSemanticsData().role;

      final menu = tester
          .getSemantics(
            find
                .descendant(
                  of: find.byType(MenuPanel<String>).first,
                  matching: find.byType(DecoratedBox),
                )
                .first,
          )
          .getSemanticsData();
      expect(menu.role, SemanticsRole.menu);
      expect(menu.label, 'File');

      expect(role('Open recent'), SemanticsRole.menuItem);
      expect(
        node('Open recent'),
        semanticsWith(
          hint: 'submenu',
          hasExpandedState: true,
          isExpanded: true,
        ),
      );
      expect(role('Beta'), SemanticsRole.menuItemCheckbox);
      expect(
        node('Beta'),
        semanticsWith(hasCheckedState: true, isChecked: false),
      );
      expect(role('Word wrap'), SemanticsRole.menuItemCheckbox);
      expect(node('Word wrap'), semanticsWith(isChecked: true));
      expect(role('Dark theme'), SemanticsRole.menuItemRadio);
      expect(
        node('Dark theme'),
        semanticsWith(hasCheckedState: true, isInMutuallyExclusiveGroup: true),
      );
      expect(
        node('Share'),
        semanticsWith(hasEnabledState: true, isEnabled: false),
      );

      expect(
        tester.getSemantics(_item('New file')),
        semanticsWith(hasTapAction: true, isEnabled: true),
      );
      semantics.dispose();
    });

    testWidgets('the submenu hint comes from the theme messages', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _menu(
          f,
          theme: InvisibleThemeData.light(
            messages: const InvisibleMessages(submenuHint: 'sottomenu'),
          ),
        ),
      );
      await _open(tester);
      expect(
        tester.getSemantics(_item('Open recent')),
        semanticsWith(hint: 'sottomenu'),
      );
      semantics.dispose();
    });
  });

  group('targets, text scale and placement', () {
    const guideline24 = MinimumTapTargetGuideline(
      size: Size(24, 24),
      link: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
    );
    const guideline44 = MinimumTapTargetGuideline(
      size: Size(44, 44),
      link:
          'https://developer.apple.com/design/human-interface-guidelines/accessibility',
    );

    testWidgets('every item is at least 24 by 24, and 44 by 44 under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      for (final (theme, guideline) in [
        (
          InvisibleThemeData.light(density: InvisibleDensity.compact),
          guideline24,
        ),
        (
          InvisibleThemeData.light(density: InvisibleDensity.touch),
          guideline44,
        ),
      ]) {
        await tester.pumpWidget(_menu(f, theme: theme));
        await _open(tester);
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(tester, LogicalKeyboardKey.arrowRight);
        await expectLater(tester, meetsGuideline(guideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await _key(tester, LogicalKeyboardKey.escape);
        await _key(tester, LogicalKeyboardKey.escape);
      }
      semantics.dispose();
    });

    testWidgets('a submenu opens at the inline-end in both directions', (
      tester,
    ) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(
          _menu(f, direction: direction, alignment: Alignment.topCenter),
        );
        await _open(tester);
        await _key(tester, LogicalKeyboardKey.arrowDown);
        await _key(
          tester,
          direction == TextDirection.ltr
              ? LogicalKeyboardKey.arrowRight
              : LogicalKeyboardKey.arrowLeft,
        );
        final trigger = tester.getRect(_item('Open recent'));
        final first = tester.getRect(_item('Alpha'));
        expect(
          direction == TextDirection.ltr
              ? first.left > trigger.right
              : first.right < trigger.left,
          isTrue,
          reason: direction.name,
        );
        expect(first.top, moreOrLessEquals(trigger.top, epsilon: 2));
        await _key(tester, LogicalKeyboardKey.escape);
        await _key(tester, LogicalKeyboardKey.escape);
      }
    });

    testWidgets('near the edge the submenu flips to the inline-start', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f, alignment: AlignmentDirectional.topEnd));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      final trigger = tester.getRect(_item('Open recent'));
      final first = tester.getRect(_item('Alpha'));
      expect(first.right, lessThan(trigger.left));
    });

    testWidgets('text scale 2.0 on a narrow screen keeps every level inside', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_menu(f, textScale: 2));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(tester.takeException(), isNull);
      for (final label in ['Open recent', 'Alpha', 'Quit']) {
        final rect = tester.getRect(_item(label));
        expect(rect.left, greaterThanOrEqualTo(0), reason: label);
        expect(rect.right, lessThanOrEqualTo(320), reason: label);
      }
    });

    testWidgets('items that drop the open submenu cut the path silently', (
      tester,
    ) async {
      await tester.pumpWidget(_menu(f));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(_item('Alpha'), findsOneWidget);
      await tester.pumpWidget(_menu(f, items: _tree(withRecent: false)));
      await pumpFocus(tester);
      expect(tester.takeException(), isNull);
      expect(_item('Alpha'), findsNothing);
      expect(_item('New file'), findsOneWidget);
      expect(f.selected, isEmpty);
    });

    testWidgets('a tall level scrolls inside the screen; the focused item '
        'stays in view', (tester) async {
      await tester.pumpWidget(
        _menu(
          f,
          items: [
            for (var i = 0; i < 40; i++)
              MenuItem(value: 'item-$i', label: 'Item $i'),
          ],
        ),
      );
      await _open(tester);
      expect(tester.takeException(), isNull);
      await _key(tester, LogicalKeyboardKey.end);
      final last = tester.getRect(_item('Item 39'));
      expect(last.top, greaterThanOrEqualTo(0));
      expect(last.bottom, lessThanOrEqualTo(600));
      final panel = tester.getRect(find.byType(MenuPanel<String>));
      expect(panel.top, greaterThanOrEqualTo(8));
      expect(panel.bottom, lessThanOrEqualTo(592));
    });

    testWidgets('no motion under reduced motion', (tester) async {
      await tester.pumpWidget(_menu(f, disableAnimations: true));
      final rotation = tester.widget<AnimatedRotation>(
        find.byType(AnimatedRotation),
      );
      expect(rotation.duration, Duration.zero);
    });
  });
}
