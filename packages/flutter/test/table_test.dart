import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' hide Table;
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

typedef _Row = Map<String, Object?>;

const List<TableColumn> _columns = [
  TableColumn(key: 'name', header: 'Name', sortable: true),
  TableColumn(key: 'role', header: 'Role'),
  TableColumn(key: 'age', header: 'Age', sortable: true, align: TableAlign.end),
];

const List<_Row> _rows = [
  {'id': 1, 'name': 'Carla', 'role': 'Design', 'age': 41},
  {'id': 2, 'name': 'Anna', 'role': 'Engineering', 'age': 29},
  {'id': 3, 'name': 'Bruno', 'role': 'Research', 'age': 35},
];

/// A table whose parent holds the sort with the three-state cycle.
class _SortedTable extends StatefulWidget {
  const _SortedTable({this.reports});

  final List<String>? reports;

  @override
  State<_SortedTable> createState() => _SortedTableState();
}

class _SortedTableState extends State<_SortedTable> {
  TableSort? sort;

  @override
  Widget build(BuildContext context) {
    return Table<_Row>(
      caption: 'Team',
      columns: _columns,
      rows: sortRows(_rows, sort, (row, key) => row[key]),
      sort: sort,
      onSortToggle: (key) {
        widget.reports?.add(key);
        setState(() => sort = nextSort(sort, key));
      },
    );
  }
}

List<String?> _names(WidgetTester tester) =>
    [
      for (final row in _rows)
        if (find.text(row['name']! as String).evaluate().isNotEmpty)
          row['name'] as String?,
    ]..sort(
      (a, b) => tester
          .getTopLeft(find.text(a!))
          .dy
          .compareTo(tester.getTopLeft(find.text(b!)).dy),
    );

SemanticsNode? _find(SemanticsNode node, bool Function(SemanticsData) test) {
  if (test(node.getSemanticsData())) return node;
  SemanticsNode? found;
  node.visitChildren((child) {
    found ??= _find(child, test);
    return found == null;
  });
  return found;
}

void main() {
  testWidgets('semantics: a table named by its caption, with rows, column '
      'headers and cells', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 500,
          child: Table<_Row>(
            caption: 'Team',
            columns: _columns,
            rows: _rows,
            sort: const TableSort('name', SortDirection.ascending),
            onSortToggle: (_) {},
          ),
        ),
      ),
    );
    final root = tester.getSemantics(find.bySemanticsLabel('Team'));
    final table = _find(root, (d) => d.role == SemanticsRole.table)!;
    expect(table.childrenCount, 4);
    final rows = <SemanticsNode>[];
    table.visitChildren((row) {
      rows.add(row);
      return true;
    });
    expect(
      rows.every((r) => r.getSemanticsData().role == SemanticsRole.row),
      isTrue,
    );
    final header = <SemanticsRole>[];
    rows.first.visitChildren((cell) {
      header.add(cell.getSemanticsData().role);
      return true;
    });
    expect(header, List.filled(3, SemanticsRole.columnHeader));
    final cells = <String>[];
    rows[1].visitChildren((cell) {
      expect(cell.getSemanticsData().role, SemanticsRole.cell);
      cells.add(cell.getSemanticsData().label);
      return true;
    });
    expect(cells, ['Carla', 'Design', '41']);
    expect(
      _find(root, (d) => d.label == 'Team' && d.role != SemanticsRole.table),
      isNotNull,
    );
    // The visible caption is not read a second time.
    expect(find.bySemanticsLabel('Team'), findsOneWidget);
    expect(
      tester.getSemantics(find.bySemanticsLabel('Name')),
      semanticsWith(
        isButton: true,
        value: 'sorted ascending',
        isFocusable: true,
        hasTapAction: true,
      ),
    );
    // A sortable header not sorted now reads no sort; a plain header is no
    // button.
    expect(tester.getSemantics(find.bySemanticsLabel('Age')).value, '');
    expect(
      tester.getSemantics(find.bySemanticsLabel('Role')),
      isNot(semanticsWith(isButton: true)),
    );
    semantics.dispose();
  });

  testWidgets('a header press reports its key once; the new sort is shown '
      'and announced', (tester) async {
    final semantics = tester.ensureSemantics();
    final log = recordAnnouncements(tester);
    final reports = <String>[];
    await tester.pumpWidget(
      harness(SizedBox(width: 500, child: _SortedTable(reports: reports))),
    );
    expect(_names(tester), ['Carla', 'Anna', 'Bruno']);
    await tester.tap(find.bySemanticsLabel('Name'));
    await tester.pump();
    expect(reports, ['name']);
    expect(_names(tester), ['Anna', 'Bruno', 'Carla']);
    expect(log.single.message, 'Name, sorted ascending');
    await tester.tap(find.bySemanticsLabel('Name'));
    await tester.pump();
    expect(_names(tester), ['Carla', 'Bruno', 'Anna']);
    expect(log.last.message, 'Name, sorted descending');
    expect(
      tester.getSemantics(find.bySemanticsLabel('Name')).value,
      'sorted descending',
    );
    // The third press clears the sort: the order comes back, nothing is
    // said.
    await tester.tap(find.bySemanticsLabel('Name'));
    await tester.pump();
    expect(_names(tester), ['Carla', 'Anna', 'Bruno']);
    expect(log, hasLength(2));
    semantics.dispose();
  });

  testWidgets('Enter and Space press a focused header', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(SizedBox(width: 500, child: _SortedTable(reports: reports))),
    );
    await focusOn(tester, find.text('Age'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['age', 'age']);
  });

  testWidgets('a cell builder and a value reader build the cells; a hidden '
      'caption still names the table', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 500,
          child: Table<(String, int)>(
            caption: 'Scores',
            hideCaption: true,
            columns: const [
              TableColumn(key: 'player', header: 'Player'),
              TableColumn(key: 'score', header: 'Score'),
            ],
            rows: const [('Ann', 3), ('Bo', 7)],
            getValue: (row, key) => key == 'player' ? row.$1 : row.$2,
            getRowId: (row, _) => row.$1,
            cellBuilder: (context, cell) => cell.column.key == 'score'
                ? Text('${cell.value} pts')
                : Text('${cell.value}'),
          ),
        ),
      ),
    );
    expect(find.text('7 pts'), findsOneWidget);
    expect(find.text('Scores'), findsNothing);
    expect(find.bySemanticsLabel('Scores'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('the selection column holds the app\'s controls', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 500,
          child: Table<_Row>(
            columns: _columns,
            rows: _rows,
            selectionColumn: true,
            selectionHeader: const Text('All'),
            isRowSelected: (row, _) => row['id'] == 2,
            selectionCellBuilder: (context, row, id, _) => Text('pick $id'),
          ),
        ),
      ),
    );
    expect(find.text('All'), findsOneWidget);
    expect(find.text('pick 1'), findsOneWidget);
    expect(find.text('pick 3'), findsOneWidget);
    expect(
      tester.getTopLeft(find.text('pick 1')).dx,
      lessThan(tester.getTopLeft(find.text('Carla')).dx),
    );
  });

  testWidgets('a table wider than its container scrolls sideways and its '
      'viewport takes focus; a table that fits adds no tab stop', (
    tester,
  ) async {
    useKeyboardHighlight();
    Widget table(double width, double scale) => harness(
      SizedBox(
        width: width,
        child: Table<_Row>(columns: _columns, rows: _rows),
      ),
      textScale: scale,
    );
    await tester.pumpWidget(table(800, 1));
    await tester.pump();
    expect(tester.takeException(), isNull);
    final focusable = FocusManager.instance.rootScope.traversalDescendants
        .where((n) => n.debugLabel == 'Scroller');
    expect(focusable, isEmpty);

    await tester.pumpWidget(table(200, 2));
    await tester.pump();
    expect(tester.takeException(), isNull);
    final scroller = FocusManager.instance.rootScope.traversalDescendants.where(
      (n) => n.debugLabel == 'Scroller',
    );
    expect(scroller, hasLength(1));
    scroller.single.requestFocus();
    await tester.pump();
    final before = tester.getTopLeft(find.text('Age')).dx;
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pumpAndSettle();
    expect(tester.getTopLeft(find.text('Age')).dx, lessThan(before));
  });

  testWidgets('right to left: the first column sits at the right', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 500,
          child: Table<_Row>(columns: _columns, rows: _rows),
        ),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getTopLeft(find.text('Name')).dx,
      greaterThan(tester.getTopLeft(find.text('Age')).dx),
    );
  });

  testWidgets('targets: 24 by 24, 44 by 44 under touch; text contrast', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(SizedBox(width: 500, child: const _SortedTable())),
    );
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    await tester.pumpWidget(
      harness(
        SizedBox(width: 500, child: const _SortedTable()),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
