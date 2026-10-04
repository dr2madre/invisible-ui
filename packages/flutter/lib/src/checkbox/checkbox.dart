import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/glyphs.dart';
import '../internal/toggle_tile.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

// Sizes the web Checkbox sets in its own stylesheet.
const double _boxSide = 20;
const double _boxPadding = 2.4;
const double _glyphStroke = 3;
const double _checkedTint = 0.1;
const double _groupGap = 8;

/// A checkbox with its label, following the WAI-ARIA checkbox pattern.
///
/// The value is `true`, `false` or `null`, the mixed state a parent checkbox
/// shows when only some of its children are checked. A tap on the box or the
/// label, or Space, checks an unchecked or mixed box and unchecks a checked
/// one; the mixed state comes only from the app.
///
/// Controlled, [Checkbox] shows [value] and reports each change through
/// [onChanged]; [Checkbox.uncontrolled] keeps its own value from
/// [initialValue]. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it validates with [validator], saves with [onSaved], and
/// a form reset restores the current default without calling [onChanged].
///
/// The name collides with Material's `Checkbox`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class Checkbox extends StatefulWidget {
  /// A checkbox that shows [value], controlled by the parent.
  const Checkbox({
    super.key,
    required this.label,
    required this.value,
    this.onChanged,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A checkbox that keeps its own value, starting from [initialValue].
  const Checkbox.uncontrolled({
    super.key,
    required this.label,
    this.initialValue = false,
    this.onChanged,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The visible label, and the accessible name.
  final String label;

  /// The value when the parent controls it: null is the mixed state.
  final bool? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final bool? initialValue;

  /// Called with the new value after a user change. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<bool>? onChanged;

  /// Hides the label visually while it still names the checkbox.
  final bool hideLabel;

  /// A hint shown under the checkbox and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the checkbox invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the checkbox takes focus and changes. A disabled one leaves the
  /// focus order.
  final bool enabled;

  /// Whether checking is required. The checkbox reports itself required;
  /// checking it is the [validator]'s work.
  final bool required;

  /// The focus node.
  final FocusNode? focusNode;

  /// Whether the checkbox takes focus when it first appears.
  final bool autofocus;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<bool?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<bool?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<Checkbox> createState() => _CheckboxState();
}

class _CheckboxState extends State<Checkbox>
    with ValueControl<bool?, Checkbox> {
  @override
  bool get isControlled => widget._controlled;

  @override
  bool? controlledValueOf(Checkbox widget) => widget.value;

  @override
  bool? get initialValueOfWidget => widget.initialValue;

  void _toggle() {
    // A mixed or unchecked box checks; a checked one unchecks.
    final next = value != true;
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
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
            indicator: CheckboxBox(value: value),
            indicatorRadius: InvisibleTheme.of(context).controlRadius,
            onActivate: widget.enabled ? _toggle : null,
            checked: value == true,
            mixed: value == null,
            focusNode: widget.focusNode,
            autofocus: widget.autofocus,
          ),
        );
      },
    );
  }
}

/// The painted box of a checkbox: a tick when checked, a bar when mixed.
///
/// Checked, the box takes a faint selection tint and the glyph the
/// selection text colour, while the border stays the control border: the
/// glyph, not colour, carries the state.
class CheckboxBox extends StatelessWidget {
  /// Paints the box for [value]; null is the mixed state.
  const CheckboxBox({super.key, required this.value});

  /// The checked state.
  final bool? value;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final side = indicatorSide(context, _boxSide);
    final on = value != false;
    return SizedBox.square(
      dimension: side,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: on
              ? colors.secondary.withValues(alpha: _checkedTint)
              : colors.background,
          border: Border.all(color: colors.controlBorder),
          borderRadius: BorderRadius.circular(theme.controlRadius),
        ),
        child: on
            ? Padding(
                padding: EdgeInsets.all(side * _boxPadding / _boxSide),
                child: IconTheme(
                  data: IconThemeData(
                    color: colors.selectedText,
                    size: side - side * 2 * _boxPadding / _boxSide - 2,
                  ),
                  child: Center(
                    child: Glyph(
                      value == true ? GlyphShape.check : GlyphShape.dash,
                      strokeWidth: _glyphStroke,
                    ),
                  ),
                ),
              )
            : null,
      ),
    );
  }
}

/// A named set of checkboxes, any number of them checked, following the
/// WAI-ARIA checkbox pattern for a group (a `<fieldset>` on the web).
///
/// Each item is its own tab stop and toggles with a tap or Space. The value
/// lists the checked items' values in the order they were checked, and may be
/// empty. [label] names the group, shown above the items.
///
/// Controlled, [CheckboxGroup] shows [value] and reports each change through
/// [onChanged]; [CheckboxGroup.uncontrolled] keeps its own value. A changed
/// [value] holding the same items in another order is the same selection,
/// so it moves nothing. Inside a [Form] it validates, saves and resets like
/// the other value controls.
class CheckboxGroup<T> extends StatefulWidget {
  /// A group that shows [value], controlled by the parent.
  const CheckboxGroup({
    super.key,
    required this.label,
    required this.items,
    required List<T> this.value,
    this.onChanged,
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
  const CheckboxGroup.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    List<T> this.initialValue = const [],
    this.onChanged,
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

  /// The checkboxes, in order.
  final List<ChoiceItem<T>> items;

  /// The checked values when the parent controls them.
  final List<T>? value;

  /// The starting values of the uncontrolled form, and its reset default.
  final List<T>? initialValue;

  /// Called with the checked values after a user change. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<List<T>>? onChanged;

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

  /// Checks the values when the enclosing [Form] validates.
  final FormFieldValidator<List<T>>? validator;

  /// Called with the values when the enclosing [Form] saves.
  final FormFieldSetter<List<T>>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<CheckboxGroup<T>> createState() => _CheckboxGroupState<T>();
}

class _CheckboxGroupState<T> extends State<CheckboxGroup<T>>
    with ValueControl<List<T>, CheckboxGroup<T>> {
  final FocusNode _scope = FocusNode(
    canRequestFocus: false,
    skipTraversal: true,
  );

  @override
  bool get isControlled => widget._controlled;

  @override
  List<T> controlledValueOf(CheckboxGroup<T> widget) => widget.value!;

  @override
  List<T> get initialValueOfWidget => widget.initialValue!;

  // The same selection, whatever order each side keeps it in.
  @override
  bool sameValue(List<T> a, List<T> b) =>
      a.length == b.length && a.every(b.contains);

  @override
  void dispose() {
    _scope.dispose();
    super.dispose();
  }

  void _toggle(T item) {
    final next = value.contains(item)
        ? [
            for (final v in value)
              if (v != item) v,
          ]
        : [...value, item];
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
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
          onLabelTap: () =>
              _scope.traversalDescendants.firstOrNull?.requestFocus(),
          control: FieldSemantics(
            label: widget.label,
            description: widget.description,
            error: error,
            required: widget.required,
            enabled: widget.enabled,
            explicitChildNodes: true,
            child: Focus(
              focusNode: _scope,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: _groupGap,
                children: [
                  for (final item in widget.items)
                    ToggleTile(
                      key: ValueKey(item.value),
                      label: item.label,
                      semanticLabel: item.label,
                      indicator: CheckboxBox(value: value.contains(item.value)),
                      indicatorRadius: theme.controlRadius,
                      onActivate: widget.enabled && !item.disabled
                          ? () => _toggle(item.value)
                          : null,
                      checked: value.contains(item.value),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
