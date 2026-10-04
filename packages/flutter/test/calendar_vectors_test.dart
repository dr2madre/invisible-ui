import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/calendar/calendar_date.dart';

// The language-neutral vectors core/src/calendar/vectors.test.ts runs
// against core/. Present in a checkout of the whole repository; a copy of
// this package alone skips them.
final File _logic = File('../../core/src/calendar/__vectors__/calendar.json');
final File _names = File(
  '../../core/src/calendar/__vectors__/calendar-names.json',
);

Map<String, dynamic> _read(File file) => file.existsSync()
    ? jsonDecode(file.readAsStringSync()) as Map<String, dynamic>
    : const <String, dynamic>{};

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

DateTime? _date(Object? iso) =>
    iso == null ? null : parseIsoDate(iso as String);

const Map<String, LogicalKeyboardKey> _keys = {
  'ArrowRight': LogicalKeyboardKey.arrowRight,
  'ArrowLeft': LogicalKeyboardKey.arrowLeft,
  'ArrowDown': LogicalKeyboardKey.arrowDown,
  'ArrowUp': LogicalKeyboardKey.arrowUp,
  'Home': LogicalKeyboardKey.home,
  'End': LogicalKeyboardKey.end,
  'PageUp': LogicalKeyboardKey.pageUp,
  'PageDown': LogicalKeyboardKey.pageDown,
};

Locale _locale(String tag) {
  final parts = tag.split('-');
  return Locale(parts[0], parts.length > 1 ? parts[1] : null);
}

void main() {
  final skip = _logic.existsSync() ? false : 'core/ is not in this checkout';
  final logic = _read(_logic);
  final names = _read(_names);

  group('calendar grid vectors', () {
    if (skip != false) return;
    for (final vector in _cases(logic['grid'])) {
      final year = vector['year'] as int;
      final month = vector['month'] as int;
      final weekStart = vector['weekStartsOn'] as int;
      test('$year-$month from weekday $weekStart', () {
        final weeks = monthMatrix(year, month, weekStart);
        expect(weeks, hasLength(6));
        expect(isoDate(weeks.first.first), vector['first']);
        expect(isoDate(weeks.last.last), vector['last']);
        expect(weekdayOrder(weekStart), vector['weekdays']);
      });
    }
  }, skip: skip);

  group('calendar keyboard vectors', () {
    if (skip != false) return;
    for (final vector in _cases(logic['keyboard'])) {
      test(vector['name'] as String, () {
        final target = gridKeyTarget(
          _keys[vector['key']]!,
          _date(vector['focused'])!,
          weekStart: vector['weekStartsOn'] as int,
          shift: vector['shift'] as bool? ?? false,
        )!;
        final landed = clampDate(
          target,
          _date(vector['min']),
          _date(vector['max']),
        );
        expect(isoDate(landed), vector['expect']);
      });
    }
    test('right to left swaps ArrowLeft and ArrowRight', () {
      for (final vector in _cases(logic['keyboard'])) {
        final key = vector['key'];
        if (key != 'ArrowLeft' && key != 'ArrowRight') continue;
        final focused = _date(vector['focused'])!;
        final mirrored = gridKeyTarget(
          key == 'ArrowLeft'
              ? LogicalKeyboardKey.arrowRight
              : LogicalKeyboardKey.arrowLeft,
          focused,
          weekStart: 1,
          rtl: true,
        )!;
        final landed = clampDate(
          mirrored,
          _date(vector['min']),
          _date(vector['max']),
        );
        expect(
          isoDate(landed),
          vector['expect'],
          reason: vector['name'] as String,
        );
      }
    });
  }, skip: skip);

  group('calendar step vectors', () {
    if (skip != false) return;
    for (final vector in _cases(logic['steps'])) {
      test('${vector['focused']} by ${vector['direction']}', () {
        final next = clampDate(
          addMonths(_date(vector['focused'])!, vector['direction'] as int),
          _date(vector['min']),
          _date(vector['max']),
        );
        expect(isoDate(next), vector['expect']);
      });
    }
  }, skip: skip);

  group('calendar selection vectors', () {
    if (skip != false) return;
    for (final vector in _cases(logic['selectable'])) {
      test('${vector['date']} in [${vector['min']}, ${vector['max']}]', () {
        expect(
          inRange(
            _date(vector['date'])!,
            _date(vector['min']),
            _date(vector['max']),
          ),
          vector['expect'],
        );
      });
    }
    for (final vector in _cases(logic['range'])) {
      test('${vector['picked']} extends ${vector['start']} to '
          '${vector['end']}', () {
        final start = _date(vector['start']);
        final next = extendRange(
          start == null ? null : DateRange(start, _date(vector['end'])),
          _date(vector['picked'])!,
        );
        final expected = vector['expect'] as Map<String, dynamic>;
        expect(isoDate(next.start), expected['start']);
        expect(next.end == null ? null : isoDate(next.end!), expected['end']);
      });
    }
    for (final vector in _cases(logic['within'])) {
      test('${vector['date']} within ${vector['start']} to '
          '${vector['end']}', () {
        expect(
          isWithinRange(
            DateRange(_date(vector['start'])!, _date(vector['end'])),
            _date(vector['date'])!,
          ),
          vector['expect'],
        );
      });
    }
  }, skip: skip);

  group('calendar name vectors', () {
    if (skip != false) return;
    final locales = names['locales'] as Map<String, dynamic>;
    for (final MapEntry(key: tag, value: json) in locales.entries) {
      test('$tag: the table matches the shared one', () {
        final entry = json as Map<String, dynamic>;
        final symbols = DateSymbols.forLocale(_locale(tag));
        final weekdays = entry['weekdays'] as Map<String, dynamic>;
        final months = entry['months'] as Map<String, dynamic>;
        final patterns = entry['patterns'] as Map<String, dynamic>;
        expect(symbols.weekdays, weekdays['long']);
        expect(symbols.shortWeekdays, weekdays['short']);
        expect(symbols.narrowWeekdays, weekdays['narrow']);
        expect(symbols.dayPattern, patterns['day']);
        expect(symbols.titlePattern, patterns['title']);
        expect(symbols.mediumPattern, patterns['medium']);
        expect(symbols.dayMonths, months['day']);
        expect(symbols.titleMonths, months['title']);
        expect(symbols.mediumMonths, months['medium']);
        expect(symbols.digits, (entry['digits'] as List<dynamic>).join());
        expect(symbols.hourCycle, entry['hourCycle']);
      });
    }
    for (final vector in _cases(names['cases'])) {
      final tag = vector['locale'] as String;
      test('$tag ${vector['style']} ${vector['date']}', () {
        final symbols = DateSymbols.forLocale(_locale(tag));
        final date = _date(vector['date'])!;
        final text = switch (vector['style']) {
          'day' => symbols.formatDay(date),
          'title' => symbols.formatMonth(date),
          _ => symbols.formatMedium(date),
        };
        expect(text, vector['expect']);
      });
    }
  }, skip: skip);

  test('names come from the calendar day, whatever the time zone', () {
    final en = DateSymbols.english;
    // Local midnight, UTC midnight and a late local time name the same day.
    for (final date in [
      DateTime(2026, 6, 1),
      DateTime.utc(2026, 6, 1),
      DateTime(2026, 6, 1, 23, 59),
    ]) {
      expect(en.formatDay(date), 'Monday, June 1, 2026');
    }
    expect(DateSymbols.forLocale(const Locale('xx')), en);
    expect(
      DateSymbols.forLocale(const Locale('fr', 'BE')),
      DateSymbols.forLocale(const Locale('fr')),
    );
  });
}
