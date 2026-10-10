import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart' show TextDirection;

// The Menubar coordination of `core/src/menubar/connect.ts` in Dart: which
// trigger is the tab stop, which top menu is open, and what the bar does with
// the keys the open menu left unused and with hover on a trigger. Data in,
// data out, so the shared vectors in core/src/menubar/__vectors__ hold both
// implementations to the same answers.

/// The keys the bar acts on.
enum MenubarKey {
  /// The previous top menu in reading order, mirrored in right to left.
  arrowLeft,

  /// The next top menu in reading order, mirrored in right to left.
  arrowRight,

  /// The first trigger, while every menu is closed.
  home,

  /// The last trigger, while every menu is closed.
  end,
}

/// What the bar asks for: the new tab stop and open menu, and the trigger to
/// focus, if any. Closing the menu open before comes first, then opening the
/// new one (which focuses its first item) or focusing the trigger.
@immutable
class MenubarStep {
  /// Creates a step.
  const MenubarStep({
    required this.focusedIndex,
    required this.openIndex,
    this.focus,
    this.handled = true,
  });

  /// The trigger that is the tab stop.
  final int focusedIndex;

  /// The open top menu, or -1 when every menu is closed.
  final int openIndex;

  /// The trigger to move focus to, or null.
  final int? focus;

  /// Whether the bar used the key; an unused key goes on to the handlers
  /// above.
  final bool handled;
}

/// The menubar's state: one flag per top menu saying whether it is disabled,
/// the tab stop and the open menu.
@immutable
class MenubarNav {
  /// Creates the state. [focusedIndex] is kept on the bar when menus go
  /// away, as the core clamps it.
  MenubarNav({
    required this.disabled,
    required int focusedIndex,
    required this.openIndex,
  }) : focusedIndex = disabled.isEmpty
           ? 0
           : focusedIndex.clamp(0, disabled.length - 1);

  /// Whether each top menu is disabled, in the order shown.
  final List<bool> disabled;

  /// The trigger that is the tab stop.
  final int focusedIndex;

  /// The open top menu, or -1.
  final int openIndex;

  int get _count => disabled.length;

  MenubarStep get _unchanged => MenubarStep(
    focusedIndex: focusedIndex,
    openIndex: openIndex,
    handled: false,
  );

  /// Opens the top menu at [index], closing the one open before. A disabled
  /// menu stays closed and its trigger takes focus.
  MenubarStep openAt(int index) {
    if (index < 0 || index >= _count) return _unchanged;
    if (disabled[index]) {
      return MenubarStep(focusedIndex: index, openIndex: -1, focus: index);
    }
    return MenubarStep(focusedIndex: index, openIndex: index);
  }

  /// Goes to the next (1) or previous (-1) top menu in reading order,
  /// wrapping: it switches the open menu, or moves focus while every menu is
  /// closed.
  MenubarStep move(int delta) {
    if (_count == 0) return _unchanged;
    final from = openIndex != -1 ? openIndex : focusedIndex;
    final next = (from + delta + _count) % _count;
    if (openIndex != -1) return openAt(next);
    return MenubarStep(focusedIndex: next, openIndex: -1, focus: next);
  }

  /// A key the open menu left unused, or one pressed on a trigger.
  MenubarStep key(MenubarKey key, TextDirection direction) {
    if (_count == 0) return _unchanged;
    final forward = direction == TextDirection.rtl ? -1 : 1;
    switch (key) {
      case MenubarKey.arrowRight:
        return move(forward);
      case MenubarKey.arrowLeft:
        return move(-forward);
      case MenubarKey.home:
      case MenubarKey.end:
        // An open menu uses Home and End for its own items.
        if (openIndex != -1) return _unchanged;
        final target = key == MenubarKey.home ? 0 : _count - 1;
        return MenubarStep(focusedIndex: target, openIndex: -1, focus: target);
    }
  }

  /// The mouse entered the trigger at [index]: it switches the open menu,
  /// only while another one is open.
  MenubarStep pointerEnter(int index) =>
      openIndex != -1 && openIndex != index ? openAt(index) : _unchanged;
}
