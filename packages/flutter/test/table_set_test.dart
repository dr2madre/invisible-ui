import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart' hide Table;
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

typedef _Row = Map<String, Object?>;

const List<TableColumn> _columns = [
  TableColumn(key: 'name', header: 'Name', sortable: true, hideable: false),
  TableColumn(key: 'city', header: 'City', sortable: true),
  TableColumn(key: 'plan', header: 'Plan'),
];

final List<_Row> _people = [
  for (final (i, name) in ['Carla', 'Anna', 'Bruno', 'Dario', 'Elena'].indexed)
    {'id': i + 1, 'name': name, 'city': 'City ${5 - i}', 'plan': 'Plan $i'},
];

String _label(_Row row) => row['name']! as String;

Widget _set(TableSet<_Row> set, {double width = 640}) => SizedBox(
  width: width,
  child: SingleChildScrollView(child: set),
);

/// The names shown, top to bottom.
List<String> _shown(WidgetTester tester) {
  final names = [
    for (final row in _people)
      if (find.text(row['name']! as String).evaluate().isNotEmpty)
        row['name']! as String,
  ];
  names.sort(
    (a, b) => tester
        .getTopLeft(find.text(a).first)
        .dy
        .compareTo(tester.getTopLeft(find.text(b).first).dy),
  );
  return names;
}

void main() {
  testWidgets('the first sortable column sorts by default; a header press '
      'switches between ascending and descending, reported once each', (
    tester,
  ) async {
    final reports = <TableSort?>[];
    await tester.pumpWidget(
      harness(
        _set(
          TableSet<_Row>(
            caption: 'Customers',
            columns: _columns,
            rows: _people,
            onSortChanged: reports.add,
          ),
        ),
      ),
    );
    expect(_shown(tester), ['Anna', 'Bruno', 'Carla', 'Dario', 'Elena']);
    await tester.tap(find.text('Name'));
    await tester.pump();
    expect(_shown(tester), ['Elena', 'Dario', 'Carla', 'Bruno', 'Anna']);
    await tester.tap(find.text('Name'));
    await tester.pump();
    expect(_shown(tester).first, 'Anna');
    await tester.tap(find.text('City'));
    await tester.pump();
    expect(_shown(tester).first, 'Elena');
    expect(reports, const [
      TableSort('name', SortDirection.descending),
      TableSort('name', SortDirection.ascending),
      TableSort('city', SortDirection.ascending),
    ]);
  });

  testWidgets('settings are controllable mirrors: a changed value shows '
      'without a report, an unchanged rebuild keeps the user\'s choice', (
    tester,
  ) async {
    final pages = <int>[];
    final sorts = <TableSort?>[];
    Widget build({int page = 1, TableSort? sort, String title = 'A'}) =>
        harness(
          _set(
            TableSet<_Row>(
              title: title,
              columns: _columns,
              rows: _people,
              pageSize: 2,
              page: page,
              sort: sort,
              onPageChanged: pages.add,
              onSortChanged: sorts.add,
            ),
          ),
        );
    await tester.pumpWidget(build());
    expect(_shown(tester), ['Anna', 'Bruno']);
    await tester.tap(find.text('2'));
    await tester.pump();
    expect(_shown(tester), ['Carla', 'Dario']);
    expect(pages, [2]);
    // An unrelated rebuild keeps page 2.
    await tester.pumpWidget(build(title: 'B'));
    expect(_shown(tester), ['Carla', 'Dario']);
    // A different page and sort from the app show without a report.
    await tester.pumpWidget(
      build(
        page: 3,
        sort: const TableSort('name', SortDirection.descending),
        title: 'B',
      ),
    );
    expect(_shown(tester), ['Anna']);
    expect(pages, [2]);
    expect(sorts, isEmpty);
  });

  testWidgets('rows that shrink under the current page show the last page, '
      'reported once', (tester) async {
    final pages = <int>[];
    Widget build(List<_Row> rows) => harness(
      _set(
        TableSet<_Row>(
          columns: _columns,
          rows: rows,
          pageSize: 2,
          page: 3,
          onPageChanged: pages.add,
        ),
      ),
    );
    await tester.pumpWidget(build(_people));
    expect(_shown(tester), ['Elena']);
    await tester.pumpWidget(build(_people.sublist(0, 3)));
    await tester.pump();
    expect(_shown(tester), ['Carla']);
    expect(pages, [2]);
    await tester.pump();
    expect(pages, [2]);
  });

  testWidgets('multiple selection: row checkboxes named from getRowLabel, a '
      'page-scoped select-all with a mixed state, ids outside the page '
      'kept', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <List<Object>>[];
    var selected = <Object>[99];
    await tester.pumpWidget(
      harness(
        StatefulBuilder(
          builder: (context, setState) => _set(
            TableSet<_Row>(
              columns: _columns,
              rows: _people,
              pageSize: 3,
              selectionMode: SelectionMode.multiple,
              selectedRowIds: selected,
              getRowLabel: _label,
              isRowSelectable: (row) => row['id'] != 3,
              onSelectedRowIdsChanged: (ids) {
                reports.add(ids);
                setState(() => selected = ids);
              },
            ),
          ),
        ),
      ),
    );
    final all = find.bySemanticsLabel('Select all visible rows');
    expect(
      tester.getSemantics(all),
      semanticsWith(hasCheckedState: true, isChecked: false),
    );
    await tester.tap(find.bySemanticsLabel('Select Anna'));
    await tester.pump();
    expect(reports.last, [99, 2]);
    expect(tester.getSemantics(all), semanticsWith(isCheckStateMixed: true));
    await tester.tap(all);
    await tester.pump();
    // Bruno (id 3) is not selectable: the scope is Anna and Carla.
    expect(reports.last, [99, 2, 1]);
    expect(find.bySemanticsLabel('Select Bruno'), findsNothing);
    expect(
      tester.getSemantics(all),
      semanticsWith(hasCheckedState: true, isChecked: true),
    );
    await tester.tap(all);
    await tester.pump();
    expect(reports.last, [99]);
    expect(reports, hasLength(3));
    semantics.dispose();
  });

  testWidgets('single selection replaces the row and has no select-all; '
      'the header is named', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <List<Object>>[];
    await tester.pumpWidget(
      harness(
        _set(
          TableSet<_Row>(
            columns: _columns,
            rows: _people,
            selectionMode: SelectionMode.single,
            selectedRowIds: const [1],
            getRowLabel: _label,
            onSelectedRowIdsChanged: reports.add,
          ),
        ),
      ),
    );
    expect(find.bySemanticsLabel('Select all visible rows'), findsNothing);
    expect(find.bySemanticsLabel('Selection'), findsOneWidget);
    await tester.tap(find.bySemanticsLabel('Select Anna'));
    await tester.pump();
    expect(reports.single, [2]);
    semantics.dispose();
  });

  testWidgets('selection without row labels fails in debug builds', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        _set(
          TableSet<_Row>(
            columns: _columns,
            rows: _people,
            selectionMode: SelectionMode.multiple,
          ),
        ),
      ),
    );
    expect(tester.takeException(), isA<FlutterError>());
  });

  testWidgets('no results: an empty state with the clear action; focus '
      'moves to the view when rows come back', (tester) async {
    final semantics = tester.ensureSemantics();
    var filtered = <_Row>[];
    var active = true;
    await tester.pumpWidget(
      harness(
        StatefulBuilder(
          builder: (context, setState) => _set(
            TableSet<_Row>(
              columns: _columns,
              rows: filtered,
              filtersActive: active,
              totalRowCount: _people.length,
              onClearFilters: () => setState(() {
                filtered = _people;
                active = false;
              }),
            ),
          ),
        ),
      ),
    );
    expect(find.text('No rows match the current filters'), findsOneWidget);
    await tester.tap(find.text('Clear filters'));
    await tester.pump();
    await tester.pump();
    expect(find.text('No rows match the current filters'), findsNothing);
    expect(_shown(tester), hasLength(5));
    final focused = FocusManager.instance.primaryFocus;
    expect(focused?.debugLabel, 'TableView');
    semantics.dispose();
  });

  testWidgets('an empty dataset is an empty table, not a no-results state', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        _set(
          TableSet<_Row>(
            columns: _columns,
            rows: const [],
            filtersActive: true,
            totalRowCount: 0,
          ),
        ),
      ),
    );
    expect(find.text('No rows match the current filters'), findsNothing);
    expect(find.text('Name'), findsOneWidget);
  });

  testWidgets('a filter change returns to page one, reported once; the '
      'selection stays; a new count is announced', (tester) async {
    final log = recordAnnouncements(tester);
    final pages = <int>[];
    final selections = <List<Object>>[];
    Widget build(List<_Row> rows, Object revision) => harness(
      _set(
        TableSet<_Row>(
          columns: _columns,
          rows: rows,
          pageSize: 2,
          page: 2,
          filtersActive: true,
          filterRevision: revision,
          selectionMode: SelectionMode.multiple,
          selectedRowIds: const [5],
          getRowLabel: _label,
          onPageChanged: pages.add,
          onSelectedRowIdsChanged: selections.add,
        ),
      ),
    );
    await tester.pumpWidget(build(_people, 'a'));
    await tester.pumpWidget(build(_people.sublist(0, 3), 'b'));
    await tester.pump();
    expect(pages, [1]);
    expect(selections, isEmpty);
    expect(log.single.message, '3 results');
    // The same revision again moves nothing.
    await tester.pumpWidget(build(_people.sublist(0, 3), 'b'));
    await tester.pump();
    expect(pages, [1]);
  });

  testWidgets('the card view is a named list of cards, with the select-all '
      'above it', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        _set(
          TableSet<_Row>(
            caption: 'Customers',
            columns: _columns,
            rows: _people,
            allowViewToggle: true,
            cardDescriptionKey: 'city',
            selectionMode: SelectionMode.multiple,
            getRowLabel: _label,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Cards'));
    await tester.pump();
    final root = tester.getSemantics(find.bySemanticsLabel('Customers'));
    SemanticsNode? list;
    void visit(SemanticsNode node) {
      if (node.getSemanticsData().role == SemanticsRole.list) list = node;
      node.visitChildren((child) {
        visit(child);
        return true;
      });
    }

    visit(root);
    expect(list, isNotNull);
    expect(list!.label, 'Customers');
    expect(list!.childrenCount, 5);
    expect(find.text('Plan 0'), findsOneWidget);
    expect(find.bySemanticsLabel('Select all visible rows'), findsOneWidget);
    expect(find.bySemanticsLabel('Select Carla'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('the column list hides a column; a column that cannot hide is '
      'disabled', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <List<String>>[];
    await tester.pumpWidget(
      appHarness(
        (_) => _set(
          TableSet<_Row>(
            title: 'Customers',
            columns: _columns,
            rows: _people,
            configurable: true,
            onHiddenColumnsChanged: reports.add,
          ),
        ),
      ),
    );
    expect(find.text('Plan'), findsOneWidget);
    await tester.tap(find.text('Columns'));
    await tester.pumpAndSettle();
    final name = find.descendant(
      of: find.byType(Checkbox),
      matching: find.text('Name'),
    );
    expect(
      tester.getSemantics(name),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    await tester.tap(
      find.descendant(of: find.byType(Checkbox), matching: find.text('Plan')),
    );
    await tester.pumpAndSettle();
    expect(reports.single, ['plan']);
    expect(
      find.descendant(
        of: find.byType(Table<_Row>),
        matching: find.text('Plan'),
      ),
      findsNothing,
    );
    expect(find.bySemanticsLabel('Customers'), findsWidgets);
    semantics.dispose();
  });

  testWidgets('views are tabs: a tab reports its id, a changed active view '
      'shows without a report, a view that goes gives way to the first', (
    tester,
  ) async {
    final reports = <String>[];
    Widget build(List<TableSetView<_Row>> views, {String? active}) => harness(
      _set(
        TableSet<_Row>(
          title: 'People',
          views: views,
          activeView: active,
          onViewChanged: reports.add,
        ),
      ),
    );
    final views = [
      TableSetView<_Row>(
        id: 'a',
        label: 'Team A',
        columns: _columns,
        rows: _people.sublist(0, 2),
      ),
      TableSetView<_Row>(
        id: 'b',
        label: 'Team B',
        columns: _columns,
        rows: _people.sublist(2),
      ),
    ];
    await tester.pumpWidget(build(views));
    expect(_shown(tester), ['Anna', 'Carla']);
    await tester.tap(find.text('Team B'));
    await tester.pump();
    expect(_shown(tester), ['Bruno', 'Dario', 'Elena']);
    expect(reports, ['b']);
    await tester.pumpWidget(build(views, active: 'a'));
    expect(_shown(tester), ['Anna', 'Carla']);
    await tester.pumpWidget(build([views.last], active: 'a'));
    expect(_shown(tester), ['Bruno', 'Dario', 'Elena']);
    expect(reports, ['b']);
  });

  testWidgets('loading more: the button asks once, then waits; loading is '
      'announced', (tester) async {
    final log = recordAnnouncements(tester);
    var asked = 0;
    Widget build({required bool loading}) => harness(
      _set(
        TableSet<_Row>(
          columns: _columns,
          rows: _people,
          infinite: true,
          hasMore: true,
          loading: loading,
          onLoadMore: () => asked++,
        ),
      ),
    );
    await tester.pumpWidget(build(loading: false));
    await tester.tap(find.text('Load more'));
    expect(asked, 1);
    await tester.pumpWidget(build(loading: true));
    await tester.pump();
    expect(log.single.message, 'Loading…');
    expect(find.text('Loading…'), findsNWidgets(2));
    await tester.tap(find.byType(Button));
    expect(asked, 1);
  });

  testWidgets('narrow at text scale 2.0 and right to left: nothing '
      'overflows; targets 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      appHarness(
        (_) => _set(
          TableSet<_Row>(
            title: 'Customers',
            columns: _columns,
            rows: _people,
            pageSize: 2,
            allowViewToggle: true,
            configurable: true,
            selectionMode: SelectionMode.multiple,
            getRowLabel: _label,
          ),
          width: 320,
        ),
        textScale: 2,
        direction: TextDirection.rtl,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await tester.pump();
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Cards'));
    await tester.pump();
    expect(tester.takeException(), isNull);
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
