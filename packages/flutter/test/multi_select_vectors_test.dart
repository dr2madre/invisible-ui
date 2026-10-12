import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/multi_select/multi_select_logic.dart';

// The language-neutral vectors core/src/multi-select/vectors.test.ts runs
// against core/. Present in a checkout of the whole repository; a copy of
// this package alone skips them.
final File _file = File(
  '../../core/src/multi-select/__vectors__/multi-select.json',
);

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

List<String> _strings(Object? json) => (json! as List<dynamic>).cast<String>();

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  final file = _file.existsSync()
      ? jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>
      : const <String, dynamic>{};
  final items = skip != false
      ? const <ChoiceItem<String>>[]
      : [
          for (final item in _cases(file['items']))
            ChoiceItem(
              value: item['value'] as String,
              label: item['label'] as String,
              disabled: item['disabled'] as bool? ?? false,
            ),
        ];

  group('multi select add vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['add'])) {
      test(vector['name'] as String, () {
        final values = _strings(vector['values']);
        final result = addValue(
          values,
          vector['value'] as String,
          vector['max'] as int?,
        );
        expect(result, _strings(vector['expect']));
        expect(identical(result, values), vector['same']);
      });
    }
  }, skip: skip);

  group('multi select remove vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['remove'])) {
      test(vector['name'] as String, () {
        final values = _strings(vector['values']);
        final result = removeValue(values, vector['value'] as String);
        expect(result, _strings(vector['expect']));
        expect(identical(result, values), vector['same']);
      });
    }
  }, skip: skip);

  group('multi select Backspace vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['lastRemovable'])) {
      test(vector['name'] as String, () {
        expect(
          lastRemovableValue(_strings(vector['values']), items),
          vector['expect'],
        );
      });
    }
  }, skip: skip);

  group('multi select fallback vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['resolve'])) {
      test(vector['name'] as String, () {
        final item = resolveItem(items, vector['value'] as String);
        final expected = vector['expect'] as Map<String, dynamic>;
        expect(item.label, expected['label']);
        expect(item.disabled, expected['disabled']);
      });
    }
  }, skip: skip);
}
