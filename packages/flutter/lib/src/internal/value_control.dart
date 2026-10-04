import 'package:flutter/widgets.dart';

import 'form_binding.dart';

/// The value of a control that is controlled or uncontrolled (ADR 0011) and
/// joins the enclosing [Form] (ADR 0012).
///
/// [value] is what the control shows. A controlled widget's new value is
/// shown without a report; a value that only gives back what the control
/// holds moves nothing, not even the reset default. A user change goes
/// through [commitValue], which updates the state before the caller reports.
/// A form reset restores the current default silently.
mixin ValueControl<T, W extends StatefulWidget> on State<W> {
  /// Whether the parent controls the value.
  bool get isControlled;

  /// The value [widget] passes when controlled.
  T controlledValueOf(W widget);

  /// The starting value of the uncontrolled form, and its reset default.
  T get initialValueOfWidget;

  /// Whether two values are the same selection.
  bool sameValue(T a, T b) => a == b;

  /// Called after a controlled value or a form reset has replaced [value],
  /// for state derived from it.
  void didReplaceValue() {}

  /// The value the control shows.
  late T value;

  late T _default;

  final GlobalKey<FormFieldState<T>> _form = GlobalKey<FormFieldState<T>>();

  @override
  void initState() {
    super.initState();
    value = isControlled ? controlledValueOf(widget) : initialValueOfWidget;
    _default = value;
  }

  @override
  void didUpdateWidget(covariant W oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): only a value the parent changed, compared with
    // the previous widget, never with the state; never reported.
    if (!isControlled) return;
    final next = controlledValueOf(widget);
    if (sameValue(next, controlledValueOf(oldWidget)) ||
        sameValue(next, value)) {
      return;
    }
    _default = next;
    value = next;
    didReplaceValue();
  }

  /// A user change: the state moves first, and true tells the caller to
  /// report it. False when [next] is the value already held.
  bool commitValue(T next) {
    if (sameValue(next, value)) return false;
    setState(() => value = next);
    _form.currentState?.didChange(next);
    return true;
  }

  /// A form reset (ADR 0012): the current default comes back, silently.
  void restoreValue() {
    setState(() {
      value = isControlled ? _default : initialValueOfWidget;
      didReplaceValue();
    });
  }

  /// Joins [builder]'s control to the enclosing [Form]. [builder] receives
  /// the validator's message.
  Widget buildFormField({
    required bool enabled,
    required Widget Function(String? errorText) builder,
    FormFieldValidator<T>? validator,
    FormFieldSetter<T>? onSaved,
    AutovalidateMode? autovalidateMode,
  }) {
    return FormBinding<T>(
      key: _form,
      value: value,
      restore: restoreValue,
      validator: validator,
      onSaved: onSaved,
      autovalidateMode: autovalidateMode,
      enabled: enabled,
      builder: (field) => builder(field.errorText),
    );
  }
}
