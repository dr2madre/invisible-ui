// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../combobox/combobox.dart' show ChoiceFilter;
import '../field/field.dart';
import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../internal/collection.dart';
import '../internal/glyphs.dart';
import '../internal/listbox.dart';
import '../internal/text_box.dart';
import '../internal/value_control.dart';
import '../tag/tag.dart';
import '../theme/theme.dart';
import 'multi_select_logic.dart';

// Sizes the web Multi Select sets in its own stylesheet.
const double _tagGap = 4;

/// A text field that filters a list of options and keeps several of them,
/// shown as removable tags: the WAI-ARIA editable combobox pattern over a
/// list that holds several choices.
///
/// Typing opens the list, filters it ([filter], by default the options
/// whose label contains the text, ignoring case) and highlights the first
/// enabled match. Down and Up open the list and move between enabled
/// options, wrapping; Enter adds the highlighted option, empties the text
/// and keeps the list open for another choice. A chosen option stays listed
/// with a tick, and choosing it again changes nothing. Escape closes the
/// list and keeps the text; with the list closed it is left to an enclosing
/// dialog. Tab closes the list and moves on. Focus stays in the field; the
/// highlighted option is announced.
///
/// Each chosen value shows as a tag in a list named
/// [InvisibleMessages.multiSelectSelected], with a remove button named
/// "Remove" and the value's label, on its own tab stop. Removing a value
/// through its button moves focus to the next remove button, else the
/// previous one, else the field. Every addition and removal is announced
/// politely ("Ada added", "Ada removed"). With [removeOnBackspace],
/// Backspace in the empty field removes the last value that can be
/// removed. A value whose option is disabled can be neither added nor
/// removed. A value with no option in [items] stays chosen and shows its
/// raw value.
///
/// [max] blocks further additions and never removes chosen values. A
/// disabled field takes no focus; a read-only one takes focus for review
/// and neither opens, adds nor removes.
///
/// Controlled, [MultiSelect] shows [values] in the order they were chosen
/// and reports each change through [onChanged]; [MultiSelect.uncontrolled]
/// keeps its own list from [initialValues]. A changed [values] is shown
/// without calling [onChanged], and one that gives back the same values in
/// another order changes nothing. Inside a [Form] it validates, saves and
/// resets like the other value controls; a reset also empties the text.
///
/// ```dart
/// iu.MultiSelect<String>(
///   label: 'Reviewers',
///   items: const [
///     iu.ChoiceItem(value: 'ada', label: 'Ada'),
///     iu.ChoiceItem(value: 'grace', label: 'Grace'),
///   ],
///   values: reviewers,
///   onChanged: (next) => setState(() => reviewers = next),
/// )
/// ```
class MultiSelect<T> extends StatefulWidget {
  /// A multi select that shows [values], controlled by the parent.
  const MultiSelect({
    super.key,
    required this.label,
    required this.items,
    required List<T> this.values,
    this.onChanged,
    this.onInputChanged,
    this.filter,
    this.placeholder,
    this.emptyText,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.max,
    this.removeOnBackspace = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValues = const [],
       assert(max == null || max >= 0);

  /// A multi select that keeps its own values, starting from
  /// [initialValues].
  const MultiSelect.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValues = const [],
    this.onChanged,
    this.onInputChanged,
    this.filter,
    this.placeholder,
    this.emptyText,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.readOnly = false,
    this.required = false,
    this.max,
    this.removeOnBackspace = false,
    this.focusNode,
    this.autofocus = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : values = null,
       assert(max == null || max >= 0);

  /// The visible label, and the accessible name of the field.
  final String label;

  /// Every option, in order. [filter] picks the ones shown.
  final List<ChoiceItem<T>> items;

  /// The chosen values, in the order they were chosen, when the parent
  /// controls them. Each value appears once.
  final List<T>? values;

  /// The starting values of the uncontrolled form, and its reset default.
  final List<T> initialValues;

  /// Called with the new values after the user adds or removes one. Never
  /// called for a changed [values] or a form reset.
  final ValueChanged<List<T>>? onChanged;

  /// Called with the text after the user changes it, by typing or by adding
  /// a value, which empties it.
  final ValueChanged<String>? onInputChanged;

  /// Picks the options shown for the text. Defaults to the options whose
  /// label contains it, ignoring case.
  final ChoiceFilter<T>? filter;

  /// Shown in the empty field. Defaults to
  /// [InvisibleMessages.multiSelectPlaceholder].
  final String? placeholder;

  /// Shown when no option matches. Defaults to
  /// [InvisibleMessages.multiSelectEmpty].
  final String? emptyText;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the field takes focus and changes.
  final bool enabled;

  /// Whether the field is for review only: it takes focus, and neither
  /// opens, adds nor removes.
  final bool readOnly;

  /// Whether a choice is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// The most values the user can add. It never removes chosen ones.
  final int? max;

  /// Whether Backspace in the empty field removes the last removable value.
  final bool removeOnBackspace;

  /// The focus node of the text.
  final FocusNode? focusNode;

  /// Whether the field takes focus when it first appears.
  final bool autofocus;

  /// Checks the values when the enclosing [Form] validates.
  final FormFieldValidator<List<T>>? validator;

  /// Called with the values when the enclosing [Form] saves.
  final FormFieldSetter<List<T>>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  @override
  State<MultiSelect<T>> createState() => _MultiSelectState<T>();
}

class _MultiSelectState<T> extends State<MultiSelect<T>>
    with ValueControl<List<T>, MultiSelect<T>> {
  final ListboxController<T> _list = ListboxController<T>();
  late final TextEditingController _text = TextEditingController();
  FocusNode? _ownFocus;
  final Map<T, FocusNode> _removeFocus = {};

  /// The options the text lets through.
  List<ChoiceItem<T>> _visible = const [];

  /// The text last written by the control itself, not typed.
  String _written = '';

  FocusNode get _focus =>
      widget.focusNode ?? (_ownFocus ??= FocusNode(debugLabel: 'MultiSelect'));

  bool get _inert => !widget.enabled || widget.readOnly;

  @override
  bool get isControlled => widget.values != null;

  @override
  List<T> controlledValueOf(MultiSelect<T> widget) => widget.values ?? const [];

  @override
  List<T> get initialValueOfWidget => widget.initialValues;

  // The same choice in another order is the same selection: a parent that
  // keeps its own order gives the values back without moving anything.
  @override
  bool sameValue(List<T> a, List<T> b) =>
      a.length == b.length && a.every(b.contains);

  @override
  void initState() {
    super.initState();
    _visible = _filter('');
    _text.addListener(_edited);
  }

  @override
  void didUpdateWidget(MultiSelect<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.items, widget.items) ||
        oldWidget.filter != widget.filter) {
      _visible = _filter(_text.text);
      final active = _list.active;
      if (active != null && !_visible.any((item) => item.value == active)) {
        _list.activate(null);
      }
    }
    if (_inert && _list.isOpen) {
      SchedulerBinding.instance.addPostFrameCallback((_) => _list.close());
    }
  }

  // A form reset also empties the text, silently.
  @override
  void restoreValue() {
    super.restoreValue();
    setState(() {
      _write('');
      _visible = _filter('');
    });
  }

  @override
  void dispose() {
    _text.dispose();
    _list.dispose();
    _ownFocus?.dispose();
    for (final node in _removeFocus.values) {
      node.dispose();
    }
    super.dispose();
  }

  List<ChoiceItem<T>> _filter(String query) =>
      (widget.filter ?? containsFilter<T>)(widget.items, query);

  void _write(String text) {
    _written = text;
    if (_text.text == text) return;
    _text.value = TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }

  /// Text the user typed: it filters, opens the list on the first match and
  /// is reported.
  void _edited() {
    final text = _text.text;
    if (text == _written) return;
    _written = text;
    setState(() => _visible = _filter(text));
    widget.onInputChanged?.call(text);
    if (!_inert) _highlight(firstEnabled(_visible), open: true);
  }

  void _highlight(T? next, {bool open = false}) =>
      _list.highlight(context, _visible, next, open: open);

  void _pointerOpen() {
    if (!_inert && !_list.isOpen) _list.open(null);
  }

  bool _removable(T value) =>
      !_inert && !resolveItem(widget.items, value).disabled;

  String _labelOf(T value) => resolveItem(widget.items, value).label;

  InvisibleMessages get _messages => InvisibleTheme.of(context).messages;

  void _announce(String message, T value) => announce(
    context,
    InvisibleMessages.fill(message, {'name': _labelOf(value)}),
  );

  /// Adds [next] and empties the text; the list stays open. Both are
  /// committed before either is reported (ADR 0011).
  void _add(T next) {
    final item = resolveItem(widget.items, next);
    if (_inert || item.disabled || value.contains(next)) return;
    final added = addValue(value, next, widget.max);
    if (identical(added, value)) return;
    final clears = _text.text.isNotEmpty;
    commitValue(added);
    if (clears) {
      setState(() {
        _write('');
        _visible = _filter('');
      });
    }
    widget.onChanged?.call(added);
    if (clears) widget.onInputChanged?.call('');
    _announce(_messages.multiSelectAdded, next);
  }

  /// Removes [target]. [fromButton] says its own remove button asked, which
  /// is about to go, so focus moves on to a neighbour.
  void _remove(T target, {bool fromButton = false}) {
    if (!_removable(target)) return;
    final before = value;
    final index = before.indexOf(target);
    final next = removeValue(before, target);
    if (identical(next, before)) return;
    commitValue(next);
    widget.onChanged?.call(next);
    _announce(_messages.multiSelectRemoved, target);
    if (fromButton) _focusAfterRemoval(next, index);
  }

  /// The next remove button from [index], else the previous one, else the
  /// field.
  void _focusAfterRemoval(List<T> values, int index) {
    T? neighbour;
    for (var i = index; i < values.length && neighbour == null; i++) {
      if (_removable(values[i])) neighbour = values[i];
    }
    for (var i = index - 1; i >= 0 && neighbour == null; i--) {
      if (_removable(values[i])) neighbour = values[i];
    }
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final node = neighbour == null ? null : _removeFocus[neighbour];
      (node != null && node.context != null ? node : _focus).requestFocus();
    });
  }

  FocusNode _removeNodeFor(T value) => _removeFocus.putIfAbsent(
    value,
    () => FocusNode(debugLabel: 'Remove ${_labelOf(value)}'),
  );

  /// Drops the focus nodes of values no longer chosen, after the frame that
  /// removes their buttons.
  void _pruneRemoveNodes() {
    final gone = [
      for (final entry in _removeFocus.entries)
        if (!value.contains(entry.key)) entry,
    ];
    for (final entry in gone) {
      _removeFocus.remove(entry.key);
      SchedulerBinding.instance.addPostFrameCallback(
        (_) => entry.value.dispose(),
      );
    }
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (!widget.enabled ||
        (event is! KeyDownEvent && event is! KeyRepeatEvent)) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.backspace) {
      // Only the opt-in removes, and only from an empty field; otherwise
      // Backspace edits the text.
      if (!widget.removeOnBackspace || _text.text.isNotEmpty || _inert) {
        return KeyEventResult.ignored;
      }
      final last = lastRemovableValue(value, widget.items);
      if (last != null) _remove(last);
      return KeyEventResult.handled;
    }
    final down = key == LogicalKeyboardKey.arrowDown;
    final up = key == LogicalKeyboardKey.arrowUp;
    if (!_list.isOpen) {
      if ((down || up) && !_inert) {
        _highlight(firstEnabled(_visible), open: true);
        return KeyEventResult.handled;
      }
      // Escape with the list closed is the enclosing dialog's.
      return KeyEventResult.ignored;
    }
    final active = _list.active;
    if (down || up) {
      _highlight(stepEnabled(_visible, active, down ? 1 : -1));
    } else if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter) {
      if (active == null || isComposing(_text.value)) {
        return KeyEventResult.ignored;
      }
      _add(active);
    } else if (key == LogicalKeyboardKey.escape) {
      _list.close();
    } else if (key == LogicalKeyboardKey.tab) {
      _list.close();
      return KeyEventResult.ignored;
    } else {
      return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  Widget _tags(InvisibleMessages messages) {
    _pruneRemoveNodes();
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: messages.multiSelectSelected,
      child: Wrap(
        spacing: _tagGap,
        runSpacing: _tagGap,
        children: [
          for (final chosen in value)
            Semantics(
              key: ValueKey<T>(chosen),
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.listItem,
              child: Tag(
                status: TagStatus.selected,
                onRemoved: _removable(chosen)
                    ? () => _remove(chosen, fromButton: true)
                    : null,
                removeLabel: InvisibleMessages.fill(
                  messages.multiSelectRemove,
                  {'name': _labelOf(chosen)},
                ),
                removeFocusNode: _removable(chosen)
                    ? _removeNodeFor(chosen)
                    : null,
                child: Text(_labelOf(chosen)),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    final placeholder = widget.placeholder ?? messages.multiSelectPlaceholder;

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
            final field = FieldSemantics(
              label: widget.label,
              description: widget.description,
              error: error,
              placeholder: _text.text.isEmpty ? placeholder : null,
              required: widget.required,
              enabled: widget.enabled,
              expanded: _list.isOpen,
              child: ListboxPopup<T>(
                controller: _list,
                items: _visible,
                selected: null,
                selectedValues: value.toSet(),
                onSelect: _add,
                onPressOutside: _list.close,
                semanticLabel: widget.label,
                emptyText: widget.emptyText ?? messages.multiSelectEmpty,
                child: Focus(
                  canRequestFocus: false,
                  skipTraversal: true,
                  onKeyEvent: _onKey,
                  child: TextBox(
                    controller: _text,
                    focusNode: _focus,
                    enabled: widget.enabled,
                    readOnly: widget.readOnly,
                    invalid: error != null && error.isNotEmpty,
                    autofocus: widget.autofocus,
                    placeholder: placeholder,
                    onTextPointerDown: _pointerOpen,
                    leading: const Glyph(GlyphShape.search),
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
              // The field keeps its place in the tree as tags come and go,
              // so the open list survives an addition.
              control: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: _tagGap * 2,
                children: [
                  if (value.isNotEmpty) _tags(messages),
                  KeyedSubtree(key: const ValueKey('field'), child: field),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
