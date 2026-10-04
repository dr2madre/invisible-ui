import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/time_field/time_logic.dart';

// The language-neutral vectors core/src/time-field/vectors.test.ts runs
// against core/. Present in a checkout of the whole repository; a copy of
// this package alone skips them.
final File _file = File(
  '../../core/src/time-field/__vectors__/time-field.json',
);

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

/// The core's spelling of an error, `range-overflow`.
String? _code(TimeFieldError? error) => error?.name.replaceAllMapped(
  RegExp('[A-Z]'),
  (match) => '-${match.group(0)!.toLowerCase()}',
);

String? _period(DayPeriod? period) => period?.name.toUpperCase();

TimeSegment _segment(String name) => TimeSegment.values.byName(name);

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  final file = _file.existsSync()
      ? jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>
      : const <String, dynamic>{};

  group('time-field parse vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['parse'])) {
      test('${vector['value']} ${vector['withSeconds']} '
          '${vector['hourCycle']}', () {
        final result = parseTimeValue(
          vector['value'] as String?,
          withSeconds: vector['withSeconds'] as bool?,
          hourCycle: vector['hourCycle'] as int?,
        );
        expect({
          'status': result.status.name,
          'canonical': result.canonical,
          'error': _code(result.error),
          'invalidSegment': result.invalidSegment?.name,
          'normalized': result.normalized,
          'dayPeriod': _period(result.parts.dayPeriod),
        }, vector['expect']);
      });
    }
  }, skip: skip);

  group('time-field range vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['range'])) {
      test('${vector['value']} in [${vector['min']}, ${vector['max']}]', () {
        expect(
          _code(
            timeRangeError(
              vector['value'] as String?,
              vector['min'] as String?,
              vector['max'] as String?,
            ),
          ),
          vector['expect'],
        );
      });
    }
  }, skip: skip);

  group('time-field key sequence vectors', () {
    if (skip != false) return;
    for (final vector in _cases(file['typing'])) {
      test(vector['name'] as String, () {
        final editor = TimeEditor(
          value: vector['value'] as String?,
          hourCycle: vector['hourCycle'] as int,
          withSeconds: vector['withSeconds'] as bool,
          min: vector['min'] as String?,
          max: vector['max'] as String?,
        );
        final focus = <String>[];
        final commits = <String?>[];
        final handled = <bool>[];
        for (final step in _cases(vector['keys'])) {
          final key = step['key'] as String;
          // The widget reports a commit when Enter's commit moved the value.
          final changed =
              key == 'Enter' &&
              formatTime(
                    editor.committed,
                    editor.withSeconds,
                    editor.hourCycle,
                  ) !=
                  editor.value;
          final result = editor.key(_segment(step['segment'] as String), key);
          if (changed) commits.add(editor.value);
          if (result.focus case final next?) focus.add(next.name);
          handled.add(result.handled);
        }
        expect({
          'value': editor.value,
          'status': editor.status.name,
          'error': _code(editor.error),
          'text': {
            for (final segment in editor.segments)
              segment.name: editor.text(segment),
          },
          'focus': focus,
          'commits': commits,
          'handled': handled,
        }, vector['expect']);
      });
    }
  }, skip: skip);
}
