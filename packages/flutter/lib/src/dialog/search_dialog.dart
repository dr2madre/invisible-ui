import 'dart:math' as math;
import 'dart:ui' show SemanticsRole;

import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../internal/collection.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/listbox.dart';
import '../internal/text_box.dart';
import '../kbd/kbd.dart';
import '../loading/loading.dart';
import '../theme/theme.dart';
import 'dialog_panel.dart';

/// One result of a [SearchDialog].
@immutable
class SearchDialogItem<T> {
  /// Creates a result.
  const SearchDialogItem({
    required this.value,
    required this.label,
    this.group,
    this.shortcut = const [],
    this.disabled = false,
  });

  /// The value [SearchDialog.onSelected] reports.
  final T value;

  /// The visible label, which the query matches.
  final String label;

  /// The section the result belongs to, such as "Pages" or "Actions".
  final String? group;

  /// A keyboard shortcut hint shown at the end of the row, one key or a
  /// chord ("⌘", "S"). It is a label: the dialog binds no key.
  final List<String> shortcut;

  /// Whether the result can be chosen.
  final bool disabled;
}

/// Picks the results that match a query; [SearchDialog.filter].
typedef SearchDialogFilter<T> =
    List<SearchDialogItem<T>> Function(
      List<SearchDialogItem<T>> items,
      String query,
    );

/// [items] in display order: the ungrouped ones first, then one run per
/// group, groups in the order they first appear. The arrows follow this
/// order, so it matches what the list shows.
List<SearchDialogItem<T>> orderSearchItems<T>(List<SearchDialogItem<T>> items) {
  final ungrouped = <SearchDialogItem<T>>[];
  final groups = <String, List<SearchDialogItem<T>>>{};
  for (final item in items) {
    final group = item.group;
    if (group == null || group.isEmpty) {
      ungrouped.add(item);
    } else {
      (groups[group] ??= []).add(item);
    }
  }
  return [...ungrouped, for (final run in groups.values) ...run];
}

List<SearchDialogItem<T>> _containsFilter<T>(
  List<SearchDialogItem<T>> items,
  String query,
) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return items;
  return [
    for (final item in items)
      if (item.label.toLowerCase().contains(q)) item,
  ];
}

// Sizes the web Search Dialog sets in its own stylesheet.
const double _insetTop = 0.12;
const double _maxHeight = 0.6;
const double _screenInset = 16;
const EdgeInsets _searchPadding = EdgeInsets.symmetric(
  horizontal: 16,
  vertical: 12,
);
const double _searchGap = 8;
const double _listPadding = 6;
const EdgeInsets _optionPadding = EdgeInsets.symmetric(
  horizontal: 10,
  vertical: 8,
);
const EdgeInsets _groupPadding = EdgeInsets.fromLTRB(10, 8, 10, 4);
const double _groupSize = 11;
const EdgeInsets _emptyPadding = EdgeInsets.symmetric(
  horizontal: 10,
  vertical: 24,
);

/// A quick search in a modal: a search field over a list of results, to
/// find something by keyword and pick it. Show it with
/// `showInvisibleDialog<T>`, which completes with the chosen value, or null
/// when closed with Escape, the barrier or the close button.
///
/// The field takes focus when the dialog opens. Typing filters the results
/// ([filter], by default the ones whose label contains the query, ignoring
/// case) and highlights the first enabled one; Down and Up move the
/// highlight across the whole list, wrapping, and the highlighted result is
/// announced; Enter chooses it. Choosing closes the dialog first, then
/// calls [onSelected] (ADR 0011). Focus leaving the field changes nothing:
/// the query stays, and only Escape, the barrier or the close button close
/// the dialog. Each change of the number of results is announced politely
/// ("3 results available", [emptyText] when nothing matches, "Searching…"
/// while [loading]).
///
/// Results with a `group` sit under a heading, after the ungrouped ones, in
/// the order their groups first appear; a group with no match disappears
/// with its heading. While the query is empty the list shows [suggestions]
/// when there are any, otherwise every item. Set [loading] while results
/// load: an indicator shows and the empty text waits. For results fetched
/// as the user types, listen to [onQueryChanged] and rebuild the dialog
/// with new [items], for example through a `ValueListenableBuilder` in the
/// route's builder.
///
/// The [title] names the dialog and stays hidden ([hideTitle]); a
/// [closeButton] shows the header. The status area after the results holds
/// messages about the search (ADR 0016). The dialog binds no shortcut: the
/// app opens it, for example from a `Shortcuts` binding of its own.
class SearchDialog<T> extends StatefulWidget {
  /// Creates a search dialog over [items].
  const SearchDialog({
    super.key,
    required this.items,
    this.suggestions = const [],
    this.loading = false,
    this.onSelected,
    this.onQueryChanged,
    this.filter,
    this.title,
    this.hideTitle = true,
    this.closeButton = false,
    this.label,
    this.placeholder,
    this.emptyText,
    this.controller,
  });

  /// The results to search.
  final List<SearchDialogItem<T>> items;

  /// The results shown while the query is empty, such as recent searches.
  final List<SearchDialogItem<T>> suggestions;

  /// Whether results are loading.
  final bool loading;

  /// Called with the chosen value after the dialog has closed.
  final ValueChanged<T>? onSelected;

  /// Called with the query after the user changes it.
  final ValueChanged<String>? onQueryChanged;

  /// Picks the results shown for the query. Defaults to the ones whose label
  /// contains it, ignoring case.
  final SearchDialogFilter<T>? filter;

  /// The title; it names the dialog. Defaults to the theme's
  /// `searchDialogTitle`.
  final String? title;

  /// Whether the title is hidden from view. It still names the dialog.
  final bool hideTitle;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// The name of the field. Defaults to the theme's `searchDialogLabel`.
  final String? label;

  /// Shown in the empty field. Defaults to the theme's
  /// `searchDialogPlaceholder`.
  final String? placeholder;

  /// Shown and announced when nothing matches. Defaults to the theme's
  /// `searchDialogEmpty`.
  final String? emptyText;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  @override
  State<SearchDialog<T>> createState() => _SearchDialogState<T>();
}

class _SearchDialogState<T> extends State<SearchDialog<T>> {
  final TextEditingController _query = TextEditingController();
  final FocusNode _field = FocusNode(debugLabel: 'Search field');
  final ListboxController<T> _list = ListboxController<T>();
  List<SearchDialogItem<T>> _visible = const [];
  String _lastQuery = '';
  String? _announced;

  @override
  void initState() {
    super.initState();
    _visible = _visibleFor('');
    _query.addListener(_edited);
    _field.addListener(_focusChanged);
  }

  @override
  void didUpdateWidget(SearchDialog<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!identical(oldWidget.items, widget.items) ||
        !identical(oldWidget.suggestions, widget.suggestions) ||
        oldWidget.filter != widget.filter) {
      _visible = _visibleFor(_query.text);
      final active = _list.active;
      if (active != null && !_visible.any((item) => item.value == active)) {
        _list.activate(null);
      }
    }
  }

  @override
  void dispose() {
    _query.dispose();
    _field.dispose();
    _list.dispose();
    super.dispose();
  }

  void _focusChanged() => setState(() {});

  List<SearchDialogItem<T>> _visibleFor(String query) {
    final suggestions = widget.suggestions;
    if (query.trim().isEmpty && suggestions.isNotEmpty) {
      return orderSearchItems(suggestions);
    }
    return (widget.filter ?? _containsFilter<T>)(
      orderSearchItems(widget.items),
      query,
    );
  }

  List<ChoiceItem<T>> get _choices => [
    for (final item in _visible)
      ChoiceItem(value: item.value, label: item.label, disabled: item.disabled),
  ];

  void _edited() {
    final query = _query.text;
    if (query == _lastQuery) return;
    _lastQuery = query;
    setState(() => _visible = _visibleFor(query));
    // The first match is highlighted, so Enter takes the top result; the
    // count is what gets announced while typing.
    _list.activate(firstEnabled(_choices));
    widget.onQueryChanged?.call(query);
  }

  /// Closes with [value], then reports it.
  void _select(T value) {
    final item = _visible.where((item) => item.value == value).firstOrNull;
    if (item == null || item.disabled) return;
    final onSelected = widget.onSelected;
    final navigator = Navigator.maybeOf(context);
    if (navigator != null && navigator.canPop()) navigator.pop(value);
    onSelected?.call(value);
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    final choices = _choices;
    if (key == LogicalKeyboardKey.arrowDown ||
        key == LogicalKeyboardKey.arrowUp) {
      final delta = key == LogicalKeyboardKey.arrowDown ? 1 : -1;
      _list.highlight(
        context,
        choices,
        stepEnabled(choices, _list.active, delta),
      );
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter) {
      final active = _list.active;
      if (active == null || isComposing(_query.value)) {
        return KeyEventResult.ignored;
      }
      _select(active);
      return KeyEventResult.handled;
    }
    // Escape is the dialog's.
    return KeyEventResult.ignored;
  }

  /// The status message, announced when it changes.
  String _status(InvisibleMessages messages) {
    if (widget.loading) return messages.searchDialogLoading;
    if (_visible.isEmpty) return widget.emptyText ?? messages.searchDialogEmpty;
    return messages.searchDialogResults(_visible.length);
  }

  void _announceStatus(String message) {
    // The status on open is the starting point, as a live region's first
    // content is; later changes are read.
    final previous = _announced;
    _announced = message;
    if (previous == null || previous == message) return;
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (mounted && _announced == message) announce(context, message);
    });
  }

  Widget _option(SearchDialogItem<T> item) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = !item.disabled;
    final name = [item.label, ...item.shortcut].join(' ');
    return Semantics(
      key: _list.keyFor(item.value),
      container: true,
      role: SemanticsRole.listItem,
      label: name,
      enabled: enabled,
      onTap: enabled ? () => _select(item.value) : null,
      child: ExcludeSemantics(
        child: MouseRegion(
          cursor: enabled
              ? SystemMouseCursors.click
              : SystemMouseCursors.forbidden,
          onEnter: enabled ? (_) => _list.activate(item.value) : null,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: enabled ? () => _select(item.value) : null,
            child: ListenableBuilder(
              listenable: _list,
              builder: (context, _) {
                final active = _list.active == item.value;
                return ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: theme.minTargetSize.height,
                  ),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: active ? colors.stateHover : null,
                      borderRadius: BorderRadius.circular(theme.controlRadius),
                      // Focus stays in the field, so the highlighted result
                      // shows a ring of its own; a tint alone is too faint.
                      border: active
                          ? Border.all(
                              color: colors.focusRing,
                              width: theme.focusRing.width,
                            )
                          : null,
                    ),
                    child: Padding(
                      padding: _optionPadding,
                      child: Row(
                        spacing: _searchGap,
                        children: [
                          Expanded(
                            child: Text(
                              item.label,
                              style: theme.textStyle.copyWith(
                                color: enabled
                                    ? colors.text
                                    : colors.textDisabled,
                              ),
                            ),
                          ),
                          if (item.shortcut.length == 1)
                            Kbd(item.shortcut.single)
                          else if (item.shortcut.length > 1)
                            Kbd.chord(item.shortcut),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _results(String label) {
    final theme = InvisibleTheme.of(context);
    final sections = <(String?, List<SearchDialogItem<T>>)>[];
    for (final item in _visible) {
      final group = (item.group?.isEmpty ?? true) ? null : item.group;
      if (sections.isNotEmpty && sections.last.$1 == group) {
        sections.last.$2.add(item);
      } else {
        sections.add((group, [item]));
      }
    }
    // Each run is a list: the ungrouped results are named like the field,
    // a group by its name, read once on entering it. The visible heading
    // stays out of the semantics tree.
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (group, items) in sections)
          Semantics(
            key: ValueKey('group:$group'),
            container: true,
            explicitChildNodes: true,
            role: SemanticsRole.list,
            label: group ?? label,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (group != null)
                  ExcludeSemantics(
                    child: Padding(
                      padding: _groupPadding,
                      child: Text(
                        group.toUpperCase(),
                        style: theme.textStyle.copyWith(
                          fontSize: _groupSize,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.05 * _groupSize,
                          color: theme.colors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ...items.map(_option),
              ],
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final label = widget.label ?? messages.searchDialogLabel;
    final placeholder = widget.placeholder ?? messages.searchDialogPlaceholder;
    _announceStatus(_status(messages));
    final divider = BorderSide(color: colors.border);

    final search = FocusRingPainter(
      // The field has no border of its own: its row shows the ring, inside
      // the panel's edge.
      visible: _field.hasFocus,
      ring: theme.focusRing,
      radius: 0,
      inside: true,
      child: DecoratedBox(
        decoration: BoxDecoration(border: Border(bottom: divider)),
        child: Padding(
          padding: _searchPadding,
          child: Row(
            spacing: _searchGap,
            children: [
              IconTheme(
                data: IconThemeData(
                  color: colors.textSecondary,
                  size: (theme.textStyle.fontSize ?? 16) * 1.1,
                  applyTextScaling: true,
                ),
                child: const ExcludeSemantics(child: Glyph(GlyphShape.search)),
              ),
              Expanded(
                child: FieldSemantics(
                  label: label,
                  placeholder: _query.text.isEmpty ? placeholder : null,
                  expanded: true,
                  child: Focus(
                    canRequestFocus: false,
                    skipTraversal: true,
                    onKeyEvent: _onKey,
                    child: TextBox(
                      controller: _query,
                      focusNode: _field,
                      framed: false,
                      placeholder: placeholder,
                      textInputAction: TextInputAction.search,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    final empty = _visible.isEmpty && !widget.loading;
    Widget list(bool bounded) {
      final content = Padding(
        padding: const EdgeInsets.all(_listPadding),
        child: _results(label),
      );
      return bounded
          ? Flexible(child: SingleChildScrollView(child: content))
          : content;
    }

    final body = LayoutBuilder(
      builder: (context, constraints) {
        final bounded = constraints.hasBoundedHeight;
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            search,
            if (widget.loading)
              DecoratedBox(
                decoration: BoxDecoration(border: Border(bottom: divider)),
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Center(
                    child: Loading(
                      variant: LoadingVariant.dots,
                      decorative: true,
                    ),
                  ),
                ),
              ),
            list(bounded),
            if (empty)
              Padding(
                padding: _emptyPadding,
                child: Text(
                  widget.emptyText ?? messages.searchDialogEmpty,
                  textAlign: TextAlign.center,
                  style: theme.textStyle.copyWith(color: colors.textSecondary),
                ),
              ),
          ],
        );
      },
    );

    return DialogPanel(
      title: widget.title ?? messages.searchDialogTitle,
      role: SemanticsRole.dialog,
      spacing: DialogSpacing.search,
      hideTitle: widget.hideTitle,
      body: body,
      closeButton: widget.closeButton,
      controller: widget.controller,
      initialFocus: _field,
      place: (context, panel) {
        final media = MediaQuery.of(context);
        final size = media.size;
        return Padding(
          padding:
              EdgeInsets.fromLTRB(
                _screenInset,
                size.height * _insetTop,
                _screenInset,
                _screenInset,
              ) +
              media.padding +
              media.viewInsets,
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: DialogSpacing.search.maxWidth,
                maxHeight: math.max(0, size.height * _maxHeight),
              ),
              child: panel,
            ),
          ),
        );
      },
    );
  }
}
