import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../field/field.dart';
import '../internal/field_button.dart';
import '../internal/form_binding.dart';
import '../internal/glyphs.dart';
import '../internal/text_box.dart';
import '../theme/theme.dart';

// Sizes the web Search Field sets in its own stylesheet.
const double _buttonGap = 4;

/// A search field: a labelled text box, a clear button while it holds text,
/// and a submit button.
///
/// Enter in the box and the submit button call [onSubmitted] with the text;
/// the app runs the search. The clear button empties the box, reports the
/// empty text once through [onChanged] and puts focus back in the box,
/// whether a key or a pointer pressed it. A disabled or read-only field has
/// no clear button. Tab moves from the box to the clear button, when it
/// shows, then to the submit button.
///
/// For a filter that applies as the user types there is nothing to submit:
/// set [submitButton] to false. The magnifying glass then marks the start of
/// the box and the clear button stays.
///
/// Controlled, [SearchField] shows [value] and reports each edit through
/// [onChanged]; [SearchField.uncontrolled] keeps its own text from
/// [initialValue]. A changed [value] is shown without calling [onChanged].
/// Inside a [Form] it validates, saves and resets like [TextField].
///
/// ```dart
/// iu.SearchField(
///   label: 'Search projects',
///   hideLabel: true,
///   value: query,
///   onChanged: (text) => setState(() => query = text),
///   onSubmitted: search,
/// )
/// ```
class SearchField extends StatefulWidget {
  /// A search field that shows [value], controlled by the parent.
  const SearchField({
    super.key,
    required this.label,
    required String this.value,
    this.onChanged,
    this.onSubmitted,
    this.hideLabel = false,
    this.placeholder,
    this.description,
    this.error,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.submitButton = true,
    this.clearLabel,
    this.submitLabel,
    this.autofillHints,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null;

  /// A search field that keeps its own text, starting from [initialValue].
  const SearchField.uncontrolled({
    super.key,
    required this.label,
    String this.initialValue = '',
    this.onChanged,
    this.onSubmitted,
    this.hideLabel = false,
    this.placeholder,
    this.description,
    this.error,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.submitButton = true,
    this.clearLabel,
    this.submitLabel,
    this.autofillHints,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null;

  /// The visible label, and the accessible name.
  final String label;

  /// The text, when the parent controls it; null in the uncontrolled form.
  final String? value;

  /// The starting text of the uncontrolled form, and its reset default.
  final String? initialValue;

  /// Called with the new text after each edit and after a clear. Never
  /// called for a changed [value] or a form reset.
  final ValueChanged<String>? onChanged;

  /// Called with the text on Enter and on the submit button.
  final ValueChanged<String>? onSubmitted;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// Shown in the empty field. It never replaces the label.
  final String? placeholder;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the field takes focus and edits. A disabled field leaves the
  /// focus order, and so do its buttons.
  final bool enabled;

  /// Whether the field is read-only: it takes focus and selection, not edits,
  /// and has no clear button.
  final bool readOnly;

  /// Whether a value is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// Whether the field ends with a submit button.
  final bool submitButton;

  /// The name of the clear button. Defaults to
  /// [InvisibleMessages.searchFieldClear].
  final String? clearLabel;

  /// The name of the submit button. Defaults to
  /// [InvisibleMessages.searchFieldSubmit].
  final String? submitLabel;

  /// Autofill hints.
  final Iterable<String>? autofillHints;

  /// The focus node of the text.
  final FocusNode? focusNode;

  /// Whether the field takes focus when it first appears.
  final bool autofocus;

  /// Checks the text when the enclosing [Form] validates.
  final FormFieldValidator<String>? validator;

  /// Called with the text when the enclosing [Form] saves.
  final FormFieldSetter<String>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  bool get _controlled => value != null;

  @override
  State<SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends State<SearchField> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.value ?? widget.initialValue,
  );
  late String _text;
  late String _default;
  FocusNode? _ownFocus;
  final GlobalKey<FormFieldState<String>> _form =
      GlobalKey<FormFieldState<String>>();

  FocusNode get _focus =>
      widget.focusNode ?? (_ownFocus ??= FocusNode(debugLabel: 'Search'));

  @override
  void initState() {
    super.initState();
    _text = _controller.text;
    _default = _text;
    _controller.addListener(_edited);
  }

  @override
  void didUpdateWidget(SearchField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): only a value the parent changed, never one that
    // gives back the text the field holds.
    final value = widget.value;
    if (widget._controlled && value != oldWidget.value && value != _text) {
      _default = value!;
      _show(value);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _ownFocus?.dispose();
    super.dispose();
  }

  void _show(String text) {
    _text = text;
    _controller.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  /// A user edit, typed or cleared: the state moves first, the report
  /// follows (ADR 0011).
  void _edited() {
    final next = _controller.text;
    if (next == _text) return;
    setState(() => _text = next);
    _form.currentState?.didChange(next);
    widget.onChanged?.call(next);
  }

  void _restore() {
    setState(
      () => _show(widget._controlled ? _default : widget.initialValue ?? ''),
    );
  }

  bool get _clearable =>
      widget.enabled && !widget.readOnly && _text.isNotEmpty;

  void _clear({required bool keyboard}) {
    if (!_clearable) return;
    _controller.value = TextEditingValue.empty;
    // The button goes once the text is gone, and a tap outside the text may
    // already have taken focus away: the box takes it back either way.
    _focus.requestFocus();
  }

  void _submit() {
    // Enter that ends an input method composition commits the text; it does
    // not submit it.
    if (isComposing(_controller.value)) return;
    widget.onSubmitted?.call(_controller.text);
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    return FormBinding<String>(
      key: _form,
      value: _text,
      restore: _restore,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      enabled: widget.enabled,
      builder: (field) {
        final error = widget.error ?? field.errorText;
        return FieldFrame(
          label: widget.label,
          hideLabel: widget.hideLabel,
          required: widget.required,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: _focus.requestFocus,
          control: FieldSemantics(
            label: widget.label,
            description: widget.description,
            error: error,
            placeholder: _text.isEmpty ? widget.placeholder : null,
            required: widget.required,
            enabled: widget.enabled,
            child: TextBox(
              controller: _controller,
              focusNode: _focus,
              enabled: widget.enabled,
              readOnly: widget.readOnly,
              invalid: error != null && error.isNotEmpty,
              autofocus: widget.autofocus,
              placeholder: widget.placeholder,
              keyboardType: TextInputType.text,
              textInputAction: TextInputAction.search,
              autofillHints: widget.autofillHints,
              onSubmitted: (_) => _submit(),
              leading: widget.submitButton
                  ? null
                  : const Glyph(GlyphShape.search),
              actions: [
                FieldButton(
                  label: widget.clearLabel ?? messages.searchFieldClear,
                  visible: _clearable,
                  focusable: true,
                  onPressed: _clear,
                  child: const Glyph(GlyphShape.close),
                ),
                if (widget.submitButton) ...[
                  const SizedBox(width: _buttonGap),
                  FieldButton(
                    label: widget.submitLabel ?? messages.searchFieldSubmit,
                    visible: true,
                    focusable: true,
                    enabled: widget.enabled,
                    onPressed: ({required bool keyboard}) => _submit(),
                    child: const Glyph(GlyphShape.search),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
