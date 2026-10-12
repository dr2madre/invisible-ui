import 'dart:ui' show SemanticsValidationResult;

import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/value_control.dart';
import '../radio/radio.dart';

// Sizes the web RadioButtonGroup sets in its own stylesheet.
const double _gap = 8;
const double _gapHorizontal = 20;

/// A named set of options of which one is chosen, following the WAI-ARIA
/// radio group pattern, built on the widgets library's [RadioGroup] and
/// [Radio].
///
/// ```dart
/// import 'package:invisible_ui/invisible_ui.dart' as iu;
///
/// iu.RadioButtonGroup<String>(
///   label: 'Export',
///   items: const [
///     iu.ChoiceItem(value: 'month', label: 'This month'),
///     iu.ChoiceItem(value: 'year', label: 'This year'),
///   ],
///   value: scope,
///   onChanged: (next) => setState(() => scope = next),
/// );
/// ```
///
/// The group is one tab stop: the chosen option, or the first enabled one
/// when none is chosen. The arrow keys move to the next or previous enabled
/// option, wrapping, and choose it; right and left follow the reading
/// direction. Space or a tap chooses the focused option. Options stack
/// vertically, or wrap in rows when [orientation] is horizontal.
///
/// Controlled, [RadioButtonGroup] shows [value] (null when nothing is
/// chosen) and reports each choice through [onChanged];
/// [RadioButtonGroup.uncontrolled] keeps its own value. A changed [value] is
/// shown without calling [onChanged]. Inside a [Form] it validates, saves
/// and resets like the other value controls: [error] or the [validator]'s
/// message shows under the options, and a reset restores the default
/// without reporting it.
///
/// The web adapters call it RadioGroup; that name is the widgets library's
/// value holder this group is built on.
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
  // Holds the options' focus nodes, for a tap on the label.
  final FocusNode _options = FocusNode(
    debugLabel: 'RadioButtonGroup options',
    canRequestFocus: false,
    skipTraversal: true,
  );

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(RadioButtonGroup<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void dispose() {
    _options.dispose();
    super.dispose();
  }

  void _choose(T? next) {
    if (next != null && commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final options = [
      for (final item in widget.items)
        Radio<T>(
          key: ValueKey(item.value),
          value: item.value,
          label: item.label,
          enabled: widget.enabled && !item.disabled,
        ),
    ];
    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        final invalid = error != null && error.isNotEmpty;
        final hint = [
          widget.description,
          error,
        ].where((part) => part != null && part.isNotEmpty).join('\n');
        return FieldFrame(
          label: widget.label,
          hideLabel: widget.hideLabel,
          required: widget.required,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: () => focusRadioTabStop(_options),
          // The native group's node has the radio group role; the field's
          // name, hint and states merge into it, as FieldSemantics gives
          // them to other fields.
          control: Actions(
            // The native group's keys invoke VoidCallbackIntent, whose action
            // WidgetsApp provides; this keeps them working without one.
            actions: _groupActions,
            child: RadioGroup<T>(
              groupValue: value,
              onChanged: _choose,
              child: Semantics(
                label: widget.label,
                hint: hint.isEmpty ? null : hint,
                enabled: widget.enabled ? null : false,
                isRequired: widget.required ? true : null,
                validationResult: invalid
                    ? SemanticsValidationResult.invalid
                    : SemanticsValidationResult.none,
                child: Focus(
                  focusNode: _options,
                  includeSemantics: false,
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
            ),
          ),
        );
      },
    );
  }
}

final Map<Type, Action<Intent>> _groupActions = {
  VoidCallbackIntent: VoidCallbackAction(),
};
