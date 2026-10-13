// The navigation bar's headless logic, ported from
// core/src/navigation-bar (connect.ts and text.ts) and run against the same
// vectors in test/navigation_bar_vectors_test.dart.
import 'package:flutter/services.dart';

import '../i18n/messages.dart';
import 'navigation_destination.dart';

/// The count the pattern is drawn for; more stop fitting at 320 wide and
/// text scale 2.0.
const int navigationBarRecommendedMaximum = 5;

/// Where an arrow key moves focus among [count] destinations, or null when
/// [key] is not one the bar handles or focus is already at that end.
///
/// Left and right follow the reading [direction]; there is no wrap and no
/// Home or End. Unavailable destinations stay in the order, so their reason
/// can be heard.
int? moveDestination({
  required LogicalKeyboardKey key,
  required int index,
  required int count,
  TextDirection direction = TextDirection.ltr,
}) {
  final rtl = direction == TextDirection.rtl;
  final int step;
  if (key == LogicalKeyboardKey.arrowRight) {
    step = rtl ? -1 : 1;
  } else if (key == LogicalKeyboardKey.arrowLeft) {
    step = rtl ? 1 : -1;
  } else {
    return null;
  }
  final next = index + step;
  return next >= 0 && next < count ? next : null;
}

/// The destination's spoken name: its [label], then the [badge] text, then
/// the position from [InvisibleMessages.navigationBarPosition] when [index]
/// (from 1) and [count] are given, then
/// [InvisibleMessages.navigationBarCurrent] when [current]. The parts are
/// joined with ", ". The unavailable reason is not part of the name: it is
/// the destination's hint.
String describeDestination({
  required String label,
  String? badge,
  int? index,
  int? count,
  bool current = false,
  InvisibleMessages messages = const InvisibleMessages(),
}) {
  return [
    label,
    if (badge != null && badge.isNotEmpty) badge,
    if (index != null && count != null)
      InvisibleMessages.fill(messages.navigationBarPosition, {
        'index': '$index',
        'count': '$count',
      }),
    if (current) messages.navigationBarCurrent,
  ].join(', ');
}

/// One badge change to announce: the destination whose badge changed and
/// the text, "Profile: Needs attention".
typedef BadgeAnnouncement<T> = ({T value, String text});

/// The badge changes to announce between two builds, in the order of
/// [next]: a badge whose label appeared or changed, unless it sets
/// `announce: false`. Nothing on the first build ([previous] null) and
/// nothing when a badge goes away. A destination is matched by value; one
/// not passed before counts as having no badge.
List<BadgeAnnouncement<T>> badgeAnnouncements<T>(
  List<NavigationDestination<T>>? previous,
  List<NavigationDestination<T>> next, {
  InvisibleMessages messages = const InvisibleMessages(),
}) {
  if (previous == null) return const [];
  final before = {
    for (final destination in previous)
      destination.value: destination.badge?.label,
  };
  return [
    for (final destination in next)
      if (destination.badge case final badge?
          when badge.label.isNotEmpty &&
              badge.announce &&
              before[destination.value] != badge.label)
        (
          value: destination.value,
          text: InvisibleMessages.fill(messages.navigationBarAnnouncement, {
            'label': destination.label,
            'badge': badge.label,
          }),
        ),
  ];
}

/// Announcements waiting for the last modal to close (ADR 0016, case 2):
/// only the latest one per destination is kept, in the order each
/// destination first waited.
List<BadgeAnnouncement<T>> holdAnnouncements<T>(
  List<BadgeAnnouncement<T>> held,
  List<BadgeAnnouncement<T>> incoming,
) {
  final latest = <T, BadgeAnnouncement<T>>{
    for (final entry in held) entry.value: entry,
  };
  for (final entry in incoming) {
    latest[entry.value] = entry;
  }
  return latest.values.toList();
}

/// The consumer mistakes in [destinations] and [value]: a repeated value,
/// which the bar refuses in debug builds, and the warnings the web adapters
/// print in development (more than five destinations, a value that names
/// no destination).
({String? repeated, List<String> warnings}) navigationBarMistakes<T>(
  List<NavigationDestination<T>> destinations,
  T? value,
) {
  final seen = <T>{};
  String? repeated;
  for (final destination in destinations) {
    if (!seen.add(destination.value)) {
      repeated ??=
          'The navigation bar value "${destination.value}" appears more '
          'than once.';
    }
  }
  return (
    repeated: repeated,
    warnings: [
      if (destinations.length > navigationBarRecommendedMaximum)
        'The navigation bar has ${destinations.length} destinations; up to '
            '$navigationBarRecommendedMaximum fit at 320 wide and text scale '
            '2.0.',
      if (value != null && !seen.contains(value))
        'The navigation bar value "$value" names no destination; none is '
            'current.',
    ],
  );
}
