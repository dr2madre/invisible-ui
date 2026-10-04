import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

// The date rules below port core/src/calendar/state.ts and the keys of
// core/src/calendar/connect.ts. The shared vectors in
// core/src/calendar/__vectors__ hold both to the same answers.
//
// A date is a DateTime at UTC midnight: the arithmetic never meets a
// daylight-saving change, and the names come from the date's year, month,
// day and weekday, never from a time zone.

/// The calendar day of [date], whatever its time and time zone.
DateTime dateOnly(DateTime date) =>
    DateTime.utc(date.year, date.month, date.day);

/// [date] as the local midnight of its calendar day, the form the widgets
/// report, as Flutter's own date pickers do.
DateTime localDay(DateTime date) => DateTime(date.year, date.month, date.day);

/// Whether [a] and [b] are the same calendar day; nulls match only nulls.
bool sameDay(DateTime? a, DateTime? b) => a == null || b == null
    ? a == b
    : a.year == b.year && a.month == b.month && a.day == b.day;

/// [date] moved by [days] days.
DateTime addDays(DateTime date, int days) =>
    DateTime.utc(date.year, date.month, date.day + days);

/// The days in [month] (1 to 12) of [year].
int daysInMonth(int year, int month) => DateTime.utc(year, month + 1, 0).day;

/// [date] moved by [months] months, its day clamped to the last of the
/// destination month: January 31 plus one month is February 28.
DateTime addMonths(DateTime date, int months) {
  final first = DateTime.utc(date.year, date.month + months);
  final last = daysInMonth(first.year, first.month);
  return DateTime.utc(first.year, first.month, date.day.clamp(1, last));
}

/// [date] moved by [years] years, clamped as [addMonths] clamps.
DateTime addYears(DateTime date, int years) => addMonths(date, years * 12);

/// The day of week, 0 for Sunday to 6, as the core counts it.
int weekdayIndex(DateTime date) => date.weekday % 7;

/// The first day of the week holding [date]; [weekStart] counts 0 for
/// Sunday to 6.
DateTime startOfWeek(DateTime date, int weekStart) =>
    addDays(date, -((weekdayIndex(date) - weekStart + 7) % 7));

/// A month as six weeks of seven days, padded with the days of the months
/// around it, so the grid keeps its height from month to month.
List<List<DateTime>> monthMatrix(int year, int month, int weekStart) {
  final start = startOfWeek(DateTime.utc(year, month), weekStart);
  return [
    for (var week = 0; week < 6; week++)
      [for (var day = 0; day < 7; day++) addDays(start, week * 7 + day)],
  ];
}

/// The weekday indices of a row, from [weekStart]: `[1, 2, 3, 4, 5, 6, 0]`
/// for a week that starts on Monday.
List<int> weekdayOrder(int weekStart) => [
  for (var i = 0; i < 7; i++) (weekStart + i) % 7,
];

/// Whether [date] lies within the inclusive bounds; a null bound is open.
bool inRange(DateTime date, DateTime? min, DateTime? max) =>
    !(min != null && date.isBefore(min)) && !(max != null && date.isAfter(max));

/// [date] moved inside the inclusive bounds.
DateTime clampDate(DateTime date, DateTime? min, DateTime? max) {
  if (min != null && date.isBefore(min)) return min;
  if (max != null && date.isAfter(max)) return max;
  return date;
}

/// A range of days: a [start], and an [end] that is null while the range is
/// half made. Both are calendar days; the time of day plays no part.
@immutable
class DateRange {
  /// Creates a range from [start] to [end], or a started one.
  const DateRange(this.start, [this.end]);

  /// The first day.
  final DateTime start;

  /// The last day, or null while only the start is picked.
  final DateTime? end;

  /// Whether both ends are picked.
  bool get isComplete => end != null;

  @override
  bool operator ==(Object other) =>
      other is DateRange &&
      sameDay(other.start, start) &&
      sameDay(other.end, end);

  @override
  int get hashCode => Object.hash(
    start.year,
    start.month,
    start.day,
    end?.year,
    end?.month,
    end?.day,
  );

  @override
  String toString() =>
      'DateRange(${isoDate(start)}, ${end == null ? null : isoDate(end!)})';
}

/// The range after the user picks [picked]. With nothing started, or a
/// finished range, the pick starts a new one; a pick before the start
/// becomes the start and pushes the old one to the end; otherwise it ends
/// the range.
DateRange extendRange(DateRange? range, DateTime picked) {
  if (range == null || range.end != null) return DateRange(picked);
  if (picked.isBefore(range.start)) return DateRange(picked, range.start);
  return DateRange(range.start, picked);
}

/// Whether [date] falls strictly between the ends of a finished [range].
bool isWithinRange(DateRange? range, DateTime date) {
  final end = range?.end;
  return range != null &&
      end != null &&
      date.isAfter(range.start) &&
      date.isBefore(end);
}

/// Where a key moves the focus in a day grid, before the bounds apply, or
/// null for a key the grid leaves alone. Arrows move a day or a week, and
/// in right-to-left text the left arrow is the next day; Home and End go
/// to the week's edges; Page Up and Page Down move a month, or a year with
/// [shift].
DateTime? gridKeyTarget(
  LogicalKeyboardKey key,
  DateTime focused, {
  required int weekStart,
  bool shift = false,
  bool rtl = false,
}) {
  if (key == LogicalKeyboardKey.arrowRight) {
    return addDays(focused, rtl ? -1 : 1);
  }
  if (key == LogicalKeyboardKey.arrowLeft) {
    return addDays(focused, rtl ? 1 : -1);
  }
  if (key == LogicalKeyboardKey.arrowDown) return addDays(focused, 7);
  if (key == LogicalKeyboardKey.arrowUp) return addDays(focused, -7);
  if (key == LogicalKeyboardKey.home) return startOfWeek(focused, weekStart);
  if (key == LogicalKeyboardKey.end) {
    return addDays(startOfWeek(focused, weekStart), 6);
  }
  if (key == LogicalKeyboardKey.pageUp) {
    return shift ? addYears(focused, -1) : addMonths(focused, -1);
  }
  if (key == LogicalKeyboardKey.pageDown) {
    return shift ? addYears(focused, 1) : addMonths(focused, 1);
  }
  return null;
}

/// [date] as ISO `YYYY-MM-DD`.
String isoDate(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-'
    '${date.month.toString().padLeft(2, '0')}-'
    '${date.day.toString().padLeft(2, '0')}';

/// An ISO `YYYY-MM-DD` date at UTC midnight.
DateTime parseIsoDate(String iso) {
  final parts = iso.split('-').map(int.parse).toList();
  return DateTime.utc(parts[0], parts[1], parts[2]);
}
