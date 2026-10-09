import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/toggle_tile.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web Switch sets in its own stylesheet.
const double _trackWidth = 40;
const double _trackWidthOnOff = 60;
const double _trackHeight = 24;
const double _thumbInset = 2;
const double _onOffInset = 8;
const double _onOffFontSize = 10;

/// An on and off switch with its label, following the WAI-ARIA switch
/// pattern. Prefer it to a checkbox for a setting that applies at once.
///
/// A tap on the track or the label, or Space, flips it. The thumb sits at
/// the inline-end when on, so it follows the reading direction. With
/// [onOff] the track also shows [onText] or [offText], so the state reads
/// without colour.
///
/// Controlled, [Switch] shows [value] and reports each change through
/// [onChanged]; [Switch.uncontrolled] keeps its own value from
/// [initialValue]. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it validates with [validator], saves with [onSaved], and
/// a form reset restores the current default without calling [onChanged].
///
/// The name collides with Material's `Switch`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class Switch extends StatefulWidget {
  /// A switch that shows [value], controlled by the parent.
  const Switch({
    super.key,
    required this.label,
    required bool this.value,
    this.onChanged,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.onOff = false,
    this.onText,
    this.offText,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null;

  /// A switch that keeps its own value, starting from [initialValue].
  const Switch.uncontrolled({
    super.key,
    required this.label,
    bool this.initialValue = false,
    this.onChanged,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.onOff = false,
    this.onText,
    this.offText,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null;

  /// The visible label, and the accessible name.
  final String label;

  /// Whether the switch is on, when the parent controls it; null in the
  /// uncontrolled form.
  final bool? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final bool? initialValue;

  /// Called with the new value after a user change. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<bool>? onChanged;

  /// Hides the label visually while it still names the switch.
  final bool hideLabel;

  /// A hint shown under the switch and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the switch invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the switch takes focus and changes. A disabled one leaves the
  /// focus order.
  final bool enabled;

  /// Whether the switch reports itself required; checking it is the
  /// [validator]'s work.
  final bool required;

  /// Shows the state as text inside a wider track.
  final bool onOff;

  /// The text of the on state with [onOff]. Defaults to
  /// [InvisibleMessages.switchOn].
  final String? onText;

  /// The text of the off state with [onOff]. Defaults to
  /// [InvisibleMessages.switchOff].
  final String? offText;

  /// The focus node.
  final FocusNode? focusNode;

  /// Whether the switch takes focus when it first appears.
  final bool autofocus;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<bool>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<bool>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  @override
  State<Switch> createState() => _SwitchState();
}

class _SwitchState extends State<Switch> with ValueControl<bool, Switch> {
  @override
  bool get isControlled => widget.value != null;

  @override
  bool controlledValueOf(Switch widget) => widget.value ?? value;

  @override
  bool get initialValueOfWidget => widget.initialValue ?? false;

  void _toggle() {
    final next = !value;
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        return ToggleField(
          label: widget.label,
          description: widget.description,
          error: error,
          required: widget.required,
          enabled: widget.enabled,
          tile: ToggleTile(
            label: widget.label,
            hideLabel: widget.hideLabel,
            indicator: _Track(
              on: value,
              onText: widget.onOff ? widget.onText ?? messages.switchOn : null,
              offText: widget.onOff
                  ? widget.offText ?? messages.switchOff
                  : null,
            ),
            indicatorRadius: InvisibleRadiusTokens.pill,
            onActivate: widget.enabled ? _toggle : null,
            toggled: value,
            focusNode: widget.focusNode,
            autofocus: widget.autofocus,
          ),
        );
      },
    );
  }
}

/// The track and thumb. The track keeps a boundary in both states, and the
/// thumb a rim, so each stays visible on the light off track.
class _Track extends StatelessWidget {
  const _Track({required this.on, this.onText, this.offText});

  final bool on;
  final String? onText;
  final String? offText;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final labelled = onText != null;
    final height = indicatorSide(context, _trackHeight);
    final width = indicatorSide(
      context,
      labelled ? _trackWidthOnOff : _trackWidth,
    );
    final inset = indicatorSide(context, _thumbInset);
    final thumb = height - inset * 2;
    final duration = reducedMotion(context)
        ? Duration.zero
        : const Duration(milliseconds: 150);

    Widget stateText(String text, {required bool visible, required Color c}) {
      return AnimatedOpacity(
        opacity: visible ? 1 : 0,
        duration: duration,
        child: Text(
          text,
          maxLines: 1,
          textScaler: TextScaler.noScaling,
          style: theme.textStyle.copyWith(
            fontSize: height * _onOffFontSize / _trackHeight,
            fontWeight: FontWeight.w700,
            letterSpacing: height * 0.4 / _trackHeight,
            height: 1,
            color: c,
          ),
        ),
      );
    }

    return AnimatedContainer(
      duration: duration,
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: on ? colors.secondary : colors.surface,
        border: Border.all(color: colors.controlBorder),
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.pill),
      ),
      child: Stack(
        children: [
          if (labelled) ...[
            PositionedDirectional(
              start: indicatorSide(context, _onOffInset) - 1,
              top: 0,
              bottom: 0,
              child: Center(
                child: stateText(onText!, visible: on, c: colors.onSecondary),
              ),
            ),
            PositionedDirectional(
              end: indicatorSide(context, _onOffInset) - 1,
              top: 0,
              bottom: 0,
              child: Center(
                child: stateText(offText!, visible: !on, c: colors.text),
              ),
            ),
          ],
          AnimatedAlign(
            duration: duration,
            curve: Curves.ease,
            alignment: on
                ? AlignmentDirectional.centerEnd
                : AlignmentDirectional.centerStart,
            child: Padding(
              // The border takes one pixel of the inset.
              padding: EdgeInsets.all(inset - 1),
              child: Container(
                width: thumb,
                height: thumb,
                decoration: BoxDecoration(
                  color: InvisiblePalette.grey0,
                  shape: BoxShape.circle,
                  border: Border.all(color: colors.controlBorder),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
