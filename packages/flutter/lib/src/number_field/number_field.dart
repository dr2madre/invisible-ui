import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../field/field.dart';
import '../i18n/messages.dart';
import '../internal/form_binding.dart';
import '../internal/glyphs.dart';
import '../internal/text_box.dart';
import '../theme/theme.dart';
import 'number_format.dart';

const double _spinGap = 4;

/// A locale-aware decimal field with step buttons, following the WAI-ARIA
/// spinbutton pattern on an editable text.
///
/// The text the user types (the draft) and the number stay apart. The
/// number follows the draft as it parses, and [onChanged] reports each
/// change; an empty field is null, distinct from 0. The draft commits on
/// blur, Enter, a step action, Home or End: the text is reformatted in the
/// locale and [onChangeEnd] reports the committed number when it moved.
/// Text that is not a number stays as typed and never commits. Escape puts
/// the committed number back, and is only consumed when it undid something,
/// so an enclosing dialog still receives it.
///
/// Typed numbers are never clamped: a number out of range or off the step
/// grid is reported as typed, and the field shows why it is invalid. The
/// reason is data too, through [NumberFieldState.validationError], and the
/// enclosing [Form]'s validation fails on it.
///
/// Arrow Up and Down step by [step]; Home and End go to [min] and [max]
/// when both are set. The step buttons stay out of the focus order and
/// leave focus in the text.
///
/// The locale is [locale], or the app's locale from [Localizations], or
/// English. [symbols] replaces the locale's symbols.
class NumberField extends StatefulWidget {
  /// A field that shows [value], controlled by the parent. Null is empty.
  const NumberField({
    super.key,
    required this.label,
    required this.value,
    this.onChanged,
    this.onChangeEnd,
    this.min,
    this.max,
    this.step = 1,
    this.locale,
    this.symbols,
    this.hideLabel = false,
    this.description,
    this.error,
    this.placeholder,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.changeOnWheel = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A field that keeps its own number, starting from [initialValue].
  const NumberField.uncontrolled({
    super.key,
    required this.label,
    this.initialValue,
    this.onChanged,
    this.onChangeEnd,
    this.min,
    this.max,
    this.step = 1,
    this.locale,
    this.symbols,
    this.hideLabel = false,
    this.description,
    this.error,
    this.placeholder,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.changeOnWheel = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The visible label, and the accessible name.
  final String label;

  /// The number, when the parent controls it. Null is empty.
  final double? value;

  /// The starting number of the uncontrolled form, and its reset default.
  final double? initialValue;

  /// Called when the number changes: as the draft parses, on a step and on
  /// Escape. Never called for a changed [value] or a form reset.
  final ValueChanged<double?>? onChanged;

  /// Called when a commit moves the committed number: blur, Enter, a step
  /// action, Home or End.
  final ValueChanged<double?>? onChangeEnd;

  /// The smallest valid number.
  final double? min;

  /// The largest valid number.
  final double? max;

  /// The step of the step actions; typed numbers are checked against it.
  /// Anything but a positive number counts as 1.
  final double step;

  /// The locale that reads and writes the number.
  final Locale? locale;

  /// The symbols that read and write the number, in place of the locale's.
  final NumberSymbols? symbols;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. It replaces the field's own validity message.
  final String? error;

  /// Shown in the empty field.
  final String? placeholder;

  /// Whether the field takes focus, edits and steps.
  final bool enabled;

  /// Whether the field is read-only: it takes focus, not edits or steps.
  final bool readOnly;

  /// Whether a value is required. The label shows an asterisk and the
  /// field reports itself required.
  final bool required;

  /// Steps on a vertical wheel while the field has focus and the pointer
  /// is over it.
  final bool changeOnWheel;

  /// The focus node of the editable text.
  final FocusNode? focusNode;

  /// Whether the field takes focus when it first appears.
  final bool autofocus;

  /// Checks the number when the enclosing [Form] validates, after the
  /// field's own validity.
  final FormFieldValidator<double?>? validator;

  /// Called with the number when the enclosing [Form] saves.
  final FormFieldSetter<double?>? onSaved;

  /// When the validation runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<NumberField> createState() => NumberFieldState();
}

/// The state of a [NumberField]: the number, the draft and its validity.
class NumberFieldState extends State<NumberField> {
  final TextEditingController _controller = TextEditingController();
  final GlobalKey<FormFieldState<double?>> _form =
      GlobalKey<FormFieldState<double?>>();
  final FocusNode _decrementFocus = FocusNode(skipTraversal: true);
  final FocusNode _incrementFocus = FocusNode(skipTraversal: true);
  FocusNode? _ownFocus;
  NumberSymbols? _symbols;
  late double? _value;
  late double? _committed;
  late double? _default;
  String _text = '';

  FocusNode get _focus => widget.focusNode ?? (_ownFocus ??= FocusNode());

  /// The number, or null when the field is empty.
  double? get value => _value;

  /// The draft: the text as typed.
  String get text => _text;

  /// How the draft reads.
  NumberInputStatus get status => _read.status;

  /// Why the draft is invalid, or null.
  NumberFieldError? get validationError => _read.error;

  double? get _min =>
      widget.min != null && widget.min!.isFinite ? widget.min : null;
  double? get _max =>
      widget.max != null && widget.max!.isFinite ? widget.max : null;
  double get _step => widget.step.isFinite && widget.step > 0 ? widget.step : 1;
  bool get _editable => widget.enabled && !widget.readOnly;

  NumberParseResult get _read =>
      readNumber(_text, _symbols!, _min, _max, _step);

  /// The number a step starts from: the draft's when it has one.
  double? get _spinBase => _read.value ?? _value;

  bool get _canIncrement {
    final base = _spinBase;
    return _editable && (_max == null || base == null || base < _max!);
  }

  bool get _canDecrement {
    final base = _spinBase;
    return _editable && (_min == null || base == null || base > _min!);
  }

  String _format(double? number) => formatNumber(number, _symbols!);

  @override
  void initState() {
    super.initState();
    _value = widget._controlled ? widget.value : widget.initialValue;
    _committed = _value;
    _default = _value;
    _controller.addListener(_edited);
    _focus.addListener(_focusChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncSymbols();
  }

  @override
  void didUpdateWidget(NumberField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      (oldWidget.focusNode ?? _ownFocus)?.removeListener(_focusChanged);
      _focus.addListener(_focusChanged);
    }
    _syncSymbols();
    // Reflection (ADR 0011): only a value the parent changed, compared with
    // the previous widget. A value that gives back the number the field
    // holds moves nothing; any other moves the number, the commit point and
    // the reset default, and the text unless the user is editing it.
    final value = widget.value;
    if (widget._controlled && value != oldWidget.value && value != _value) {
      _value = value;
      _committed = value;
      _default = value;
      if (!_focus.hasFocus) _show(_format(value));
    }
  }

  @override
  void dispose() {
    (widget.focusNode ?? _ownFocus)?.removeListener(_focusChanged);
    _controller.dispose();
    _ownFocus?.dispose();
    _decrementFocus.dispose();
    _incrementFocus.dispose();
    super.dispose();
  }

  void _syncSymbols() {
    final next =
        widget.symbols ??
        NumberSymbols.forLocale(
          widget.locale ??
              Localizations.maybeLocaleOf(context) ??
              const Locale('en'),
        );
    final previous = _symbols;
    if (next == previous) return;
    _symbols = next;
    if (previous == null) {
      _show(_format(_committed));
    } else if (!_focus.hasFocus &&
        _text == formatNumber(_committed, previous)) {
      // An idle display of the committed number follows the locale; a draft
      // or a kept invalid text is the user's and stays.
      _show(_format(_committed));
    }
  }

  /// Shows [text] without treating it as typing.
  void _show(String text) {
    _text = text;
    _controller.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  void _focusChanged() {
    if (mounted && !_focus.hasFocus) _commit();
  }

  /// Typing: the number follows the draft. State first, report after.
  void _edited() {
    final text = _controller.text;
    // A read-only or disabled box takes no edits, so only typing gets here.
    if (text == _text) return;
    final next = readNumber(text, _symbols!, _min, _max, _step).value;
    final changed = next != _value;
    setState(() {
      _text = text;
      _value = next;
    });
    if (changed) _report(next);
  }

  void _report(double? next) {
    _form.currentState?.didChange(next);
    widget.onChanged?.call(next);
  }

  /// Moves to [next]; at a commit boundary the commit point moves too.
  void _apply(double? next, {required bool commit}) {
    final changed = next != _value;
    final committed = commit && next != _committed;
    final text = _format(next);
    setState(() {
      if (text != _text) _show(text);
      _value = next;
      if (committed) _committed = next;
    });
    if (changed) _report(next);
    if (committed) widget.onChangeEnd?.call(next);
  }

  void _commit() {
    if (!_editable) return;
    final read = _read;
    // Text that does not parse stays as typed: committing it would lose
    // what the user wrote. Range and step errors commit, since the number
    // is real and the error is reported.
    if (read.error == NumberFieldError.parse) return;
    _apply(read.value, commit: true);
  }

  bool get _dirty => _text != _format(_committed);

  void _revert() {
    if (!_editable) return;
    final changed = _committed != _value;
    setState(() {
      _show(_format(_committed));
      _value = _committed;
    });
    if (changed) _report(_committed);
  }

  void _stepBy(int direction) {
    if (direction == 1 ? !_canIncrement : !_canDecrement) return;
    _apply(snapToStep(_spinBase, direction, _min, _max, _step), commit: true);
  }

  void _spin(int direction) {
    // The text keeps focus, as the web spin buttons keep it in the input.
    _focus.requestFocus();
    _stepBy(direction);
  }

  void _toBound(double bound) {
    if (_editable) _apply(bound, commit: true);
  }

  /// A form reset (ADR 0012): the current default comes back, silently.
  void _restore() {
    final number = widget._controlled ? _default : widget.initialValue;
    setState(() {
      _value = number;
      _committed = number;
      _show(_format(number));
    });
  }

  void _wheel(PointerSignalEvent event) {
    if (!widget.changeOnWheel || !_editable || !_focus.hasFocus) return;
    if (event is! PointerScrollEvent || event.scrollDelta.dy == 0) return;
    // Claimed, so an enclosing scrollable does not scroll as well.
    GestureBinding.instance.pointerSignalResolver.register(
      event,
      (_) => _stepBy(event.scrollDelta.dy < 0 ? 1 : -1),
    );
  }

  String? _validityMessage(InvisibleMessages messages) {
    return switch (validationError) {
      null => null,
      NumberFieldError.parse => messages.numberFieldParseError,
      NumberFieldError.rangeUnderflow => InvisibleMessages.fill(
        messages.numberFieldRangeUnderflow,
        {'min': _format(_min ?? 0)},
      ),
      NumberFieldError.rangeOverflow => InvisibleMessages.fill(
        messages.numberFieldRangeOverflow,
        {'max': _format(_max ?? 0)},
      ),
      NumberFieldError.stepMismatch => InvisibleMessages.fill(
        messages.numberFieldStepMismatch,
        {'step': _format(_step)},
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    final readOnly = !widget.enabled || widget.readOnly;
    final bounded = _min != null && _max != null;
    final validity = _validityMessage(messages);

    return FormBinding<double?>(
      key: _form,
      value: _value,
      restore: _restore,
      validator: (number) => validity ?? widget.validator?.call(number),
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      enabled: widget.enabled,
      builder: (field) {
        final error = widget.error ?? validity ?? field.errorText;
        final increment = _canIncrement ? () => _spin(1) : null;
        final decrement = _canDecrement ? () => _spin(-1) : null;

        final Widget input = Shortcuts(
          shortcuts: const {
            SingleActivator(LogicalKeyboardKey.arrowUp): _StepIntent(1),
            SingleActivator(LogicalKeyboardKey.arrowDown): _StepIntent(-1),
            SingleActivator(LogicalKeyboardKey.home): _BoundIntent(min: true),
            SingleActivator(LogicalKeyboardKey.end): _BoundIntent(min: false),
            SingleActivator(LogicalKeyboardKey.escape): _RevertIntent(),
          },
          child: Actions(
            actions: {
              // Read-only arrows, Home and End keep their caret meaning.
              _StepIntent: _WhenAction<_StepIntent>(
                enabled: () => !readOnly,
                run: (intent) => _stepBy(intent.direction),
              ),
              _BoundIntent: _WhenAction<_BoundIntent>(
                enabled: () => !readOnly && bounded,
                run: (intent) => _toBound(intent.min ? _min! : _max!),
              ),
              // Only when there is a draft to undo, so an enclosing dialog
              // still receives Escape.
              _RevertIntent: _WhenAction<_RevertIntent>(
                enabled: () => !readOnly && _dirty,
                run: (_) => _revert(),
              ),
            },
            child: Listener(
              onPointerSignal: _wheel,
              child: TextBox(
                controller: _controller,
                focusNode: _focus,
                enabled: widget.enabled,
                readOnly: widget.readOnly,
                invalid: error != null && error.isNotEmpty,
                autofocus: widget.autofocus,
                placeholder: widget.placeholder,
                keyboardType: const TextInputType.numberWithOptions(
                  signed: true,
                  decimal: true,
                ),
                textAlign: TextAlign.center,
                onSubmitted: (_) => _commit(),
              ),
            ),
          ),
        );

        return FieldFrame(
          label: widget.label,
          hideLabel: widget.hideLabel,
          required: widget.required,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: _focus.requestFocus,
          control: Row(
            children: [
              Button.icon(
                onPressed: decrement,
                focusNode: _decrementFocus,
                icon: const SignGlyph(plus: false),
                semanticLabel: InvisibleMessages.fill(
                  messages.numberFieldDecrement,
                  {'label': widget.label},
                ),
              ),
              const SizedBox(width: _spinGap),
              Expanded(
                child: FieldSemantics(
                  label: widget.label,
                  description: widget.description,
                  error: error,
                  placeholder: _text.isEmpty ? widget.placeholder : null,
                  required: widget.required,
                  enabled: widget.enabled,
                  // An empty field has no value to announce, so its step
                  // results go unannounced too, as Flutter requires.
                  child: Semantics(
                    increasedValue: increment == null || _text.isEmpty
                        ? null
                        : _format(snapToStep(_spinBase, 1, _min, _max, _step)),
                    decreasedValue: decrement == null || _text.isEmpty
                        ? null
                        : _format(snapToStep(_spinBase, -1, _min, _max, _step)),
                    onIncrease: increment == null ? null : () => _stepBy(1),
                    onDecrease: decrement == null ? null : () => _stepBy(-1),
                    child: input,
                  ),
                ),
              ),
              const SizedBox(width: _spinGap),
              Button.icon(
                onPressed: increment,
                focusNode: _incrementFocus,
                icon: const SignGlyph(plus: true),
                semanticLabel: InvisibleMessages.fill(
                  messages.numberFieldIncrement,
                  {'label': widget.label},
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StepIntent extends Intent {
  const _StepIntent(this.direction);

  final int direction;
}

class _BoundIntent extends Intent {
  const _BoundIntent({required this.min});

  final bool min;
}

class _RevertIntent extends Intent {
  const _RevertIntent();
}

/// An action that is only enabled while [enabled] says so. A disabled action
/// leaves the key to the widgets above, or to the text's own handling.
class _WhenAction<T extends Intent> extends Action<T> {
  _WhenAction({required this.enabled, required this.run});

  final bool Function() enabled;
  final void Function(T intent) run;

  @override
  bool isEnabled(T intent) => enabled();

  @override
  Object? invoke(T intent) {
    run(intent);
    return null;
  }
}
