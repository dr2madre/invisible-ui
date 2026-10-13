import 'dart:convert';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/number_field/number_format.dart';

/// The number field vectors the core tests read too. Present in a checkout
/// of the whole repository; a copy of this package alone skips them.
final File _file = File(
  '../../core/src/number-field/__vectors__/number-field.json',
);

NumberSymbols _symbols(String tag) {
  final parts = tag.split('-');
  return NumberSymbols.forLocale(
    Locale(parts.first, parts.length > 1 ? parts[1] : null),
  );
}

double? _number(Object? value) => (value as num?)?.toDouble();

String _camel(String kebab) => kebab.replaceAllMapped(
  RegExp('-([a-z])'),
  (match) => match.group(1)!.toUpperCase(),
);

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  final vectors = _file.existsSync()
      ? jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>
      : <String, dynamic>{};
  List<Map<String, dynamic>> cases(String name) =>
      ((vectors[name] as List<dynamic>?) ?? const <dynamic>[])
          .cast<Map<String, dynamic>>();

  group('symbols', () {
    test('the table matches the shared vectors', () {
      final table = vectors['symbols'] as Map<String, dynamic>;
      for (final MapEntry(:key, :value) in table.entries) {
        final expected = value as Map<String, dynamic>;
        final symbols = _symbols(key);
        expect(symbols.decimal, expected['decimal'], reason: key);
        expect(symbols.group, expected['group'], reason: key);
        expect(symbols.minusSign, expected['minusSign'], reason: key);
        expect(
          symbols.digits,
          (expected['digits'] as List<dynamic>).join(),
          reason: key,
        );
      }
    }, skip: skip);

    test('an unknown country falls back to its language, then English', () {
      expect(
        NumberSymbols.forLocale(const Locale('it', 'CH')),
        NumberSymbols.forLocale(const Locale('it')),
      );
      expect(
        NumberSymbols.forLocale(const Locale('xx')),
        const NumberSymbols(),
      );
    });
  });

  test('parse', () {
    for (final vector in cases('parse')) {
      final expected = vector['expect'] as Map<String, dynamic>;
      final result = parseNumber(
        vector['text'] as String,
        _symbols(vector['locale'] as String),
      );
      final reason = '${vector['locale']} ${jsonEncode(vector['text'])}';
      expect(result.status.name, expected['status'], reason: reason);
      expect(result.value, _number(expected['value']), reason: reason);
      expect(
        result.error?.name,
        expected['error'] == null ? null : _camel(expected['error'] as String),
        reason: reason,
      );
    }
  }, skip: skip);

  test('validate', () {
    for (final vector in cases('validate')) {
      final error = validateNumber(
        _number(vector['value'])!,
        _number(vector['min']),
        _number(vector['max']),
        _number(vector['step'])!,
      );
      expect(
        error?.name,
        vector['expect'] == null ? null : _camel(vector['expect'] as String),
        reason: '$vector',
      );
    }
  }, skip: skip);

  test('step', () {
    for (final vector in cases('snap')) {
      expect(
        snapToStep(
          _number(vector['current']),
          vector['direction'] as int,
          _number(vector['min']),
          _number(vector['max']),
          _number(vector['step'])!,
        ),
        _number(vector['expect']),
        reason: '$vector',
      );
    }
  }, skip: skip);

  test('format', () {
    for (final vector in cases('format')) {
      expect(
        formatNumber(
          _number(vector['value']),
          _symbols(vector['locale'] as String),
        ),
        vector['expect'],
        reason: '${vector['locale']} ${vector['value']}',
      );
    }
    for (final vector in cases('canonical')) {
      expect(
        canonicalNumber(_number(vector['value'])),
        vector['expect'],
        reason: '${vector['value']}',
      );
    }
    for (final vector in cases('decimals')) {
      expect(
        decimalsOf(_number(vector['value'])!),
        vector['expect'],
        reason: '${vector['value']}',
      );
    }
  }, skip: skip);

  test('every formatted value parses back to the same number', () {
    const values = [0.0, 1, -1, 0.5, 1234.5, -9876543.21, 15, 1000000];
    for (final tag in ['en', 'it-IT', 'de-DE', 'fr-FR', 'ar-EG', 'sv', 'fa']) {
      final symbols = _symbols(tag);
      for (final value in values) {
        final text = formatNumber(value.toDouble(), symbols);
        final result = parseNumber(text, symbols);
        expect(result.status, NumberInputStatus.valid, reason: '$tag $text');
        expect(result.value, value, reason: '$tag $text');
      }
    }
  });

  group('Arabic-Indic and Persian digits', () {
    test('fold to ASCII; other text stays as it is', () {
      expect(asciiDigits('٠١٢٣٤'), '01234');
      expect(asciiDigits('٥٦٧٨٩'), '56789');
      expect(asciiDigits('۰۱۲۳۴'), '01234');
      expect(asciiDigits('۵۶۷۸۹'), '56789');
      expect(asciiDigits('12:30 ٫٬'), '12:30 ٫٬');
    });

    test('parse in every locale of the table', () {
      for (final tag in [
        'en',
        'it-IT',
        'de-DE',
        'de-CH',
        'fr-FR',
        'sv',
        'ja',
        'he',
        'ar',
        'ar-EG',
        'ar-MA',
        'fa',
      ]) {
        final symbols = _symbols(tag);
        for (final text in ['١٢٣', '۱۲۳']) {
          final result = parseNumber(text, symbols);
          expect(result.status, NumberInputStatus.valid, reason: '$tag $text');
          expect(result.value, 123, reason: '$tag $text');
        }
      }
    });

    test('mix with the locale separators and signs', () {
      expect(parseNumber('-١٢.٥', _symbols('en')).value, -12.5);
      expect(parseNumber('١.٢٣٤,٥', _symbols('de')).value, 1234.5);
      expect(parseNumber('۱’۲۳۴', _symbols('de-CH')).value, 1234);
      expect(
        parseNumber('١٢.', _symbols('en')).status,
        NumberInputStatus.incomplete,
      );
      expect(parseNumber('١٢a', _symbols('en')).error, NumberFieldError.parse);
    });
  });

  group('apostrophe grouping', () {
    final swiss = _symbols('de-CH');

    test('de-CH takes the typographic and the straight apostrophe', () {
      for (final text in ['1’234.5', "1'234.5", "12'345’678", "-1'234"]) {
        final result = parseNumber(text, swiss);
        expect(result.status, NumberInputStatus.valid, reason: text);
      }
      expect(parseNumber("1'234.5", swiss).value, 1234.5);
      expect(parseNumber("12'345’678", swiss).value, 12345678);
    });

    test('a malformed number is still refused', () {
      for (final text in ["1'234,5", "1'234.5.6", "1'2a3", "'"]) {
        expect(
          parseNumber(text, swiss).error,
          NumberFieldError.parse,
          reason: text,
        );
      }
    });

    test('an apostrophe is no separator where the locale groups otherwise', () {
      for (final tag in ['en', 'de-DE', 'it-IT', 'fr-FR']) {
        for (final text in ["1'234", '1’234']) {
          expect(
            parseNumber(text, _symbols(tag)).error,
            NumberFieldError.parse,
            reason: '$tag $text',
          );
        }
      }
    });

    test('display uses the typographic apostrophe', () {
      expect(formatNumber(1234.5, swiss), '1’234.5');
      expect(formatNumber(-12345678, swiss), '-12’345’678');
    });
  });
}
