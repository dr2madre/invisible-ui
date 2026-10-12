import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

final GlobalKey<NavigatorState> _navigator = GlobalKey<NavigatorState>();

const List<SidebarSection<String>> _sections = [
  SidebarSection(
    label: 'Workspace',
    items: [
      SidebarItem(value: 'home', label: 'Home', icon: Glyph(GlyphShape.home)),
      SidebarItem(value: 'inbox', label: 'Inbox', icon: Glyph(GlyphShape.home)),
    ],
  ),
];

/// A page with a header button that opens the drawer, and a second button
/// to hold focus elsewhere.
Widget _page({
  required ValueChanged<String> onSelected,
  bool closeOnNavigate = true,
  FocusNode? returnFocus,
  FocusNode? elsewhere,
  TextDirection direction = TextDirection.ltr,
}) => WidgetsApp(
  navigatorKey: _navigator,
  color: const Color(0xFF000000),
  pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (context, _, _) => builder(context),
  ),
  builder: (context, child) => Directionality(
    textDirection: direction,
    child: InvisibleTheme(data: InvisibleThemeData.light(), child: child!),
  ),
  home: Builder(
    builder: (context) => Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Button(
            focusNode: returnFocus,
            onPressed: () => showSidebarDrawer<String>(
              context: context,
              closeOnNavigate: closeOnNavigate,
              returnFocus: returnFocus,
              builder: (context) => Sidebar<String>(
                sections: _sections,
                value: 'home',
                collapsed: true,
                onCollapsedChanged: (_) {},
                onSelected: onSelected,
              ),
            ),
            child: Text(InvisibleTheme.of(context).messages.sidebarOpen),
          ),
          Button(
            focusNode: elsewhere,
            onPressed: () {},
            child: const Text('Elsewhere'),
          ),
        ],
      ),
    ),
  ),
);

Future<void> _open(WidgetTester tester) async {
  await tester.sendKeyEvent(LogicalKeyboardKey.tab);
  await tester.sendKeyEvent(LogicalKeyboardKey.enter);
  await tester.pumpAndSettle();
}

final Finder _panel = find.byWidgetPredicate(
  (widget) =>
      widget is DecoratedBox &&
      widget.decoration is BoxDecoration &&
      (widget.decoration as BoxDecoration).boxShadow != null,
);

void main() {
  testWidgets('a modal sheet named like the navigation, at the inline-start '
      'edge, with labels and no rail toggle', (tester) async {
    final semantics = tester.ensureSemantics();
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(_page(onSelected: (_) {}, direction: direction));
      await tester.tap(find.text('Open the navigation'));
      await tester.pumpAndSettle();
      final dialog = tester.getSemantics(
        find
            .byWidgetPredicate(
              (widget) =>
                  widget is Semantics && widget.properties.namesRoute == true,
            )
            .last,
      );
      expect(dialog, semanticsWith(label: 'Main', namesRoute: true));
      expect(dialog.getSemanticsData().role, SemanticsRole.dialog);
      final rect = tester.getRect(_panel);
      if (direction == TextDirection.ltr) {
        expect(rect.left, 0);
      } else {
        expect(rect.right, 800);
      }
      expect(find.text('Inbox'), findsOneWidget, reason: 'labels show');
      expect(find.bySemanticsLabel('Expand the navigation'), findsNothing);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
    }
    semantics.dispose();
  });

  testWidgets('following a destination closes the drawer first, then '
      'reports; focus returns to the button that opened it', (tester) async {
    final seen = <(String, bool)>[];
    await tester.pumpWidget(
      _page(
        onSelected: (value) =>
            seen.add((value, _navigator.currentState!.canPop())),
      ),
    );
    await _open(tester);
    await tester.tap(find.text('Inbox'));
    await tester.pumpAndSettle();
    expect(seen, [('inbox', false)]);
    expect(find.byType(SheetDialog), findsNothing);
    expect(
      Focus.of(
        tester.element(find.text('Open the navigation')),
      ).hasPrimaryFocus,
      isTrue,
    );
  });

  testWidgets('closeOnNavigate false keeps it open and still reports', (
    tester,
  ) async {
    final seen = <String>[];
    await tester.pumpWidget(
      _page(onSelected: seen.add, closeOnNavigate: false),
    );
    await _open(tester);
    await tester.tap(find.text('Inbox'));
    await tester.pumpAndSettle();
    expect(seen, ['inbox']);
    expect(find.byType(SheetDialog), findsOneWidget);
  });

  testWidgets('returnFocus names where focus goes when focus was elsewhere at '
      'the opening', (tester) async {
    final opener = FocusNode(debugLabel: 'Opener');
    final elsewhere = FocusNode(debugLabel: 'Elsewhere');
    addTearDown(opener.dispose);
    addTearDown(elsewhere.dispose);
    await tester.pumpWidget(
      _page(onSelected: (_) {}, returnFocus: opener, elsewhere: elsewhere),
    );
    // Opened by something other than its button: focus sits elsewhere.
    elsewhere.requestFocus();
    await tester.pump();
    await tester.tap(find.text('Open the navigation'));
    elsewhere.requestFocus();
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(opener.hasPrimaryFocus, isTrue);
  });
}
