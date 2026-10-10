import 'dart:async';

import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../internal/focus_ring.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

// Sizes the web PinInput sets in its own stylesheet.
const double _cell = 44;
const double _gap = 8;
const double _fontSize = 20;
const double _disabledOpacity = 0.5;

/// The characters a [PinInput] takes.
enum PinInputType {
  /// Digits 0 to 9.
  numeric,

  /// Digits and the letters a to z, in either case.
  alphanumeric,
}

// The rules of `core/src/pin-input/state.ts`, in Dart. They take data and
// return data, so the shared vectors in core/src/pin-input/__vectors__ hold
// both implementations to the same answers.

final RegExp _digit = RegExp('[0-9]');
final RegExp _alphanumeric = RegExp('[0-9a-z]', caseSensitive: false);

/// [value] spread over [length] cells, one character each.
List<String> splitValue(String value, int length) => [
  for (var i = 0; i < length; i++) i < value.length ? value[i] : '',
];

/// [char] when [type] allows it, or an empty string.
String sanitizeChar(String char, PinInputType type) {
  if (char.isEmpty) return '';
  final allowed = type == PinInputType.numeric ? _digit : _alphanumeric;
  return allowed.hasMatch(char) ? char : '';
}

/// [text] spread over the cells from [index]: the characters [type] allows,
/// one per cell, up to the last cell, with the cell to focus next. Null when
/// [text] holds no allowed character.
({List<String> values, int focus})? pasteInto(
  List<String> values,
  int index,
  String text,
  PinInputType type,
) {
  final chars = [
    for (final unit in text.split(''))
      if (sanitizeChar(unit, type) case final c when c.isNotEmpty) c,
  ];
  if (chars.isEmpty) return null;
  final next = [...values];
  var i = index;
  for (final c in chars) {
    if (i >= values.length) break;
    next[i] = c;
    i++;
  }
  return (values: next, focus: i < values.length ? i : values.length - 1);
}

/// A row of single-character cells for a one-time code or a PIN, such as a
/// six-digit verification code. The cells form one named group; each cell
/// is named "Character 2 of 6" from [InvisibleMessages.pinInputCell].
///
/// Typing a character the [type] allows fills the cell and moves to the
/// next; other characters are refused. Backspace clears the cell, or the
/// previous one when the cell is empty, and moves there. The arrows move
/// between the cells, following the reading direction, and Home and End go
/// to the ends. Pasted text, or a code the platform fills in from a message
/// (the first cell carries the one-time code autofill hint), is spread over
/// the cells from the focused one. With [obscureText] the characters are
/// hidden, as in a password field.
///
/// [onChanged] reports the code, the cells' characters joined, after each
/// change; [onCompleted] reports it each time a change leaves every cell
/// filled. Controlled, [PinInput] shows [value] and a changed [value] is
/// shown without a report; [PinInput.uncontrolled] keeps its own code from
/// [initialValue]. Inside a [Form] it saves with [onSaved], and a form reset
/// restores the current default silently. The widget never writes the code
/// to the log or to its diagnostics.
class PinInput extends StatefulWidget {
  /// A PIN input that shows [value], controlled by the parent.
  const PinInput({
    super.key,
    required this.label,
    required String this.value,
    this.onChanged,
    this.onCompleted,
    this.length = 6,
    this.type = PinInputType.numeric,
    this.obscureText = false,
    this.enabled = true,
    this.invalid = false,
    this.success = false,
    this.autofocus = false,
    this.onSaved,
  }) : initialValue = '',
       _controlled = true;

  /// A PIN input that keeps its own code, starting from [initialValue].
  const PinInput.uncontrolled({
    super.key,
    required this.label,
    this.initialValue = '',
    this.onChanged,
    this.onCompleted,
    this.length = 6,
    this.type = PinInputType.numeric,
    this.obscureText = false,
    this.enabled = true,
    this.invalid = false,
    this.success = false,
    this.autofocus = false,
    this.onSaved,
  }) : value = null,
       _controlled = false;

  /// The accessible name of the group of cells.
  final String label;

  /// The code when the parent controls it.
  final String? value;

  /// The starting code of the uncontrolled form, and its reset default.
  final String initialValue;

  /// Called with the code after each user change. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<String>? onChanged;

  /// Called with the code each time a user change fills every cell.
  final ValueChanged<String>? onCompleted;

  /// The number of cells.
  final int length;

  /// The characters the cells take.
  final PinInputType type;

  /// Hides the characters.
  final bool obscureText;

  /// Whether the cells take focus and input.
  final bool enabled;

  /// Marks the code invalid: danger borders, and each cell reports itself
  /// invalid.
  final bool invalid;

  /// Marks the code accepted: success borders. [invalid] wins over it.
  final bool success;

  /// Whether the first cell takes focus when it first appears.
  final bool autofocus;

  /// Called with the code when the enclosing [Form] saves.
  final FormFieldSetter<String>? onSaved;

  final bool _controlled;

  @override
  State<PinInput> createState() => _PinInputState();
}

class _PinInputState extends State<PinInput>
    with ValueControl<String, PinInput> {
  late List<String> _cells = splitValue(value, widget.length);
  final List<TextEditingController> _controllers = [];
  final List<FocusNode> _nodes = [];

  @override
  bool get isControlled => widget._controlled;

  @override
  String controlledValueOf(PinInput widget) =>
      splitValue(widget.value!, widget.length).join();

  @override
  String get initialValueOfWidget =>
      splitValue(widget.initialValue, widget.length).join();

  @override
  void initState() {
    super.initState();
    _fit();
  }

  @override
  void didUpdateWidget(PinInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.length != widget.length) {
      _cells = splitValue(value, widget.length);
      _fit();
    }
  }

  @override
  void didReplaceValue() {
    _cells = splitValue(value, widget.length);
    _syncControllers();
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _nodes) {
      node.dispose();
    }
    super.dispose();
  }

  /// One controller and focus node per cell.
  void _fit() {
    while (_controllers.length > widget.length) {
      _controllers.removeLast().dispose();
      _nodes.removeLast().dispose();
    }
    while (_controllers.length < widget.length) {
      final index = _controllers.length;
      _controllers.add(TextEditingController());
      final node = FocusNode(
        debugLabel: 'PinInput cell $index',
        onKeyEvent: (_, event) => _key(index, event),
      );
      node.addListener(() {
        // A cell selects its character when focused, so typing replaces it.
        if (!mounted) return;
        if (node.hasFocus) _select(index);
        setState(() {});
      });
      _nodes.add(node);
    }
    _syncControllers();
  }

  void _syncControllers() {
    for (var i = 0; i < _controllers.length; i++) {
      final text = _cells[i];
      if (_controllers[i].text != text) {
        _controllers[i].value = TextEditingValue(
          text: text,
          selection: TextSelection(baseOffset: 0, extentOffset: text.length),
        );
      }
    }
  }

  void _select(int index) {
    final controller = _controllers[index];
    controller.selection = TextSelection(
      baseOffset: 0,
      extentOffset: controller.text.length,
    );
  }

  void _focus(int index) {
    if (index >= 0 && index < _nodes.length) _nodes[index].requestFocus();
  }

  /// A user change of the cells: the state moves first, then the reports.
  void _commit(List<String> next) {
    _cells = next;
    _syncControllers();
    final code = next.join();
    if (!commitValue(code)) {
      setState(() {});
      return;
    }
    widget.onChanged?.call(code);
    // A parent that wrote its own value from that callback owns the state:
    // only a completion still standing is reported.
    if (value == code && next.every((c) => c.isNotEmpty)) {
      widget.onCompleted?.call(code);
    }
  }

  /// Text the platform put in cell [index]: a typed character, a deletion,
  /// or a whole code from a paste or autofill.
  void _edited(int index, String text) {
    final old = _cells[index];
    if (text.isEmpty) {
      _commit([..._cells]..[index] = '');
      return;
    }
    // A character typed beside the one already there replaces it.
    final typed = old.isNotEmpty && text.length == 2 && text.contains(old)
        ? text.replaceFirst(old, '')
        : text;
    final valid = sanitizeChar(typed, widget.type);
    if (typed.length == 1) {
      if (valid.isEmpty) {
        _syncControllers();
        _select(index);
        setState(() {});
        return;
      }
      _commit([..._cells]..[index] = valid);
      _focus(index + 1);
      return;
    }
    final pasted = pasteInto(_cells, index, text, widget.type);
    if (pasted == null) {
      _syncControllers();
      setState(() {});
      return;
    }
    _commit(pasted.values);
    _focus(pasted.focus);
  }

  Future<void> _paste(int index) async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (!mounted || !widget.enabled) return;
    final pasted = pasteInto(_cells, index, data?.text ?? '', widget.type);
    if (pasted == null) return;
    _commit(pasted.values);
    _focus(pasted.focus);
  }

  KeyEventResult _key(int index, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.backspace) {
      if (_cells[index].isNotEmpty) {
        _commit([..._cells]..[index] = '');
      } else if (index > 0) {
        _commit([..._cells]..[index - 1] = '');
        _focus(index - 1);
      }
      return KeyEventResult.handled;
    }
    final int? target;
    if (key == LogicalKeyboardKey.arrowLeft) {
      target = rtl ? index + 1 : index - 1;
    } else if (key == LogicalKeyboardKey.arrowRight) {
      target = rtl ? index - 1 : index + 1;
    } else if (key == LogicalKeyboardKey.home) {
      target = 0;
    } else if (key == LogicalKeyboardKey.end) {
      target = widget.length - 1;
    } else {
      return KeyEventResult.ignored;
    }
    _focus(target);
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final enabled = widget.enabled;
    final side = MediaQuery.textScalerOf(context).scale(_cell);
    // Disabled cells leave the focus order, as disabled inputs do.
    for (final node in _nodes) {
      node.canRequestFocus = enabled;
    }

    final cells = [
      for (var i = 0; i < widget.length; i++)
        _Cell(
          key: ValueKey(i),
          label: InvisibleMessages.fill(messages.pinInputCell, {
            'index': '${i + 1}',
            'length': '${widget.length}',
          }),
          side: side,
          controller: _controllers[i],
          focusNode: _nodes[i],
          enabled: enabled,
          invalid: widget.invalid,
          success: widget.success,
          obscureText: widget.obscureText,
          numeric: widget.type == PinInputType.numeric,
          autofocus: widget.autofocus && i == 0,
          // The platform fills a one-time code into the first cell.
          autofillHints: i == 0 ? const [AutofillHints.oneTimeCode] : null,
          onEdited: (text) => _edited(i, text),
          onPaste: () => unawaited(_paste(i)),
        ),
    ];

    return buildFormField(
      enabled: enabled,
      onSaved: widget.onSaved,
      builder: (_) => Semantics(
        container: true,
        explicitChildNodes: true,
        label: widget.label,
        child: Opacity(
          opacity: enabled ? 1 : _disabledOpacity,
          child: Wrap(spacing: _gap, runSpacing: _gap, children: cells),
        ),
      ),
    );
  }
}

class _Cell extends StatelessWidget {
  const _Cell({
    super.key,
    required this.label,
    required this.side,
    required this.controller,
    required this.focusNode,
    required this.enabled,
    required this.invalid,
    required this.success,
    required this.obscureText,
    required this.numeric,
    required this.autofocus,
    required this.autofillHints,
    required this.onEdited,
    required this.onPaste,
  });

  final String label;
  final double side;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final bool invalid;
  final bool success;
  final bool obscureText;
  final bool numeric;
  final bool autofocus;
  final List<String>? autofillHints;
  final ValueChanged<String> onEdited;
  final VoidCallback onPaste;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final focused = focusNode.hasFocus;
    final state = invalid
        ? colors.danger
        : success
        ? colors.success
        : null;
    final ring = state == null
        ? theme.focusRing
        : theme.focusRing.copyWith(color: state, haloColor: state);
    final style = theme.textStyle.copyWith(
      fontSize: _fontSize,
      color: colors.text,
    );
    return Semantics(
      label: label,
      validationResult: invalid
          ? SemanticsValidationResult.invalid
          : SemanticsValidationResult.none,
      child: GestureDetector(
        onTap: enabled ? focusNode.requestFocus : null,
        child: MouseRegion(
          cursor: enabled
              ? SystemMouseCursors.text
              : SystemMouseCursors.forbidden,
          child: FocusRingPainter(
            visible: focused && enabled,
            ring: ring,
            radius: theme.controlRadius,
            child: Container(
              width: side,
              height: side,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: colors.background,
                border: Border.all(
                  color:
                      state ??
                      (focused ? colors.focusRing : colors.controlBorder),
                ),
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: Actions(
                actions: {
                  // The cell spreads a paste over the cells instead of
                  // inserting it.
                  PasteTextIntent: CallbackAction<PasteTextIntent>(
                    onInvoke: (_) => onPaste(),
                  ),
                },
                child: EditableText(
                  controller: controller,
                  focusNode: focusNode,
                  autofocus: autofocus,
                  readOnly: !enabled,
                  style: style,
                  textAlign: TextAlign.center,
                  cursorColor: colors.text,
                  backgroundCursorColor: colors.textDisabled,
                  selectionColor: colors.focusHalo,
                  obscureText: obscureText,
                  keyboardType: numeric
                      ? TextInputType.number
                      : TextInputType.text,
                  autofillHints: autofillHints,
                  autocorrect: false,
                  enableSuggestions: false,
                  enableInteractiveSelection: false,
                  maxLines: 1,
                  onChanged: onEdited,
                  onEditingComplete: () {},
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
