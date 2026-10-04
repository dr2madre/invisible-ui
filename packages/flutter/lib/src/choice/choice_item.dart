import 'package:flutter/widgets.dart';

/// One option of a choice control: [CheckboxGroup], [RadioButtonGroup],
/// [SegmentedControl], [Select] or [Combobox].
///
/// Values identify the options, so each value appears once in a list.
@immutable
class ChoiceItem<T> {
  /// Creates an option.
  const ChoiceItem({
    required this.value,
    required this.label,
    this.disabled = false,
    this.icon,
  });

  /// The value the control holds and reports when this option is chosen.
  final T value;

  /// The visible label: the option's accessible name, and the text typeahead
  /// and filtering match.
  final String label;

  /// Whether the option can be chosen. A disabled option shows dimmed and
  /// takes no focus.
  final bool disabled;

  /// A decorative leading icon, sized and coloured by the surrounding
  /// [IconTheme]. Shown by [SegmentedControl], [Select] and [Combobox]; the
  /// label stays the accessible name.
  final Widget? icon;
}
