import 'package:flutter/foundation.dart';

// The pure table logic of `core/src/table/state.ts`: the sort cycle, the cell
// comparison, the stable sort, column visibility and row selection. The
// shared vectors in `core/src/table/__vectors__` hold both to the same
// answers.

/// The direction of a column sort.
enum SortDirection {
  /// Smallest first.
  ascending,

  /// Largest first.
  descending,
}

/// The active sort of a table: the column [key] and the [direction].
@immutable
class TableSort {
  /// Sorts by [key] in [direction].
  const TableSort(this.key, this.direction);

  /// The column key.
  final String key;

  /// The direction.
  final SortDirection direction;

  @override
  bool operator ==(Object other) =>
      other is TableSort && other.key == key && other.direction == direction;

  @override
  int get hashCode => Object.hash(key, direction);

  @override
  String toString() => 'TableSort($key, ${direction.name})';
}

/// How the rows of a table can be selected.
enum SelectionMode {
  /// No selection, and no selection column.
  none,

  /// One row at a time.
  single,

  /// Any number of rows.
  multiple,
}

/// How much of a set of rows is selected.
enum ScopeSelection {
  /// None of them, or the set is empty.
  none,

  /// Some of them.
  some,

  /// All of them.
  all,
}

/// The sort after a press on the header of column [key]: unsorted, then
/// ascending, then descending, then unsorted again. Another column starts
/// ascending.
TableSort? nextSort(TableSort? current, String key) {
  if (current == null || current.key != key) {
    return TableSort(key, SortDirection.ascending);
  }
  if (current.direction == SortDirection.ascending) {
    return TableSort(key, SortDirection.descending);
  }
  return null;
}

/// Compares two cell values for sorting. Numbers and dates compare by value,
/// booleans false first, anything else as text: without case, digit runs
/// by their number, accented Latin letters as their base letter. A null
/// sorts after any value.
///
/// The web compares text with the locale collation; this comparison agrees
/// with it for letters, digits and spaces, the range the shared vectors
/// cover.
int compareCellValues(Object? a, Object? b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a is num && b is num) return (a - b).sign.toInt();
  if (a is DateTime && b is DateTime) return a.compareTo(b);
  if (a is bool && b is bool) return (a ? 1 : 0) - (b ? 1 : 0);
  return _compareText('$a', '$b');
}

/// [rows] sorted by [sort], a new list; the order of [rows] when [sort] is
/// null. Equal values keep their order, and nulls stay last in both
/// directions. [getValue] reads a row's value for a column key.
List<T> sortRows<T>(
  List<T> rows,
  TableSort? sort,
  Object? Function(T row, String key) getValue,
) {
  if (sort == null) return List.of(rows);
  final factor = sort.direction == SortDirection.ascending ? 1 : -1;
  final indexed = [for (final (index, row) in rows.indexed) (index, row)];
  indexed.sort((a, b) {
    final aValue = getValue(a.$2, sort.key);
    final bValue = getValue(b.$2, sort.key);
    final result = compareCellValues(aValue, bValue);
    if (result == 0) return a.$1 - b.$1;
    return aValue == null || bValue == null ? result : result * factor;
  });
  return [for (final entry in indexed) entry.$2];
}

/// [hidden] with [key] added at the end, or removed when it is there.
List<String> toggleHidden(List<String> hidden, String key) =>
    hidden.contains(key)
    ? [
        for (final k in hidden)
          if (k != key) k,
      ]
    : [...hidden, key];

/// The selection after toggling row [id]. Multiple mode adds the id at the
/// end or removes it; single mode replaces the selection, or empties it
/// when [id] was the selected row; none mode returns [selected] itself.
List<Object> toggleRowSelection(
  List<Object> selected,
  Object id,
  SelectionMode mode,
) {
  switch (mode) {
    case SelectionMode.none:
      return selected;
    case SelectionMode.single:
      return selected.contains(id) ? const [] : [id];
    case SelectionMode.multiple:
      return selected.contains(id)
          ? [
              for (final s in selected)
                if (s != id) s,
            ]
          : [...selected, id];
  }
}

/// The selection after toggling a whole [scope], the selectable rows shown.
/// Only multiple mode toggles a scope. A fully selected scope is removed;
/// otherwise its missing ids are added in scope order. Ids outside the
/// scope stay. A change that moves nothing returns [selected] itself.
List<Object> toggleScopeSelection(
  List<Object> selected,
  List<Object> scope,
  SelectionMode mode,
) {
  if (mode != SelectionMode.multiple || scope.isEmpty) return selected;
  final selectedSet = selected.toSet();
  if (scope.every(selectedSet.contains)) {
    final scopeSet = scope.toSet();
    return [
      for (final id in selected)
        if (!scopeSet.contains(id)) id,
    ];
  }
  final missing = <Object>[];
  final queued = <Object>{};
  for (final id in scope) {
    if (selectedSet.contains(id) || !queued.add(id)) continue;
    missing.add(id);
  }
  return missing.isEmpty ? selected : [...selected, ...missing];
}

/// How much of [scope] is selected. An empty scope is none.
ScopeSelection scopeSelectionState(List<Object> selected, List<Object> scope) {
  if (scope.isEmpty) return ScopeSelection.none;
  final selectedSet = selected.toSet();
  final count = scope.where(selectedSet.contains).length;
  if (count == 0) return ScopeSelection.none;
  return count == scope.length ? ScopeSelection.all : ScopeSelection.some;
}

bool _isDigit(int unit) => unit >= 0x30 && unit <= 0x39;

int _compareText(String a, String b) {
  final x = _fold(a);
  final y = _fold(b);
  var i = 0;
  var j = 0;
  while (i < x.length && j < y.length) {
    final cx = x.codeUnitAt(i);
    final cy = y.codeUnitAt(j);
    if (_isDigit(cx) && _isDigit(cy)) {
      var endX = i;
      while (endX < x.length && _isDigit(x.codeUnitAt(endX))) {
        endX++;
      }
      var endY = j;
      while (endY < y.length && _isDigit(y.codeUnitAt(endY))) {
        endY++;
      }
      final byNumber = _compareDigits(
        x.substring(i, endX),
        y.substring(j, endY),
      );
      if (byNumber != 0) return byNumber;
      i = endX;
      j = endY;
      continue;
    }
    if (cx != cy) return cx < cy ? -1 : 1;
    i++;
    j++;
  }
  final restX = x.length - i;
  final restY = y.length - j;
  return restX == restY ? 0 : (restX < restY ? -1 : 1);
}

// Two runs of ASCII digits by their number, of any length.
int _compareDigits(String a, String b) {
  final x = a.replaceFirst(RegExp('^0+(?=.)'), '');
  final y = b.replaceFirst(RegExp('^0+(?=.)'), '');
  if (x.length != y.length) return x.length < y.length ? -1 : 1;
  final result = x.compareTo(y);
  return result == 0 ? 0 : (result < 0 ? -1 : 1);
}

// Lower case, with the accented Latin-1 letters as their base letter: the
// base strength of the web's collation for the letters most tables hold.
String _fold(String text) {
  final lower = text.toLowerCase();
  final buffer = StringBuffer();
  for (final rune in lower.runes) {
    buffer.write(_bases[rune] ?? String.fromCharCode(rune));
  }
  return buffer.toString();
}

const Map<int, String> _bases = {
  0xE0: 'a', 0xE1: 'a', 0xE2: 'a', 0xE3: 'a', 0xE4: 'a', 0xE5: 'a', //
  0xE7: 'c',
  0xE8: 'e', 0xE9: 'e', 0xEA: 'e', 0xEB: 'e', //
  0xEC: 'i', 0xED: 'i', 0xEE: 'i', 0xEF: 'i', //
  0xF1: 'n',
  0xF2: 'o', 0xF3: 'o', 0xF4: 'o', 0xF5: 'o', 0xF6: 'o', 0xF8: 'o', //
  0xF9: 'u', 0xFA: 'u', 0xFB: 'u', 0xFC: 'u', //
  0xFD: 'y', 0xFF: 'y',
};
