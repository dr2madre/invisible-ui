import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/accordion/accordion.dart';
import 'package:invisible_ui/src/meter/meter.dart';
import 'package:invisible_ui/src/pagination/page_items.dart';
import 'package:invisible_ui/src/progress/progress.dart';
import 'package:invisible_ui/src/tabs/tab_keys.dart';

// The language-neutral vectors the core tests run against core/: tabs keys,
// accordion toggles, pagination page lists, meter readings and progress
// percentages. Present in a checkout of the whole repository; a copy of this
// package alone skips them.
File _vectors(String component) =>
    File('../../core/src/$component/__vectors__/$component.json');

Map<String, dynamic> _read(String component) =>
    jsonDecode(_vectors(component).readAsStringSync()) as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

Object? _skip(String component) =>
    _vectors(component).existsSync() ? false : 'core/ is not in this checkout';

const Map<String, LogicalKeyboardKey> _keys = {
  'ArrowRight': LogicalKeyboardKey.arrowRight,
  'ArrowLeft': LogicalKeyboardKey.arrowLeft,
  'ArrowDown': LogicalKeyboardKey.arrowDown,
  'ArrowUp': LogicalKeyboardKey.arrowUp,
  'Home': LogicalKeyboardKey.home,
  'End': LogicalKeyboardKey.end,
  'Enter': LogicalKeyboardKey.enter,
  ' ': LogicalKeyboardKey.space,
  'a': LogicalKeyboardKey.keyA,
};

double? _number(Object? json) => (json as num?)?.toDouble();

void main() {
  group('tabs keyboard vectors', () {
    if (_skip('tabs') != false) return;
    final file = _read('tabs');
    final items = [
      for (final item in _cases(file['items']))
        ChoiceItem(
          value: item['value'] as String,
          label: item['value'] as String,
          disabled: item['disabled'] as bool? ?? false,
        ),
    ];
    for (final vector in _cases(file['keys'])) {
      test(vector['name'] as String, () {
        final result = tabKey(
          items,
          vector['from'] as String,
          _keys[vector['key']]!,
          orientation: vector['orientation'] == 'vertical'
              ? Axis.vertical
              : Axis.horizontal,
          direction: vector['direction'] == 'rtl'
              ? TextDirection.rtl
              : TextDirection.ltr,
          manual: vector['activationMode'] == 'manual',
        );
        expect(result.focus, vector['focus']);
        expect(result.select, vector['select']);
      });
    }
  }, skip: _skip('tabs'));

  group('accordion toggle vectors', () {
    if (_skip('accordion') != false) return;
    for (final vector in _cases(_read('accordion')['toggles'])) {
      test(vector['name'] as String, () {
        final next = toggleExpanded(
          {...(vector['value'] as List<dynamic>).cast<String>()},
          vector['toggle'] as String,
          multiple: vector['type'] == 'multiple',
          collapsible: vector['collapsible'] as bool? ?? true,
        );
        expect(next.toList(), vector['expect']);
      });
    }
  }, skip: _skip('accordion'));

  group('pagination page list vectors', () {
    if (_skip('pagination') != false) return;
    for (final vector in _cases(_read('pagination')['pages'])) {
      test(vector['name'] as String, () {
        final pageCount = vector['pageCount'] as int;
        final page = clampPage(vector['page'] as int, pageCount);
        final expected = vector['expect'] as Map<String, dynamic>;
        expect(page, expected['page']);
        expect(
          pageItems(
            page: page,
            pageCount: pageCount < 1 ? 1 : pageCount,
            siblingCount: vector['siblingCount'] as int? ?? 1,
            boundaryCount: vector['boundaryCount'] as int? ?? 1,
          ).map((item) => item ?? 'ellipsis').toList(),
          expected['items'],
        );
      });
    }
  }, skip: _skip('pagination'));

  group('meter reading vectors', () {
    if (_skip('meter') != false) return;
    for (final vector in _cases(_read('meter')['readings'])) {
      test(vector['name'] as String, () {
        final value = _number(vector['value'])!;
        final min = _number(vector['min']) ?? 0;
        final max = _number(vector['max']) ?? 100;
        final low = _number(vector['low']);
        final high = _number(vector['high']);
        final expected = vector['expect'] as Map<String, dynamic>;
        expect(
          progressPercentage(value, min, max),
          closeTo(_number(expected['percentage'])!, 1e-9),
        );
        expect(
          meterLevel(value, min: min, max: max, low: low, high: high).name,
          expected['level'],
        );
        expect(
          meterQuality(
            value,
            min: min,
            max: max,
            low: low,
            high: high,
            optimum: _number(vector['optimum']),
          ).name,
          expected['quality'],
        );
      });
    }
  }, skip: _skip('meter'));

  group('progress percentage vectors', () {
    if (_skip('progress') != false) return;
    for (final vector in _cases(_read('progress')['percentages'])) {
      test(vector['name'] as String, () {
        expect(
          progressPercentage(
            _number(vector['value'])!,
            _number(vector['min']) ?? 0,
            _number(vector['max']) ?? 100,
          ),
          closeTo(_number(vector['expect'])!, 1e-9),
        );
      });
    }
  }, skip: _skip('progress'));
}
