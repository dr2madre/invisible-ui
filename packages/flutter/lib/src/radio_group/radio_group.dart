import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/single_choice.dart';
import '../internal/toggle_tile.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

// Sizes the web RadioButtonGroup sets in its own stylesheet.
const double _dotSide = 17.6;
const double _innerDot = 9.6;
const double _gap = 8;
const double _gapHorizontal = 20;

/// A named set of options of which one is chosen, following the WAI-ARIA
/// radio group pattern.
///
/// The group is one tab stop: the chosen option, or the first enabled one
/// when none is chosen. The arrow keys move to the next or previous enabled
/// option, wrapping, and choose it; right and left follow the reading
/// direction. Space or a tap chooses the focused option. Options stack
/// vertically, or wrap in rows when [orientation] is horizontal.
///
/// Controlled, [RadioButtonGroup] shows [value] (null when nothing is chosen) and
/// reports each choice through [onChanged]; [RadioButtonGroup.uncontrolled] keeps
/// its own value. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it validates, saves and resets like the other value
/// controls.
///
/// The web adapters call it RadioGroup; the widgets library has its own
/// `RadioGroup`, a registry for raw radio buttons, so this one has another
/// name.
class RadioButtonGroup<T> extends StatefulWidget {
  /// A group that shows [value], controlled by the parent.
  const RadioButtonGroup({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    this.onChanged,
    this.orientation = Axis.vertical,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A group that keeps its own value, starting from [initialValue].
  const RadioButtonGroup.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValue,
    this.onChanged,
    this.orientation = Axis.vertical,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The group's visible label and accessible name.
  final String label;

  /// The options, in order.
  final List<ChoiceItem<T>> items;

  /// The chosen value when the parent controls it; null when none is.
  final T? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final T? initialValue;

  /// Called with the chosen value after a user choice. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<T>? onChanged;

  /// How the options are laid out.
  final Axis orientation;

  /// Hides the group label visually while it still names the group.
  final bool hideLabel;

  /// A hint shown under the group and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the group invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the group takes focus and changes.
  final bool enabled;

  /// Whether a choice is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<T?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<T?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<RadioButtonGroup<T>> createState() => _RadioButtonGroupState<T>();
}

class _RadioButtonGroupState<T> extends State<RadioButtonGroup<T>>
    with ValueControl<T?, RadioButtonGroup<T>> {
  final SingleChoiceFocus<T> _focus = SingleChoiceFocus<T>();

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(RadioButtonGroup<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _choose(T next) {
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    _focus.sync(items, value, enabled: widget.enabled);
    final options = [
      for (final item in items)
        ToggleTile(
          key: ValueKey(item.value),
          label: item.label,
          semanticLabel: item.label,
          indicator: RadioDot(checked: item.value == value),
          indicatorRadius: indicatorSide(context, _dotSide) / 2,
          onActivate: widget.enabled && !item.disabled
              ? () => _choose(item.value)
              : null,
          checked: item.value == value,
          inMutuallyExclusiveGroup: true,
          focusNode: _focus.nodeFor(item.value),
        ),
    ];
    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        return FieldFrame(
          label: widget.label,
          hideLabel: widget.hideLabel,
          required: widget.required,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: _focus.focusTabStop,
          control: FieldSemantics(
            label: widget.label,
            description: widget.description,
            error: error,
            required: widget.required,
            enabled: widget.enabled,
            role: SemanticsRole.radioGroup,
            explicitChildNodes: true,
            child: SingleChoiceKeys<T>(
              focus: _focus,
              items: items,
              onMove: _choose,
              child: widget.orientation == Axis.vertical
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: _gap,
                      children: options,
                    )
                  : Wrap(
                      spacing: _gapHorizontal,
                      runSpacing: _gap,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: options,
                    ),
            ),
          ),
        );
      },
    );
  }
}

/// The painted circle of a radio option, with a dot when [checked]. The dot
/// takes the selection text colour, and the ring stays the control border.
class RadioDot extends StatelessWidget {
  /// Paints the circle.
  const RadioDot({super.key, required this.checked});

  /// Whether the option is chosen.
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
