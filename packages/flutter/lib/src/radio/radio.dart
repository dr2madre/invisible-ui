import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/roving.dart';
import '../internal/toggle_tile.dart';
import '../radio_group/radio_group.dart';

// The web Radio's dot, as RadioButtonGroup draws it.
const double _dotSide = 17.6;

/// One radio button with its label, for a group laid out by the app. Radios
/// with the same [name] in the same focus scope form one group, as native
/// radio buttons sharing a name do. For a managed group with a label, a
/// description and an error, use [RadioButtonGroup].
///
/// The group is one tab stop: the checked radio, or the first enabled one
/// in reading order when none is checked. The arrow keys move to the next
/// or previous enabled radio of the group, wrapping, and check it; right
/// and left follow the reading direction. Space or a tap checks the focused
/// radio.
///
/// The radio is checked when [value] equals [groupValue], and reports a
/// user's choice through [onChanged] with its [value]; checking the radio
/// that is already checked reports nothing. A null [onChanged] disables it.
/// The parent holds the group's value, so the radio joins no [Form]:
/// [RadioButtonGroup] does.
///
/// The name collides with Material's `Radio`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class Radio<T> extends StatefulWidget {
  /// Creates a radio for [value] in the group [name].
  const Radio({
    super.key,
    required this.name,
    required this.value,
    required this.groupValue,
    required this.onChanged,
    required this.label,
    this.autofocus = false,
  });

  /// The group: radios sharing it in a focus scope are mutually exclusive.
  final Object name;

  /// The value this radio stands for.
  final T value;

  /// The group's checked value; null when none is checked.
  final T? groupValue;

  /// Called with [value] when the user checks this radio. Null disables it.
  final ValueChanged<T>? onChanged;

  /// The visible label, and the accessible name.
  final String label;

  /// Whether the radio takes focus when it first appears.
  final bool autofocus;

  @override
  State<Radio<T>> createState() => _RadioState<T>();
}

class _RadioState<T> extends State<Radio<T>> {
  late final _RadioNode _node = _RadioNode(this);

  bool get _enabled => widget.onChanged != null;
  bool get _checked => widget.value == widget.groupValue;

  @override
  void dispose() {
    _node.dispose();
    super.dispose();
  }

  void _check() {
    if (!_checked) widget.onChanged?.call(widget.value);
  }

  /// The enabled radio an arrow moves to, or null when [key] is not one.
  _RadioNode? _target(LogicalKeyboardKey key) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final delta = switch (key) {
      LogicalKeyboardKey.arrowDown => 1,
      LogicalKeyboardKey.arrowUp => -1,
      LogicalKeyboardKey.arrowRight => rtl ? -1 : 1,
      LogicalKeyboardKey.arrowLeft => rtl ? 1 : -1,
      _ => 0,
    };
    if (delta == 0) return null;
    final group = _node.readingOrder().where((n) => n.enabled).toList();
    final index = group.indexOf(_node);
    if (index == -1 || group.length < 2) return null;
    return group[(index + delta) % group.length];
  }

  @override
  Widget build(BuildContext context) {
    final checked = _checked;
    return Shortcuts(
      shortcuts: rovingShortcuts,
      child: Actions(
        actions: {
          RovingKeyIntent: RovingKeyAction(
            handles: (intent) => _target(intent.key) != null,
            onKey: (intent) {
              final target = _target(intent.key)!;
              target.requestFocus();
              target.radio._check();
            },
          ),
        },
        child: ToggleTile(
          label: widget.label,
          semanticLabel: widget.label,
          indicator: RadioDot(checked: checked),
          indicatorRadius: indicatorSide(context, _dotSide) / 2,
          onActivate: _enabled ? _check : null,
          checked: checked,
          inMutuallyExclusiveGroup: true,
          focusNode: _node,
          autofocus: widget.autofocus,
        ),
      ),
    );
  }
}

/// A radio's focus node. It finds the radios of its group among the nodes
/// of its focus scope, and holds the group's single tab stop when its radio
/// is the checked one, or the first enabled one while none is checked.
class _RadioNode extends FocusNode {
  _RadioNode(this.radio) : super(debugLabel: 'Radio');

  final _RadioState<dynamic> radio;

  Object get _name => radio.widget.name;
  bool get enabled => radio.mounted && radio._enabled;
  bool get _checked => radio.mounted && radio._checked;

  /// The radios of the group in this node's focus scope.
  Iterable<_RadioNode> _group() {
    final scope = nearestScope;
    if (scope == null) return [this];
    return scope.descendants.whereType<_RadioNode>().where(
      (node) => node.radio.mounted && node._name == _name,
    );
  }

  /// The radios of the group in reading order.
  List<_RadioNode> readingOrder() => ReadingOrderTraversalPolicy()
      .sortDescendants(_group(), this)
      .cast<_RadioNode>()
      .toList();

  @override
  bool get skipTraversal {
    if (super.skipTraversal) return true;
    if (_checked) return false;
    final group = _group().where((node) => node.enabled).toList();
    if (group.any((node) => node._checked)) return true;
    // None checked: the first enabled radio in reading order takes the stop.
    final order = readingOrder().where((node) => node.enabled);
    return order.isNotEmpty && order.first != this;
  }
}
