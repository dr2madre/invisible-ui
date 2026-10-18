import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

// The keyboard pieces the toolbar and the menus share: one tab stop for a
// group of controls, and arrow keys that follow the reading direction.

/// What the focused control does with the keys, so a group does not take
/// the ones it needs: a single-line [text] field keeps the arrows that move
/// its caret and Home and End; a [multiline] one keeps every arrow too. The
/// kinds of `ToolbarControlKind` in `core/src/toolbar/types.ts`.
enum ControlKind {
  /// A single-line editable text field.
  text,

  /// An editable text field of more than one line.
  multiline,

  /// Any other control, a read-only field included: it has no caret to move.
  other,
}

/// The kind of control [node] is: an editable [EditableText] that [node]
/// focuses is [ControlKind.text] or [ControlKind.multiline], anything else
/// [ControlKind.other]. The rule of `controlKind` in
/// `core/src/toolbar/state.ts`.
ControlKind controlKind(FocusNode? node) {
  final editable = node?.context
      ?.findAncestorStateOfType<EditableTextState>()
      ?.widget;
  if (editable == null || editable.focusNode != node || editable.readOnly) {
    return ControlKind.other;
  }
  final multiline =
      editable.maxLines != 1 ||
      editable.keyboardType == TextInputType.multiline;
  return multiline ? ControlKind.multiline : ControlKind.text;
}

/// The index focus moves to in a group of [count] controls, or null when
/// [key] is not one the group handles. Movement wraps; Home and End jump to
/// the ends. A horizontal group follows [direction], so in right-to-left text
/// the left arrow moves forward. A focused text [control] keeps the keys its
/// caret needs: the arrows along [axis] and Home and End, or every arrow when
/// it is multi-line. The rule of `core/src/toolbar/state.ts`.
int? nextIndex({
  required LogicalKeyboardKey key,
  required int index,
  required int count,
  required Axis axis,
  required TextDirection direction,
  ControlKind control = ControlKind.other,
}) {
  if (count <= 0 || index < 0 || index >= count) return null;
  final horizontal = axis == Axis.horizontal;
  if (_keepsKey(control, key, horizontal: horizontal)) return null;
  if (key == LogicalKeyboardKey.home) return 0;
  if (key == LogicalKeyboardKey.end) return count - 1;
  final rtl = direction == TextDirection.rtl;
  final forward = horizontal
      ? (rtl ? LogicalKeyboardKey.arrowLeft : LogicalKeyboardKey.arrowRight)
      : LogicalKeyboardKey.arrowDown;
  final backward = horizontal
      ? (rtl ? LogicalKeyboardKey.arrowRight : LogicalKeyboardKey.arrowLeft)
      : LogicalKeyboardKey.arrowUp;
  if (key == forward) return (index + 1) % count;
  if (key == backward) return (index - 1 + count) % count;
  return null;
}

final Set<LogicalKeyboardKey> _horizontalArrows = {
  LogicalKeyboardKey.arrowLeft,
  LogicalKeyboardKey.arrowRight,
};

final Set<LogicalKeyboardKey> _verticalArrows = {
  LogicalKeyboardKey.arrowUp,
  LogicalKeyboardKey.arrowDown,
};

// A single-line field keeps the arrows along the group's axis (the other
// axis moves no caret in one line) and Home and End for its ends.
bool _keepsKey(
  ControlKind control,
  LogicalKeyboardKey key, {
  required bool horizontal,
}) {
  if (control == ControlKind.other) return false;
  if (key == LogicalKeyboardKey.home || key == LogicalKeyboardKey.end) {
    return true;
  }
  if (control == ControlKind.multiline) {
    return _horizontalArrows.contains(key) || _verticalArrows.contains(key);
  }
  return (horizontal ? _horizontalArrows : _verticalArrows).contains(key);
}

/// A key a roving group acts on, as an [Intent], so a group's [Shortcuts]
/// can map it and its [Actions] can decline it.
class RovingKeyIntent extends Intent {
  /// Wraps [key], pressed with Shift when [shift].
  const RovingKeyIntent(this.key, {this.shift = false});

  /// The key pressed.
  final LogicalKeyboardKey key;

  /// Whether Shift was held: Shift+Tab moves backward.
  final bool shift;
}

/// The arrow, Home and End shortcuts of a roving group.
const Map<ShortcutActivator, Intent> rovingShortcuts = {
  SingleActivator(LogicalKeyboardKey.arrowDown): RovingKeyIntent(
    LogicalKeyboardKey.arrowDown,
  ),
  SingleActivator(LogicalKeyboardKey.arrowUp): RovingKeyIntent(
    LogicalKeyboardKey.arrowUp,
  ),
  SingleActivator(LogicalKeyboardKey.arrowLeft): RovingKeyIntent(
    LogicalKeyboardKey.arrowLeft,
  ),
  SingleActivator(LogicalKeyboardKey.arrowRight): RovingKeyIntent(
    LogicalKeyboardKey.arrowRight,
  ),
  SingleActivator(LogicalKeyboardKey.home): RovingKeyIntent(
    LogicalKeyboardKey.home,
  ),
  SingleActivator(LogicalKeyboardKey.end): RovingKeyIntent(
    LogicalKeyboardKey.end,
  ),
};

/// Enter, Numpad Enter (as Enter) and Space, the keys that activate.
const Map<ShortcutActivator, Intent> activationShortcuts = {
  SingleActivator(LogicalKeyboardKey.enter): RovingKeyIntent(
    LogicalKeyboardKey.enter,
  ),
  SingleActivator(LogicalKeyboardKey.numpadEnter): RovingKeyIntent(
    LogicalKeyboardKey.enter,
  ),
  SingleActivator(LogicalKeyboardKey.space): RovingKeyIntent(
    LogicalKeyboardKey.space,
  ),
};

/// The keys of an open menu: the roving keys plus activation, Escape and
/// Tab.
const Map<ShortcutActivator, Intent> menuShortcuts = {
  ...rovingShortcuts,
  ...activationShortcuts,
  SingleActivator(LogicalKeyboardKey.escape): RovingKeyIntent(
    LogicalKeyboardKey.escape,
  ),
  SingleActivator(LogicalKeyboardKey.tab): RovingKeyIntent(
    LogicalKeyboardKey.tab,
  ),
  SingleActivator(LogicalKeyboardKey.tab, shift: true): RovingKeyIntent(
    LogicalKeyboardKey.tab,
    shift: true,
  ),
};

/// An action that runs [onKey] and is enabled only while [handles] says the
/// key applies, so a key the group does not use reaches the handlers above
/// it, as an unprevented DOM event does.
class RovingKeyAction extends Action<RovingKeyIntent> {
  /// Creates the action.
  RovingKeyAction({required this.handles, required this.onKey});

  /// Whether the key applies now.
  final bool Function(RovingKeyIntent intent) handles;

  /// Runs the key.
  final void Function(RovingKeyIntent intent) onKey;

  @override
  bool isEnabled(RovingKeyIntent intent) => handles(intent);

  @override
  void invoke(RovingKeyIntent intent) => onKey(intent);
}

/// How long typed characters build one typeahead query.
const Duration typeaheadReset = Duration(milliseconds: 500);

/// The character [event] types, for typeahead: a printable one pressed with
/// no command modifier, or null.
String? typedCharacter(KeyEvent event) {
  if (event is! KeyDownEvent && event is! KeyRepeatEvent) return null;
  final character = event.character;
  final keyboard = HardwareKeyboard.instance;
  if (character == null ||
      character.trim().isEmpty ||
      keyboard.isControlPressed ||
      keyboard.isMetaPressed ||
      keyboard.isAltPressed) {
    return null;
  }
  return character;
}
