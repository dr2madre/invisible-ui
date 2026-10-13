import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/carousel/carousel_logic.dart';
import 'package:invisible_ui/src/i18n/locale_provider.dart';
import 'package:invisible_ui/src/table/table_logic.dart';

// The language-neutral vectors the core tests run against core/: table
// sorting and selection, carousel navigation and locale direction. Present
// in a checkout of the whole repository; a copy of this package alone skips
// them.
final File _table = File('../../core/src/table/__vectors__/table.json');
final File _carousel = File(
  '../../core/src/carousel/__vectors__/carousel.json',
);
final File _direction = File(
  '../../core/src/i18n/__vectors__/locale-direction.json',
);

Map<String, dynamic> _read(File file) =>
    jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

TableSort? _sort(Object? json) {
  if (json == null) return null;
  final map = json as Map<String, dynamic>;
  return TableSort(
    map['key'] as String,
    map['direction'] == 'asc'
        ? SortDirection.ascending
        : SortDirection.descending,
  );
}

SelectionMode _mode(Object? json) =>
    SelectionMode.values.byName(json! as String);

List<Object> _ids(Object? json) => (json! as List<dynamic>).cast<Object>();

const Map<String, LogicalKeyboardKey> _keys = {
  'ArrowRight': LogicalKeyboardKey.arrowRight,
  'ArrowLeft': LogicalKeyboardKey.arrowLeft,
  'ArrowDown': LogicalKeyboardKey.arrowDown,
  'ArrowUp': LogicalKeyboardKey.arrowUp,
};

Locale _locale(String tag) {
  final parts = tag.split('-');
  String? script;
  String? country;
  for (final part in parts.skip(1)) {
    if (part.length == 4) {
      script = part;
    } else {
      country = part;
    }
  }
  return Locale.fromSubtags(
    languageCode: parts.first,
    scriptCode: script,
    countryCode: country,
  );
}

void main() {
  group('table vectors', () {
    if (!_table.existsSync()) return;
    final file = _read(_table);
    for (final vector in _cases(file['nextSort'])) {
      test(vector['name'] as String, () {
        expect(
          nextSort(_sort(vector['current']), vector['key'] as String),
          _sort(vector['expect']),
        );
      });
    }
    for (final vector in _cases(file['compareValues'])) {
      test(vector['name'] as String, () {
        expect(
          compareCellValues(vector['a'], vector['b']).sign,
          vector['expect'],
        );
      });
    }
    for (final vector in _cases(file['sortRows'])) {
      test(vector['name'] as String, () {
        final rows = _cases(vector['rows']);
        final sorted = sortRows(
          rows,
          _sort(vector['sort']),
          (row, key) => row[key],
        );
        expect([for (final row in sorted) row['id']], vector['expect']);
      });
    }
    for (final vector in _cases(file['toggleRowSelection'])) {
      test(vector['name'] as String, () {
        expect(
          toggleRowSelection(
            _ids(vector['selected']),
            vector['id'] as Object,
            _mode(vector['mode']),
          ),
          vector['expect'],
        );
      });
    }
    for (final vector in _cases(file['toggleScopeSelection'])) {
      test(vector['name'] as String, () {
        expect(
          toggleScopeSelection(
            _ids(vector['selected']),
            _ids(vector['scope']),
            _mode(vector['mode']),
          ),
          vector['expect'],
        );
      });
    }
    for (final vector in _cases(file['scopeSelectionState'])) {
      test(vector['name'] as String, () {
        expect(
          scopeSelectionState(
            _ids(vector['selected']),
            _ids(vector['scope']),
          ).name,
          vector['expect'],
        );
      });
    }
    for (final vector in _cases(file['toggleHidden'])) {
      test(vector['name'] as String, () {
        expect(
          toggleHidden(
            (vector['hidden'] as List<dynamic>).cast<String>(),
            vector['key'] as String,
          ),
          vector['expect'],
        );
      });
    }
  });

  group('carousel vectors', () {
    if (!_carousel.existsSync()) return;
    final file = _read(_carousel);
    for (final vector in _cases(file['states'])) {
      test(vector['name'] as String, () {
        final count = vector['count'] as int;
        final loop = vector['loop'] as bool;
        final index = clampSlide(vector['index'] as int, count);
        expect({
          'index': index,
          'next': nextSlide(index, count, loop: loop),
          'prev': previousSlide(index, count, loop: loop),
          'canGoNext': canGoNext(index, count, loop: loop),
          'canGoPrev': canGoPrevious(index, count, loop: loop),
        }, vector['expect']);
      });
    }
    for (final vector in _cases(file['keys'])) {
      test(vector['name'] as String, () {
        final index = vector['index'] as int;
        final target = carouselKeyTarget(
          key: _keys[vector['key']]!,
          index: index,
          count: vector['count'] as int,
          loop: vector['loop'] as bool,
          orientation: vector['orientation'] == 'vertical'
              ? Axis.vertical
              : Axis.horizontal,
          direction: vector['direction'] == 'rtl'
              ? TextDirection.rtl
              : TextDirection.ltr,
        );
        expect(target ?? index, vector['expect']);
      });
    }
  });

  group('locale direction vectors', () {
    if (!_direction.existsSync()) return;
    final file = _read(_direction);
    for (final vector in _cases(file['directions'])) {
      final tag = vector['locale'] as String;
      test('$tag is ${vector['expect']}', () {
        expect(localeDirection(_locale(tag)).name, vector['expect']);
      });
    }
  });
}
