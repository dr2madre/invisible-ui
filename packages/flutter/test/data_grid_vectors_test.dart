import 'dart:convert';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/data_grid/data_grid_logic.dart';

// The language-neutral vectors the core tests run against core/src/grid: the
// key table, the totals, the active cell after data changes and the spoken
// text. Present in a checkout of the whole repository; a copy of this
// package alone skips them.
File _vectors(String name) =>
    File('../../core/src/grid/__vectors__/$name.json');

Map<String, dynamic> _read(String name) =>
    jsonDecode(_vectors(name).readAsStringSync()) as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

bool _present(String name) => _vectors(name).existsSync();

GridPos _pos(Object? json) {
  final map = json! as Map<String, dynamic>;
  return GridPos(map['row'] as int, map['column'] as int);
}

DataGridCellKind _kind(Object? json) => switch (json) {
  'editable' => DataGridCellKind.editable,
  'summary' => DataGridCellKind.summary,
  _ => DataGridCellKind.readOnly,
};

GridShape _shape(Object? kinds, [Object? details]) {
  final rows = (kinds! as List<dynamic>).cast<List<dynamic>>();
  final flags = (details as List<dynamic>?)?.cast<List<dynamic>>();
  return GridShape(
    rowCount: rows.length,
    columnCount: rows.first.length,
    kindAt: (pos) => _kind(rows[pos.row][pos.column]),
    hasDetails: (pos) => flags?[pos.row][pos.column] as bool? ?? false,
  );
}

GridKey _key(Map<String, dynamic> json) => GridKey(
  json['key'] as String,
  ctrl: json['ctrl'] as bool? ?? false,
  meta: json['meta'] as bool? ?? false,
  alt: json['alt'] as bool? ?? false,
  shift: json['shift'] as bool? ?? false,
  composing: json['composing'] as bool? ?? false,
);

Locale _locale(String tag) {
  final parts = tag.split('-');
  return Locale(parts[0], parts.length > 1 ? parts[1] : null);
}

/// The command in the vectors' JSON form, to compare with the file.
Map<String, Object?> _json(GridCommand command) {
  Map<String, Object?> pos(GridPos to) => {'row': to.row, 'column': to.column};
  return switch (command) {
    GridNone() => {'type': 'none'},
    GridMove(:final to) => {'type': 'move', 'to': pos(to)},
    GridEdit(:final seed, :final text) => {
      'type': 'edit',
      'seed': seed.name,
      'text': ?text,
    },
    GridCommit(:final then, :final to, :final forward) => {
      'type': 'commit',
      'then': then.name,
      if (then == GridThen.next || then == GridThen.previous) 'to': pos(to!),
      if (then == GridThen.leave) 'forward': forward,
    },
    GridCancel() => {'type': 'cancel'},
    GridActivate() => {'type': 'activate'},
    GridDetails(:final commitFirst) => {
      'type': 'details',
      'commitFirst': commitFirst,
    },
    GridStep(:final direction) => {'type': 'step', 'direction': direction},
  };
}

double? _number(Object? json) => (json as num?)?.toDouble();

List<double?> _numbers(Object? json) =>
    (json! as List<dynamic>).map(_number).toList();

InvisibleMessages _messages(Map<String, dynamic> overrides) {
  String? m(String key) => overrides[key] as String?;
  return const InvisibleMessages().copyWith(
    dataGridCell: m('dataGrid.cell'),
    dataGridRowHeader: m('dataGrid.rowHeader'),
    dataGridColumnTotal: m('dataGrid.columnTotal'),
    dataGridRowTotal: m('dataGrid.rowTotal'),
    dataGridGrandTotal: m('dataGrid.grandTotal'),
    dataGridSeparator: m('dataGrid.separator'),
    dataGridError: m('dataGrid.error'),
    dataGridDetailsLabel: m('dataGrid.detailsLabel'),
    dataGridAnnouncement: m('dataGrid.announcement'),
  );
}

GridLabelKind _labelKind(Object? json) => switch (json) {
  'rowHeader' => GridLabelKind.rowHeader,
  'columnTotal' => GridLabelKind.columnTotal,
  'rowTotal' => GridLabelKind.rowTotal,
  'grandTotal' => GridLabelKind.grandTotal,
  _ => GridLabelKind.cell,
};

void main() {
  group('grid keyboard vectors', () {
    if (!_present('grid-keyboard')) return;
    final file = _read('grid-keyboard');
    final shape = _shape(file['kinds'], file['details']);
    final fileShortcut = file['detailsShortcut'] as Map<String, dynamic>;
    for (final v in _cases(file['keys'])) {
      test(v['name'] as String, () {
        final symbols = NumberSymbols.forLocale(
          _locale(v['locale'] as String? ?? 'en'),
        );
        final negative = v['negative'] as bool? ?? false;
        final shortcut = v.containsKey('shortcut')
            ? v['shortcut'] as Map<String, dynamic>?
            : fileShortcut;
        final command = gridKeyCommand(
          editing: v['mode'] == 'edit',
          active: _pos(v['active']),
          key: _key(v['key'] as Map<String, dynamic>),
          shape: shape,
          direction: v['direction'] == 'rtl'
              ? TextDirection.rtl
              : TextDirection.ltr,
          pageRows: v['pageRows'] as int? ?? 2,
          accepts: (char) => gridAcceptsCharacter(char, symbols, negative),
          detailsShortcut: shortcut == null ? null : _key(shortcut),
        );
        expect(_json(command), v['expect']);
      });
    }
    for (final v in _cases(file['nextEditable'])) {
      test('next editable: ${v['name']}', () {
        final next = gridNextEditable(_pos(v['from']), v['step'] as int, shape);
        expect(next, v['expect'] == null ? isNull : _pos(v['expect']));
      });
    }
    for (final v in _cases(file['initial'])) {
      test('initial active cell: ${v['name']}', () {
        expect(
          gridInitialActive(_shape(v['kinds']), _pos(v['fallback'])),
          _pos(v['expect']),
        );
      });
    }
  });

  group('grid totals vectors', () {
    if (!_present('grid-totals')) return;
    final file = _read('grid-totals');
    for (final v in _cases(file['sum'])) {
      test(v['name'] as String, () {
        expect(sumGridValues(_numbers(v['values'])), _number(v['expect']));
      });
    }
    for (final v in _cases(file['grid'])) {
      test('grid: ${v['name']}', () {
        final values = (v['values'] as List<dynamic>).map(_numbers).toList();
        final expected = v['expect'] as Map<String, dynamic>;
        final totals = gridTotals(values);
        expect(totals.rows, _numbers(expected['rows']));
        expect(totals.columns, _numbers(expected['columns']));
        expect(totals.grand, _number(expected['grand']));
      });
    }
  });

  group('grid active cell vectors', () {
    if (!_present('grid-active')) return;
    final file = _read('grid-active');
    List<String> ids(Object? json) =>
        (json! as List<dynamic>).cast<String>().toList();
    for (final v in _cases(file['cases'])) {
      test(v['name'] as String, () {
        final previous = v['previous'] as Map<String, dynamic>;
        final before = v['before'] as Map<String, dynamic>;
        final after = v['after'] as Map<String, dynamic>;
        final result = gridResolveActive<String, String>(
          (previous['rowId'] as String, previous['columnId'] as String),
          rowsBefore: ids(before['rowIds']),
          columnsBefore: ids(before['columnIds']),
          rowsAfter: ids(after['rowIds']),
          columnsAfter: ids(after['columnIds']),
        );
        final expected = v['expect'] as Map<String, dynamic>?;
        expect(
          result,
          expected == null
              ? isNull
              : (expected['rowId'] as String, expected['columnId'] as String),
        );
      });
    }
  });

  group('grid label vectors', () {
    if (!_present('grid-label')) return;
    final file = _read('grid-label');
    final locales = file['locales'] as Map<String, dynamic>;
    InvisibleMessages messagesOf(Object? locale) =>
        _messages(locales[locale] as Map<String, dynamic>);
    for (final v in _cases(file['labels'])) {
      test(v['name'] as String, () {
        final parts = v['parts'] as Map<String, dynamic>;
        expect(
          gridCellLabel((
            kind: _labelKind(parts['kind']),
            column: parts['column'] as String?,
            row: parts['row'] as String?,
            value: parts['value'] as String?,
            badge: parts['badge'] as String?,
            secondary: parts['secondary'] as String?,
            error: parts['error'] as String?,
          ), messagesOf(v['locale'])),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['details'])) {
      test(v['name'] as String, () {
        expect(
          gridDetailsLabel(
            v['column'] as String,
            v['row'] as String,
            messagesOf(v['locale']),
          ),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['announcements'])) {
      test(v['name'] as String, () {
        expect(
          gridErrorAnnouncement(
            v['column'] as String,
            v['row'] as String,
            v['message'] as String,
            messagesOf(v['locale']),
          ),
          v['expect'],
        );
      });
    }
  });
}
