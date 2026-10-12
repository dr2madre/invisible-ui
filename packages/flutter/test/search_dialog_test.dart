import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

Future<String?>? _result;

final GlobalKey<NavigatorState> _navigator = GlobalKey<NavigatorState>();

const List<SearchDialogItem<String>> _items = [
  SearchDialogItem(
    value: 'save',
    label: 'Save',
    group: 'Actions',
    shortcut: ['⌘', 'S'],
  ),
  SearchDialogItem(value: 'home', label: 'Home', group: 'Pages'),
  SearchDialogItem(value: 'help', label: 'Help'),
  SearchDialogItem(
    value: 'share',
    label: 'Share',
    group: 'Actions',
    disabled: true,
  ),
  SearchDialogItem(value: 'settings', label: 'Settings', group: 'Pages'),
];

Widget _page(
  WidgetBuilder dialog, {
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
}) => WidgetsApp(
  navigatorKey: _navigator,
  color: const Color(0xFF000000),
  pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (context, _, _) => builder(context),
  ),
  builder: (context, child) => MediaQuery(
    data: MediaQuery.of(
      context,
    ).copyWith(textScaler: TextScaler.linear(textScale)),
    child: Directionality(
      textDirection: direction,
      child: InvisibleTheme(
        data: theme ?? InvisibleThemeData.light(),
        child: child!,
      ),
    ),
  ),
  home: Builder(
    builder: (context) => Center(
      child: Button(
        onPressed: () => _result = showInvisibleDialog<String>(
          context: context,
          builder: dialog,
        ),
        child: const Text('Open'),
      ),
    ),
  ),
);

/// Opens from the keyboard, so the trigger holds focus.
Future<void> _open(WidgetTester tester) async {
  await tester.sendKeyEvent(LogicalKeyboardKey.tab);
  await tester.sendKeyEvent(LogicalKeyboardKey.enter);
  await tester.pumpAndSettle();
}

final Finder _editable = find.byType(EditableText);

bool _fieldFocused(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).focusNode.hasPrimaryFocus;

/// The labels of the results shown, top to bottom.
List<String> _shown(WidgetTester tester) {
  final labels = [
    for (final item in _items)
      if (find.text(item.label).evaluate().isNotEmpty) item.label,
  ];
  labels.sort(
    (a, b) => tester
        .getTopLeft(find.text(a))
        .dy
        .compareTo(tester.getTopLeft(find.text(b)).dy),
  );
  return labels;
}

/// The highlighted result: the one with a ring.
String? _active(WidgetTester tester) {
  for (final item in _items) {
    final finder = find.text(item.label);
    if (finder.evaluate().isEmpty) continue;
    final ringed = tester
        .widgetList<DecoratedBox>(
          find.ancestor(of: finder, matching: find.byType(DecoratedBox)),
        )
        .any((box) {
          final d = box.decoration;
          return d is BoxDecoration &&
              d.border is Border &&
              (d.border! as Border).top.width == 2 &&
              d.boxShadow == null;
        });
    if (ringed) return item.value;
  }
  return null;
}

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await tester.pump();
}

SearchDialog<String> _search({
  List<SearchDialogItem<String>> items = _items,
  List<SearchDialogItem<String>> suggestions = const [],
  bool loading = false,
  ValueChanged<String>? onSelected,
  ValueChanged<String>? onQueryChanged,
}) => SearchDialog<String>(
  items: items,
  suggestions: suggestions,
  loading: loading,
  onSelected: onSelected,
  onQueryChanged: onQueryChanged,
);

void main() {
  tearDown(() => _result = null);

  group('opening and semantics', () {
    testWidgets('focus goes to the field; the hidden title names the dialog; '
        'ungrouped results first, then groups in order', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      expect(_fieldFocused(tester), isTrue);
      final dialog = tester.getSemantics(
        find
            .byWidgetPredicate(
              (widget) =>
                  widget is Semantics && widget.properties.namesRoute == true,
            )
            .last,
      );
      expect(dialog, semanticsWith(label: 'Search', namesRoute: true));
      expect(dialog.getSemanticsData().role, SemanticsRole.dialog);
      expect(find.text('Search'), findsNothing, reason: 'the title is hidden');
      expect(
        editableSemantics(tester, find.byType(SearchDialog<String>)),
        semanticsWith(
          label: 'Search',
          hint: 'Type to search…',
          isTextField: true,
          isExpanded: true,
        ),
      );
      expect(_shown(tester), ['Help', 'Save', 'Share', 'Home', 'Settings']);
      for (final group in ['Actions', 'Pages']) {
        expect(
          find.byWidgetPredicate(
            (widget) => widget is Semantics && widget.properties.label == group,
          ),
          findsOneWidget,
        );
      }
      expect(_active(tester), isNull, reason: 'nothing highlighted on open');
      semantics.dispose();
    });

    testWidgets('a shortcut shows as keycaps and is part of the name', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      expect(find.byType(Kbd), findsOneWidget);
      expect(find.bySemanticsLabel('Save ⌘ S'), findsOneWidget);
      semantics.dispose();
    });
  });

  group('searching', () {
    testWidgets('typing filters, highlights the first enabled result and '
        'announces each change of the count', (tester) async {
      final said = recordAnnouncements(tester);
      final queries = <String>[];
      await tester.pumpWidget(
        _page((_) => _search(onQueryChanged: queries.add)),
      );
      await _open(tester);
      await tester.enterText(_editable, 'sh');
      await tester.pump();
      await tester.pump();
      expect(_shown(tester), ['Share']);
      expect(_active(tester), isNull, reason: 'Share is disabled');
      expect(said.last, (message: '1 result available', assertive: false));
      await tester.enterText(_editable, 's');
      await tester.pump();
      await tester.pump();
      expect(_shown(tester), ['Save', 'Share', 'Settings']);
      expect(_active(tester), 'save');
      expect(said.last.message, '3 results available');
      await tester.enterText(_editable, 'zzz');
      await tester.pump();
      await tester.pump();
      expect(find.text('No results found.'), findsOneWidget);
      expect(said.last.message, 'No results found.');
      expect(queries, ['sh', 's', 'zzz']);
    });

    testWidgets('Down and Up cross groups in display order, skip disabled '
        'results, wrap, and announce the highlight', (tester) async {
      final said = recordAnnouncements(tester);
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_active(tester), 'help');
      expect(said.last.message, 'Help');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_active(tester), 'home', reason: 'Share is disabled');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_active(tester), 'help');
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_active(tester), 'settings');
    });

    testWidgets('suggestions show while the query is empty', (tester) async {
      await tester.pumpWidget(
        _page(
          (_) => _search(
            suggestions: const [
              SearchDialogItem(value: 'home', label: 'Home', group: 'Recent'),
            ],
          ),
        ),
      );
      await _open(tester);
      expect(_shown(tester), ['Home']);
      expect(find.text('RECENT'), findsOneWidget);
      await tester.enterText(_editable, 'he');
      await tester.pump();
      expect(_shown(tester), ['Help']);
    });

    testWidgets('loading shows an indicator, announces it and holds the empty '
        'text', (tester) async {
      final said = recordAnnouncements(tester);
      final loading = ValueNotifier(false);
      addTearDown(loading.dispose);
      await tester.pumpWidget(
        _page(
          (_) => ValueListenableBuilder<bool>(
            valueListenable: loading,
            builder: (context, value, _) =>
                _search(items: const [], loading: value),
          ),
        ),
      );
      await _open(tester);
      expect(find.text('No results found.'), findsOneWidget);
      loading.value = true;
      await tester.pump();
      await tester.pump();
      expect(find.byType(Loading), findsOneWidget);
      expect(find.text('No results found.'), findsNothing);
      expect(said.last.message, 'Searching…');
    });

    testWidgets('focus leaving the field keeps the query and the dialog', (
      tester,
    ) async {
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      await tester.enterText(_editable, 'ho');
      await tester.pump();
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();
      expect(find.byType(SearchDialog<String>), findsOneWidget);
      expect(tester.widget<EditableText>(_editable).controller.text, 'ho');
    });
  });

  group('choosing', () {
    testWidgets('Enter chooses: the dialog closes first, then reports, and '
        'focus returns to the trigger', (tester) async {
      final seen = <(String, bool)>[];
      await tester.pumpWidget(
        _page(
          (_) => _search(
            onSelected: (value) =>
                seen.add((value, _navigator.currentState!.canPop())),
          ),
        ),
      );
      await _open(tester);
      await tester.enterText(_editable, 'set');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(seen, [('settings', false)]);
      expect(await _result, 'settings');
      expect(
        Focus.of(tester.element(find.text('Open'))).hasPrimaryFocus,
        isTrue,
      );
    });

    testWidgets('Enter that ends an input method composition chooses '
        'nothing', (tester) async {
      final seen = <String>[];
      await tester.pumpWidget(_page((_) => _search(onSelected: seen.add)));
      await _open(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      tester.testTextInput.updateEditingValue(
        const TextEditingValue(
          text: 'へ',
          selection: TextSelection.collapsed(offset: 1),
          composing: TextRange(start: 0, end: 1),
        ),
      );
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(seen, isEmpty);
    });

    testWidgets('a press on a result chooses it; a disabled one does nothing', (
      tester,
    ) async {
      final seen = <String>[];
      await tester.pumpWidget(_page((_) => _search(onSelected: seen.add)));
      await _open(tester);
      await tester.tap(find.text('Share'));
      await tester.pump();
      expect(seen, isEmpty);
      await tester.tap(find.text('Home'));
      await tester.pumpAndSettle();
      expect(seen, ['home']);
      expect(find.byType(SearchDialog<String>), findsNothing);
    });

    testWidgets('Escape closes with nothing chosen', (tester) async {
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      await tester.enterText(_editable, 'ho');
      await _key(tester, LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.byType(SearchDialog<String>), findsNothing);
      expect(await _result, isNull);
    });

    testWidgets('new items keep the highlight while it is still listed', (
      tester,
    ) async {
      final items = ValueNotifier<List<SearchDialogItem<String>>>(_items);
      addTearDown(items.dispose);
      await tester.pumpWidget(
        _page(
          (_) => ValueListenableBuilder(
            valueListenable: items,
            builder: (context, value, _) => _search(items: value),
          ),
        ),
      );
      await _open(tester);
      await tester.enterText(_editable, 'h');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_active(tester), 'home');
      items.value = [..._items.where((item) => item.value != 'help')];
      await tester.pump();
      expect(_active(tester), 'home');
      items.value = [..._items.where((item) => item.value != 'home')];
      await tester.pump();
      expect(_active(tester), isNull);
    });
  });

  group('dialog', () {
    testWidgets('the query starts empty on every opening', (tester) async {
      await tester.pumpWidget(_page((_) => _search()));
      await _open(tester);
      await tester.enterText(_editable, 'ho');
      await _key(tester, LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      await _open(tester);
      expect(tester.widget<EditableText>(_editable).controller.text, '');
    });

    testWidgets('the search row shows the focus ring; a notice sits after '
        'the results and takes no focus', (tester) async {
      final controller = DialogController();
      await tester.pumpWidget(
        _page(
          (_) => SearchDialog<String>(items: _items, controller: controller),
        ),
      );
      await _open(tester);
      final ring = tester.widget<FocusRingPainter>(
        find
            .ancestor(of: _editable, matching: find.byType(FocusRingPainter))
            .first,
      );
      expect(ring.visible, isTrue);
      controller.notify(title: 'Search is offline');
      await tester.pump();
      expect(
        tester.getTopLeft(find.text('Search is offline')).dy,
        greaterThan(tester.getBottomLeft(find.text('Settings')).dy),
      );
      expect(_fieldFocused(tester), isTrue);
    });
  });

  group('layout', () {
    testWidgets('right to left at text scale 2.0 on a narrow screen: no '
        'overflow; 44 by 44 targets under touch; contrast', (tester) async {
      tester.view.physicalSize = const Size(320, 720);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _page(
          (_) => _search(),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await _open(tester);
      expect(tester.takeException(), isNull);
      await expectLater(tester, meetsGuideline(targetGuideline44));
      semantics.dispose();
    });

    testWidgets('text contrast, light and dark', (tester) async {
      final semantics = tester.ensureSemantics();
      for (final theme in [
        InvisibleThemeData.light(),
        InvisibleThemeData.dark(),
      ]) {
        await tester.pumpWidget(_page((_) => _search(), theme: theme));
        await _open(tester);
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await tester.sendKeyEvent(LogicalKeyboardKey.escape);
        await tester.pumpAndSettle();
      }
      semantics.dispose();
    });
  });
}
