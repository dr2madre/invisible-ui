import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../internal/collection.dart';

/// What a key pressed on the tab [from] does, the keyboard model of
/// `core/src/tabs/connect.ts`: the tab focus moves to and the tab it
/// selects, either null when the key does nothing of the kind.
///
/// The arrows along [orientation] move to the next or previous enabled tab,
/// wrapping; in a horizontal list they follow [direction], so in
/// right-to-left text the left arrow moves forward. Home and End jump to
/// the first and the last enabled tab. A move selects the tab it lands on
/// unless [manual]; Enter and Space select the focused tab. The shared
/// vectors in `core/src/tabs/__vectors__` hold both implementations to it.
({T? focus, T? select}) tabKey<T>(
  List<ChoiceItem<T>> items,
  T from,
  LogicalKeyboardKey key, {
  required Axis orientation,
  required TextDirection direction,
  required bool manual,
}) {
  final vertical = orientation == Axis.vertical;
  final rtl = direction == TextDirection.rtl;
  final next = vertical
      ? LogicalKeyboardKey.arrowDown
      : (rtl ? LogicalKeyboardKey.arrowLeft : LogicalKeyboardKey.arrowRight);
  final previous = vertical
      ? LogicalKeyboardKey.arrowUp
      : (rtl ? LogicalKeyboardKey.arrowRight : LogicalKeyboardKey.arrowLeft);
  bool enabled(T value) =>
      items.any((item) => item.value == value && !item.disabled);

  final T? focus;
  if (key == next) {
    focus = stepEnabled(items, from, 1);
  } else if (key == previous) {
    focus = stepEnabled(items, from, -1);
  } else if (key == LogicalKeyboardKey.home) {
    focus = firstEnabled(items);
  } else if (key == LogicalKeyboardKey.end) {
    focus = lastEnabled(items);
  } else if (key == LogicalKeyboardKey.enter ||
      key == LogicalKeyboardKey.space) {
    return (focus: null, select: enabled(from) ? from : null);
  } else {
    return (focus: null, select: null);
  }
  return (focus: focus, select: manual ? null : focus);
}
