// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

final Finder _products = find.text('Products');
final Finder _resources = find.text('Resources');

bool _shows(String text) => find.text(text).evaluate().isNotEmpty;

List<NavigationMenuItem<String>> _items(List<String> opened) => [
  NavigationMenuItem.panel(
    value: 'products',
    label: 'Products',
    links: [
      NavigationMenuLink(
        label: 'Analytics',
        description: 'Understand your traffic',
        uri: Uri.parse('/analytics'),
        onPressed: () => opened.add('analytics'),
      ),
      NavigationMenuLink(
        label: 'Automation',
        onPressed: () => opened.add('automation'),
      ),
    ],
  ),
  NavigationMenuItem.panel(
    value: 'resources',
    label: 'Resources',
    links: [
      NavigationMenuLink(label: 'Docs', onPressed: () => opened.add('docs')),
    ],
  ),
  NavigationMenuItem.link(
    value: 'pricing',
    label: 'Pricing',
    uri: Uri.parse('/pricing'),
    onPressed: () => opened.add('pricing'),
  ),
];

Widget _menu({
  List<String>? opened,
  ValueChanged<String?>? onOpenChanged,
  TextDirection direction = TextDirection.ltr,
  InvisibleThemeData? theme,
  double textScale = 1,
  bool disableAnimations = false,
}) => harness(
  NavigationMenu<String>(
    label: 'Main',
    items: _items(opened ?? []),
    onOpenChanged: onOpenChanged,
  ),
  direction: direction,
  theme: theme,
  textScale: textScale,
  disableAnimations: disableAnimations,
);

/// The nearest ancestor with a role. Flutter 3.44 adds a node without one
/// between an overlay portal and its child; 3.32 does not.
SemanticsNode _withRole(SemanticsNode node) {
  var parent = node.parent!;
  while (parent.getSemanticsData().role == SemanticsRole.none) {
    parent = parent.parent!;
  }
  return parent;
}

Future<TestGesture> _mouse(WidgetTester tester) async {
  final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
  addTearDown(mouse.removePointer);
  await mouse.addPointer(location: Offset.zero);
  return mouse;
}

void main() {
  for (final direction in TextDirection.values) {
    testWidgets('${direction.name}: Enter and Space toggle; ArrowDown opens '
        'and focuses the first link; Escape closes and returns focus', (
      tester,
    ) async {
      final reports = <String?>[];
      await tester.pumpWidget(
        _menu(onOpenChanged: reports.add, direction: direction),
      );
      await focusOn(tester, _products);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(_shows('Analytics'), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(_shows('Analytics'), isFalse);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(_shows('Analytics'), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_shows('Analytics'), isFalse);
      expect(focusedOn(tester, _products), isTrue);

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('Analytics')), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await pumpFocus(tester);
      expect(_shows('Analytics'), isFalse);
      expect(focusedOn(tester, _products), isTrue);
      expect(reports, ['products', null, 'products', null, 'products', null]);
    });
  }

  testWidgets('Escape with nothing open is left to the rest of the app', (
    tester,
  ) async {
    var outer = 0;
    await tester.pumpWidget(
      Focus(
        onKeyEvent: (_, event) {
          if (event is KeyDownEvent) outer++;
          return KeyEventResult.handled;
        },
        child: _menu(),
      ),
    );
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    expect(outer, 1);
  });

  testWidgets('Tab enters an open panel after its trigger, then moves on', (
    tester,
  ) async {
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => _menu(),
      ),
    );
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(focusedOn(tester, _resources), isTrue, reason: 'closed: next item');
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Pricing')), isTrue);

    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    for (final next in ['Analytics', 'Automation', 'Resources']) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text(next)), isTrue, reason: next);
    }
    expect(_shows('Analytics'), isTrue, reason: 'Tab closes nothing');
  });

  testWidgets('hover opens after 150 ms, switches at once, stays over the '
      'panel and closes 150 ms after leaving', (tester) async {
    final reports = <String?>[];
    await tester.pumpWidget(_menu(onOpenChanged: reports.add));
    final mouse = await _mouse(tester);
    await mouse.moveTo(tester.getCenter(_products));
    await tester.pump(const Duration(milliseconds: 100));
    expect(_shows('Analytics'), isFalse);
    await tester.pump(const Duration(milliseconds: 60));
    expect(_shows('Analytics'), isTrue);
    await mouse.moveTo(tester.getCenter(_resources));
    await tester.pump();
    expect(_shows('Docs'), isTrue, reason: 'switches at once');
    expect(_shows('Analytics'), isFalse);
    await mouse.moveTo(tester.getCenter(find.text('Docs')));
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Docs'), isTrue, reason: 'the panel cancels the close');
    await mouse.moveTo(const Offset(5, 5));
    await tester.pump(const Duration(milliseconds: 100));
    expect(_shows('Docs'), isTrue);
    await tester.pump(const Duration(milliseconds: 60));
    expect(_shows('Docs'), isFalse);
    expect(reports, ['products', 'resources', null]);
  });

  testWidgets('a pending hover survives another item going away; a panel '
      'whose item goes away closes without a report', (tester) async {
    final reports = <String?>[];
    final items = _items([]);
    // Pinned to the start, so the trigger stays under the pointer when the
    // bar narrows.
    Widget build(List<NavigationMenuItem<String>> items) => harness(
      SizedBox(
        width: 600,
        child: Align(
          alignment: AlignmentDirectional.topStart,
          child: NavigationMenu<String>(
            label: 'Main',
            items: items,
            onOpenChanged: reports.add,
          ),
        ),
      ),
    );
    await tester.pumpWidget(build(items));
    final mouse = await _mouse(tester);
    await mouse.moveTo(tester.getCenter(_products));
    await tester.pump(const Duration(milliseconds: 50));
    await tester.pumpWidget(build([items[0], items[2]]));
    await tester.pump(const Duration(milliseconds: 120));
    expect(_shows('Analytics'), isTrue);
    await tester.pumpWidget(build([items[2]]));
    expect(_shows('Analytics'), isFalse);
    expect(reports, ['products']);
  });

  testWidgets('a click closes what it opened even when the hover delay runs '
      'out afterwards', (tester) async {
    await tester.pumpWidget(_menu());
    final mouse = await _mouse(tester);
    await mouse.moveTo(tester.getCenter(_products));
    await mouse.down(tester.getCenter(_products));
    await mouse.up();
    await tester.pump();
    expect(_shows('Analytics'), isTrue);
    await mouse.down(tester.getCenter(_products));
    await mouse.up();
    await tester.pump();
    expect(_shows('Analytics'), isFalse);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_shows('Analytics'), isFalse);
  });

  testWidgets('touch has no hover: a tap toggles the panel', (tester) async {
    final reports = <String?>[];
    await tester.pumpWidget(_menu(onOpenChanged: reports.add));
    await tester.tap(_products);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_shows('Analytics'), isTrue);
    await tester.tap(_products);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_shows('Analytics'), isFalse);
    expect(reports, ['products', null]);
  });

  testWidgets('a press outside closes without moving focus back; a press on '
      'another trigger switches', (tester) async {
    final reports = <String?>[];
    await tester.pumpWidget(_menu(onOpenChanged: reports.add));
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    await tester.tapAt(const Offset(5, 5));
    await pumpFocus(tester);
    expect(_shows('Analytics'), isFalse);
    expect(Focus.of(tester.element(_products)).hasFocus, isFalse);
    await tester.tap(_products);
    await tester.pump();
    await tester.tap(_resources);
    await tester.pump();
    expect(_shows('Docs'), isTrue);
    expect(reports, ['products', null, 'products', null, 'resources']);
  });

  testWidgets('links open through their callbacks by a tap or Enter, never '
      'Space, and leave the panel open; the callbacks are read when pressed', (
    tester,
  ) async {
    final opened = <String>[];
    await tester.pumpWidget(_menu(opened: opened));
    await tester.tap(find.text('Pricing'));
    await focusOn(tester, find.text('Pricing'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.tap(_products);
    await tester.pump();
    await tester.tap(find.text('Analytics'));
    await focusOn(tester, find.text('Automation'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    expect(opened, ['pricing', 'pricing', 'analytics', 'automation']);
    expect(_shows('Automation'), isTrue, reason: 'choosing closes nothing');

    final replaced = <String>[];
    await tester.pumpWidget(_menu(opened: replaced));
    await tester.tap(find.text('Analytics'));
    expect(replaced, ['analytics']);
    expect(opened, hasLength(4));
  });

  testWidgets('onOpenChanged reports once per change and is read at the '
      'change', (tester) async {
    final first = <String?>[];
    final second = <String?>[];
    await tester.pumpWidget(_menu(onOpenChanged: first.add));
    await tester.tap(_products);
    await tester.pump();
    await tester.pumpWidget(_menu(onOpenChanged: second.add));
    await tester.tap(_products);
    await tester.pump();
    expect(first, ['products']);
    expect(second, [null]);
  });

  testWidgets('semantics: a list named by the label; triggers are buttons '
      'that say whether they are expanded; the panel is a list named by its '
      'trigger; links carry their address', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(_menu());
    expect(tester.takeException(), isNull, reason: 'the role checks pass');
    final bar = tester.getSemantics(find.byType(NavigationMenu<String>));
    expect(bar.label, 'Main');
    expect(bar.getSemanticsData().role, SemanticsRole.list);
    expect(
      tester.getSemantics(_products),
      semanticsWith(
        label: 'Products',
        isButton: true,
        hasExpandedState: true,
        isExpanded: false,
      ),
    );
    expect(
      _withRole(tester.getSemantics(_products)).getSemanticsData().role,
      SemanticsRole.listItem,
    );
    final pricing = tester.getSemantics(find.text('Pricing'));
    expect(pricing.getSemanticsData().linkUrl, Uri.parse('/pricing'));
    // The flag API Flutter 3.32 has; later releases add flagsCollection.
    // ignore: deprecated_member_use
    expect(pricing.getSemanticsData().hasFlag(SemanticsFlag.isLink), isTrue);

    await tester.tap(_products);
    await tester.pump();
    expect(
      tester.getSemantics(_products),
      semanticsWith(hasExpandedState: true, isExpanded: true),
    );
    final analytics = tester.getSemantics(find.text('Analytics'));
    expect(
      analytics,
      semanticsWith(label: 'Analytics', hint: 'Understand your traffic'),
    );
    expect(analytics.getSemanticsData().linkUrl, Uri.parse('/analytics'));
    // ignore: deprecated_member_use
    expect(analytics.getSemanticsData().hasFlag(SemanticsFlag.isLink), isTrue);
    final panel = _withRole(_withRole(analytics));
    expect(panel.label, 'Products');
    expect(panel.getSemanticsData().role, SemanticsRole.list);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('the panel sits below its trigger at the inline-start edge, at '
      'least 288 wide', (tester) async {
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(_menu(direction: direction));
      await tester.tap(_products);
      await tester.pump();
      final trigger = tester.getRect(_products);
      final panel = tester.getRect(
        find
            .ancestor(
              of: find.text('Analytics'),
              matching: find.byType(DecoratedBox),
            )
            .last,
      );
      expect(panel.top, greaterThan(trigger.bottom));
      expect(panel.width, greaterThanOrEqualTo(288));
      if (direction == TextDirection.ltr) {
        expect(panel.left, lessThan(trigger.left));
      } else {
        expect(panel.right, greaterThan(trigger.right));
      }
      await tester.tap(_products);
      await tester.pump();
    }
  });

  testWidgets('right to left at text scale 2.0 in a narrow window the bar '
      'wraps and the panel stays inside; 44 by 44 targets under touch', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      _menu(
        direction: TextDirection.rtl,
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('Pricing')).dy,
      greaterThan(tester.getBottomLeft(_products).dy),
      reason: 'the bar wraps',
    );
    expect(
      tester.getCenter(_products).dx,
      greaterThan(tester.getCenter(_resources).dx),
      reason: 'right to left',
    );
    await tester.tap(_products);
    await tester.pump();
    expect(tester.takeException(), isNull);
    final link = tester.getRect(find.text('Understand your traffic'));
    expect(link.left, greaterThanOrEqualTo(8));
    expect(link.right, lessThanOrEqualTo(312));
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });

  testWidgets('the chevron turns half a turn when open, at once under '
      'reduced motion; the keyboard ring shows', (tester) async {
    useKeyboardHighlight();
    await tester.pumpWidget(_menu(disableAnimations: true));
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    final rotation = tester.widget<AnimatedRotation>(
      find.byType(AnimatedRotation).first,
    );
    expect(rotation.turns, 0.5);
    expect(rotation.duration, Duration.zero);
    expect(
      tester
          .widget<FocusRingPainter>(
            find.ancestor(
              of: _products,
              matching: find.byType(FocusRingPainter),
            ),
          )
          .visible,
      isTrue,
    );
  });
}
