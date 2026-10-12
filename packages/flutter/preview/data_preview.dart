// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart' hide Table;
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

typedef _Row = Map<String, Object?>;

const List<TableColumn> _columns = [
  TableColumn(key: 'name', header: 'Name', sortable: true, hideable: false),
  TableColumn(key: 'city', header: 'City', sortable: true),
  TableColumn(key: 'plan', header: 'Plan'),
  TableColumn(key: 'seats', header: 'Seats', align: TableAlign.end),
];

const List<_Row> _customers = [
  {'id': 1, 'name': 'Northwind', 'city': 'Turin', 'plan': 'Team', 'seats': 12},
  {'id': 2, 'name': 'Contoso', 'city': 'Lyon', 'plan': 'Free', 'seats': 3},
  {'id': 3, 'name': 'Fabrikam', 'city': 'Porto', 'plan': 'Team', 'seats': 40},
  {'id': 4, 'name': 'Tailspin', 'city': 'Graz', 'plan': 'Business', 'seats': 8},
  {'id': 5, 'name': 'Adatum', 'city': 'Gent', 'plan': 'Free', 'seats': 1},
  {'id': 6, 'name': 'Litware', 'city': 'Bern', 'plan': 'Team', 'seats': 22},
];

/// The table set with every part on: title, view switch, column list,
/// selection and pagination.
@Preview(
  group: 'Data',
  name: 'Table set, light',
  brightness: Brightness.light,
  size: Size(720, 640),
)
@Preview(
  group: 'Data',
  name: 'Table set, dark',
  brightness: Brightness.dark,
  size: Size(720, 640),
)
Widget tableSetStates() => const PreviewSheet(child: _Customers());

/// Right to left at text scale 2.0 in a narrow column: the table scrolls
/// sideways, the header wraps.
@Preview(
  group: 'Data',
  name: 'Table set, right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1200),
)
Widget tableSetRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Customers()),
);

/// Touch density: every header, checkbox and page keeps a 44 by 44 target.
@Preview(group: 'Data', name: 'Table set, touch density', size: Size(720, 720))
Widget tableSetTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Customers());

/// Filters on and no row left: the no-results state with its action.
@Preview(group: 'Data', name: 'Table set, no results', size: Size(720, 400))
Widget tableSetNoResults() => PreviewSheet(
  child: TableSet<_Row>(
    title: 'Customers',
    columns: _columns,
    rows: const [],
    filtersActive: true,
    totalRowCount: _customers.length,
    onClearFilters: () {},
  ),
);

/// The plain table, sorted by its parent.
@Preview(group: 'Data', name: 'Table', size: Size(560, 360))
Widget tablePrimitive() => PreviewSheet(
  child: Table<_Row>(
    caption: 'Customers',
    columns: _columns,
    rows: sortRows(
      _customers,
      const TableSort('seats', SortDirection.descending),
      (row, key) => row[key],
    ),
    sort: const TableSort('seats', SortDirection.descending),
    onSortToggle: (_) {},
  ),
);

class _Customers extends StatefulWidget {
  const _Customers();

  @override
  State<_Customers> createState() => _CustomersState();
}

class _CustomersState extends State<_Customers> {
  List<Object> _selected = const [2];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: TableSet<_Row>(
        title: 'Customers',
        columns: _columns,
        rows: _customers,
        pageSize: 4,
        allowViewToggle: true,
        configurable: true,
        cardDescriptionKey: 'city',
        selectionMode: SelectionMode.multiple,
        selectedRowIds: _selected,
        onSelectedRowIdsChanged: (ids) => setState(() => _selected = ids),
        getRowLabel: (row) => row['name']! as String,
      ),
    );
  }
}
