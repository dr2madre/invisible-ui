import 'package:flutter/foundation.dart';

// The rules below port core/src/time-field/state.ts and the key handling of
// core/src/time-field/connect.ts. The shared vectors in
// core/src/time-field/__vectors__ hold both to the same answers.

/// A part of a time field.
enum TimeSegment {
  /// The hour: 0 to 23, or 1 to 12 in a 12-hour field.
  hour,

  /// The minute.
  minute,

  /// The second, when the field has one.
  second,

  /// AM or PM, in a 12-hour field.
  dayPeriod,
}

/// Before or after noon.
enum DayPeriod {
  /// Before noon.
  am,

  /// After noon.
  pm,
}

/// How a time field's segments read.
enum TimeInputStatus {
  /// No segment has a value.
  empty,

  /// Some segments have a value, not yet enough for a time.
  incomplete,

  /// A complete time within the bounds.
  valid,

  /// A value that is malformed, out of range, at the wrong precision, or
  /// outside the bounds.
  invalid,
}

/// Why a time field's value is invalid.
enum TimeFieldError {
  /// The value is not `HH:mm` or `HH:mm:ss`.
  invalidFormat,

  /// A segment of the value is out of its range, such as 25:30.
  outOfRange,

  /// The field has seconds and the value has none.
  secondsRequired,

  /// The value has seconds and the field has none.
  secondsNotAllowed,

  /// The time is before the minimum.
  rangeUnderflow,

  /// The time is after the maximum.
  rangeOverflow,
}

/// The parts of a time: the hour always 0 to 23; null is empty.
@immutable
class TimeParts {
  /// Creates the parts.
  const TimeParts({this.hour, this.minute, this.second, this.dayPeriod});

  /// No part filled.
  static const TimeParts empty = TimeParts();

  /// The hour, 0 to 23.
  final int? hour;

  /// The minute.
  final int? minute;

  /// The second.
  final int? second;

  /// AM or PM; needed to publish a value in a 12-hour field.
  final DayPeriod? dayPeriod;

  /// Whether no part is filled.
  bool get isEmpty =>
      hour == null && minute == null && second == null && dayPeriod == null;

  /// The part of [segment], as a number; AM is 0 and PM 1.
  int? of(TimeSegment segment) => switch (segment) {
    TimeSegment.hour => hour,
    TimeSegment.minute => minute,
    TimeSegment.second => second,
    TimeSegment.dayPeriod => dayPeriod?.index,
  };

  /// A copy with [segment] set to [value]; a null value empties it.
  TimeParts withPart(TimeSegment segment, int? value) => TimeParts(
    hour: segment == TimeSegment.hour ? value : hour,
    minute: segment == TimeSegment.minute ? value : minute,
    second: segment == TimeSegment.second ? value : second,
    dayPeriod: segment == TimeSegment.dayPeriod
        ? (value == null ? null : DayPeriod.values[value])
        : dayPeriod,
  );

  @override
  bool operator ==(Object other) =>
      other is TimeParts &&
      other.hour == hour &&
      other.minute == minute &&
      other.second == second &&
      other.dayPeriod == dayPeriod;

  @override
  int get hashCode => Object.hash(hour, minute, second, dayPeriod);
}

/// The result of reading a time value.
@immutable
class TimeParseResult {
  const TimeParseResult._(
    this.status,
    this.parts,
    this.canonical,
    this.error,
    this.invalidSegment,
    this.normalized,
  );

  /// Empty, valid or invalid.
  final TimeInputStatus status;

  /// The parts; empty when the value is empty or invalid.
  final TimeParts parts;

  /// The canonical 24-hour value when valid.
  final String? canonical;

  /// Why the value is invalid.
  final TimeFieldError? error;

  /// The segment out of range, when one can be named.
  final TimeSegment? invalidSegment;

  /// Whether a valid value was padded, as `9:30` to `09:30`.
  final bool normalized;
}

final RegExp _timePattern = RegExp(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?$');

String _pad2(int n) => n.toString().padLeft(2, '0');

/// Reads a time value. [withSeconds] true requires seconds, false rejects
/// them, null takes either. In a 12-hour field ([hourCycle] 12) a valid
/// value derives its day period. Nothing is clamped or guessed.
TimeParseResult parseTimeValue(
  String? value, {
  bool? withSeconds,
  int? hourCycle,
}) {
  TimeParseResult invalid(TimeFieldError error, [TimeSegment? segment]) =>
      TimeParseResult._(
        TimeInputStatus.invalid,
        TimeParts.empty,
        null,
        error,
        segment,
        false,
      );
  if (value == null || value.isEmpty) {
    return const TimeParseResult._(
      TimeInputStatus.empty,
      TimeParts.empty,
      null,
      null,
      null,
      false,
    );
  }
  final match = _timePattern.firstMatch(value);
  if (match == null) return invalid(TimeFieldError.invalidFormat);
  final hasSeconds = match.group(3) != null;
  if (withSeconds == true && !hasSeconds) {
    return invalid(TimeFieldError.secondsRequired, TimeSegment.second);
  }
  if (withSeconds == false && hasSeconds) {
    return invalid(TimeFieldError.secondsNotAllowed, TimeSegment.second);
  }
  final hour = int.parse(match.group(1)!);
  final minute = int.parse(match.group(2)!);
  final second = hasSeconds ? int.parse(match.group(3)!) : null;
  final outOfRange = hour > 23
      ? TimeSegment.hour
      : minute > 59
      ? TimeSegment.minute
      : second != null && second > 59
      ? TimeSegment.second
      : null;
  if (outOfRange != null) {
    return invalid(TimeFieldError.outOfRange, outOfRange);
  }
  final canonical =
      '${_pad2(hour)}:${_pad2(minute)}${second == null ? '' : ':${_pad2(second)}'}';
  return TimeParseResult._(
    TimeInputStatus.valid,
    TimeParts(
      hour: hour,
      minute: minute,
      second: second,
      dayPeriod: hourCycle == 12 ? periodOf(hour) : null,
    ),
    canonical,
    null,
    null,
    canonical != value,
  );
}

/// The segments of a field, in order.
List<TimeSegment> timeSegments(int hourCycle, bool withSeconds) => [
  TimeSegment.hour,
  TimeSegment.minute,
  if (withSeconds) TimeSegment.second,
  if (hourCycle == 12) TimeSegment.dayPeriod,
];

/// The inclusive bounds a numeric segment shows.
({int min, int max}) segmentBounds(TimeSegment segment, int hourCycle) =>
    segment == TimeSegment.hour
    ? (hourCycle == 12 ? (min: 1, max: 12) : (min: 0, max: 23))
    : (min: 0, max: 59);

/// The 12-hour display hour of a 0 to 23 hour.
int to12(int hour) => hour % 12 == 0 ? 12 : hour % 12;

/// The day period of a 0 to 23 hour.
DayPeriod periodOf(int hour) => hour >= 12 ? DayPeriod.pm : DayPeriod.am;

/// The 0 to 23 hour of a 12-hour display hour and a period.
int from12(int display, DayPeriod period) =>
    display % 12 + (period == DayPeriod.pm ? 12 : 0);

/// The canonical 24-hour value of [parts], or null while a part the field
/// needs is missing.
String? formatTime(TimeParts parts, bool withSeconds, int hourCycle) {
  final hour = parts.hour;
  final minute = parts.minute;
  if (hour == null || minute == null) return null;
  if (withSeconds && parts.second == null) return null;
  if (hourCycle == 12 && parts.dayPeriod == null) return null;
  final base = '${_pad2(hour)}:${_pad2(minute)}';
  return withSeconds ? '$base:${_pad2(parts.second ?? 0)}' : base;
}

/// Whether a complete time falls outside the bounds. Reported, never
/// corrected. 09:30 and 09:30:00 compare as the same time.
TimeFieldError? timeRangeError(String? canonical, String? min, String? max) {
  if (canonical == null) return null;
  String trim(String a, String b) =>
      a.length == b.length ? a : a.substring(0, 5);
  if (min != null && trim(canonical, min).compareTo(trim(min, canonical)) < 0) {
    return TimeFieldError.rangeUnderflow;
  }
  if (max != null && trim(canonical, max).compareTo(trim(max, canonical)) > 0) {
    return TimeFieldError.rangeOverflow;
  }
  return null;
}

/// A bound that parses as a time, or null.
String? validBound(String? value) =>
    value != null && parseTimeValue(value).status == TimeInputStatus.valid
    ? value
    : null;

/// What a key did in a [TimeEditor].
typedef TimeKeyResult = ({bool handled, TimeSegment? focus});

/// The editing state of a time field, and the keys that change it.
///
/// A key is named as the web names it: `ArrowUp`, `ArrowDown`,
/// `ArrowLeft`, `ArrowRight`, `Backspace`, `Delete`, `Enter`, `Escape`, a
/// digit, or a letter for the day period.
class TimeEditor {
  /// Starts from [value], a canonical time or null.
  TimeEditor({
    required String? value,
    required this.hourCycle,
    required this.withSeconds,
    String? min,
    String? max,
  }) : min = validBound(min),
       max = validBound(max) {
    load(value);
  }

  /// 12 or 24.
  final int hourCycle;

  /// Whether the field has seconds.
  final bool withSeconds;

  /// The earliest time accepted without an error.
  final String? min;

  /// The latest time accepted without an error.
  final String? max;

  /// The parts the field shows.
  TimeParts parts = TimeParts.empty;

  /// The parts at the last commit; Escape puts these back.
  TimeParts committed = TimeParts.empty;

  /// The structural error of a value set from outside; an edit clears it.
  TimeFieldError? structuralError;

  /// The segment a structural error names.
  TimeSegment? invalidSegment;

  String _buffer = '';
  TimeSegment? _bufferSegment;

  /// Replaces the state with [value], as a value from outside or a reset.
  void load(String? value) {
    final parsed = parseTimeValue(
      value,
      hourCycle: hourCycle,
      withSeconds: withSeconds,
    );
    parts = parsed.parts;
    committed = parsed.parts;
    structuralError = parsed.error;
    invalidSegment = parsed.invalidSegment;
    _buffer = '';
    _bufferSegment = null;
  }

  /// The segments, in order.
  List<TimeSegment> get segments => timeSegments(hourCycle, withSeconds);

  /// The canonical value, or null while incomplete.
  String? get value => formatTime(parts, withSeconds, hourCycle);

  /// The error the field reports: a structural one, else the bounds.
  TimeFieldError? get error =>
      structuralError ?? timeRangeError(value, min, max);

  /// How the segments read.
  TimeInputStatus get status => error != null
      ? TimeInputStatus.invalid
      : value != null
      ? TimeInputStatus.valid
      : parts.isEmpty
      ? TimeInputStatus.empty
      : TimeInputStatus.incomplete;

  /// The number a numeric segment shows, or null.
  int? displayValue(TimeSegment segment) {
    if (segment == TimeSegment.hour) {
      final hour = parts.hour;
      return hour == null ? null : (hourCycle == 12 ? to12(hour) : hour);
    }
    if (segment == TimeSegment.dayPeriod) return null;
    return parts.of(segment);
  }

  /// A segment's text: its padded number or period, or a placeholder.
  String text(TimeSegment segment) {
    if (segment == TimeSegment.dayPeriod) {
      return switch (parts.dayPeriod) {
        DayPeriod.am => 'AM',
        DayPeriod.pm => 'PM',
        null => '--',
      };
    }
    final shown = displayValue(segment);
    if (shown != null) return _pad2(shown);
    return switch (segment) {
      TimeSegment.hour => 'hh',
      TimeSegment.minute => 'mm',
      _ => 'ss',
    };
  }

  void _set(TimeParts next, [String buffer = '', TimeSegment? segment]) {
    parts = next;
    _buffer = buffer;
    _bufferSegment = segment;
    structuralError = null;
    invalidSegment = null;
  }

  TimeParts _withNumber(TimeSegment segment, int? raw) {
    if (segment != TimeSegment.hour || raw == null || hourCycle == 24) {
      return parts.withPart(segment, raw);
    }
    final period = parts.dayPeriod;
    return parts.withPart(
      TimeSegment.hour,
      period == null ? raw : from12(raw, period),
    );
  }

  /// Steps a segment by [direction], wrapping; from empty, up starts at
  /// the lowest value and down at the highest.
  void step(TimeSegment segment, int direction) {
    if (segment == TimeSegment.dayPeriod) return _togglePeriod();
    final (:min, :max) = segmentBounds(segment, hourCycle);
    final current = displayValue(segment);
    final base = current ?? (direction == 1 ? min - 1 : min);
    final span = max - min + 1;
    _set(_withNumber(segment, min + (base - min + direction) % span));
  }

  /// The text [segment] would show after a step, for the increase and
  /// decrease actions; the state stays as it is.
  String steppedText(TimeSegment segment, int direction) {
    final saved = parts;
    final buffer = _buffer;
    final bufferSegment = _bufferSegment;
    final error = structuralError;
    final invalid = invalidSegment;
    step(segment, direction);
    final shown = text(segment);
    parts = saved;
    _buffer = buffer;
    _bufferSegment = bufferSegment;
    structuralError = error;
    invalidSegment = invalid;
    return shown;
  }

  void _togglePeriod([DayPeriod? to]) {
    final current = parts.dayPeriod;
    final period =
        to ?? (current == DayPeriod.am ? DayPeriod.pm : DayPeriod.am);
    final hour = parts.hour;
    final display = hour == null ? null : (current == null ? hour : to12(hour));
    _set(
      TimeParts(
        hour: display == null ? null : from12(display, period),
        minute: parts.minute,
        second: parts.second,
        dayPeriod: period,
      ),
    );
  }

  TimeSegment? _typeDigit(TimeSegment segment, int digit) {
    final max = segmentBounds(segment, hourCycle).max;
    final buffer = _bufferSegment == segment ? '$_buffer$digit' : '$digit';
    final candidate = int.parse(buffer);
    // An impossible digit keeps the value and the focus.
    if (candidate > max) return null;
    // A lone 0 is no 12-hour hour yet: wait for the second digit.
    final tooSmall =
        segment == TimeSegment.hour && hourCycle == 12 && candidate == 0;
    final full = !tooSmall && (buffer.length >= 2 || candidate * 10 > max);
    final next = _withNumber(segment, tooSmall ? null : candidate);
    if (!full) {
      _set(next, buffer, segment);
      return null;
    }
    _set(next);
    final order = segments;
    final index = order.indexOf(segment);
    return index < order.length - 1 ? order[index + 1] : null;
  }

  void _clear(TimeSegment segment) => _set(
    segment == TimeSegment.dayPeriod
        ? parts.withPart(TimeSegment.dayPeriod, null)
        : _withNumber(segment, null),
  );

  /// Records the parts as finished. True when the value changed since the
  /// last commit, so the field reports it.
  bool commit() {
    final changed = formatTime(committed, withSeconds, hourCycle) != value;
    committed = parts;
    return changed;
  }

  /// Puts back the parts of the last commit; false when there was nothing
  /// to undo.
  bool revert() {
    if (committed == parts) return false;
    _set(committed);
    return true;
  }

  TimeSegment? _neighbour(TimeSegment segment, int direction) {
    final order = segments;
    final index = order.indexOf(segment) + direction;
    return index >= 0 && index < order.length ? order[index] : null;
  }

  /// Runs [key] on [segment]. Enter commits and is never handled, so a
  /// form still sees it; Escape is handled only when it undid something.
  TimeKeyResult key(TimeSegment segment, String key) {
    switch (key) {
      case 'ArrowUp':
        step(segment, 1);
      case 'ArrowDown':
        step(segment, -1);
      case 'ArrowLeft':
        return (handled: true, focus: _neighbour(segment, -1));
      case 'ArrowRight':
        return (handled: true, focus: _neighbour(segment, 1));
      case 'Backspace' || 'Delete':
        _clear(segment);
      case 'Enter':
        commit();
        return (handled: false, focus: null);
      case 'Escape':
        return (handled: revert(), focus: null);
      default:
        if (segment == TimeSegment.dayPeriod) {
          final letter = key.toLowerCase();
          if (letter == 'a') {
            _togglePeriod(DayPeriod.am);
          } else if (letter == 'p') {
            _togglePeriod(DayPeriod.pm);
          } else {
            return (handled: false, focus: null);
          }
        } else if (RegExp(r'^\d$').hasMatch(key)) {
          return (handled: true, focus: _typeDigit(segment, int.parse(key)));
        } else {
          return (handled: false, focus: null);
        }
    }
    return (handled: true, focus: null);
  }
}
