import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

// Sizes the web ToggleButton sets in its own stylesheet.
const double _side = 36;
const double _paddingX = 8;
const double _gap = 8;
const double _iconSize = 18.4;
const double _checkStroke = 2.5;
const double _onTint = 0.1;
const double _onBorder = 0.35;
const double _disabledOpacity = 0.5;

/// Marks the toggle buttons of a joined [ToggleGroup]: they drop their own
/// border and corners, which the group draws once around them.
class ToggleJoin extends InheritedWidget {
  /// Joins the toggle buttons in [child].
  const ToggleJoin({super.key, required super.child});

  /// Whether a joined group holds [context].
  static bool of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ToggleJoin>() != null;

  @override
  bool updateShouldNotify(ToggleJoin oldWidget) => false;
}

/// An on and off control that looks like a button, such as Bold in a
/// toolbar. As on the web, where it is a native checkbox styled as a
/// button, it is announced as checked or not checked.
///
/// A tap or Space flips it; Enter does not, as on a checkbox. When on, the
/// surface takes a tint of the selection colour and a matching border, and
/// with [check] a leading tick, so the state never relies on colour alone.
/// Use [Switch] for a setting.
///
/// The [child] is the content, a [Text] or an icon. An icon-only toggle
/// needs [semanticLabel], its accessible name.
///
/// Controlled, [ToggleButton] shows [value] and reports each change through
/// [onChanged]; [ToggleButton.uncontrolled] keeps its own value from
/// [initialValue]. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it saves with [onSaved], and a form reset restores the
/// current default silently.
class ToggleButton extends StatefulWidget {
  /// A toggle button that shows [value], controlled by the parent.
  const ToggleButton({
    super.key,
    required bool this.value,
    required this.child,
    this.onChanged,
    this.semanticLabel,
    this.check = false,
    this.enabled = true,
    this.focusNode,
    this.onSaved,
  }) : initialValue = null;

  /// A toggle button that keeps its own value, starting from [initialValue].
  const ToggleButton.uncontrolled({
    super.key,
    required this.child,
    bool this.initialValue = false,
    this.onChanged,
    this.semanticLabel,
    this.check = false,
    this.enabled = true,
    this.focusNode,
    this.onSaved,
  }) : value = null;

  /// Whether it is on, when the parent controls it.
  final bool? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final bool? initialValue;

  /// Called with the new value after a user change. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<bool>? onChanged;

  /// The content.
  final Widget child;

  /// The accessible name, in place of what [child] says; required for an
  /// icon-only toggle.
  final String? semanticLabel;

  /// Shows a leading tick while on: the filter-chip look.
  final bool check;

  /// Whether it takes focus and changes. A disabled one leaves the focus
  /// order.
  final bool enabled;

  /// The focus node.
  final FocusNode? focusNode;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<bool>? onSaved;

  @override
  State<ToggleButton> createState() => _ToggleButtonState();
}

class _ToggleButtonState extends State<ToggleButton>
    with ValueControl<bool, ToggleButton> {
  @override
  bool get isControlled => widget.value != null;

  @override
  bool controlledValueOf(ToggleButton widget) => widget.value ?? value;

  @override
  bool get initialValueOfWidget => widget.initialValue ?? false;

  void _toggle() {
    final next = !value;
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final joined = ToggleJoin.of(context);
    final on = value;
    final enabled = widget.enabled;
    final side = MediaQuery.textScalerOf(context).scale(_side);
    final foreground = on ? colors.selected : colors.text;
    final radius = joined ? 0.0 : theme.controlRadius;
    final duration = reducedMotion(context)
        ? Duration.zero
        : const Duration(milliseconds: 120);

    final content = IconTheme(
      data: IconThemeData(
        color: foreground,
        size: _iconSize,
        applyTextScaling: true,
      ),
      child: DefaultTextStyle(
        style: theme.textStyle.copyWith(color: foreground, height: 1),
        textAlign: TextAlign.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          spacing: _gap,
          children: [
            if (widget.check && on)
              const Glyph(GlyphShape.check, strokeWidth: _checkStroke),
            Flexible(
              child: ExcludeSemantics(
                excluding: widget.semanticLabel != null,
                child: widget.child,
              ),
            ),
          ],
        ),
      ),
    );

    return buildFormField(
      enabled: enabled,
      onSaved: widget.onSaved,
      builder: (_) => Semantics(
        container: true,
        checked: on,
        enabled: enabled,
        label: widget.semanticLabel,
        onTap: enabled ? _toggle : null,
        child: Pressable(
          onPressed: enabled ? _toggle : null,
          keys: PressKeys.space,
          focusNode: widget.focusNode,
          builder: (context, states) => Opacity(
            opacity: enabled ? 1 : _disabledOpacity,
            child: FocusRingPainter(
              visible: states.focusVisible,
              ring: theme.focusRing,
              radius: radius,
              // A joined group clips its toggles, so the ring goes inside.
              inside: joined,
              child: AnimatedContainer(
                duration: duration,
                curve: Curves.ease,
                constraints: BoxConstraints(minWidth: side, minHeight: side),
                padding: const EdgeInsets.symmetric(horizontal: _paddingX),
                decoration: BoxDecoration(
                  color: on
                      ? colors.selected.withValues(alpha: _onTint)
                      : colors.background,
                  border: joined
                      ? null
                      : Border.all(
                          color: on
                              ? colors.selected.withValues(alpha: _onBorder)
                              : colors.controlBorder,
                        ),
                  borderRadius: BorderRadius.circular(radius),
                ),
                child: Center(widthFactor: 1, heightFactor: 1, child: content),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
