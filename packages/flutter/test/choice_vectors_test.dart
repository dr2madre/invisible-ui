import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/collection.dart';

// The language-neutral vectors core/src/select/vectors.test.ts runs against
// core/. Present in a checkout of the whole repository; a copy of this
// package alone skips them.
final File _file = File('../../core/src/select/__vectors__/select.json');

List<ChoiceItem<String>> _items(Object? json) => [
  for (final item in (json! as List<dynamic>).cast<Map<String, dynamic>>())
    ChoiceItem(
      value: item['value'] as String,
      label: item['label'] as String,
      disabled: item['disabled'] as bool? ?? false,
    ),
];

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

String? _run(List<ChoiceItem<String>> items, Map<String, dynamic> vector) {
  final from = vector['from'] as String?;
  return switch (vector['op'] as String) {
    'first' => firstEnabled(items),
    'last' => lastEnabled(items),
    'next' => stepEnabled(items, from, 1),
    'prev' => stepEnabled(items, from, -1),
    'typeahead' => matchOption(items, vector['query'] as String, from),
    final op => throw ArgumentError('Unknown op $op'),
  };
}

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  final file = _file.existsSync()
      ? jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>
      : const <String, dynamic>{};

  group('select typeahead vectors', () {
    if (skip != false) return;
    final items = _items(file['items']);
    for (final vector in _cases(file['typeahead'])) {
      test(vector['name'] as String, () {
        expect(
          matchOption(items, vector['query'] as String, vector['from']),
          vector['expect'],
        );
      });
    }
  }, skip: skip);

  group('select navigation vectors', () {
    if (skip != false) return;
    final items = _items(file['items']);
    for (final vector in _cases(file['navigation'])) {
      test(
        vector['name'] as String,
        () => expect(_run(items, vector), vector['expect']),
      );
    }
  }, skip: skip);

  group('select vectors with every item disabled', () {
    if (skip != false) return;
    final disabled = file['disabledOnly'] as Map<String, dynamic>;
    final items = _items(disabled['items']);
    for (final vector in _cases(disabled['cases'])) {
      test(
        vector['name'] as String,
        () => expect(_run(items, vector), vector['expect']),
      );
    }
  }, skip: skip);

  test('the default filter keeps labels that contain the text, ignoring '
      'case and the spaces around it, as the web Combobox does', () {
    const items = [
      ChoiceItem(value: 'a', label: 'Atlas'),
      ChoiceItem(value: 'd', label: 'Delta app'),
    ];
    expect(containsFilter(items, '').length, 2);
    expect(containsFilter(items, '  APP ').single.value, 'd');
    expect(containsFilter(items, 'tla').single.value, 'a');
    expect(containsFilter(items, 'zz'), isEmpty);
  });
}
