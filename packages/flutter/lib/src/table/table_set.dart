import 'package:flutter/widgets.dart' hide Table;

import '../tabs/tabs.dart';
import '../theme/theme.dart';
import 'table.dart';
import 'table_logic.dart';
import 'table_view.dart';

// Sizes the web TableSet sets in its own stylesheet.
const double _gap = 12;
const double _titleSize = 24;

/// How a [TableSet] shows its rows.
enum TableViewMode {
  /// A table.
  table,

  /// A list of cards, one per row.
  cards,
}

/// A view of a [TableSet], shown as a tab: its own [columns] and [rows].
@immutable
class TableSetView<T> {
  /// A view named [label], identified by [id].
  const TableSetView({
    required this.id,
    required this.label,
    required this.columns,
    required this.rows,
    this.caption,
  });

  /// The stable id, reported by [TableSet.onViewChanged].
  final String id;

  /// The tab's label.
  final String label;

  /// The view's columns.
  final List<TableColumn> columns;

  /// The view's rows.
  final List<T> rows;

  /// The name of the view's table or card list. Defaults to [label].
  final String? caption;
}

/// The composed data table: a [Table] with a title, a column list, a table
/// and cards switch, client-side pagination or loading more, filtering
/// coordination and row selection, and tabs for several [views].
///
/// Without [views] it shows one view of [columns] and [rows]. There is
/// always an active sort: the first sortable column, ascending, unless
/// [sort] says otherwise, and a header press switches between ascending
/// and descending.
///
/// Each stateful setting is a controllable mirror (ADR 0011): [activeView],
/// [page], [sort], [hiddenColumns], [viewMode] and [selectedRowIds] seed the
/// state, a later different value replaces it without a report, and each
/// user change is reported once through its callback.
///
/// **Selection.** [selectionMode] adds a first column of checkboxes, and a
/// checkbox per card. Every row needs a stable, unique id, from [getRowId]
/// or a map row's `id`; the position is never used. [getRowLabel] names
/// each checkbox ("Select {name}"). The select-all checkbox covers the
/// selectable rows shown on the page and shows the mixed state when only
/// some of them are selected. The selection is the app's data: ids of rows
/// on other pages, filtered out or gone stay until the app changes
/// [selectedRowIds]. Missing ids, duplicate ids and missing labels fail in
/// debug builds.
///
/// **Filtering.** The app filters and passes the filtered [rows], with
/// [filtersActive] and [totalRowCount]. Zero rows with filters active and a
/// non-empty dataset show a no-results state with [onClearFilters] as its
/// action; after that action brings rows back, focus moves to the view. A
/// change of [filtersActive] or [filterRevision] returns to page one, and a
/// change of the row count under filters is announced ("3 results").
///
/// Cells show the value as text; [cellBuilder] builds them, in the table
/// and in the cards. [toolbar] sits in the header, for the app's filters.
class TableSet<T> extends StatelessWidget {
  /// A table set of one view, or of [views] as tabs.
  const TableSet({
    super.key,
    this.columns = const [],
    this.rows = const [],
    this.views = const [],
    this.activeView,
    this.onViewChanged,
    this.viewsLabel,
    this.title,
    this.headingLevel = 2,
    this.caption,
    this.hideCaption = false,
    this.toolbar,
    this.pageSize,
    this.page,
    this.onPageChanged,
    this.paginationLabel,
    this.infinite = false,
    this.hasMore = false,
    this.loading = false,
    this.onLoadMore,
    this.loadMoreLabel,
    this.loadingLabel,
    this.sort,
    this.onSortChanged,
    this.hiddenColumns,
    this.onHiddenColumnsChanged,
    this.viewMode,
    this.allowViewToggle = false,
    this.configurable = false,
    this.configLabel,
    this.cardTitleKey,
    this.cardDescriptionKey,
    this.getValue,
    this.getRowId,
    this.cellBuilder,
    this.selectionMode = SelectionMode.none,
    this.selectedRowIds,
    this.onSelectedRowIdsChanged,
    this.isRowSelectable,
    this.getRowLabel,
    this.filtersActive = false,
    this.totalRowCount,
    this.filterRevision,
    this.onClearFilters,
    this.noResultsLabel,
  }) : assert(headingLevel >= 2 && headingLevel <= 6),
       assert(pageSize == null || pageSize > 0);

  /// The columns of the single view, used without [views].
  final List<TableColumn> columns;

  /// The rows of the single view, used without [views].
  final List<T> rows;

  /// Several views, shown as tabs, each with its own columns and rows.
  final List<TableSetView<T>> views;

  /// The id of the active view. Defaults to the first; an id no view has
  /// shows the first.
  final String? activeView;

  /// Called with the view id after the user picks a tab.
  final ValueChanged<String>? onViewChanged;

  /// The name of the tabs. Defaults to [InvisibleMessages.tableViews].
  final String? viewsLabel;

  /// The heading above the table.
  final String? title;

  /// The heading level of [title].
  final int headingLevel;

  /// The name of the table or card list.
  final String? caption;

  /// Hides the caption while it still names the table.
  final bool hideCaption;

  /// Header content beside the title, such as the app's filters.
  final Widget? toolbar;

  /// Rows per page; null shows every row.
  final int? pageSize;

  /// The current page, from 1.
  final int? page;

  /// Called with the page after the user moves, or after the set returns
  /// to page one or to the last page because the rows or the filters
  /// changed.
  final ValueChanged<int>? onPageChanged;

  /// The name of the pagination. Defaults to
  /// [InvisibleMessages.tablePagination].
  final String? paginationLabel;

  /// Shows a load-more button in place of pagination.
  final bool infinite;

  /// Whether more rows can load.
  final bool hasMore;

  /// Whether rows are loading; announced and shown.
  final bool loading;

  /// Called when the user asks for more rows.
  final VoidCallback? onLoadMore;

  /// The load-more button's text. Defaults to
  /// [InvisibleMessages.tableLoadMore].
  final String? loadMoreLabel;

  /// The loading text. Defaults to [InvisibleMessages.tableLoading].
  final String? loadingLabel;

  /// The active sort. Defaults to the first sortable column, ascending.
  final TableSort? sort;

  /// Called with the sort after the user changes it.
  final ValueChanged<TableSort?>? onSortChanged;

  /// The keys of the hidden columns.
  final List<String>? hiddenColumns;

  /// Called with the hidden keys after the user changes them.
  final ValueChanged<List<String>>? onHiddenColumnsChanged;

  /// How the rows show. Defaults to [TableViewMode.table].
  final TableViewMode? viewMode;

  /// Shows the switch between the table and the cards.
  final bool allowViewToggle;

  /// Shows the column list, where columns can be hidden.
  final bool configurable;

  /// The column list's button and name. Defaults to
  /// [InvisibleMessages.tableColumns].
  final String? configLabel;

  /// The column whose value titles each card. Defaults to the first.
  final String? cardTitleKey;

  /// The column whose value describes each card.
  final String? cardDescriptionKey;

  /// Reads a row's value for a column key. Defaults to a map's entry.
  final Object? Function(T row, String key)? getValue;

  /// A row's stable, unique id. Defaults to a map row's `id`.
  final Object Function(T row, int index)? getRowId;

  /// Builds a cell's content, in the table and in the cards.
  final TableCellBuilder<T>? cellBuilder;

  /// How rows can be selected.
  final SelectionMode selectionMode;

  /// The selected row ids. Replace the list to change it.
  final List<Object>? selectedRowIds;

  /// Called with the selected ids after a user selection.
  final ValueChanged<List<Object>>? onSelectedRowIdsChanged;

  /// Whether the user may select a row. Others show no checkbox.
  final bool Function(T row)? isRowSelectable;

  /// Names a row for its checkbox. Required while selection is on.
  final String Function(T row)? getRowLabel;

  /// Whether the app's filters are on.
  final bool filtersActive;

  /// The number of rows before filtering, when known; 0 is an empty
  /// dataset.
  final int? totalRowCount;

  /// Changed by the app when the filters change, to return to page one.
  final Object? filterRevision;

  /// Clears the app's filters; adds the no-results state's action.
  final VoidCallback? onClearFilters;

  /// The no-results title. Defaults to [InvisibleMessages.tableNoResults].
  final String? noResultsLabel;

  @override
  Widget build(BuildContext context) {
    if (views.isEmpty) {
      return Semantics(
        container: true,
        explicitChildNodes: true,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: _gap,
          children: [
            ?toolbar,
            TableView<T>(
              set: this,
              columns: columns,
              rows: rows,
              caption: caption,
              title: title,
            ),
          ],
        ),
      );
    }
    return _TableSetViews<T>(set: this);
  }
}

class _TableSetViews<T> extends StatefulWidget {
  const _TableSetViews({required this.set});

  final TableSet<T> set;

  @override
  State<_TableSetViews<T>> createState() => _TableSetViewsState<T>();
}

class _TableSetViewsState<T> extends State<_TableSetViews<T>> {
  late String _active = _resolve(widget.set.activeView, widget.set.views);

  static String _resolve(
    String? requested,
    List<TableSetView<Object?>> views,
  ) => views.any((v) => v.id == requested) ? requested! : views.first.id;

  @override
  void didUpdateWidget(_TableSetViews<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    final set = widget.set;
    final old = oldWidget.set;
    // A changed active view is shown without a report; a view that is gone
    // gives way to the first one, also without a report.
    if (set.activeView != old.activeView && set.activeView != null) {
      _active = _resolve(set.activeView, set.views);
    } else if (!set.views.any((v) => v.id == _active)) {
      _active = set.views.first.id;
    }
  }

  void _select(String id) {
    if (id == _active) return;
    setState(() => _active = id);
    widget.set.onViewChanged?.call(id);
  }

  @override
  Widget build(BuildContext context) {
    final set = widget.set;
    final theme = InvisibleTheme.of(context);
    final title = set.title;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: _gap,
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
          ?set.toolbar,
          Tabs<String>(
            label: set.viewsLabel ?? theme.messages.tableViews,
            value: _active,
            onChanged: _select,
            items: [
              for (final view in set.views)
                TabItem(
                  value: view.id,
                  label: view.label,
                  // Only the active view is built, as on the web; a view
                  // shown again starts from the set's settings.
                  child: view.id == _active
                      ? DefaultTextStyle.merge(
                          style: TextStyle(color: theme.colors.text),
                          child: TableView<T>(
                            key: ValueKey(view.id),
                            set: set,
                            columns: view.columns,
                            rows: view.rows,
                            caption: view.caption ?? view.label,
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
