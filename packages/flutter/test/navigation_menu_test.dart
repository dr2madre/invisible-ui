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

/// The nearest ancestor with a role, past any node without one that the
/// framework puts between an overlay portal and its child.
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
      'Space; the callbacks are read when pressed', (tester) async {
    final opened = <String>[];
    await tester.pumpWidget(_menu(opened: opened));
    await tester.tap(find.text('Pricing'));
    await focusOn(tester, find.text('Pricing'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.tap(_products);
    await tester.pump();
    await tester.tap(find.text('Analytics'));
    await tester.pump();
    await tester.tap(_products);
    await tester.pump();
    await focusOn(tester, find.text('Automation'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    expect(opened, ['pricing', 'pricing', 'analytics', 'automation']);

    final replaced = <String>[];
    await tester.pumpWidget(_menu(opened: replaced));
    await tester.pump();
    await tester.tap(_products);
    await tester.pump();
    await tester.tap(find.text('Analytics'));
    expect(replaced, ['analytics']);
    expect(opened, hasLength(4));
  });

  testWidgets('a link closes the panel before its callback runs, by a tap '
      'and by Enter; a plain link closes an open panel too', (tester) async {
    final log = <String>[];
    await tester.pumpWidget(
      harness(
        NavigationMenu<String>(
          label: 'Main',
          onOpenChanged: (value) => log.add('open $value'),
          items: [
            NavigationMenuItem.panel(
              value: 'products',
              label: 'Products',
              links: [
                NavigationMenuLink(
                  label: 'Analytics',
                  onPressed: () => log.add('analytics'),
                ),
              ],
            ),
            NavigationMenuItem.link(
              value: 'pricing',
              label: 'Pricing',
              onPressed: () => log.add('pricing'),
            ),
          ],
        ),
      ),
    );
    await tester.tap(_products);
    await tester.pump();
    await tester.tap(find.text('Analytics'));
    await tester.pump();
    expect(_shows('Analytics'), isFalse);
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(_shows('Analytics'), isFalse);
    await tester.tap(_products);
    await tester.pump();
    await focusOn(tester, find.text('Pricing'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(_shows('Analytics'), isFalse);
    // The close is committed and reported before each callback runs.
    expect(log, [
      for (final link in ['analytics', 'analytics', 'pricing']) ...[
        'open products',
        'open null',
        link,
      ],
    ]);
  });

  testWidgets('a link leaves focus where its callback puts it, never back on '
      'the trigger by itself', (tester) async {
    final page = FocusNode(debugLabel: 'page');
    addTearDown(page.dispose);
    await tester.pumpWidget(
      harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NavigationMenu<String>(
              label: 'Main',
              items: [
                NavigationMenuItem.panel(
                  value: 'products',
                  label: 'Products',
                  links: [
                    NavigationMenuLink(
                      label: 'Analytics',
                      onPressed: page.requestFocus,
                    ),
                  ],
                ),
              ],
            ),
            Focus(focusNode: page, child: const Text('Page')),
          ],
        ),
      ),
    );
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Analytics')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await pumpFocus(tester);
    await pumpFocus(tester);
    expect(_shows('Analytics'), isFalse);
    expect(page.hasPrimaryFocus, isTrue);
    expect(focusedOn(tester, _products), isFalse);
  });

  testWidgets('a link whose callback leaves focus nowhere hands it to the '
      'trigger; a trigger that is gone takes nothing', (tester) async {
    final withPanel = ValueNotifier<bool>(true);
    addTearDown(withPanel.dispose);
    final opened = <String>[];
    final early = <bool>[];
    await tester.pumpWidget(
      harness(
        ValueListenableBuilder<bool>(
          valueListenable: withPanel,
          builder: (context, panel, _) => NavigationMenu<String>(
            label: 'Main',
            items: [
              if (panel)
                NavigationMenuItem.panel(
                  value: 'products',
                  label: 'Products',
                  links: [
                    NavigationMenuLink(
                      label: 'Analytics',
                      onPressed: () {
                        opened.add('analytics');
                        // What focus does before any frame: the trigger
                        // only takes it as the safety net, a frame later.
                        Future.microtask(
                          () => early.add(focusedOn(tester, _products)),
                        );
                      },
                    ),
                    NavigationMenuLink(
                      label: 'Automation',
                      // The page this link opens has no panel item.
                      onPressed: () => withPanel.value = false,
                    ),
                  ],
                ),
              NavigationMenuItem.link(
                value: 'pricing',
                label: 'Pricing',
                onPressed: () {},
              ),
            ],
          ),
        ),
      ),
    );
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await pumpFocus(tester);
    await pumpFocus(tester);
    expect(opened, ['analytics']);
    expect(early, [false]);
    expect(_shows('Analytics'), isFalse);
    expect(focusedOn(tester, _products), isTrue, reason: 'the safety net');

    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    await focusOn(tester, find.text('Automation'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await pumpFocus(tester);
    await pumpFocus(tester);
    expect(tester.takeException(), isNull);
    expect(_products, findsNothing);
    expect(focusedOn(tester, find.text('Pricing')), isFalse);
  });

  testWidgets('the first click keeps a panel the pointer opened; leaving '
      'then closes nothing; the next click closes it', (tester) async {
    final reports = <String?>[];
    await tester.pumpWidget(_menu(onOpenChanged: reports.add));
    final mouse = await _mouse(tester);
    await mouse.moveTo(tester.getCenter(_products));
    await tester.pump(const Duration(milliseconds: 160));
    expect(_shows('Analytics'), isTrue, reason: 'hover opened it');
    await mouse.down(tester.getCenter(_products));
    await mouse.up();
    await tester.pump();
    expect(_shows('Analytics'), isTrue, reason: 'the click keeps it');
    await mouse.moveTo(const Offset(5, 5));
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Analytics'), isTrue, reason: 'leaving closes nothing');
    // Hovering another trigger switches, and the menu stays kept.
    await mouse.moveTo(tester.getCenter(_resources));
    await tester.pump();
    await mouse.moveTo(const Offset(5, 5));
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Docs'), isTrue);
    await mouse.moveTo(tester.getCenter(_resources));
    await mouse.down(tester.getCenter(_resources));
    await mouse.up();
    await tester.pump();
    expect(_shows('Docs'), isFalse, reason: 'the second click closes');
    expect(reports, ['products', 'resources', null]);
  });

  testWidgets('a click opens a panel and keeps it; Escape and a press '
      'outside close a kept panel', (tester) async {
    await tester.pumpWidget(_menu());
    final mouse = await _mouse(tester);
    await mouse.moveTo(tester.getCenter(_products));
    await mouse.down(tester.getCenter(_products));
    await mouse.up();
    await mouse.moveTo(const Offset(5, 5));
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Analytics'), isTrue);
    await focusOn(tester, _products);
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pump();
    expect(_shows('Analytics'), isFalse);

    await tester.tap(_products);
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Analytics'), isTrue);
    await tester.tapAt(const Offset(5, 5));
    await tester.pump(const Duration(milliseconds: 400));
    expect(_shows('Analytics'), isFalse);
  });

  for (final close in ['click', 'Escape']) {
    testWidgets('after a $close closes the panel, the resting pointer opens '
        'nothing; leaving the trigger re-arms hover', (tester) async {
      await tester.pumpWidget(_menu());
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(_products));
      await tester.pump(const Duration(milliseconds: 160));
      expect(_shows('Analytics'), isTrue);
      if (close == 'click') {
        // The first click keeps the panel, the second closes it.
        for (var i = 0; i < 2; i++) {
          await mouse.down(tester.getCenter(_products));
          await mouse.up();
          await tester.pump();
        }
      } else {
        await focusOn(tester, _products);
        await tester.sendKeyEvent(LogicalKeyboardKey.escape);
        await tester.pump();
      }
      expect(_shows('Analytics'), isFalse);
      await mouse.moveBy(const Offset(2, 1));
      await tester.pump(const Duration(milliseconds: 400));
      expect(_shows('Analytics'), isFalse, reason: 'the pointer stayed');
      await mouse.moveTo(const Offset(5, 5));
      await tester.pump();
      await mouse.moveTo(tester.getCenter(_products));
      await tester.pump(const Duration(milliseconds: 160));
      expect(_shows('Analytics'), isTrue, reason: 'hover is re-armed');
    });
  }

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
    expect(pricing.getSemanticsData().flagsCollection.isLink, isTrue);

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
    expect(analytics.getSemanticsData().flagsCollection.isLink, isTrue);
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

  group('current page', () {
    List<NavigationMenuItem<String>> items({String current = 'analytics'}) => [
      NavigationMenuItem.panel(
        value: 'products',
        label: 'Products',
        links: [
          NavigationMenuLink(
            label: 'Analytics',
            current: current == 'analytics',
            onPressed: () {},
          ),
          NavigationMenuLink(label: 'Automation', onPressed: () {}),
        ],
      ),
      NavigationMenuItem.panel(
        value: 'resources',
        label: 'Resources',
        links: [NavigationMenuLink(label: 'Docs', onPressed: () {})],
      ),
      NavigationMenuItem.link(
        value: 'pricing',
        label: 'Pricing',
        current: current == 'pricing',
        onPressed: () {},
      ),
    ];

    Widget build({
      String current = 'analytics',
      TextDirection direction = TextDirection.ltr,
      double textScale = 1,
      InvisibleThemeData? theme,
    }) => harness(
      NavigationMenu<String>(
        label: 'Main',
        items: items(current: current),
      ),
      direction: direction,
      textScale: textScale,
      theme: theme,
    );

    // The bar painted beside the colour, so the state never rests on
    // colour alone.
    bool marked(WidgetTester tester, String text) => tester
        .widgetList<CustomPaint>(
          find.ancestor(
            of: find.text(text),
            matching: find.byType(CustomPaint),
          ),
        )
        .any(
          (paint) => '${paint.foregroundPainter.runtimeType}' == '_CurrentMark',
        );

    Color colorOf(WidgetTester tester, String text) =>
        tester.widget<Text>(find.text(text)).style!.color!;

    testWidgets('only the current link is read as the current page; its '
        'trigger is marked on screen and read as before', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(build());
      final products = tester.getSemantics(_products);
      expect(products.value, isEmpty, reason: 'visual only');
      expect(products.label, 'Products');
      expect(marked(tester, 'Products'), isTrue);
      expect(marked(tester, 'Resources'), isFalse);
      expect(marked(tester, 'Pricing'), isFalse);
      expect(tester.getSemantics(find.text('Pricing')).value, isEmpty);

      await tester.tap(_products);
      await tester.pump();
      expect(
        tester.getSemantics(find.text('Analytics')),
        semanticsWith(label: 'Analytics', value: 'current page'),
      );
      expect(tester.getSemantics(find.text('Automation')).value, isEmpty);
      expect(marked(tester, 'Analytics'), isTrue);
      expect(marked(tester, 'Automation'), isFalse);
      expect(
        colorOf(tester, 'Analytics'),
        isNot(colorOf(tester, 'Automation')),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('a plain link in the bar can be the current page', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(build(current: 'pricing'));
      expect(
        tester.getSemantics(find.text('Pricing')),
        semanticsWith(label: 'Pricing', value: 'current page'),
      );
      expect(marked(tester, 'Pricing'), isTrue);
      expect(marked(tester, 'Products'), isFalse);
      semantics.dispose();
    });

    testWidgets('the mark of a current panel link sits at the inline-start '
        'edge, mirrored right to left', (tester) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(build(direction: direction));
        await tester.tap(_products);
        await tester.pump();
        final paint = find
            .ancestor(
              of: find.text('Analytics'),
              matching: find.byType(CustomPaint),
            )
            .first;
        final box = tester.renderObject<RenderBox>(paint);
        final width = box.size.width;
        final left = direction == TextDirection.ltr ? 0.0 : width - 2;
        expect(
          box,
          paints
            // The tint, then the mark.
            ..rrect()
            ..rrect(
              rrect: RRect.fromRectAndRadius(
                Rect.fromLTWH(left, 4, 2, box.size.height - 8),
                const Radius.circular(1),
              ),
            ),
          reason: direction.name,
        );
        await tester.tap(_products);
        await tester.pump();
      }
    });

    testWidgets('right to left at text scale 2.0 under touch: no overflow, '
        'labelled 44 by 44 targets', (tester) async {
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        build(
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.tap(_products);
      await tester.pump();
      expect(tester.takeException(), isNull);
      final semantics = tester.ensureSemantics();
      await tester.pump();
      expect(
        tester.getSemantics(find.text('Analytics')),
        semanticsWith(value: 'current page'),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline44));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('two current links fail an assertion', (tester) async {
      await tester.pumpWidget(
        harness(
          NavigationMenu<String>(
            label: 'Main',
            items: [
              NavigationMenuItem.panel(
                value: 'products',
                label: 'Products',
                links: [
                  NavigationMenuLink(
                    label: 'Analytics',
                    current: true,
                    onPressed: () {},
                  ),
                ],
              ),
              NavigationMenuItem.link(
                value: 'pricing',
                label: 'Pricing',
                current: true,
                onPressed: () {},
              ),
            ],
          ),
        ),
      );
      expect(tester.takeException(), isAssertionError);
    });
  });
}
