import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../number_field/number_format.dart';

// The rules below port core/src/grid. The shared vectors in
// core/src/grid/__vectors__ hold both to the same answers.

/// How a body cell of a data grid behaves.
enum DataGridCellKind {
  /// Its number is edited in place.
  editable,

  /// It shows a value and a badge and calls the grid's `onCellActivated`.
  summary,

  /// It shows a value.
  readOnly,
}

/// A cell position, 0-based, with the column header row left out. Columns
/// are in logical order: the row header first.
@immutable
class GridPos {
  /// The cell in [row] and [column].
  const GridPos(this.row, this.column);

  /// The row: a body row or the totals row.
  final int row;

  /// The column: the row header, a data column or the total column.
  final int column;

  @override
  bool operator ==(Object other) =>
      other is GridPos && other.row == row && other.column == column;

  @override
  int get hashCode => Object.hash(row, column);

  @override
  String toString() => 'GridPos($row, $column)';
}

/// The grid as the keyboard sees it.
@immutable
class GridShape {
  /// A grid of [rowCount] by [columnCount] cells.
  const GridShape({
    required this.rowCount,
    required this.columnCount,
    required this.kindAt,
    required this.hasDetails,
  });

  /// Body rows and the totals row.
  final int rowCount;

  /// The row header, the data columns and the total column.
  final int columnCount;

  /// The kind of the cell at a position.
  final DataGridCellKind Function(GridPos pos) kindAt;

  /// Whether the cell at a position offers details.
  final bool Function(GridPos pos) hasDetails;
}

/// A key press, with the web's `KeyboardEvent.key` names.
@immutable
class GridKey {
  /// The key [key] with its modifiers.
  const GridKey(
    this.key, {
    this.ctrl = false,
    this.meta = false,
    this.alt = false,
    this.shift = false,
    this.composing = false,
  });

  /// "ArrowLeft", "Home", "F2", "5"…
  final String key;

  /// Whether Control is held.
  final bool ctrl;

  /// Whether Meta (Command) is held.
  final bool meta;

  /// Whether Alt (Option) is held.
  final bool alt;

  /// Whether Shift is held.
  final bool shift;

  /// Whether an input method is composing text.
  final bool composing;
}

/// What a key does in a data grid.
sealed class GridCommand {
  const GridCommand();
}

/// The key is not the grid's: it goes on to the widgets above.
final class GridNone extends GridCommand {
  /// The command.
  const GridNone();
}

/// Moves the active cell to [to].
final class GridMove extends GridCommand {
  /// The command.
  const GridMove(this.to);

  /// The new active cell.
  final GridPos to;
}

/// How an edit starts.
enum GridEditSeed {
  /// With the committed value selected.
  select,

  /// With the caret after the committed value.
  end,

  /// With the draft replaced by the typed text.
  replace,

  /// With an empty draft.
  clear,
}

/// Starts editing the active cell.
final class GridEdit extends GridCommand {
  /// The command.
  const GridEdit(this.seed, [this.text]);

  /// How the draft starts.
  final GridEditSeed seed;

  /// The typed text, for [GridEditSeed.replace].
  final String? text;
}

/// What follows a commit.
enum GridThen {
  /// Navigation mode on the same cell.
  stay,

  /// Editing the next editable cell.
  next,

  /// Editing the previous editable cell.
  previous,

  /// Leaving the grid.
  leave,
}

/// Commits the draft, then does [then].
final class GridCommit extends GridCommand {
  /// The command.
  const GridCommit(this.then, {this.to, this.forward = true});

  /// What follows.
  final GridThen then;

  /// The cell edited next, for [GridThen.next] and [GridThen.previous].
  final GridPos? to;

  /// For [GridThen.leave]: whether focus moves to the next control.
  final bool forward;
}

/// Reverts the draft and returns to navigation mode.
final class GridCancel extends GridCommand {
  /// The command.
  const GridCancel();
}

/// Activates a summary cell.
final class GridActivate extends GridCommand {
  /// The command.
  const GridActivate();
}

/// Opens the active cell's details.
final class GridDetails extends GridCommand {
  /// The command.
  const GridDetails({required this.commitFirst});

  /// Whether the draft commits first.
  final bool commitFirst;
}

/// Steps the draft.
final class GridStep extends GridCommand {
  /// The command.
  const GridStep(this.direction);

  /// 1 up, -1 down.
  final int direction;
}

/// Whether [key] is [shortcut], modifiers included. Letters match in either
/// case.
bool gridMatchesShortcut(GridKey key, GridKey? shortcut) {
  if (shortcut == null) return false;
  return key.key.toLowerCase() == shortcut.key.toLowerCase() &&
      key.ctrl == shortcut.ctrl &&
      key.meta == shortcut.meta &&
      key.alt == shortcut.alt &&
      key.shift == shortcut.shift;
}

final RegExp _anyDigit = RegExp('^[0-9٠-٩۰-۹]\$');

/// Whether a typed character starts editing a number cell: an ASCII digit,
/// one of the locale's digits, an Arabic-Indic or Persian digit, the
/// locale's decimal separator, and a minus sign when [allowNegative].
bool gridAcceptsCharacter(
  String char,
  NumberSymbols symbols,
  bool allowNegative,
) {
  if (char.runes.length != 1) return false;
  if (_anyDigit.hasMatch(char)) return true;
  if (symbols.digits.contains(char)) return true;
  if (char == symbols.decimal) return true;
  return allowNegative &&
      (char == '-' || char == '−' || char == symbols.minusSign);
}

/// The next editable cell after [from] in reading order, or the previous
/// one with [step] -1; null when there is none.
GridPos? gridNextEditable(GridPos from, int step, GridShape shape) {
  final columns = shape.columnCount;
  final last = shape.rowCount * columns;
  var index = from.row * columns + from.column + step;
  while (index >= 0 && index < last) {
    final pos = GridPos(index ~/ columns, index % columns);
    if (shape.kindAt(pos) == DataGridCellKind.editable) return pos;
    index += step;
  }
  return null;
}

/// The cell that takes the tab stop the first time: the first editable body
/// cell, or [fallback].
GridPos gridInitialActive(GridShape shape, GridPos fallback) =>
    gridNextEditable(const GridPos(0, -1), 1, shape) ?? fallback;

/// [previous], moved inside [shape] when the grid shrank.
GridPos gridClampActive(GridPos previous, GridShape shape) => GridPos(
  previous.row.clamp(0, shape.rowCount - 1),
  previous.column.clamp(0, shape.columnCount - 1),
);

int _clamp(int value, int max) => value < 0 ? 0 : (value > max ? max : value);

bool _anyModifier(GridKey key) => key.ctrl || key.meta || key.alt || key.shift;

GridCommand _navigate(
  GridPos active,
  GridKey key,
  GridShape shape,
  TextDirection direction,
  int pageRows,
  bool Function(String char) accepts,
) {
  final lastRow = shape.rowCount - 1;
  final lastColumn = shape.columnCount - 1;
  GridCommand move(int row, int column) =>
      GridMove(GridPos(_clamp(row, lastRow), _clamp(column, lastColumn)));
  final kind = shape.kindAt(active);

  if (key.key == 'Home' || key.key == 'End') {
    if (key.meta || key.alt || key.shift) return const GridNone();
    final home = key.key == 'Home';
    if (key.ctrl) return home ? move(0, 0) : move(lastRow, lastColumn);
    return move(active.row, home ? 0 : lastColumn);
  }
  if (_anyModifier(key)) return const GridNone();

  final rtl = direction == TextDirection.rtl;
  final page = pageRows < 1 ? 1 : pageRows;
  switch (key.key) {
    case 'ArrowRight':
      return move(active.row, active.column + (rtl ? -1 : 1));
    case 'ArrowLeft':
      return move(active.row, active.column + (rtl ? 1 : -1));
    case 'ArrowDown':
      return move(active.row + 1, active.column);
    case 'ArrowUp':
      return move(active.row - 1, active.column);
    case 'PageDown':
      return move(active.row + page, active.column);
    case 'PageUp':
      return move(active.row - page, active.column);
    case 'Enter':
      return switch (kind) {
        DataGridCellKind.editable => const GridEdit(GridEditSeed.select),
        DataGridCellKind.summary => const GridActivate(),
        DataGridCellKind.readOnly => const GridNone(),
      };
    case 'F2':
      return kind == DataGridCellKind.editable
          ? const GridEdit(GridEditSeed.end)
          : const GridNone();
    case 'Backspace':
    case 'Delete':
      return kind == DataGridCellKind.editable
          ? const GridEdit(GridEditSeed.clear)
          : const GridNone();
  }
  if (kind == DataGridCellKind.editable && accepts(key.key)) {
    return GridEdit(GridEditSeed.replace, key.key);
  }
  return const GridNone();
}

GridCommand _edit(GridPos active, GridKey key, GridShape shape) {
  if (key.key == 'Tab' && !key.ctrl && !key.meta && !key.alt) {
    final to = gridNextEditable(active, key.shift ? -1 : 1, shape);
    if (to != null) {
      return GridCommit(key.shift ? GridThen.previous : GridThen.next, to: to);
    }
    return GridCommit(GridThen.leave, forward: !key.shift);
  }
  if (_anyModifier(key)) return const GridNone();
  return switch (key.key) {
    'Escape' => const GridCancel(),
    'Enter' || 'F2' => const GridCommit(GridThen.stay),
    'ArrowUp' => const GridStep(1),
    'ArrowDown' => const GridStep(-1),
    // Characters, the caret keys and deletion belong to the editor.
    _ => const GridNone(),
  };
}

/// What [key] does in a data grid in navigation mode or, when [editing], in
/// editing mode. The rule of `core/src/grid/keyboard.ts`.
GridCommand gridKeyCommand({
  required bool editing,
  required GridPos active,
  required GridKey key,
  required GridShape shape,
  required TextDirection direction,
  required int pageRows,
  required bool Function(String char) accepts,
  GridKey? detailsShortcut,
}) {
  if (key.composing) return const GridNone();
  if (gridMatchesShortcut(key, detailsShortcut)) {
    return shape.hasDetails(active)
        ? GridDetails(commitFirst: editing)
        : const GridNone();
  }
  return editing
      ? _edit(active, key, shape)
      : _navigate(active, key, shape, direction, pageRows, accepts);
}

/// The sum of [values], skipping null; null when only null values (or none)
/// remain. The sum is rounded to the largest number of decimals among its
/// terms, so 0.1 + 0.2 is 0.3.
double? sumGridValues(Iterable<double?> values) {
  final terms = [
    for (final value in values)
      if (value != null && value.isFinite) value,
  ];
  if (terms.isEmpty) return null;
  var decimals = 0;
  for (final term in terms) {
    final places = decimalsOf(term);
    if (places > decimals) decimals = places;
  }
  if (decimals > 12) decimals = 12;
  var scale = 1.0;
  for (var i = 0; i < decimals; i++) {
    scale *= 10;
  }
  var scaled = 0.0;
  for (final term in terms) {
    scaled += _jsRound(term * scale);
  }
  final sum = scaled / scale;
  return sum == 0 ? 0 : sum;
}

/// JavaScript's `Math.round`: halves round towards positive infinity.
double _jsRound(double x) {
  final floor = x.floorToDouble();
  return x - floor >= 0.5 ? floor + 1 : floor;
}

/// The derived totals of a grid's body values.
typedef GridTotals = ({
  List<double?> rows,
  List<double?> columns,
  double? grand,
});

/// The row totals, column totals and grand total of [values], one list per
/// body row with one value per data column.
GridTotals gridTotals(List<List<double?>> values) {
  var width = 0;
  for (final row in values) {
    if (row.length > width) width = row.length;
  }
  return (
    rows: [for (final row in values) sumGridValues(row)],
    columns: [
      for (var column = 0; column < width; column++)
        sumGridValues([
          for (final row in values) column < row.length ? row[column] : null,
        ]),
    ],
    grand: sumGridValues(values.expand((row) => row)),
  );
}

/// The active cell after the application changed its rows or columns: an
/// id that still exists is kept, one that is gone gives way to the id now
/// at its old position, clamped. Null when no row or no column is left.
(T, U)? gridResolveActive<T, U>(
  (T, U) previous, {
  required List<T> rowsBefore,
  required List<U> columnsBefore,
  required List<T> rowsAfter,
  required List<U> columnsAfter,
}) {
  V? resolve<V>(V id, List<V> before, List<V> after) {
    if (after.isEmpty) return null;
    if (after.contains(id)) return id;
    final index = before.indexOf(id);
    return after[index.clamp(0, after.length - 1)];
  }

  final row = resolve(previous.$1, rowsBefore, rowsAfter);
  final column = resolve(previous.$2, columnsBefore, columnsAfter);
  if (row == null || column == null) return null;
  return (row, column);
}

/// Which label a data grid cell composes.
enum GridLabelKind {
  /// A body cell.
  cell,

  /// A row header.
  rowHeader,

  /// A column's total, in the totals row.
  columnTotal,

  /// A row's total, in the Total column.
  rowTotal,

  /// The grand total.
  grandTotal,
}

/// The parts of a data grid cell's label, already turned into text: [value]
/// is the value text, or the empty text.
typedef GridLabelParts = ({
  GridLabelKind kind,
  String? column,
  String? row,
  String? value,
  String? badge,
  String? secondary,
  String? error,
});

/// A data grid cell's spoken label: the column label, the row label and the
/// value text in the order of [InvisibleMessages.dataGridCell], then the
/// badge, the secondary label and the error, joined with
/// [InvisibleMessages.dataGridSeparator]. Totals and the row header use
/// their own messages; a row header without a value is the row label. An
/// application's card view can use it for the same words as the grid.
String gridCellLabel(GridLabelParts parts, InvisibleMessages messages) {
  final values = {
    'column': parts.column ?? '',
    'row': parts.row ?? '',
    'value': parts.value ?? '',
  };
  final base = switch (parts.kind) {
    GridLabelKind.rowHeader when parts.value == null => parts.row ?? '',
    GridLabelKind.rowHeader => InvisibleMessages.fill(
      messages.dataGridRowHeader,
      values,
    ),
    GridLabelKind.columnTotal => InvisibleMessages.fill(
      messages.dataGridColumnTotal,
      values,
    ),
    GridLabelKind.rowTotal => InvisibleMessages.fill(
      messages.dataGridRowTotal,
      values,
    ),
    GridLabelKind.grandTotal => InvisibleMessages.fill(
      messages.dataGridGrandTotal,
      values,
    ),
    GridLabelKind.cell => InvisibleMessages.fill(messages.dataGridCell, values),
  };
  final error = parts.error;
  return [
    base,
    ?parts.badge,
    ?parts.secondary,
    if (error != null && error.isNotEmpty)
      InvisibleMessages.fill(messages.dataGridError, {'message': error}),
  ].where((part) => part.isNotEmpty).join(messages.dataGridSeparator);
}

/// The details button's name: "Details, Monday 6 October, PX-12 Project X".
String gridDetailsLabel(
  String column,
  String row,
  InvisibleMessages messages,
) => InvisibleMessages.fill(messages.dataGridDetailsLabel, {
  'column': column,
  'row': row,
});

/// The announcement of an error that appears on commit.
String gridErrorAnnouncement(
  String column,
  String row,
  String message,
  InvisibleMessages messages,
) => InvisibleMessages.fill(messages.dataGridAnnouncement, {
  'column': column,
  'row': row,
  'message': message,
});

final Map<LogicalKeyboardKey, String> _keyNames = {
  LogicalKeyboardKey.arrowLeft: 'ArrowLeft',
  LogicalKeyboardKey.arrowRight: 'ArrowRight',
  LogicalKeyboardKey.arrowUp: 'ArrowUp',
  LogicalKeyboardKey.arrowDown: 'ArrowDown',
  LogicalKeyboardKey.home: 'Home',
  LogicalKeyboardKey.end: 'End',
  LogicalKeyboardKey.pageUp: 'PageUp',
  LogicalKeyboardKey.pageDown: 'PageDown',
  LogicalKeyboardKey.enter: 'Enter',
  LogicalKeyboardKey.numpadEnter: 'Enter',
  LogicalKeyboardKey.f2: 'F2',
  LogicalKeyboardKey.escape: 'Escape',
  LogicalKeyboardKey.tab: 'Tab',
  LogicalKeyboardKey.backspace: 'Backspace',
  LogicalKeyboardKey.delete: 'Delete',
};

/// The web name of [key] with [character] typed, as `KeyboardEvent.key`
/// gives it. With a command modifier held the key's own label counts, as
/// the character an Option key composes is no shortcut.
String gridKeyName(
  LogicalKeyboardKey key, {
  String? character,
  bool command = false,
}) {
  final name = _keyNames[key];
  if (name != null) return name;
  final label = key.keyLabel;
  if (command || character == null || character.isEmpty) {
    return label.length == 1 ? label.toLowerCase() : label;
  }
  return character;
}

/// [activator] in the grid's key vocabulary.
GridKey gridShortcutOf(SingleActivator activator) => GridKey(
  gridKeyName(activator.trigger, command: true),
  ctrl: activator.control,
  meta: activator.meta,
  alt: activator.alt,
  shift: activator.shift,
);
