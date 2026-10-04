import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/collection.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/listbox.dart';
import '../internal/text_box.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';

// Sizes the web Combobox sets in its own stylesheet.
const double _buttonSide = 24;
const double _buttonGap = 4;

/// Picks the items that match a query; [Combobox.filter].
typedef ChoiceFilter<T> =
    List<ChoiceItem<T>> Function(List<ChoiceItem<T>> items, String query);

/// A text field that filters a list of options as the user types, following
/// the WAI-ARIA editable combobox pattern with list autocomplete.
///
/// Typing opens the list, filters it ([filter], by default the options
/// whose label contains the text, ignoring case) and highlights the first
/// enabled match. Down and Up open the list on the chosen option, or the
/// first one, and move between enabled options, wrapping; Enter chooses the
/// highlighted option and fills the field with its label; Escape closes the
/// list and puts back the text of the last choice, and is left to an
/// enclosing dialog when it has nothing to undo; Tab closes the list and
/// moves on. Leaving the field puts the text back too, so the field never
/// shows a filter nobody chose. Focus stays in the field; the highlighted
/// option is announced. The chevron opens the full list; the clear button,
/// shown while there is something to clear, empties the field and the
/// choice. With no match the list says [emptyText].
///
/// For options that load as the user types, listen to [onInputChanged],
/// show [loading] while a request runs, pass the results as [items], and
/// pass a [filter] that keeps every item. With [searchable] false the field
/// is read-only and the list always shows every option: a select with a
/// styled popup.
///
/// Controlled, [Combobox] shows [value] (null when nothing is chosen) and
/// reports each change through [onChanged], null when cleared, after the
/// list has closed; [Combobox.uncontrolled] keeps its own value. A changed
/// [value] is shown without calling [onChanged]. Inside a [Form] it
/// validates, saves and resets like the other value controls.
class Combobox<T> extends StatefulWidget {
  /// A combobox that shows [value], controlled by the parent.
  const Combobox({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    this.onChanged,
    this.onInputChanged,
    this.filter,
    this.searchable = true,
    this.loading = false,
    this.placeholder,
    this.emptyText,
    this.clearLabel,
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

  /// A combobox that keeps its own value, starting from [initialValue].
  const Combobox.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValue,
    this.onChanged,
    this.onInputChanged,
    this.filter,
    this.searchable = true,
    this.loading = false,
    this.placeholder,
    this.emptyText,
    this.clearLabel,
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

  /// Every option, in order. [filter] picks the ones shown.
  final List<ChoiceItem<T>> items;

  /// The chosen value when the parent controls it; null when none is.
  final T? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final T? initialValue;

  /// Called with the chosen value after a user change, null when the field
  /// is cleared. Never called for a changed [value] or a form reset.
  final ValueChanged<T?>? onChanged;

  /// Called with the text after the user changes it, by typing, choosing,
  /// clearing or leaving.
  final ValueChanged<String>? onInputChanged;

  /// Picks the options shown for the text. Defaults to the options whose
  /// label contains it, ignoring case.
  final ChoiceFilter<T>? filter;

  /// Whether the user types to filter. False makes the field read-only and
  /// shows every option.
  final bool searchable;

  /// Whether options are loading. The list says so in place of [emptyText].
  final bool loading;

  /// Shown in the empty field. Defaults to
  /// [InvisibleMessages.comboboxPlaceholder].
  final String? placeholder;

  /// Shown when no option matches. Defaults to
  /// [InvisibleMessages.comboboxEmpty].
  final String? emptyText;

  /// The name of the clear button. Defaults to
  /// [InvisibleMessages.comboboxClear].
  final String? clearLabel;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the field takes focus and changes.
  final bool enabled;

  /// Whether a choice is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// The focus node of the text.
  final FocusNode? focusNode;

  /// Whether the field takes focus when it first appears.
  final bool autofocus;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<T?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<T?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<Combobox<T>> createState() => _ComboboxState<T>();
}

class _ComboboxState<T> extends State<Combobox<T>>
    with ValueControl<T?, Combobox<T>> {
  final ListboxController<T> _list = ListboxController<T>();
  late final TextEditingController _text = TextEditingController();
  FocusNode? _ownFocus;

  /// The text at the last choice, which leaving or Escape puts back.
  String _committed = '';

  /// The options the text lets through.
  List<ChoiceItem<T>> _visible = const [];

  /// The text last written by the control itself, not typed.
  String _written = '';

  FocusNode get _focus =>
      widget.focusNode ?? (_ownFocus ??= FocusNode(debugLabel: 'Combobox'));

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(Combobox<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void initState() {
    super.initState();
    _settle(_labelOf(value));
    _text.addListener(_edited);
    _focus.addListener(_focusChanged);
  }

  @override
  void didUpdateWidget(Combobox<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      (oldWidget.focusNode ?? _ownFocus)?.removeListener(_focusChanged);
      _focus.addListener(_focusChanged);
    }
    if (!identical(oldWidget.items, widget.items) ||
        oldWidget.searchable != widget.searchable ||
        oldWidget.filter != widget.filter) {
      _visible = _filter(_text.text);
      final active = _list.active;
      if (active != null && !_visible.any((item) => item.value == active)) {
        _list.activate(null);
      }
    }
    if (!widget.enabled && _list.isOpen) {
      SchedulerBinding.instance.addPostFrameCallback((_) => _list.close());
    }
  }

  // A controlled value or a form reset: the text follows the choice.
  @override
  void didReplaceValue() {
    _list.activate(null);
    _settle(_labelOf(value));
  }

  @override
  void dispose() {
    _focus.removeListener(_focusChanged);
    _text.dispose();
    _list.dispose();
    _ownFocus?.dispose();
    super.dispose();
  }

  String _labelOf(T? value) =>
      widget.items.where((item) => item.value == value).firstOrNull?.label ??
      '';

  List<ChoiceItem<T>> _filter(String query) {
    if (!widget.searchable) return widget.items;
    return (widget.filter ?? containsFilter<T>)(widget.items, query);
  }

  /// Shows [text] as the settled text, the one leaving puts back, without
  /// reporting it.
  void _settle(String text) {
    _committed = text;
    _write(text);
    _visible = _filter(text);
  }

  void _write(String text) {
    _written = text;
    if (_text.text == text) return;
    _text.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  /// Text the user changed: reported, and it filters the list.
  void _edited() {
    final text = _text.text;
    if (text == _written) return;
    _written = text;
    setState(() => _visible = _filter(text));
    widget.onInputChanged?.call(text);
    _highlight(firstEnabled(_visible), open: true);
  }

  /// Text the control changed, by choosing, clearing or reverting: reported
  /// when it moved.
  void _replaceText(String text) {
    final moved = text != _text.text;
    setState(() => _settle(text));
    if (moved) widget.onInputChanged?.call(text);
  }

  void _focusChanged() {
    // Leaving settles the field: the list closes and the text goes back.
    if (!_focus.hasFocus && widget.enabled) _commit();
  }

  void _highlight(T? next, {bool open = false}) {
    if (widget.enabled) _list.highlight(context, _visible, next, open: open);
  }

  /// Closes the list and puts back the text of the last choice.
  void _commit() {
    _list.close();
    if (_text.text != _committed) _replaceText(_committed);
  }

  /// Chooses [next]: the list closes and the text becomes its label, then
  /// the choice is reported.
  void _choose(T next) {
    final item = widget.items.where((i) => i.value == next).firstOrNull;
    if (item == null || item.disabled || !widget.enabled) return;
    _list.close();
    _replaceText(item.label);
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  void _clear({required bool keyboard}) {
    if (!widget.enabled) return;
    _list.activate(null);
    _replaceText('');
    if (commitValue(null)) widget.onChanged?.call(null);
    // A key press left focus on a button that has just gone.
    if (keyboard) _focus.requestFocus();
  }

  /// The chevron: the full list opens, or the open list closes.
  void _toggleAll() {
    if (!widget.enabled) return;
    if (_list.isOpen) return _list.close();
    setState(() => _visible = _filter(''));
    _list.open(value);
    _focus.requestFocus();
  }

  void _pointerOpen() {
    if (widget.enabled && !_list.isOpen) _list.open(value);
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (!widget.enabled ||
        (event is! KeyDownEvent && event is! KeyRepeatEvent)) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    final down = key == LogicalKeyboardKey.arrowDown;
    final up = key == LogicalKeyboardKey.arrowUp;
    final escape = key == LogicalKeyboardKey.escape;
    if (!_list.isOpen) {
      if (down || up) {
        _highlight(value ?? firstEnabled(_visible), open: true);
        return KeyEventResult.handled;
      }
      // Escape is the dialog's unless there is text to put back.
      if (escape && _text.text != _committed) {
        _commit();
        return KeyEventResult.handled;
      }
      return KeyEventResult.ignored;
    }
    final active = _list.active;
    if (down || up) {
      _highlight(stepEnabled(_visible, active, down ? 1 : -1));
    } else if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter) {
      if (active == null) return KeyEventResult.ignored;
      _choose(active);
    } else if (escape) {
      _commit();
    } else if (key == LogicalKeyboardKey.tab) {
      _list.close();
      return KeyEventResult.ignored;
    } else {
      return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final placeholder = widget.placeholder ?? messages.comboboxPlaceholder;
    final chosenIcon = widget.items
        .where((item) => item.value == value)
        .firstOrNull
        ?.icon;

    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        return ListenableBuilder(
          listenable: _list,
          builder: (context, _) {
            final open = _list.isOpen;
            final clearable =
                widget.enabled && (value != null || _text.text.isNotEmpty);
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
                placeholder: _text.text.isEmpty ? placeholder : null,
                required: widget.required,
                enabled: widget.enabled,
                expanded: open,
                child: ListboxPopup<T>(
                  controller: _list,
                  items: _visible,
                  selected: value,
                  onSelect: _choose,
                  onPressOutside: _commit,
                  semanticLabel: widget.label,
                  emptyText: widget.emptyText ?? messages.comboboxEmpty,
                  loading: widget.loading,
                  child: Focus(
                    canRequestFocus: false,
                    skipTraversal: true,
                    onKeyEvent: _onKey,
                    child: TextBox(
                      controller: _text,
                      focusNode: _focus,
                      enabled: widget.enabled,
                      readOnly: !widget.searchable,
                      invalid: error != null && error.isNotEmpty,
                      autofocus: widget.autofocus,
                      placeholder: placeholder,
                      onTextPointerDown: _pointerOpen,
                      leading: widget.searchable
                          ? const Glyph(GlyphShape.search)
                          : chosenIcon,
                      actions: [
                        _FieldButton(
                          label: widget.clearLabel ?? messages.comboboxClear,
                          visible: clearable,
                          focusable: true,
                          onPressed: _clear,
                          child: const Glyph(GlyphShape.close),
                        ),
                        const SizedBox(width: _buttonGap),
                        _FieldButton(
                          label: open
                              ? messages.comboboxHide
                              : messages.comboboxShow,
                          visible: true,
                          focusable: false,
                          enabled: widget.enabled,
                          onPressed: ({required bool keyboard}) => _toggleAll(),
                          child: ListboxChevron(open: open),
                        ),
                      ],
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

/// A small button inside the field: the clear button, a tab stop while it
/// has something to clear, and the chevron, which only a pointer uses. A
/// hidden button keeps its place, so the text never jumps.
class _FieldButton extends StatefulWidget {
  const _FieldButton({
    required this.label,
    required this.visible,
    required this.focusable,
    required this.onPressed,
    required this.child,
    this.enabled = true,
  });

  final String label;
  final bool visible;
  final bool focusable;
  final bool enabled;
  final void Function({required bool keyboard}) onPressed;
  final Widget child;

  @override
  State<_FieldButton> createState() => _FieldButtonState();
}

class _FieldButtonState extends State<_FieldButton> {
  bool _focusVisible = false;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.numpadEnter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(
      onInvoke: (_) => widget.onPressed(keyboard: true),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final active = widget.visible && widget.enabled;
    final side = MediaQuery.textScalerOf(context).scale(_buttonSide);
    final target = theme.minTargetSize;
    final body = ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: target.width,
        minHeight: target.height,
      ),
      child: Center(
        widthFactor: 1,
        heightFactor: 1,
        child: FocusRingPainter(
          visible: _focusVisible && active,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: SizedBox.square(
            dimension: side,
            child: Center(child: widget.child),
          ),
        ),
      ),
    );
    if (!active) {
      return ExcludeSemantics(
        child: Visibility(
          visible: widget.visible,
          maintainSize: true,
          maintainAnimation: true,
          maintainState: true,
          child: body,
        ),
      );
    }
    return Semantics(
      container: true,
      button: true,
      label: widget.label,
      onTap: () => widget.onPressed(keyboard: false),
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: widget.focusable,
          shortcuts: _shortcuts,
          actions: _actions,
          mouseCursor: SystemMouseCursors.click,
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => widget.onPressed(keyboard: false),
            child: body,
          ),
        ),
      ),
    );
  }
}
