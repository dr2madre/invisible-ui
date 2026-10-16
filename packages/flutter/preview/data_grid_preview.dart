// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/services.dart';
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// Timelog's week: projects in rows, days in columns, the weekend with the
/// secondary emphasis, a summary cell, a day over 24 hours and the totals.
/// Tab into the grid, move with the arrows, type a number or press Enter.
@Preview(
  group: 'Data grid',
  name: 'Light',
  brightness: Brightness.light,
  size: Size(760, 420),
)
@Preview(
  group: 'Data grid',
  name: 'Dark',
  brightness: Brightness.dark,
  size: Size(760, 420),
)
Widget dataGridWeek() => const PreviewSheet(child: _Week());

/// Right to left at text scale 2.0 in a 320 wide column: the row header
/// sits at the right and sticks, the grid scrolls on both axes.
@Preview(
  group: 'Data grid',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(352, 480),
)
Widget dataGridRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Week()),
);

/// Touch density: every cell and the details button keep a 44 by 44 target,
/// and the details button shows on the active cell.
@Preview(group: 'Data grid', name: 'Touch density', size: Size(760, 520))
Widget dataGridTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Week());

const List<String> _dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

final List<DataGridColumn> _columns = [
  for (final (index, name) in _dayNames.indexed)
    DataGridColumn(
      id: 'd$index',
      label: '$name ${6 + index} October',
      header: Text('${name.substring(0, 3)} ${6 + index}'),
      secondary: index >= 5,
      secondaryLabel: index >= 5 ? 'Non-working day' : null,
    ),
];

const List<DataGridRow> _rows = [
  DataGridRow(id: 'px', code: 'PX-12', name: 'Project X'),
  DataGridRow(id: 'py', code: 'PY-3', name: 'Project Y, onboarding'),
  DataGridRow(id: 'ops', code: 'OPS', name: 'Operations'),
];

class _Week extends StatefulWidget {
  const _Week();

  @override
  State<_Week> createState() => _WeekState();
}

class _WeekState extends State<_Week> {
  final Map<(String, String), double?> _hours = {
    ('px', 'd0'): 8,
    ('px', 'd1'): 7.5,
    ('py', 'd0'): 18,
    ('ops', 'd2'): 2,
  };

  String? _dayError(String column) {
    var sum = 0.0;
    for (final row in _rows) {
      sum += _hours[(row.id, column)] ?? 0;
    }
    return sum > 24 ? 'More than 24 hours on this day' : null;
  }

  @override
  Widget build(BuildContext context) {
    return DataGrid(
      label: 'Week 41',
      rowHeaderLabel: 'Project',
      columns: _columns,
      rows: _rows,
      editor: const DataGridEditor(min: 0, max: 24, step: 0.5),
      detailsShortcut: const SingleActivator(
        LogicalKeyboardKey.enter,
        alt: true,
      ),
      activationHint: 'Show entries',
      totalError: _dayError,
      cell: (row, column) {
        final summary = row == 'ops' && column == 'd2';
        return DataGridCell(
          kind: summary ? DataGridCellKind.summary : DataGridCellKind.editable,
          value: _hours[(row, column)],
          badge: summary ? '2 entries' : null,
        );
      },
      onCellChanged: (change) => setState(
        () => _hours[(change.rowId, change.columnId)] = change.value,
      ),
      onCellActivated: (_) {},
      onCellDetails: (_) {},
    );
  }
}
