import 'dart:async';

import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/collection.dart';
import '../internal/listbox.dart';
import '../internal/roving.dart';
import '../internal/text_box.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

const double _gap = 8;

/// A field that picks one option from a list, following the WAI-ARIA
/// select-only combobox pattern: a trigger showing the chosen option, or
/// [placeholder] while there is none, and a popup list of options.
///
/// Keys on the trigger: Down, Up, Enter and Space open the list on the
/// chosen option, or the first enabled one; typed characters open it on the
/// first option whose label starts with them. In the open list, Up and Down
/// move between enabled options, wrapping, Home and End jump to the ends,
/// typed characters find an option, Enter and Space choose the highlighted
/// option, Escape closes the list and Tab closes it and moves on. Focus
/// stays on the trigger; the highlighted option is announced. A tap on the
/// trigger toggles the list, a tap on an option chooses it, and a press
/// outside closes it.
///
/// Controlled, [Select] shows [value] (null shows the placeholder) and
/// reports each new choice through [onChanged], after the list has closed;
/// [Select.uncontrolled] keeps its own value. A changed [value] is shown
/// without calling [onChanged]. Inside a [Form] it validates, saves and
/// resets like the other value controls.
class Select<T> extends StatefulWidget {
  /// A select that shows [value], controlled by the parent.
  const Select({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    this.onChanged,
    this.placeholder,
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

  /// A select that keeps its own value, starting from [initialValue].
  const Select.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValue,
    this.onChanged,
    this.placeholder,
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

  /// The options, in order.
  final List<ChoiceItem<T>> items;

  /// The chosen value when the parent controls it; null shows the
  /// placeholder.
  final T? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final T? initialValue;

  /// Called with the chosen value after a user choice that changed it. Never
  /// called for a changed [value] or a form reset.
  final ValueChanged<T>? onChanged;

  /// Shown while nothing is chosen. Defaults to
  /// [InvisibleMessages.selectPlaceholder].
  final String? placeholder;

  /// Hides the label visually while it still names the select.
  final bool hideLabel;

  /// A hint shown under the select and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the select invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the select takes focus and opens. A disabled select leaves the
  /// focus order.
  final bool enabled;

  /// Whether a choice is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// The focus node of the trigger.
  final FocusNode? focusNode;

  /// Whether the trigger takes focus when it first appears.
  final bool autofocus;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<T?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<T?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<Select<T>> createState() => _SelectState<T>();
}

class _SelectState<T> extends State<Select<T>>
    with ValueControl<T?, Select<T>> {
  final ListboxController<T> _list = ListboxController<T>();
  FocusNode? _ownFocus;
  bool _focusVisible = false;
  String _query = '';
  Timer? _queryTimer;

  FocusNode get _focus =>
      widget.focusNode ?? (_ownFocus ??= FocusNode(debugLabel: 'Select'));

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(Select<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void didUpdateWidget(Select<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.enabled && _list.isOpen) {
      SchedulerBinding.instance.addPostFrameCallback((_) => _list.close());
    }
  }

  @override
  void dispose() {
    _queryTimer?.cancel();
    _list.dispose();
    _ownFocus?.dispose();
    super.dispose();
  }

  ChoiceItem<T>? _itemOf(T? value) =>
      widget.items.where((item) => item.value == value).firstOrNull;

  /// The chosen option when it can be highlighted, else null.
  T? get _enabledValue {
    final item = _itemOf(value);
    return item == null || item.disabled ? null : item.value;
  }

  void _open({required bool keyboard, T? highlight}) {
    if (!widget.enabled) return;
    // A pointer opens on the chosen option only; a key always highlights one.
    _highlight(
      keyboard
          ? highlight ?? _enabledValue ?? firstEnabled(widget.items)
          : _enabledValue,
      open: true,
    );
  }

  void _highlight(T? next, {bool open = false}) =>
      _list.highlight(context, widget.items, next, open: open);

  void _toggle() {
    _list.isOpen ? _list.close() : _open(keyboard: false);
  }

  /// Chooses [next]: the list closes first, then the choice is reported.
  void _choose(T next) {
    final item = _itemOf(next);
    if (item == null || item.disabled || !widget.enabled) return;
    _list.close();
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  void _typeahead(String character) {
    _query += character;
    _queryTimer?.cancel();
    _queryTimer = Timer(typeaheadReset, () => _query = '');
    final from = _list.active ?? value;
    final match = matchOption(widget.items, _query, from);
    if (!_list.isOpen) {
      _open(keyboard: true, highlight: match);
    } else if (match != null) {
      _highlight(match);
    }
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (!widget.enabled ||
        (event is! KeyDownEvent && event is! KeyRepeatEvent)) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    final items = widget.items;
    final character = typedCharacter(event);
    final activation =
        key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter ||
        key == LogicalKeyboardKey.space;
    if (!_list.isOpen) {
      if (key == LogicalKeyboardKey.arrowDown ||
          key == LogicalKeyboardKey.arrowUp ||
          activation) {
        _open(keyboard: true);
        return KeyEventResult.handled;
      }
      if (character != null) {
        _typeahead(character);
        return KeyEventResult.handled;
      }
      return KeyEventResult.ignored;
    }
    final active = _list.active;
    if (key == LogicalKeyboardKey.arrowDown) {
      _highlight(stepEnabled(items, active, 1));
    } else if (key == LogicalKeyboardKey.arrowUp) {
      _highlight(stepEnabled(items, active, -1));
    } else if (key == LogicalKeyboardKey.home) {
      _highlight(firstEnabled(items));
    } else if (key == LogicalKeyboardKey.end) {
      _highlight(lastEnabled(items));
    } else if (activation) {
      if (active != null) _choose(active);
    } else if (key == LogicalKeyboardKey.escape) {
      _list.close();
    } else if (key == LogicalKeyboardKey.tab) {
      // Tab closes the list and focus moves on as usual.
      _list.close();
      return KeyEventResult.ignored;
    } else if (character != null) {
      _typeahead(character);
    } else {
      return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final placeholder = widget.placeholder ?? theme.messages.selectPlaceholder;
    final chosen = _itemOf(value);

    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        final invalid = error != null && error.isNotEmpty;
        return ListenableBuilder(
          listenable: _list,
          builder: (context, _) {
            final open = _list.isOpen;
            final trigger = FieldBox(
              enabled: widget.enabled,
              invalid: invalid,
              focused: _focusVisible,
              child: Row(
                children: [
                  if (chosen?.icon case final icon?) ...[
                    ExcludeSemantics(child: icon),
                    const SizedBox(width: _gap),
                  ],
                  Expanded(
                    child: Text(
                      chosen?.label ?? placeholder,
                      style: theme.textStyle.copyWith(
                        color: !widget.enabled
                            ? colors.textDisabled
                            : chosen == null
                            ? colors.textSecondary
                            : colors.text,
                      ),
                    ),
                  ),
                  const SizedBox(width: _gap),
                  ListboxChevron(open: open),
                ],
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
              control: FieldSemantics(
                label: widget.label,
                description: widget.description,
                error: error,
                placeholder: chosen == null ? placeholder : null,
                required: widget.required,
                enabled: widget.enabled,
                expanded: open,
                child: Semantics(
                  button: true,
                  value: chosen?.label,
                  onTap: widget.enabled ? _toggle : null,
                  child: ListboxPopup<T>(
                    controller: _list,
                    items: widget.items,
                    selected: value,
                    onSelect: _choose,
                    onPressOutside: _list.close,
                    semanticLabel: widget.label,
                    child: ExcludeSemantics(
                      child: Focus(
                        canRequestFocus: false,
                        skipTraversal: true,
                        onKeyEvent: _onKey,
                        child: FocusableActionDetector(
                          enabled: widget.enabled,
                          focusNode: _focus,
                          autofocus: widget.autofocus,
                          mouseCursor: widget.enabled
                              ? SystemMouseCursors.click
                              : SystemMouseCursors.forbidden,
                          onShowFocusHighlight: (visible) =>
                              setState(() => _focusVisible = visible),
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            excludeFromSemantics: true,
                            onTap: widget.enabled ? _toggle : null,
                            child: trigger,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
