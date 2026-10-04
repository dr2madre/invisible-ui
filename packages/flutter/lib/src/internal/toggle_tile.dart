import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../field/field.dart';
import '../theme/theme.dart';
import 'focus_ring.dart';

// Sizes the web checkbox, switch and radio set in their own stylesheets.
const double _gap = 8;
const double _disabledOpacity = 0.5;

/// A painted indicator and its label, activated as a whole: the shared body
/// of [Checkbox], [Switch], and the items of [CheckboxGroup] and [RadioButtonGroup],
/// as the web wraps the native input and its text in one `<label>`.
///
/// A tap anywhere on the row or Space activates it; Enter does not, as on a
/// native checkbox. The focus ring is drawn around the indicator. The row is
/// at least [InvisibleThemeData.minTargetSize] in both directions, and the
/// label wraps.
///
/// With [semanticLabel] the tile is a semantics node of its own, named by
/// it; without, its flags merge into the enclosing node, such as a
/// [FieldSemantics].
class ToggleTile extends StatefulWidget {
  /// Creates the tile.
  const ToggleTile({
    super.key,
    required this.label,
    required this.indicator,
    required this.indicatorRadius,
    required this.onActivate,
    this.hideLabel = false,
    this.semanticLabel,
    this.checked,
    this.mixed = false,
    this.toggled,
    this.inMutuallyExclusiveGroup = false,
    this.focusNode,
    this.autofocus = false,
    this.onFocusChange,
  });

  /// The visible label.
  final String label;

  /// The painted box, track or dot.
  final Widget indicator;

  /// The corner radius of [indicator], which the focus ring follows.
  final double indicatorRadius;

  /// Runs on a tap or Space. Null disables the tile: it leaves the focus
  /// order and reports itself disabled.
  final VoidCallback? onActivate;

  /// Hides the label visually.
  final bool hideLabel;

  /// The accessible name, when the tile is a node of its own.
  final String? semanticLabel;

  /// The checked state of a checkbox or radio; null for a switch.
  final bool? checked;

  /// Whether a checkbox is in the mixed state.
  final bool mixed;

  /// The on state of a switch; null for a checkbox or radio.
  final bool? toggled;

  /// Whether the tile is one option of a single choice.
  final bool inMutuallyExclusiveGroup;

  /// The focus node, for a group that moves focus between its items.
  final FocusNode? focusNode;

  /// Whether the tile takes focus when it first appears.
  final bool autofocus;

  /// Called when the tile gains or loses focus.
  final ValueChanged<bool>? onFocusChange;

  @override
  State<ToggleTile> createState() => _ToggleTileState();
}

class _ToggleTileState extends State<ToggleTile> {
  bool _focusVisible = false;
  bool _focused = false;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(
      onInvoke: (_) => _activate(),
    ),
  };

  bool get _enabled => widget.onActivate != null;

  // Read from the widget at the press, so a replaced callback is the one run.
  void _activate() => widget.onActivate?.call();

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final target = theme.minTargetSize;
    final enabled = _enabled;

    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        FocusRingPainter(
          visible: _focusVisible,
          ring: theme.focusRing,
          radius: widget.indicatorRadius,
          child: Opacity(
            opacity: enabled ? 1 : _disabledOpacity,
            child: widget.indicator,
          ),
        ),
        if (!widget.hideLabel) ...[
          const SizedBox(width: _gap),
          Flexible(
            child: Text(
              widget.label,
              style: theme.textStyle.copyWith(
                color: enabled ? colors.text : colors.textDisabled,
              ),
            ),
          ),
        ],
      ],
    );

    // Only the label and the indicator take presses, also in a parent that
    // stretches its children.
    return Align(
      alignment: AlignmentDirectional.centerStart,
      widthFactor: 1,
      heightFactor: 1,
      child: Semantics(
        container: widget.semanticLabel != null,
        label: widget.semanticLabel,
        checked: widget.checked,
        mixed: widget.mixed ? true : null,
        toggled: widget.toggled,
        inMutuallyExclusiveGroup: widget.inMutuallyExclusiveGroup ? true : null,
        // Merged into a field's node, which reports the disabled state; two
        // enabled states on one node would split it.
        enabled: widget.semanticLabel == null && !enabled ? null : enabled,
        focusable: enabled,
        focused: _focused,
        onTap: enabled ? _activate : null,
        child: ExcludeSemantics(
          child: FocusableActionDetector(
            enabled: enabled,
            focusNode: widget.focusNode,
            autofocus: widget.autofocus,
            shortcuts: _shortcuts,
            actions: _actions,
            mouseCursor: enabled
                ? SystemMouseCursors.click
                : SystemMouseCursors.forbidden,
            onFocusChange: (focused) {
              setState(() => _focused = focused);
              widget.onFocusChange?.call(focused);
            },
            onShowFocusHighlight: (value) =>
                setState(() => _focusVisible = value),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTap: enabled ? _activate : null,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: target.width,
                  minHeight: target.height,
                ),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  widthFactor: 1,
                  heightFactor: 1,
                  child: row,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The side of an indicator, [base] logical pixels at text scale 1, grown
/// with the text as the web's `rem` sizes grow with the root font size.
double indicatorSide(BuildContext context, double base) =>
    MediaQuery.textScalerOf(context).scale(base);

/// A [ToggleTile] that names itself, with a field's description and error
/// under it and their semantics on its node: the body of [Checkbox] and
/// [Switch].
class ToggleField extends StatelessWidget {
  /// Wraps [tile], named by [label].
  const ToggleField({
    super.key,
    required this.label,
    required this.tile,
    this.description,
    this.error,
    this.required = false,
    this.enabled = true,
  });

  /// The accessible name, which [tile] shows beside its indicator.
  final String label;

  /// The tile, merging into the field's node.
  final ToggleTile tile;

  /// A hint shown under the tile.
  final String? description;

  /// An error shown under the tile.
  final String? error;

  /// Whether a value is required.
  final bool required;

  /// Whether the control is enabled.
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return FieldFrame(
      label: label,
      hideLabel: true,
      description: description,
      error: error,
      control: FieldSemantics(
        label: label,
        description: description,
        error: error,
        required: required,
        enabled: enabled,
        child: tile,
      ),
    );
  }
}
