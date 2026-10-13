import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/navigation_bar/navigation_bar_logic.dart';

// The language-neutral vectors the core tests run against
// core/src/navigation-bar: the arrow keys, the composed name and the badge
// announcements. Present in a checkout of the whole repository; a copy of
// this package alone skips them.
File _vectors(String name) =>
    File('../../core/src/navigation-bar/__vectors__/$name.json');

Map<String, dynamic> _read(String name) =>
    jsonDecode(_vectors(name).readAsStringSync()) as Map<String, dynamic>;

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

bool _present(String name) => _vectors(name).existsSync();

const Map<String, LogicalKeyboardKey> _keys = {
  'ArrowRight': LogicalKeyboardKey.arrowRight,
  'ArrowLeft': LogicalKeyboardKey.arrowLeft,
  'ArrowDown': LogicalKeyboardKey.arrowDown,
  'ArrowUp': LogicalKeyboardKey.arrowUp,
  'Home': LogicalKeyboardKey.home,
  'End': LogicalKeyboardKey.end,
};

NavigationDestination<String> _destination(Map<String, dynamic> json) {
  final badge = json['badge'] as Map<String, dynamic>?;
  final unavailable = json['unavailable'] as Map<String, dynamic>?;
  return NavigationDestination(
    value: json['value'] as String,
    label: json['label'] as String,
    icon: const SizedBox.shrink(),
    badge: badge == null
        ? null
        : NavigationBadge(
            label: badge['label'] as String,
            content: badge['content'] as String?,
            announce: badge['announce'] as bool? ?? true,
          ),
    unavailableReason: unavailable?['reason'] as String?,
  );
}

List<NavigationDestination<String>>? _destinations(Object? json) =>
    json == null ? null : _cases(json).map(_destination).toList();

void main() {
  group(
    'navigation bar key vectors',
    () {
      if (!_present('keys')) return;
      final file = _read('keys');
      final values = [
        for (final d in _cases(file['destinations'])) d['value'] as String,
      ];
      for (final vector in _cases(file['keys'])) {
        test(vector['name'] as String, () {
          final next = moveDestination(
            key: _keys[vector['key']]!,
            index: values.indexOf(vector['from'] as String),
            count: values.length,
            direction: vector['direction'] == 'rtl'
                ? TextDirection.rtl
                : TextDirection.ltr,
          );
          expect(next == null ? null : values[next], vector['focus']);
        });
      }
    },
    skip: _present('keys') ? false : 'core/ is not in this checkout',
  );

  group(
    'navigation bar describe vectors',
    () {
      if (!_present('describe')) return;
      for (final vector in _cases(_read('describe')['cases'])) {
        test(vector['name'] as String, () {
          final overrides = (vector['messages'] as Map<String, dynamic>? ?? {})
              .cast<String, String>();
          final messages = const InvisibleMessages().copyWith(
            navigationBarPosition: overrides['navigationBar.position'],
            navigationBarCurrent: overrides['navigationBar.current'],
          );
          final destination = _destination(
            vector['destination'] as Map<String, dynamic>,
          );
          expect(
            describeDestination(
              label: destination.label,
              badge: destination.badge?.label,
              index: vector['index'] as int?,
              count: vector['count'] as int?,
              current: vector['current'] as bool? ?? false,
              messages: messages,
            ),
            vector['expect'],
          );
        });
      }
    },
    skip: _present('describe') ? false : 'core/ is not in this checkout',
  );

  group(
    'navigation bar badge vectors',
    () {
      if (!_present('badges')) return;
      for (final vector in _cases(_read('badges')['cases'])) {
        test(vector['name'] as String, () {
          final announcements = badgeAnnouncements(
            _destinations(vector['previous']),
            _destinations(vector['next'])!,
          );
          expect([
            for (final entry in announcements)
              {'value': entry.value, 'text': entry.text},
          ], _cases(vector['expect']));
        });
      }
    },
    skip: _present('badges') ? false : 'core/ is not in this checkout',
  );

  test('held announcements keep the latest per destination, in the order '
      'each first waited', () {
    final held = holdAnnouncements<String>(
      [(value: 'inbox', text: 'Inbox: 1 unread')],
      [
        (value: 'profile', text: 'Profile: Needs attention'),
        (value: 'inbox', text: 'Inbox: 2 unread'),
      ],
    );
    expect(held, [
      (value: 'inbox', text: 'Inbox: 2 unread'),
      (value: 'profile', text: 'Profile: Needs attention'),
    ]);
  });
}
