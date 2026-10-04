import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../field/field.dart';
import '../internal/form_binding.dart';
import '../internal/text_box.dart';

/// A single-line text field: a label, an editable box, an optional
/// description and an optional error, built on [EditableText].
///
/// Controlled, [TextField] shows [value] and reports each edit through
/// [onChanged]; the parent passes the new text back. Uncontrolled,
/// [TextField.uncontrolled] keeps the text itself from [initialValue]. A
/// changed [value] is shown without calling [onChanged].
///
/// Inside a [Form] the field validates with [validator], saves with
/// [onSaved], and a form reset restores the current default (the last
/// [value] the parent passed, or [initialValue]) without calling
/// [onChanged].
///
/// The name collides with Material's `TextField`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class TextField extends _TextControl {
  /// A field that shows [value], controlled by the parent.
  const TextField({
    super.key,
    required super.label,
    required String super.value,
    super.onChanged,
    super.hideLabel,
    super.description,
    super.error,
    super.placeholder,
    super.enabled,
    super.readOnly,
    super.required,
    super.maxLength,
    super.keyboardType,
    super.textInputAction,
    super.obscureText,
    super.autofillHints,
    super.leading,
    super.trailing,
    super.onSubmitted,
    super.focusNode,
    super.autofocus,
    super.validator,
    super.onSaved,
    super.autovalidateMode,
  }) : super(initialValue: null, minLines: null, maxLines: 1);

  /// A field that keeps its own text, starting from [initialValue].
  const TextField.uncontrolled({
    super.key,
    required super.label,
    String super.initialValue = '',
    super.onChanged,
    super.hideLabel,
    super.description,
    super.error,
    super.placeholder,
    super.enabled,
    super.readOnly,
    super.required,
    super.maxLength,
    super.keyboardType,
    super.textInputAction,
    super.obscureText,
    super.autofillHints,
    super.leading,
    super.trailing,
    super.onSubmitted,
    super.focusNode,
    super.autofocus,
    super.validator,
    super.onSaved,
    super.autovalidateMode,
  }) : super(value: null, minLines: null, maxLines: 1);
}

/// A multi-line text field. It shows [minLines] lines at least, grows with
/// its text up to [maxLines] (without limit when null) and then scrolls.
/// Enter inserts a line break.
///
/// Everything else is as in [TextField]: [Textarea] is controlled by
/// [value] and [onChanged], [Textarea.uncontrolled] keeps its own text, and
/// both work inside a [Form].
class Textarea extends _TextControl {
  /// A text area that shows [value], controlled by the parent.
  const Textarea({
    super.key,
    required super.label,
    required String super.value,
    super.onChanged,
    super.minLines = 3,
    super.maxLines,
    super.hideLabel,
    super.description,
    super.error,
    super.placeholder,
    super.enabled,
    super.readOnly,
    super.required,
    super.maxLength,
    super.autofillHints,
    super.focusNode,
    super.autofocus,
    super.validator,
    super.onSaved,
    super.autovalidateMode,
  }) : assert(maxLines == null || maxLines >= (minLines ?? 1)),
       super(
         initialValue: null,
         keyboardType: TextInputType.multiline,
         textInputAction: TextInputAction.newline,
       );

  /// A text area that keeps its own text, starting from [initialValue].
  const Textarea.uncontrolled({
    super.key,
    required super.label,
    String super.initialValue = '',
    super.onChanged,
    super.minLines = 3,
    super.maxLines,
    super.hideLabel,
    super.description,
    super.error,
    super.placeholder,
    super.enabled,
    super.readOnly,
    super.required,
    super.maxLength,
    super.autofillHints,
    super.focusNode,
    super.autofocus,
    super.validator,
    super.onSaved,
    super.autovalidateMode,
  }) : assert(maxLines == null || maxLines >= (minLines ?? 1)),
       super(
         value: null,
         keyboardType: TextInputType.multiline,
         textInputAction: TextInputAction.newline,
       );
}

/// What [TextField] and [Textarea] share.
abstract class _TextControl extends StatefulWidget {
  const _TextControl({
    super.key,
    required this.label,
    required this.value,
    required this.initialValue,
    required this.minLines,
    required this.maxLines,
    this.onChanged,
    this.hideLabel = false,
    this.description,
    this.error,
    this.placeholder,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.maxLength,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.autofillHints,
    this.leading,
    this.trailing,
    this.onSubmitted,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : assert(maxLength == null || maxLength > 0);

  /// The visible label, and the accessible name.
  final String label;

  /// The text, when the parent controls it; null in the uncontrolled form.
  final String? value;

  /// The starting text of the uncontrolled form, and its reset default.
  final String? initialValue;

  /// Called with the new text after each edit. Never called for a changed
  /// [value] or a form reset.
  final ValueChanged<String>? onChanged;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Shown in the empty field.
  final String? placeholder;

  /// Whether the field takes focus and edits. A disabled field leaves the
  /// focus order.
  final bool enabled;

  /// Whether the field is read-only: it takes focus and selection, not
  /// edits.
  final bool readOnly;

  /// Whether a value is required. The label shows an asterisk and the
  /// field reports itself required; checking it is the [validator]'s work.
  final bool required;

  /// The most characters a user can type. Text the parent passes is never
  /// cut.
  final int? maxLength;

  /// The keyboard a touch device shows.
  final TextInputType? keyboardType;

  /// The action key of a touch keyboard.
  final TextInputAction? textInputAction;

  /// Hides the characters, for passwords.
  final bool obscureText;

  /// Autofill hints, such as `AutofillHints.email`.
  final Iterable<String>? autofillHints;

  /// A decorative widget before the text.
  final Widget? leading;

  /// A decorative widget after the text.
  final Widget? trailing;

  /// Called with the text on Enter.
  final ValueChanged<String>? onSubmitted;

  /// The lines a text area shows at least.
  final int? minLines;

  /// The lines a text area grows to before it scrolls.
  final int? maxLines;

  /// The focus node of the editable text.
  final FocusNode? focusNode;

  /// Whether the field takes focus when it first appears.
  final bool autofocus;

  /// Checks the text when the enclosing [Form] validates; its message shows
  /// as the error unless [error] is set.
  final FormFieldValidator<String>? validator;

  /// Called with the text when the enclosing [Form] saves.
  final FormFieldSetter<String>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  bool get _controlled => value != null;

  @override
  State<_TextControl> createState() => _TextControlState();
}

class _TextControlState extends State<_TextControl> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.value ?? widget.initialValue,
  );
  late String _text;
  late String _default;
  FocusNode? _ownFocus;
  final GlobalKey<FormFieldState<String>> _form =
      GlobalKey<FormFieldState<String>>();

  FocusNode get _focus => widget.focusNode ?? (_ownFocus ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _text = _controller.text;
    _default = _text;
    _controller.addListener(_edited);
  }

  @override
  void didUpdateWidget(_TextControl oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): only a value the parent changed, compared with
    // the previous widget, never with the text. A value that gives back the
    // text the field holds moves neither the text nor the reset default.
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

  /// Shows [text] without reporting it.
  void _show(String text) {
    _text = text;
    _controller.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  /// A user edit: the state moves first, the report follows (ADR 0011).
  void _edited() {
    final next = _controller.text;
    if (next == _text) return;
    setState(() => _text = next);
    _form.currentState?.didChange(next);
    widget.onChanged?.call(next);
  }

  /// A form reset (ADR 0012): the current default comes back, silently.
  void _restore() {
    setState(
      () => _show(widget._controlled ? _default : widget.initialValue ?? ''),
    );
  }

  @override
  Widget build(BuildContext context) {
    final maxLength = widget.maxLength;
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
            maxValueLength: maxLength,
            currentValueLength: _text.characters.length,
            child: TextBox(
              controller: _controller,
              focusNode: _focus,
              enabled: widget.enabled,
              readOnly: widget.readOnly,
              invalid: error != null && error.isNotEmpty,
              autofocus: widget.autofocus,
              placeholder: widget.placeholder,
              obscureText: widget.obscureText,
              minLines: widget.minLines,
              maxLines: widget.maxLines,
              keyboardType: widget.keyboardType,
              textInputAction: widget.textInputAction,
              inputFormatters: maxLength == null
                  ? null
                  : [LengthLimitingTextInputFormatter(maxLength)],
              autofillHints: widget.autofillHints,
              onSubmitted: widget.onSubmitted,
              leading: widget.leading,
              trailing: widget.trailing,
            ),
          ),
        );
      },
    );
  }
}
