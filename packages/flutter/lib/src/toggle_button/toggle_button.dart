import 'package:flutter/semantics.dart';
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
const double _errorGap = 6;
const double _errorGlyphGap = 5.6;

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

/// Marks the toggle buttons of a flat [Toolbar]: at rest they have no fill
/// and a transparent border, and the pointer over them shows the
/// `state-hover` tint. A toggle that is on keeps its tint and border.
class ToggleFlat extends InheritedWidget {
  /// Flattens the toggle buttons in [child] when [flat].
  const ToggleFlat({super.key, required this.flat, required super.child});

  /// Whether the toggle buttons below are flat.
  final bool flat;

  /// Whether a flat toolbar holds [context].
  static bool of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ToggleFlat>()?.flat ?? false;

  @override
  bool updateShouldNotify(ToggleFlat oldWidget) => oldWidget.flat != flat;
}

/// An on and off control that looks like a button, such as Bold in a
/// toolbar: a button with a toggled state, the WAI-ARIA button pattern with
/// `aria-pressed`.
///
/// A tap, Enter or Space flips it. Its accessible name stays the same in
/// both states; only the toggled state changes. When on, the surface takes a
/// tint of the selection colour and a matching border, and with [check] a
/// leading tick, so the state never relies on colour alone. Use [Switch] for
/// a setting that applies at once.
///
/// The [child] is the content, a [Text] or an icon. An icon-only toggle
/// needs [semanticLabel], its accessible name.
///
/// Controlled, [ToggleButton] shows [value] and reports each change through
/// [onChanged]; [ToggleButton.uncontrolled] keeps its own value from
/// [initialValue]. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it validates with [validator] and saves with [onSaved]; a
/// form reset clears the validator's message and restores the current
/// default without calling [onChanged].
///
/// ```dart
/// iu.ToggleButton.uncontrolled(
///   semanticLabel: 'Bold',
///   onChanged: (on) => setState(() => bold = on),
///   child: const Text('B'),
/// )
/// ```
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
    this.error,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
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
    this.error,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
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

  /// An error message. A non-empty one marks the toggle invalid; it shows
  /// under the toggle with a hazard glyph and is announced. It takes
  /// precedence over the [validator]'s message.
  final String? error;

  /// The focus node.
  final FocusNode? focusNode;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<bool>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<bool>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

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

  final GlobalKey _toggleKey = GlobalKey();

  void _toggle() {
    final next = !value;
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final joined = ToggleJoin.of(context);
    final flat = ToggleFlat.of(context);
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

    final toggle = Pressable(
      onPressed: enabled ? _toggle : null,
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
                  : !flat
                  ? colors.background
                  : states.hovered
                  ? colors.stateHover
                  : const Color(0x00000000),
              border: joined
                  ? null
                  : Border.all(
                      color: on
                          ? colors.selected.withValues(alpha: _onBorder)
                          : flat
                          ? const Color(0x00000000)
                          : colors.controlBorder,
                    ),
              borderRadius: BorderRadius.circular(radius),
            ),
            child: Center(widthFactor: 1, heightFactor: 1, child: content),
          ),
        ),
      ),
    );

    return buildFormField(
      enabled: enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        final invalid = error != null && error.isNotEmpty;
        final button = KeyedSubtree(
          // Keeps the toggle's state, and its focus, when an error shows or
          // clears around it.
          key: _toggleKey,
          child: Semantics(
            container: true,
            button: true,
            toggled: on,
            enabled: enabled,
            label: widget.semanticLabel,
            hint: invalid ? error : null,
            validationResult: invalid
                ? SemanticsValidationResult.invalid
                : SemanticsValidationResult.none,
            onTap: enabled ? _toggle : null,
            child: toggle,
          ),
        );
        if (!invalid) return button;
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: _errorGap,
          children: [button, _ErrorText(error)],
        );
      },
    );
  }
}

/// The error under a toggle: a hazard glyph and the message, so the invalid
/// state never relies on colour alone, in a live region, so a new error is
/// announced.
class _ErrorText extends StatelessWidget {
  const _ErrorText(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final color = theme.colors.dangerBodyText;
    return Semantics(
      container: true,
      liveRegion: true,
      child: IconTheme(
        data: IconThemeData(
          color: color,
          size: theme.textStyle.fontSize,
          applyTextScaling: true,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: _errorGlyphGap,
          children: [
            const HazardGlyph(),
            Flexible(
              child: Text(
                message,
                style: theme.textStyle.copyWith(color: color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
