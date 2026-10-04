import 'package:flutter/widgets.dart';

/// Joins a value control to the enclosing [Form] (ADR 0012).
///
/// The control keeps its own state; the binding mirrors [value] into the
/// [FormFieldState], so the form's validators and savers see it, and calls
/// [restore] when the form resets, after the form field has cleared its
/// error. The control restores its current default there and reports
/// nothing.
class FormBinding<T> extends FormField<T> {
  /// Binds a control holding [value].
  const FormBinding({
    super.key,
    required this.value,
    required this.restore,
    required super.builder,
    super.validator,
    super.onSaved,
    super.autovalidateMode,
    super.enabled,
  }) : super(initialValue: value);

  /// The value the control holds now.
  final T value;

  /// Restores the control's current default, silently.
  final VoidCallback restore;

  @override
  FormFieldState<T> createState() => _FormBindingState<T>();
}

class _FormBindingState<T> extends FormFieldState<T> {
  FormBinding<T> get _binding => widget as FormBinding<T>;

  @override
  void didUpdateWidget(covariant FormBinding<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_binding.value != value) setValue(_binding.value);
  }

  @override
  void reset() {
    super.reset();
    _binding.restore();
  }
}
