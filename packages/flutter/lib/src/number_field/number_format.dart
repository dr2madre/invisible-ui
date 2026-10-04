import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// How the editing text of a number field reads.
enum NumberInputStatus {
  /// Nothing typed.
  empty,

  /// A transient draft: a lone sign, a lone decimal separator, or digits with
  /// a trailing decimal separator.
  incomplete,

  /// A complete number within the constraints.
  valid,

  /// Text that is not a number, or a number that breaks a constraint.
  invalid,
}

/// Why a number field's value or draft is invalid.
enum NumberFieldError {
  /// The text is not a number.
  parse,

  /// The number is below the minimum.
  rangeUnderflow,

  /// The number is above the maximum.
  rangeOverflow,

  /// The number is not on the step grid.
  stepMismatch,
}

/// The result of reading an editing text.
@immutable
class NumberParseResult {
  /// Creates a parse result.
  const NumberParseResult(this.status, this.value, this.error);

  /// How the text reads.
  final NumberInputStatus status;

  /// The number the text expresses, or null.
  final double? value;

  /// Why the text is invalid, or null.
  final NumberFieldError? error;
}

/// The symbols and digits a locale writes numbers with.
///
/// [NumberSymbols.forLocale] returns the CLDR data the web adapters read
/// through `Intl.NumberFormat`, for the locales in its table; the shared test
/// vectors hold the two in agreement. Pass explicit symbols for any other
/// locale.
@immutable
class NumberSymbols {
  /// Creates a set of number symbols. The defaults are English.
  const NumberSymbols({
    this.decimal = '.',
    this.group = ',',
    this.minusSign = '-',
    String? negativePrefix,
    this.digits = '0123456789',
    this.minimumGroupingDigits = 1,
  }) : _negativePrefix = negativePrefix,
       assert(digits.length == 10, 'Ten digits, 0 to 9.');

  /// The decimal separator.
  final String decimal;

  /// The grouping separator.
  final String group;

  /// The minus sign.
  final String minusSign;

  final String? _negativePrefix;

  /// What a negative number starts with: the minus sign, with the direction
  /// mark some right-to-left locales put before it.
  String get negativePrefix => _negativePrefix ?? minusSign;

  /// The ten digits, 0 to 9, of the locale's numbering system.
  final String digits;

  /// How many digits the integer part needs beyond the first group before
  /// grouping applies: 2 in Italian or Spanish, where 1234 stays ungrouped.
  final int minimumGroupingDigits;

  static const String _arabDigits = '٠١٢٣٤٥٦٧٨٩';

  static const Map<String, NumberSymbols> _table = {
    'en': NumberSymbols(),
    'it': NumberSymbols(decimal: ',', group: '.', minimumGroupingDigits: 2),
    'de': NumberSymbols(decimal: ',', group: '.'),
    'de-CH': NumberSymbols(group: '’'),
    'fr': NumberSymbols(decimal: ',', group: ' '),
    'fr-CA': NumberSymbols(decimal: ',', group: ' '),
    'es': NumberSymbols(decimal: ',', group: '.', minimumGroupingDigits: 2),
    'es-MX': NumberSymbols(),
    'pt': NumberSymbols(decimal: ',', group: '.'),
    'pt-PT': NumberSymbols(decimal: ',', group: ' ', minimumGroupingDigits: 2),
    'nl': NumberSymbols(decimal: ',', group: '.'),
    'pl': NumberSymbols(decimal: ',', group: ' ', minimumGroupingDigits: 2),
    'sv': NumberSymbols(decimal: ',', group: ' ', minusSign: '−'),
    'ru': NumberSymbols(decimal: ',', group: ' '),
    'tr': NumberSymbols(decimal: ',', group: '.'),
    'ja': NumberSymbols(),
    'zh': NumberSymbols(),
    'ar': NumberSymbols(negativePrefix: '‎-'),
    'ar-EG': NumberSymbols(
      decimal: '٫',
      group: '٬',
      negativePrefix: '؜-',
      digits: _arabDigits,
    ),
    'ar-SA': NumberSymbols(
      decimal: '٫',
      group: '٬',
      negativePrefix: '؜-',
      digits: _arabDigits,
    ),
    'ar-MA': NumberSymbols(decimal: ',', group: '.', negativePrefix: '‎-'),
    'he': NumberSymbols(negativePrefix: '‎-'),
    'fa': NumberSymbols(
      decimal: '٫',
      group: '٬',
      minusSign: '−',
      negativePrefix: '‎−',
      digits: '۰۱۲۳۴۵۶۷۸۹',
    ),
  };

  /// The symbols of [locale]: its language and country, then its language
  /// alone, then English.
  static NumberSymbols forLocale(Locale locale) {
    final country = locale.countryCode;
    return (country == null
            ? null
            : _table['${locale.languageCode}-$country']) ??
        _table[locale.languageCode] ??
        _table['en']!;
  }

  @override
  bool operator ==(Object other) =>
      other is NumberSymbols &&
      other.decimal == decimal &&
      other.group == group &&
      other.minusSign == minusSign &&
      other.negativePrefix == negativePrefix &&
      other.digits == digits &&
      other.minimumGroupingDigits == minimumGroupingDigits;

  @override
  int get hashCode => Object.hash(
    decimal,
    group,
    minusSign,
    negativePrefix,
    digits,
    minimumGroupingDigits,
  );
}

// The rules below port core/src/number-field/state.ts. The shared vectors in
// core/src/number-field/__vectors__ hold both to the same answers.

final RegExp _directionMarks = RegExp('[\u061c\u200e\u200f\u2066-\u2069]');
final RegExp _lone = RegExp(r'^[-+]$|^[-+]?\.$');
final RegExp _complete = RegExp(r'^[-+]?(\d+(\.\d+)?|\.\d+)$');
final RegExp _trailingSeparator = RegExp(r'^[-+]?\d+\.$');

// Group separators typed with a plain or non-breaking space all count as the
// locale's space grouping, because keyboards produce different spaces.
const List<String> _spaceGroups = [' ', ' ', ' ', ' '];

const double _epsilon = 2.220446049250313e-16;

/// JavaScript's `Math.round`: halves round towards positive infinity.
double _round(double x) {
  final floor = x.floorToDouble();
  return x - floor >= 0.5 ? floor + 1 : floor;
}

/// Parse an editing text against [symbols]. This classifies the grammar
/// only; [validateNumber] checks range and step.
NumberParseResult parseNumber(String text, NumberSymbols symbols) {
  final trimmed = text.trim();
  if (trimmed.isEmpty) {
    return const NumberParseResult(NumberInputStatus.empty, null, null);
  }
  var s = trimmed.replaceAll(_directionMarks, '');
  if (symbols.digits != '0123456789') {
    final folded = StringBuffer();
    for (final char in s.split('')) {
      final index = symbols.digits.indexOf(char);
      folded.write(index == -1 ? char : '$index');
    }
    s = folded.toString();
  }
  final groups = symbols.group.trim().isEmpty ? _spaceGroups : [symbols.group];
  for (final group in groups) {
    s = s.replaceAll(group, '');
  }
  if (symbols.minusSign != '-') s = s.replaceAll(symbols.minusSign, '-');
  s = s.replaceAll('−', '-');
  if (symbols.decimal != '.') s = s.replaceAll(symbols.decimal, '.');

  if (_lone.hasMatch(s)) {
    return const NumberParseResult(NumberInputStatus.incomplete, null, null);
  }
  final trailing = _trailingSeparator.hasMatch(s);
  if (!trailing && !_complete.hasMatch(s)) {
    return const NumberParseResult(
      NumberInputStatus.invalid,
      null,
      NumberFieldError.parse,
    );
  }
  final value = double.parse(trailing ? s.substring(0, s.length - 1) : s);
  if (!value.isFinite) {
    return const NumberParseResult(
      NumberInputStatus.invalid,
      null,
      NumberFieldError.parse,
    );
  }
  return NumberParseResult(
    trailing ? NumberInputStatus.incomplete : NumberInputStatus.valid,
    value == 0 ? 0 : value,
    null,
  );
}

/// Why [value] breaks the constraints, or null.
NumberFieldError? validateNumber(
  double value,
  double? min,
  double? max,
  double step,
) {
  if (min != null && value < min) return NumberFieldError.rangeUnderflow;
  if (max != null && value > max) return NumberFieldError.rangeOverflow;
  final units = (value - (min ?? 0)) / step;
  final distance = (units - _round(units)).abs();
  // The tolerance absorbs float noise, so 0.3 with step 0.1 is on the grid.
  final tolerance = (units.abs() * _epsilon * 4).clamp(1e-8, double.infinity);
  return distance > tolerance ? NumberFieldError.stepMismatch : null;
}

/// Parse and validate an editing text in one step.
NumberParseResult readNumber(
  String text,
  NumberSymbols symbols,
  double? min,
  double? max,
  double step,
) {
  final parsed = parseNumber(text, symbols);
  if (parsed.status != NumberInputStatus.valid) return parsed;
  final error = validateNumber(parsed.value!, min, max, step);
  return error == null
      ? parsed
      : NumberParseResult(NumberInputStatus.invalid, parsed.value, error);
}

/// The shortest decimal digits of [value] and the position of the decimal
/// point in them, from the round-trip form Dart prints.
({String digits, int point}) _decimal(double value) {
  var text = value.abs().toString();
  var exponent = 0;
  final e = text.indexOf('e');
  if (e != -1) {
    exponent = int.parse(text.substring(e + 1));
    text = text.substring(0, e);
  }
  final dot = text.indexOf('.');
  var digits = dot == -1 ? text : text.replaceFirst('.', '');
  var point = (dot == -1 ? text.length : dot) + exponent;
  final leading = digits.length - digits.replaceFirst(RegExp('^0+'), '').length;
  digits = digits.substring(leading);
  point -= leading;
  digits = digits.replaceFirst(RegExp(r'0+$'), '');
  return (digits: digits, point: point);
}

/// [value] as plain ASCII digits, rounded half away from zero to 15
/// fraction digits, as `Intl.NumberFormat` with `maximumFractionDigits: 15`.
({String integer, String fraction}) _plain(double value) {
  var (:digits, :point) = _decimal(value);
  if (digits.isEmpty) return (integer: '0', fraction: '');
  // Pad so the digits cover the integer part and 15 fraction digits.
  if (point <= 0) {
    digits = '${'0' * (1 - point)}$digits';
    point = 1;
  }
  if (digits.length < point) digits = digits.padRight(point, '0');
  final keep = point + 15;
  if (digits.length > keep) {
    final roundUp = digits.codeUnitAt(keep) >= 0x35;
    var kept = BigInt.parse(digits.substring(0, keep));
    if (roundUp) kept += BigInt.one;
    final text = kept.toString().padLeft(keep, '0');
    if (text.length > keep) point += 1;
    digits = text;
  }
  final integer = digits.substring(0, point).replaceFirst(RegExp('^0+'), '');
  final fraction = digits.substring(point).replaceFirst(RegExp(r'0+$'), '');
  return (integer: integer.isEmpty ? '0' : integer, fraction: fraction);
}

/// The localized display text of [value], empty for null.
String formatNumber(double? value, NumberSymbols symbols) {
  if (value == null) return '';
  final (:integer, :fraction) = _plain(value);
  final grouped = StringBuffer();
  final grouping = integer.length >= 4 + symbols.minimumGroupingDigits - 1;
  for (var i = 0; i < integer.length; i++) {
    if (grouping && i > 0 && (integer.length - i) % 3 == 0) {
      grouped.write(symbols.group);
    }
    grouped.write(symbols.digits[integer.codeUnitAt(i) - 0x30]);
  }
  if (fraction.isNotEmpty) {
    grouped.write(symbols.decimal);
    for (final unit in fraction.codeUnits) {
      grouped.write(symbols.digits[unit - 0x30]);
    }
  }
  final zero = integer == '0' && fraction.isEmpty;
  return value < 0 && !zero
      ? '${symbols.negativePrefix}$grouped'
      : grouped.toString();
}

/// The canonical ASCII form value, empty for null: no grouping, a dot for
/// the decimal separator.
String canonicalNumber(double? value) {
  if (value == null) return '';
  final (:integer, :fraction) = _plain(value);
  final zero = integer == '0' && fraction.isEmpty;
  final body = fraction.isEmpty ? integer : '$integer.$fraction';
  return value < 0 && !zero ? '-$body' : body;
}

/// The number of decimal places of [value], through e-notation.
int decimalsOf(double value) {
  if (!value.isFinite) return 0;
  final (:digits, :point) = _decimal(value);
  final places = digits.length - point;
  return digits.isEmpty || places < 0 ? 0 : places;
}

double _clamp(double value, double? min, double? max) {
  if (min != null && value < min) return min;
  if (max != null && value > max) return max;
  return value;
}

/// The next value for a step action. From an on-grid value it moves one
/// step; from an off-grid value to the nearest step multiple in [direction];
/// from null to the nearest bound to zero. The result stays inside the
/// bounds. The arithmetic runs on scaled integers, so decimal steps never
/// drift.
double snapToStep(
  double? current,
  int direction,
  double? min,
  double? max,
  double step,
) {
  if (current == null) {
    return _clamp(direction == 1 ? (min ?? 0) : (max ?? 0), min, max);
  }
  final base = min ?? 0;
  final decimals = [
    decimalsOf(step),
    decimalsOf(base),
    decimalsOf(current),
  ].reduce((a, b) => a > b ? a : b).clamp(0, 12);
  final scale = math.pow(10, decimals).toDouble();
  final currentScaled = _round(current * scale);
  final baseScaled = _round(base * scale);
  final stepScaled = _round(step * scale);
  if (!currentScaled.isFinite || stepScaled <= 0) {
    return _clamp(current + direction * step, min, max);
  }
  final remainder = (currentScaled - baseScaled) % stepScaled;
  final next = remainder == 0
      ? currentScaled + direction * stepScaled
      : direction == 1
      ? currentScaled + (stepScaled - remainder)
      : currentScaled - remainder;
  return _clamp(next / scale, min, max);
}
