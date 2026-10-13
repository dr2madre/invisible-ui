import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/roving.dart';
import '../internal/toggle_tile.dart';
import '../theme/theme.dart';

// The sizes the web Radio and RadioGroup set in their own stylesheets.
const double _dotSide = 17.6;
const double _innerDot = 9.6;

/// One radio button with its label, built on the widgets library's
/// [RawRadio].
///
/// Inside a [RadioGroup] of the same type, the radio joins it as Flutter's
/// own radios do: the group holds the value, reports the choice through its
/// `onChanged`, and gives the radios one tab stop, the arrow keys and Space.
/// [name], [groupValue] and [onChanged] are then ignored.
///
/// ```dart
/// import 'package:flutter/widgets.dart';
/// import 'package:invisible_ui/invisible_ui.dart' as iu;
///
/// RadioGroup<String>(
///   groupValue: plan,
///   onChanged: (next) => setState(() => plan = next),
///   child: const Column(
///     children: [
///       iu.Radio(value: 'free', label: 'Free'),
///       iu.Radio(value: 'pro', label: 'Pro'),
///     ],
///   ),
/// );
/// ```
///
/// Outside a [RadioGroup], radios with the same [name] in the same focus
/// scope form one group, as native radio buttons sharing a name do. The
/// radio is checked when [value] equals [groupValue], and reports a user's
/// choice through [onChanged] with its [value]; a null [onChanged] disables
/// it.
///
/// ```dart
/// iu.Radio<String>(
///   name: 'plan',
///   value: 'pro',
///   groupValue: plan,
///   label: 'Pro',
///   onChanged: (next) => setState(() => plan = next),
/// );
/// ```
///
/// Either way the group is one tab stop: the checked radio, or the first
/// enabled one in reading order when none is checked. The arrow keys move to
/// the next or previous enabled radio, wrapping, and check it; right and
/// left follow the reading direction. Space or a tap checks the focused
/// radio, and checking the radio that is already checked reports nothing.
/// The radio joins no [Form]: [RadioButtonGroup] does, with a label, a
/// description and an error.
///
/// The name matches Material's `Radio`: import this package with a prefix,
/// as above.
class Radio<T> extends StatefulWidget {
  /// Creates a radio for [value], labelled [label].
  const Radio({
    super.key,
    required this.value,
    required this.label,
    this.name,
    this.groupValue,
    this.onChanged,
    this.enabled = true,
    this.autofocus = false,
  });

  /// The value this radio stands for.
  final T value;

  /// The visible label, and the accessible name.
  final String label;

  /// The group outside a [RadioGroup]: radios sharing it in a focus scope
  /// are mutually exclusive. Required there; ignored inside a [RadioGroup].
  final Object? name;

  /// The group's checked value outside a [RadioGroup]; null when none is
  /// checked.
  final T? groupValue;

  /// Called with [value] when the user checks this radio outside a
  /// [RadioGroup]. Null disables it there.
  final ValueChanged<T>? onChanged;

  /// Whether the radio takes focus and can be checked.
  final bool enabled;

  /// Whether the radio takes focus when it first appears.
  final bool autofocus;

  @override
  State<Radio<T>> createState() => _RadioState<T>();
}

class _RadioState<T> extends State<Radio<T>> {
  late final _RadioNode _node = _RadioNode(this);
  late final _NameRegistry<T> _byName = _NameRegistry<T>(this);

  /// The enclosing native group, read on each build.
  RadioGroupRegistry<T>? _group;

  bool get _inGroup => _group != null;
  bool get _enabled => widget.enabled && (_inGroup || widget.onChanged != null);
  T? get _groupValue => _inGroup ? _group!.groupValue : widget.groupValue;
  bool get _checked => widget.value == _groupValue;

  /// What the radios of one group share: the native group, or the name.
  Object? get _groupKey => _group ?? widget.name;

  static final WidgetStateProperty<MouseCursor> _cursor =
      WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.disabled)
            ? SystemMouseCursors.forbidden
            : SystemMouseCursors.click,
      );

  @override
  void dispose() {
    _node.dispose();
    super.dispose();
  }

  void _select() {
    if (!_checked) (_group ?? _byName).onChanged(widget.value);
  }

  /// The enabled radio an arrow moves to, or null when the key is not this
  /// radio's to handle.
  _RadioNode? _target(LogicalKeyboardKey key) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final vertical =
        key == LogicalKeyboardKey.arrowDown ||
        key == LogicalKeyboardKey.arrowUp;
    // A native group moves on every arrow, the right one always to the next
    // radio in reading order, which right to left lies on the left. Only
    // the horizontal arrows in right-to-left text are mirrored here.
    if (_inGroup && (!rtl || vertical)) return null;
    final delta = switch (key) {
      LogicalKeyboardKey.arrowDown => 1,
      LogicalKeyboardKey.arrowUp => -1,
      LogicalKeyboardKey.arrowRight => rtl ? -1 : 1,
      LogicalKeyboardKey.arrowLeft => rtl ? 1 : -1,
      _ => 0,
    };
    if (delta == 0) return null;
    final group = _node.enabledInReadingOrder();
    final index = group.indexOf(_node);
    if (index == -1 || group.length < 2) return null;
    return group[(index + delta) % group.length];
  }

  @override
  Widget build(BuildContext context) {
    _group = RadioGroup.maybeOf<T>(context);
    assert(
      _inGroup || widget.name != null,
      'A Radio outside a RadioGroup needs a name to find its group.',
    );
    final enabled = _enabled;
    final checked = _checked;
    final radio = RawRadio<T>(
      value: widget.value,
      mouseCursor: _cursor,
      toggleable: false,
      focusNode: _node,
      autofocus: widget.autofocus,
      // A disabled radio stays out of the native group, so the group's
      // arrows and tab stop skip it, and still shows the group's value.
      groupRegistry: enabled && _inGroup ? _group : _byName,
      enabled: enabled,
      builder: (context, state) => MetaData(
        // The whole row takes presses, not only the painted parts.
        behavior: HitTestBehavior.opaque,
        child: ExcludeSemantics(
          child: ToggleTileBody(
            label: widget.label,
            indicator: RadioDot(checked: checked),
            indicatorRadius: indicatorSide(context, _dotSide) / 2,
            enabled: enabled,
            focusVisible: state.states.contains(WidgetState.focused),
          ),
        ),
      ),
    );
    // Only the label and the indicator take presses, also in a parent that
    // stretches its children.
    return Align(
      alignment: AlignmentDirectional.centerStart,
      widthFactor: 1,
      heightFactor: 1,
      child: Shortcuts(
        shortcuts: _inGroup ? rovingShortcuts : _byNameShortcuts,
        child: Actions(
          actions: {
            RovingKeyIntent: RovingKeyAction(
              handles: (intent) => _target(intent.key) != null,
              onKey: (intent) {
                final target = _target(intent.key)!;
                target.requestFocus();
                target.radio._select();
              },
            ),
          },
          child: Semantics(container: true, label: widget.label, child: radio),
        ),
      ),
    );
  }
}

/// The arrows of a radio grouped by name, and Space, which a [RadioGroup]
/// would otherwise provide.
final Map<ShortcutActivator, Intent> _byNameShortcuts = {
  ...rovingShortcuts,
  const SingleActivator(LogicalKeyboardKey.space): const ActivateIntent(),
};

/// The registry of a radio outside a [RadioGroup], or of a disabled one
/// inside it: it shows the group's value and registers nothing, so the
/// native group's keyboard never reaches the radio.
class _NameRegistry<T> extends RadioGroupRegistry<T> {
  _NameRegistry(this.radio);

  final _RadioState<T> radio;

  @override
  T? get groupValue => radio._groupValue;

  @override
  ValueChanged<T?> get onChanged => (value) {
    if (value != null) radio.widget.onChanged?.call(value);
  };

  @override
  void registerClient(RadioClient<T> client) {}

  @override
  void unregisterClient(RadioClient<T> client) {}
}

/// A radio's focus node. It finds the radios of its group among the nodes
/// of its focus scope, and, for radios grouped by name, holds the group's
/// single tab stop when its radio is the checked one, or the first enabled
/// one while none is checked.
class _RadioNode extends FocusNode {
  _RadioNode(this.radio) : super(debugLabel: 'Radio');

  final _RadioState<dynamic> radio;

  bool get _live => radio.mounted;
  bool get enabled => _live && radio._enabled;
  bool get checked => _live && radio._checked;

  /// The radios of the group in this node's focus scope.
  Iterable<_RadioNode> _members() {
    final scope = nearestScope;
    if (scope == null) return [this];
    final key = radio._groupKey;
    return scope.descendants.whereType<_RadioNode>().where(
      (node) => node._live && node.radio._groupKey == key,
    );
  }

  /// The enabled radios of the group in reading order.
  List<_RadioNode> enabledInReadingOrder() =>
      _sorted(_members().where((node) => node.enabled));

  @override
  bool get skipTraversal {
    if (super.skipTraversal) return true;
    // A native group's traversal policy keeps its single tab stop.
    if (!_live || radio._inGroup || checked) return false;
    final group = enabledInReadingOrder();
    if (group.any((node) => node.checked)) return true;
    // None checked: the first enabled radio in reading order takes the stop.
    return group.isNotEmpty && group.first != this;
  }
}

List<_RadioNode> _sorted(Iterable<_RadioNode> nodes) =>
    ReadingOrderTraversalPolicy.sort(nodes).cast<_RadioNode>().toList();

/// Focuses the radio under [container] that holds the tab stop: the checked
/// enabled one, else the first enabled one in reading order. A tap on a
/// group's label does this.
void focusRadioTabStop(FocusNode container) {
  final radios = _sorted(
    container.descendants.whereType<_RadioNode>().where((n) => n.enabled),
  );
  (radios.where((n) => n.checked).firstOrNull ?? radios.firstOrNull)
      ?.requestFocus();
}

/// The painted circle of a radio, with a dot when [checked]. The dot takes
/// the selection text colour, and the ring stays the control border.
class RadioDot extends StatelessWidget {
  /// Paints the circle.
  const RadioDot({super.key, required this.checked});

  /// Whether the radio is checked.
  final bool checked;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final side = indicatorSide(context, _dotSide);
    final inner = indicatorSide(context, _innerDot);
    return Container(
      width: side,
      height: side,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: colors.controlBorder),
      ),
      child: checked
          ? Container(
              width: inner,
              height: inner,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colors.selectedText,
              ),
            )
          : null,
    );
  }
}
