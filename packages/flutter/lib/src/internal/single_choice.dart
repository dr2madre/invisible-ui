import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import 'collection.dart';
import 'roving.dart';

/// The arrows of a single-choice group: every arrow works whatever the
/// layout, as on native radio buttons. Home and End do nothing there.
const Map<ShortcutActivator, Intent> _arrowShortcuts = {
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
};

/// The focus of a single-choice group, [RadioButtonGroup] and [SegmentedControl],
/// as native radio buttons sharing a name have it: one tab stop, on the
/// chosen option or, with none chosen, the first enabled one; arrows move
/// focus to the next or previous enabled option, wrapping, and choose it.
/// Right and left follow the reading direction.
class SingleChoiceFocus<T> {
  final Map<T, FocusNode> _nodes = {};

  /// The focus node of the option [value].
  FocusNode nodeFor(T value) =>
      _nodes.putIfAbsent(value, () => FocusNode(debugLabel: 'Option $value'));

  /// Keeps the tab stop on the chosen option, else the first enabled one,
  /// and drops the nodes of options that are gone. Called while building.
  void sync(List<ChoiceItem<T>> items, T? value, {required bool enabled}) {
    final values = {for (final item in items) item.value};
    for (final gone in _nodes.keys.where((v) => !values.contains(v)).toList()) {
      _nodes.remove(gone)!.dispose();
    }
    final chosen = items.where((i) => i.value == value && !i.disabled);
    final stop = enabled
        ? (chosen.isNotEmpty ? value : firstEnabled(items))
        : null;
    for (final item in items) {
      nodeFor(item.value).skipTraversal = item.value != stop;
    }
  }

  /// Focuses the option that holds the tab stop, as a tap on the group's
  /// label does.
  void focusTabStop() => _nodes.values
      .where((node) => !node.skipTraversal)
      .firstOrNull
      ?.requestFocus();

  /// The option that has focus, or null.
  T? get focused =>
      _nodes.entries.where((e) => e.value.hasPrimaryFocus).firstOrNull?.key;

  /// The option [key] moves to from the focused one, or null when the key
  /// does not apply.
  T? target(
    List<ChoiceItem<T>> items,
    LogicalKeyboardKey key,
    TextDirection direction,
  ) {
    final from = focused;
    if (from == null) return null;
    final rtl = direction == TextDirection.rtl;
    final delta = switch (key) {
      LogicalKeyboardKey.arrowDown => 1,
      LogicalKeyboardKey.arrowUp => -1,
      LogicalKeyboardKey.arrowRight => rtl ? -1 : 1,
      LogicalKeyboardKey.arrowLeft => rtl ? 1 : -1,
      _ => 0,
    };
    if (delta == 0) return null;
    final next = stepEnabled(items, from, delta);
    return next == from ? null : next;
  }

  /// Releases the focus nodes.
  void dispose() {
    for (final node in _nodes.values) {
      node.dispose();
    }
    _nodes.clear();
  }
}

/// Gives [child], the options of a single-choice group, the arrow keys of
/// [focus]: an arrow focuses the next option and [onMove] chooses it.
class SingleChoiceKeys<T> extends StatelessWidget {
  /// Wraps the options.
  const SingleChoiceKeys({
    super.key,
    required this.focus,
    required this.items,
    required this.onMove,
    required this.child,
  });

  /// The group's focus.
  final SingleChoiceFocus<T> focus;

  /// The options, in order.
  final List<ChoiceItem<T>> items;

  /// Chooses the option an arrow moved to.
  final ValueChanged<T> onMove;

  /// The options.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    T? target(RovingKeyIntent intent) =>
        focus.target(items, intent.key, Directionality.of(context));
    return Shortcuts(
      shortcuts: _arrowShortcuts,
      child: Actions(
        actions: {
          RovingKeyIntent: RovingKeyAction(
            handles: (intent) => target(intent) != null,
            onKey: (intent) {
              final next = target(intent) as T;
              focus.nodeFor(next).requestFocus();
              onMove(next);
            },
          ),
        },
        child: child,
      ),
    );
  }
}
