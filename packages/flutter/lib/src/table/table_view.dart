import 'dart:math' as math;

import 'package:flutter/foundation.dart';
// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/widgets.dart' hide Table;

import '../button/button.dart';
import '../card/card.dart';
import '../checkbox/checkbox.dart';
import '../choice/choice_item.dart';
import '../feedback_state/feedback_state.dart';
import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../pagination/pagination.dart';
import '../popover/popover.dart';
import '../segmented_control/segmented_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'table.dart';
import 'table_logic.dart';
import 'table_set.dart';

// Sizes the web TableView sets in its own stylesheet.
const double _gap = 12;
const double _titleSize = 24;
const double _cardMinWidth = 256;
const double _fieldGap = 5.6;
const double _fieldLabelSize = 13;
const double _noResultsPaddingY = 32;
const double _noResultsPaddingX = 16;
const double _configMinWidth = 160;

/// One view of a [TableSet]: the header, the table or the cards, and the
/// pagination or load-more footer. It owns the view's state: sort, hidden
/// columns, selection, page and table or cards. Package-internal, as on the
/// web: apps use [TableSet], with one view for a single table.
class TableView<T> extends StatefulWidget {
  /// The view of [columns] and [rows], configured by [set].
  const TableView({
    super.key,
    required this.set,
    required this.columns,
    required this.rows,
    this.caption,
    this.title,
  });

  /// The set whose settings the view follows.
  final TableSet<T> set;

  /// The columns.
  final List<TableColumn> columns;

  /// The rows, already filtered by the app.
  final List<T> rows;

  /// The name of the table or the card list.
  final String? caption;

  /// The heading above the view, for a set without tabs.
  final String? title;

  @override
  State<TableView<T>> createState() => _TableViewState<T>();
}

class _TableViewState<T> extends State<TableView<T>> {
  final FocusNode _root = FocusNode(
    debugLabel: 'TableView',
    skipTraversal: true,
  );

  late TableSort? _sort = widget.set.sort ?? _defaultSort(widget.columns);
  late List<String> _hidden = widget.set.hiddenColumns ?? const [];
  late List<Object> _selected = widget.set.selectedRowIds ?? const [];
  late int _page = widget.set.page ?? 1;
  late TableViewMode _mode = widget.set.viewMode ?? TableViewMode.table;
  bool _focusAfterClear = false;

  TableSet<T> get _set => widget.set;

  static TableSort? _defaultSort(List<TableColumn> columns) {
    final first = columns.where((c) => c.sortable).firstOrNull;
    return first == null ? null : TableSort(first.key, SortDirection.ascending);
  }

  /// Whether [count] rows under [set] show the no-results state: filters
  /// leave nothing of a dataset that is not empty.
  static bool _noResults(TableSet<Object?> set, int count) =>
      count == 0 && set.filtersActive && set.totalRowCount != 0;

  @override
  void dispose() {
    _root.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(TableView<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    final set = widget.set;
    final old = oldWidget.set;
    // Controllable mirrors (ADR 0011): only a value the app changed,
    // compared with the previous widget; never reported.
    if (set.sort != old.sort) _sort = set.sort ?? _defaultSort(widget.columns);
    if (!listEquals(set.hiddenColumns, old.hiddenColumns)) {
      _hidden = set.hiddenColumns ?? const [];
    }
    if (!listEquals(set.selectedRowIds, old.selectedRowIds)) {
      _selected = set.selectedRowIds ?? const [];
    }
    if (set.page != old.page && set.page != null) _page = set.page!;
    if (set.viewMode != old.viewMode && set.viewMode != null) {
      _mode = set.viewMode!;
    }
    // New columns keep the sort while its column is still sortable;
    // otherwise the first sortable column takes over, without a report.
    if (!identical(widget.columns, oldWidget.columns)) {
      final sort = _sort;
      final stillSortable =
          sort != null &&
          widget.columns.any((c) => c.key == sort.key && c.sortable);
      if (!stillSortable) _sort = _defaultSort(widget.columns);
    }

    // The app owns the filters: a change of the signal or of the revision
    // returns to page one, reported once, and leaves the selection alone.
    final filtersChanged =
        set.filtersActive != old.filtersActive ||
        set.filterRevision != old.filterRevision;
    if (filtersChanged && _page != 1) {
      _page = 1;
      _afterFrame(() => _set.onPageChanged?.call(1));
    }

    // A change of the row count under filters is announced, the rule of
    // `tableResultsUpdate` in core; the no-results state announces itself.
    final count = widget.rows.length;
    if (count != oldWidget.rows.length &&
        (set.filtersActive || filtersChanged) &&
        !_noResults(set, count)) {
      _afterFrame(() {
        if (mounted) announce(context, _messages.tableResults(count));
      });
    }

    if (set.loading && !old.loading) {
      _afterFrame(() {
        if (mounted) announce(context, _loadingText);
      });
    }

    // Content back after the built-in clear action: the action's button
    // went with the no-results state, so the view takes focus.
    if (_focusAfterClear && count > 0) {
      _focusAfterClear = false;
      _afterFrame(() {
        if (mounted) _root.requestFocus();
      });
    }
  }

  // Reports run after the frame: the app's handler may rebuild the app,
  // which it cannot do while this widget updates.
  void _afterFrame(VoidCallback callback) =>
      WidgetsBinding.instance.addPostFrameCallback((_) => callback());

  InvisibleMessages get _messages => InvisibleTheme.of(context).messages;

  String get _loadingText => _set.loadingLabel ?? _messages.tableLoading;

  Object? _value(T row, String key) =>
      (_set.getValue ?? defaultTableValue)(row, key);

  // Two states (ascending and descending): the view is never unsorted.
  void _toggleSort(String key) {
    final current = _sort;
    final next = current != null && current.key == key
        ? TableSort(
            key,
            current.direction == SortDirection.ascending
                ? SortDirection.descending
                : SortDirection.ascending,
          )
        : TableSort(key, SortDirection.ascending);
    setState(() => _sort = next);
    _set.onSortChanged?.call(next);
  }

  void _toggleColumn(TableColumn column) {
    if (!column.hideable) return;
    final next = toggleHidden(_hidden, column.key);
    setState(() => _hidden = next);
    _set.onHiddenColumnsChanged?.call(next);
  }

  void _select(List<Object> next) {
    if (identical(next, _selected)) return;
    setState(() => _selected = next);
    _set.onSelectedRowIdsChanged?.call(next);
  }

  void _changePage(int next) {
    if (next == _page) return;
    setState(() => _page = next);
    _set.onPageChanged?.call(next);
  }

  void _clearFilters() {
    _focusAfterClear = true;
    _set.onClearFilters?.call();
  }

  /// The selection id of each row; null for a row that cannot be selected.
  /// Selection needs an id that survives sorting and paging, so the
  /// position is never one.
  Map<T, Object?> _selectionIds() {
    final ids = Map<T, Object?>.identity();
    if (_set.selectionMode == SelectionMode.none) return ids;
    final seen = <Object>{};
    for (final (index, row) in widget.rows.indexed) {
      final getRowId = _set.getRowId;
      final id = getRowId != null
          ? getRowId(row, index)
          : (row is Map ? row['id'] as Object? : null);
      if (id == null) {
        _fail(
          'Row selection needs a stable id: give each map row an `id` or '
          'pass a stable `getRowId`.',
        );
        ids[row] = null;
      } else if (!seen.add(id)) {
        _fail('Duplicate row id "$id": row selection needs unique ids.');
        ids[row] = null;
      } else {
        ids[row] = id;
      }
    }
    return ids;
  }

  String _rowLabel(T row, Object id) {
    final label = _set.getRowLabel?.call(row);
    if (label == null || label.trim().isEmpty) {
      _fail(
        'Row selection needs `getRowLabel` returning a non-empty name for '
        'every row.',
      );
      return '$id';
    }
    return label;
  }

  // Misuse fails in debug builds; a release build degrades instead.
  void _fail(String message) {
    assert(() {
      throw FlutterError(message);
    }());
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final set = _set;
    final columns = widget.columns;
    final shown = [
      for (final c in columns)
        if (!_hidden.contains(c.key)) c,
    ];
    final sorted = sortRows(widget.rows, _sort, _value);
    final pageSize = set.pageSize;
    final paginated = !set.infinite && pageSize != null;
    final pageCount = paginated
        ? math.max(1, (sorted.length / pageSize).ceil())
        : 1;
    // The rows shrank under the current page: the last page shows, and the
    // change is reported once.
    if (_page > pageCount) {
      final last = pageCount;
      _page = last;
      _afterFrame(() => _set.onPageChanged?.call(last));
    }
    final visible = paginated
        ? sorted.sublist(
            (_page - 1) * pageSize,
            math.min(_page * pageSize, sorted.length),
          )
        : sorted;

    final noResults = _noResults(set, widget.rows.length);

    final mode = set.selectionMode;
    final ids = _selectionIds();
    final selectable = set.isRowSelectable ?? (_) => true;
    bool canSelect(T row) => ids[row] != null && selectable(row);
    final scope = mode == SelectionMode.multiple
        ? [
            for (final row in visible)
              if (canSelect(row)) ids[row]!,
          ]
        : const <Object>[];
    final scopeState = scopeSelectionState(_selected, scope);

    Widget selectPage() => Checkbox(
      label: messages.tableSelectPage,
      hideLabel: true,
      value: switch (scopeState) {
        ScopeSelection.all => true,
        ScopeSelection.some => null,
        ScopeSelection.none => false,
      },
      enabled: scope.isNotEmpty,
      onChanged: (_) => _select(toggleScopeSelection(_selected, scope, mode)),
    );

    Widget? rowCheckbox(T row) {
      final id = ids[row];
      if (id == null || !selectable(row)) return null;
      return Checkbox(
        label: InvisibleMessages.fill(messages.tableSelectRow, {
          'name': _rowLabel(row, id),
        }),
        hideLabel: true,
        value: _selected.contains(id),
        onChanged: (_) => _select(toggleRowSelection(_selected, id, mode)),
      );
    }

    final border = Border.all(color: theme.colors.border);
    final radius = BorderRadius.circular(InvisibleRadiusTokens.surface);

    final Widget body;
    if (noResults) {
      body = DecoratedBox(
        decoration: BoxDecoration(border: border, borderRadius: radius),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            vertical: _noResultsPaddingY,
            horizontal: _noResultsPaddingX,
          ),
          child: Center(
            child: EmptyState(
              title: set.noResultsLabel ?? messages.tableNoResults,
              actionLabel: set.onClearFilters != null
                  ? messages.tableClearFilters
                  : null,
              onAction: set.onClearFilters != null ? _clearFilters : null,
              live: true,
            ),
          ),
        ),
      );
    } else if (_mode == TableViewMode.cards) {
      body = _Cards<T>(
        caption: widget.caption,
        rows: visible,
        columns: shown,
        titleKey: set.cardTitleKey ?? columns.firstOrNull?.key,
        descriptionKey: set.cardDescriptionKey,
        value: _value,
        cellBuilder: set.cellBuilder,
        checkbox: mode == SelectionMode.none ? null : rowCheckbox,
        isSelected: (row) => ids[row] != null && _selected.contains(ids[row]),
        selectAll: mode == SelectionMode.multiple ? selectPage() : null,
      );
    } else {
      body = DecoratedBox(
        position: DecorationPosition.foreground,
        decoration: BoxDecoration(border: border, borderRadius: radius),
        child: ClipRRect(
          borderRadius: radius,
          child: TableScrollName(
            name: widget.title,
            child: Table<T>(
              columns: shown,
              rows: visible,
              sort: _sort,
              onSortToggle: _toggleSort,
              caption: widget.caption,
              hideCaption: set.hideCaption || widget.title != null,
              getValue: set.getValue,
              getRowId: set.getRowId,
              cellBuilder: set.cellBuilder,
              selectionColumn: mode != SelectionMode.none,
              isRowSelected: (row, _) =>
                  ids[row] != null && _selected.contains(ids[row]),
              selectionHeader: switch (mode) {
                SelectionMode.multiple => selectPage(),
                SelectionMode.single => Semantics(
                  label: messages.tableSelection,
                  child: const SizedBox.shrink(),
                ),
                SelectionMode.none => null,
              },
              selectionCellBuilder: (context, row, _, _) =>
                  rowCheckbox(row) ?? const SizedBox.shrink(),
            ),
          ),
        ),
      );
    }

    final title = widget.title;
    final hasHeader =
        (title != null && title.isNotEmpty) ||
        set.allowViewToggle ||
        set.configurable;
    final configLabel = set.configLabel ?? messages.tableColumns;

    return Focus(
      focusNode: _root,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: _gap,
        children: [
          if (hasHeader)
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 16,
              runSpacing: 8,
              children: [
                if (title != null && title.isNotEmpty)
                  Semantics(
                    header: true,
                    headingLevel: set.headingLevel,
                    child: Text(
                      title,
                      style: theme.textStyle.copyWith(
                        color: theme.colors.text,
                        fontSize: _titleSize,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    if (set.allowViewToggle)
                      SegmentedControl<TableViewMode>(
                        label: messages.tableView,
                        hideLabel: true,
                        value: _mode,
                        items: [
                          ChoiceItem(
                            value: TableViewMode.table,
                            label: messages.tableViewTable,
                          ),
                          ChoiceItem(
                            value: TableViewMode.cards,
                            label: messages.tableViewCards,
                          ),
                        ],
                        onSelected: (next) => setState(() => _mode = next),
                      ),
                    if (set.configurable)
                      Popover(
                        label: configLabel,
                        trigger: Text(configLabel),
                        triggerVariant: ButtonVariant.ghost,
                        builder: (context, _) => ConstrainedBox(
                          constraints: const BoxConstraints(
                            minWidth: _configMinWidth,
                          ),
                          child: _ColumnList(
                            label: configLabel,
                            columns: columns,
                            hidden: _hidden,
                            onToggle: _toggleColumn,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          body,
          if (set.infinite)
            Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 8,
              children: [
                Text(
                  set.loading ? _loadingText : '',
                  style: theme.textStyle.copyWith(
                    color: theme.colors.textSecondary,
                    fontSize: _fieldLabelSize,
                  ),
                ),
                if (set.hasMore)
                  Button(
                    onPressed: set.loading ? null : set.onLoadMore,
                    child: Text(
                      set.loading
                          ? _loadingText
                          : set.loadMoreLabel ?? messages.tableLoadMore,
                    ),
                  ),
              ],
            )
          else if (paginated && pageCount > 1)
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Pagination(
                page: _page,
                pageCount: pageCount,
                label: set.paginationLabel ?? messages.tablePagination,
                onPageChanged: _changePage,
              ),
            ),
        ],
      ),
    );
  }
}

/// The column list in the column popover: one checkbox per column, the
/// columns that cannot hide disabled.
class _ColumnList extends StatelessWidget {
  const _ColumnList({
    required this.label,
    required this.columns,
    required this.hidden,
    required this.onToggle,
  });

  final String label;
  final List<TableColumn> columns;
  final List<String> hidden;
  final ValueChanged<TableColumn> onToggle;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          for (final column in columns)
            Checkbox(
              key: ValueKey(column.key),
              label: column.header,
              value: !hidden.contains(column.key),
              enabled: column.hideable,
              onChanged: (_) => onToggle(column),
            ),
        ],
      ),
    );
  }
}

/// The card view: a named list with one card per row, as many across as fit.
class _Cards<T> extends StatelessWidget {
  const _Cards({
    required this.caption,
    required this.rows,
    required this.columns,
    required this.titleKey,
    required this.descriptionKey,
    required this.value,
    required this.cellBuilder,
    required this.checkbox,
    required this.isSelected,
    required this.selectAll,
  });

  final String? caption;
  final List<T> rows;
  final List<TableColumn> columns;
  final String? titleKey;
  final String? descriptionKey;
  final Object? Function(T row, String key) value;
  final TableCellBuilder<T>? cellBuilder;
  final Widget? Function(T row)? checkbox;
  final bool Function(T row) isSelected;
  final Widget? selectAll;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final fieldColumns = [
      for (final c in columns)
        if (c.key != titleKey && c.key != descriptionKey) c,
    ];
    final minWidth = MediaQuery.textScalerOf(context).scale(_cardMinWidth);

    Widget card(int rowIndex, T row) {
      final titleValue = titleKey == null ? null : value(row, titleKey!);
      final descriptionValue = descriptionKey == null
          ? null
          : value(row, descriptionKey!);
      final fields = Column(
        mainAxisSize: MainAxisSize.min,
        spacing: _fieldGap,
        children: [
          for (final column in fieldColumns)
            MergeSemantics(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 16,
                children: [
                  Text(
                    column.header,
                    style: theme.textStyle.copyWith(
                      color: colors.textSecondary,
                      fontSize: _fieldLabelSize,
                    ),
                  ),
                  Expanded(
                    child: Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: DefaultTextStyle.merge(
                        style: TextStyle(
                          color: colors.text,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.end,
                        child:
                            cellBuilder?.call(
                              context,
                              TableCellDetails(
                                row: row,
                                column: column,
                                value: value(row, column.key),
                                rowIndex: rowIndex,
                              ),
                            ) ??
                            Text('${value(row, column.key) ?? ''}'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      );
      final box = checkbox?.call(row);
      final content = Card(
        title: titleValue == null ? null : '$titleValue',
        description: descriptionValue == null ? null : '$descriptionValue',
        child: fields,
      );
      return Semantics(
        role: SemanticsRole.listItem,
        container: true,
        explicitChildNodes: true,
        selected: box == null ? null : isSelected(row),
        child: box == null
            ? content
            : Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 8,
                children: [
                  box,
                  Expanded(child: content),
                ],
              ),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: _gap,
      children: [
        ?selectAll,
        Semantics(
          role: SemanticsRole.list,
          container: true,
          explicitChildNodes: true,
          label: caption,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final across = width.isFinite
                  ? math.max(1, ((width + _gap) / (minWidth + _gap)).floor())
                  : 1;
              final itemWidth = width.isFinite
                  ? (width - _gap * (across - 1)) / across
                  : minWidth;
              return Wrap(
                spacing: _gap,
                runSpacing: _gap,
                children: [
                  for (final (index, row) in rows.indexed)
                    SizedBox(width: itemWidth, child: card(index, row)),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}
