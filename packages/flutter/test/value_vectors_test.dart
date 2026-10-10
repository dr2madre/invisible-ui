import 'dart:convert';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/pin_input/pin_input.dart';
import 'package:invisible_ui/src/slider/slider_logic.dart';
import 'package:invisible_ui/src/stepper/stepper.dart';

// The language-neutral vectors the core tests run against core/: slider and
// range slider values, stepper progress and PIN input cells. Present in a
// checkout of the whole repository; a copy of this package alone skips them.
File _vectors(String component) =>
    File('../../core/src/$component/__vectors__/$component.json');

Map<String, dynamic> _read(String component) =>
    jsonDecode(_vectors(component).readAsStringSync()) as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

bool _present(String component) => _vectors(component).existsSync();

double _n(Object? json) => (json! as num).toDouble();

(double, double) _pair(Object? json) {
  final list = json! as List<dynamic>;
  return (_n(list[0]), _n(list[1]));
}

void _closePair((double, double) got, Object? expected) {
  final want = _pair(expected);
  expect(got.$1, closeTo(want.$1, 1e-9));
  expect(got.$2, closeTo(want.$2, 1e-9));
}

void main() {
  group('slider vectors', () {
    if (!_present('slider')) return;
    final file = _read('slider');
    for (final v in _cases(file['snap'])) {
      test('snap: ${v['name']}', () {
        expect(
          snapSlider(_n(v['value']), _n(v['min']), _n(v['max']), _n(v['step'])),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
    for (final v in _cases(file['percentage'])) {
      test('percentage: ${v['name']}', () {
        expect(
          sliderPercentage(_n(v['value']), _n(v['min']), _n(v['max'])),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
    for (final v in _cases(file['fraction'])) {
      test('fraction: ${v['name']}', () {
        expect(
          sliderValueFromFraction(
            _n(v['fraction']),
            _n(v['min']),
            _n(v['max']),
            _n(v['step']),
          ),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
  });

  group('range slider vectors', () {
    if (!_present('range-slider')) return;
    final file = _read('range-slider');
    for (final v in _cases(file['snap'])) {
      test('snap: ${v['name']}', () {
        expect(
          snapRange(_n(v['value']), _n(v['min']), _n(v['max']), _n(v['step'])),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
    for (final v in _cases(file['minDistance'])) {
      test('distance: ${v['name']}', () {
        expect(
          effectiveMinDistance(
            _n(v['minDistance']),
            _n(v['min']),
            _n(v['max']),
            _n(v['step']),
          ),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
    for (final v in _cases(file['clampPair'])) {
      test('clampPair: ${v['name']}', () {
        _closePair(
          clampPair(
            _pair(v['value']),
            v['moved'] as int,
            _n(v['raw']),
            _n(v['min']),
            _n(v['max']),
            _n(v['step']),
            _n(v['minDistance']),
          ),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['normalizePair'])) {
      test('normalizePair: ${v['name']}', () {
        _closePair(
          normalizePair(
            _pair(v['value']),
            _n(v['min']),
            _n(v['max']),
            _n(v['step']),
            _n(v['minDistance']),
          ),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['orderBounds'])) {
      test('orderBounds: ${v['name']}', () {
        _closePair(orderBounds(_n(v['min']), _n(v['max'])), v['expect']);
      });
    }
    for (final v in _cases(file['nearerThumb'])) {
      test('nearerThumb: ${v['name']}', () {
        expect(
          nearerThumb(_n(v['pointer']), _n(v['lower']), _n(v['upper'])),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['pointerFraction'])) {
      test('pointerFraction: ${v['name']}', () {
        expect(
          pointerFraction(
            axis: v['orientation'] == 'vertical'
                ? Axis.vertical
                : Axis.horizontal,
            rtl: v['rtl'] as bool,
            box: const Rect.fromLTWH(10, 0, 200, 100),
            point: Offset(_n(v['x']), _n(v['y'])),
          ),
          closeTo(_n(v['expect']), 1e-9),
        );
      });
    }
  });

  group('stepper vectors', () {
    if (!_present('stepper')) return;
    for (final v in _cases(_read('stepper')['steps'])) {
      test(v['name'] as String, () {
        final count = v['count'] as int;
        final current = clampStep(v['current'] as int, count);
        final expected = v['expect'] as Map<String, dynamic>;
        expect(current, expected['current']);
        expect([
          for (var i = 0; i < count; i++) stepStatus(current, i).name,
        ], expected['status']);
        expect([
          for (var i = 0; i < count; i++)
            canGoTo(
              current: current,
              count: count,
              index: i,
              linear: v['linear'] as bool,
              enabled: !(v['disabled'] as bool),
            ),
        ], expected['reachable']);
      });
    }
  });

  group('pin input vectors', () {
    if (!_present('pin-input')) return;
    final file = _read('pin-input');
    PinInputType type(Object? json) => json == 'alphanumeric'
        ? PinInputType.alphanumeric
        : PinInputType.numeric;
    for (final v in _cases(file['split'])) {
      test('split: ${v['name']}', () {
        expect(
          splitValue(v['value'] as String, v['length'] as int),
          v['expect'],
        );
      });
    }
    for (final v in _cases(file['sanitize'])) {
      test('sanitize: ${v['name']}', () {
        expect(sanitizeChar(v['char'] as String, type(v['type'])), v['expect']);
      });
    }
    for (final v in _cases(file['paste'])) {
      test('paste: ${v['name']}', () {
        final result = pasteInto(
          (v['values'] as List<dynamic>).cast<String>(),
          v['index'] as int,
          v['text'] as String,
          type(v['type']),
        );
        final expected = v['expect'] as Map<String, dynamic>?;
        if (expected == null) {
          expect(result, isNull);
        } else {
          expect(result!.values, expected['values']);
          expect(result.focus, expected['focus']);
        }
      });
    }
  });
}
