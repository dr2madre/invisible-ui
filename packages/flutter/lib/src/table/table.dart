// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/widgets.dart' hide Table, TableRow;
import 'package:flutter/widgets.dart' as widgets show Table, TableRow;

import '../i18n/messages.dart';
import '../internal/announce.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../scroll_area/scroll_area.dart';
import '../theme/theme.dart';
import 'table_logic.dart';

// Sizes the web Table sets in its own stylesheet.
const double _cellPaddingY = 10;
const double _cellPaddingX = 12;
const double _fontSize = 15;
const double _captionGap = 8;
const double _sortGap = 5.6;
const double _sortGlyphScale = 0.9;
const double _unsortedOpacity = 0.4;
const double _unsortedHoverOpacity = 0.7;
const double _selectedTint = 0.08;
const double _selectionBox = 24;

/// The name a [Table]'s scroller takes while the table overflows, in place
/// of its caption: a Table Set names it with its title. Package-internal.
class TableScrollName extends InheritedWidget {
  /// Names the scrollers of the tables in [child] with [name].
  const TableScrollName({super.key, required this.name, required super.child});

  /// The region's name.
  final String? name;

  /// The name around [context], or null.
  static String? of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<TableScrollName>()?.name;

  @override
  bool updateShouldNotify(TableScrollName oldWidget) => oldWidget.name != name;
}

/// Where the text of a column sits in its cells.
enum TableAlign {
  /// At the inline start: left in left-to-right text.
  start,

  /// In the middle.
  center,

  /// At the inline end: right in left-to-right text, for numbers.
  end,
}

/// A column of a [Table] or a [TableSet].
@immutable
class TableColumn {
  /// A column showing [header], reading each row's value at [key].
  const TableColumn({
    required this.key,
    required this.header,
    this.sortable = false,
    this.hideable = true,
    this.align = TableAlign.start,
  });

  /// The stable key: it names the column and reads a row's value.
  final String key;

  /// The header text, and the column's name.
  final String header;

  /// Whether the header sorts the rows.
  final bool sortable;

  /// Whether the column can be hidden from a [TableSet]'s column list.
  final bool hideable;

  /// Where the text sits in the column's cells.
  final TableAlign align;
}

/// What a [Table.cellBuilder] builds a cell from.
@immutable
class TableCellDetails<T> {
  /// Describes the cell of [row] in [column].
  const TableCellDetails({
    required this.row,
    required this.column,
    required this.value,
    required this.rowIndex,
  });

  /// The row.
  final T row;

  /// The column.
  final TableColumn column;

  /// The row's value for the column.
  final Object? value;

  /// The row's position among the rows shown.
  final int rowIndex;
}

/// Builds the content of one cell.
typedef TableCellBuilder<T> =
    Widget Function(BuildContext context, TableCellDetails<T> cell);

/// Builds the content of a row's selection cell.
typedef TableSelectionCellBuilder<T> =
    Widget Function(BuildContext context, T row, Object rowId, int rowIndex);

/// The value of [row] at [key] when [row] is a map, the default reader.
Object? defaultTableValue(Object? row, String key) =>
    row is Map ? row[key] : null;

/// The id of [row]: its `id` entry when it is a map with one, else its
/// position. Selection never takes the position (see [TableSet]).
Object defaultTableRowId(Object? row, int index) =>
    (row is Map ? row['id'] as Object? : null) ?? index;

/// A data table: the [columns] and the [rows] it is given, with sortable
/// headers.
///
/// The table is controlled: it shows [sort] on the headers and reports a
/// press on a sortable header through [onSortToggle] with the column's key;
/// it does not sort, page or hide columns itself. [nextSort] gives the
/// three-state cycle and [sortRows] the sorted rows. [TableSet] adds the
/// title, the column list, the card view, pagination, filtering and
/// selection around it.
///
/// Cells show the row's value as text, read with [getValue] (a map's entry
/// by default); [cellBuilder] builds them instead. Each column takes the
/// width of its widest cell, so a cell's content must be able to report
/// its size ahead of layout: text, icons and buttons can, a
/// [LayoutBuilder] cannot. With [selectionColumn] a
/// first column holds [selectionHeader] and, in each row,
/// [selectionCellBuilder]'s widget; [isRowSelected] tints the selected rows.
///
/// The table, its rows, its cells and its column headers carry the table
/// roles of Flutter's semantics; a sortable header is a button whose value
/// says the sort ("sorted ascending"), announced after the user changes it,
/// since Flutter has no sort property. [caption] names the table and shows
/// above it unless [hideCaption]. A table wider than its container scrolls
/// sideways, and the scroller takes focus then, so the keyboard reaches
/// every column; while it does, the scroller is a region named by the
/// caption, or "Table" (`InvisibleMessages.tableViewTable`).
///
/// The name matches the widgets library's `Table`: import this package
/// with a prefix, as `iu.Table`.
class Table<T> extends StatefulWidget {
  /// A table of [rows] in [columns].
  const Table({
    super.key,
    required this.columns,
    required this.rows,
    this.sort,
    this.onSortToggle,
    this.caption,
    this.hideCaption = false,
    this.getValue,
    this.getRowId,
    this.cellBuilder,
    this.selectionColumn = false,
    this.isRowSelected,
    this.selectionHeader,
    this.selectionCellBuilder,
  });

  /// The columns, in order.
  final List<TableColumn> columns;

  /// The rows, in order.
  final List<T> rows;

  /// The active sort, shown on its header.
  final TableSort? sort;

  /// Called with the column key when the user presses a sortable header.
  final ValueChanged<String>? onSortToggle;

  /// The table's name, shown above it.
  final String? caption;

  /// Hides the caption while it still names the table.
  final bool hideCaption;

  /// Reads a row's value for a column key. Defaults to a map's entry.
  final Object? Function(T row, String key)? getValue;

  /// A row's stable id. Defaults to a map's `id` entry, or the position.
  final Object Function(T row, int index)? getRowId;

  /// Builds a cell's content. Defaults to the value as text.
  final TableCellBuilder<T>? cellBuilder;

  /// Whether a first column holds the selection controls.
  final bool selectionColumn;

  /// Whether a row is selected, which tints it.
  final bool Function(T row, int rowIndex)? isRowSelected;

  /// The selection column's header content.
  final Widget? selectionHeader;

  /// Builds a row's selection cell content.
  final TableSelectionCellBuilder<T>? selectionCellBuilder;

  @override
  State<Table<T>> createState() => _TableState<T>();
}

class _TableState<T> extends State<Table<T>> {
  int? _hoveredRow;
  String? _toggled;

  /// The scroller's name: the set's title, the caption, or "Table".
  String _scrollName(BuildContext context) {
    for (final name in [TableScrollName.of(context), widget.caption]) {
      if (name != null && name.isNotEmpty) return name;
    }
    return InvisibleTheme.of(context).messages.tableViewTable;
  }

  Object? _value(T row, String key) =>
      (widget.getValue ?? defaultTableValue)(row, key);

  Object _rowId(T row, int index) =>
      (widget.getRowId ?? defaultTableRowId)(row, index);

  @override
  void didUpdateWidget(Table<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    final toggled = _toggled;
    _toggled = null;
    final sort = widget.sort;
    if (toggled == null || sort == oldWidget.sort || sort?.key != toggled) {
      return;
    }
    // Flutter semantics have no aria-sort: the new sort is said once,
    // after the user asked for it.
    final column = widget.columns.where((c) => c.key == toggled).firstOrNull;
    if (column == null) return;
    final messages = InvisibleTheme.of(context).messages;
    final state = sortStateText(messages, sort);
    if (state != null) announce(context, '${column.header}, $state');
  }

  void _toggle(String key) {
    _toggled = key;
    widget.onSortToggle?.call(key);
  }

  void _hover(int? row) {
    if (_hoveredRow != row) setState(() => _hoveredRow = row);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final style = theme.textStyle.copyWith(
      color: colors.text,
      fontSize: _fontSize,
    );
    final border = BorderSide(color: colors.border);
    final columns = widget.columns;
    final selection = widget.selectionColumn;

    Widget cell(int rowIndex, Widget child, TableAlign align) => MouseRegion(
      onEnter: (_) => _hover(rowIndex),
      onExit: (_) {
        if (_hoveredRow == rowIndex) _hover(null);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: _cellPaddingY,
          horizontal: _cellPaddingX,
        ),
        child: Align(
          alignment: _alignment(align),
          widthFactor: 1,
          child: child,
        ),
      ),
    );

    final header = widgets.TableRow(
      decoration: BoxDecoration(border: Border(bottom: border)),
      children: [
        if (selection)
          Semantics(
            role: SemanticsRole.columnHeader,
            container: true,
            child: _HeaderPadding(child: widget.selectionHeader),
          ),
        for (final column in columns)
          Semantics(
            role: SemanticsRole.columnHeader,
            container: true,
            child: _HeaderCell(
              column: column,
              sort: column.sortable && widget.sort?.key == column.key
                  ? widget.sort
                  : null,
              onPressed: column.sortable && widget.onSortToggle != null
                  ? () => _toggle(column.key)
                  : null,
            ),
          ),
      ],
    );

    final body = [
      for (final (rowIndex, row) in widget.rows.indexed)
        widgets.TableRow(
          key: ValueKey<Object>(_rowId(row, rowIndex)),
          decoration: BoxDecoration(
            color:
                selection &&
                    (widget.isRowSelected?.call(row, rowIndex) ?? false)
                ? colors.selected.withValues(alpha: _selectedTint)
                : _hoveredRow == rowIndex
                ? colors.neutralSurface
                : null,
            border: Border(bottom: border),
          ),
          children: [
            if (selection)
              Semantics(
                role: SemanticsRole.cell,
                container: true,
                child: cell(
                  rowIndex,
                  widget.selectionCellBuilder?.call(
                        context,
                        row,
                        _rowId(row, rowIndex),
                        rowIndex,
                      ) ??
                      const SizedBox.shrink(),
                  TableAlign.start,
                ),
              ),
            for (final column in columns)
              Semantics(
                role: SemanticsRole.cell,
                container: true,
                child: cell(
                  rowIndex,
                  widget.cellBuilder?.call(
                        context,
                        TableCellDetails(
                          row: row,
                          column: column,
                          value: _value(row, column.key),
                          rowIndex: rowIndex,
                        ),
                      ) ??
                      Text(
                        '${_value(row, column.key) ?? ''}',
                        textAlign: _textAlign(column.align),
                      ),
                  column.align,
                ),
              ),
          ],
        ),
    ];

    final table = widgets.Table(
      defaultColumnWidth: const IntrinsicColumnWidth(flex: 1),
      // The selection controls are fields, which cannot be measured ahead
      // of layout: their column has a width of its own.
      columnWidths: selection
          ? {0: FixedColumnWidth(selectionColumnWidth(context))}
          : const <int, TableColumnWidth>{},
      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
      children: [header, ...body],
    );

    final caption = widget.caption;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: caption,
      child: DefaultTextStyle(
        style: style,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (caption != null && caption.isNotEmpty && !widget.hideCaption)
              Padding(
                padding: const EdgeInsets.only(bottom: _captionGap),
                // The container above carries the name.
                child: ExcludeSemantics(
                  child: Text(
                    caption,
                    style: style.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            LayoutBuilder(
              builder: (context, constraints) => Scroller(
                vertical: false,
                horizontal: true,
                focusableOnlyWhenScrollable: true,
                semanticLabel: _scrollName(context),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minWidth: constraints.hasBoundedWidth
                        ? constraints.maxWidth
                        : 0,
                  ),
                  child: table,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The width of the selection column: a checkbox's target and the cell's
/// padding, growing with the text.
double selectionColumnWidth(BuildContext context) {
  final target = InvisibleTheme.of(context).minTargetSize.width;
  final box = MediaQuery.textScalerOf(context).scale(_selectionBox);
  return (target > box ? target : box) + 2 * _cellPaddingX;
}

/// The words a sorted header is read with, or null when [sort] is null.
String? sortStateText(InvisibleMessages messages, TableSort? sort) =>
    switch (sort?.direction) {
      SortDirection.ascending => messages.tableSortedAscending,
      SortDirection.descending => messages.tableSortedDescending,
      null => null,
    };

AlignmentDirectional _alignment(TableAlign align) => switch (align) {
  TableAlign.start => AlignmentDirectional.centerStart,
  TableAlign.center => AlignmentDirectional.center,
  TableAlign.end => AlignmentDirectional.centerEnd,
};

TextAlign _textAlign(TableAlign align) => switch (align) {
  TableAlign.start => TextAlign.start,
  TableAlign.center => TextAlign.center,
  TableAlign.end => TextAlign.end,
};

class _HeaderPadding extends StatelessWidget {
  const _HeaderPadding({required this.child, this.align = TableAlign.start});

  final Widget? child;
  final TableAlign align;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: _cellPaddingY,
        horizontal: _cellPaddingX,
      ),
      child: Align(
        alignment: _alignment(align),
        widthFactor: 1,
        child: child ?? const SizedBox.shrink(),
      ),
    );
  }
}

/// A column header: its text, and for a sortable column a button that
/// shows the sort with a glyph, never with colour alone.
class _HeaderCell extends StatelessWidget {
  const _HeaderCell({
    required this.column,
    required this.sort,
    required this.onPressed,
  });

  final TableColumn column;
  final TableSort? sort;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final active = sort != null;
    final color = active ? colors.secondaryBodyText : colors.textSecondary;
    final style = DefaultTextStyle.of(
      context,
    ).style.copyWith(fontWeight: FontWeight.w600, color: color);
    final text = Text(column.header, softWrap: false, style: style);
    if (!column.sortable) {
      return _HeaderPadding(align: column.align, child: text);
    }

    final glyph = switch (sort?.direction) {
      SortDirection.ascending => GlyphShape.chevronUp,
      SortDirection.descending => GlyphShape.chevronDown,
      null => GlyphShape.sortable,
    };
    return _HeaderPadding(
      align: column.align,
      child: Semantics(
        container: true,
        button: true,
        enabled: onPressed != null,
        label: column.header,
        value: sortStateText(theme.messages, sort),
        onTap: onPressed,
        child: Pressable(
          onPressed: onPressed,
          builder: (context, states) => FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: 2,
            child: ExcludeSemantics(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: _sortGap,
                children: [
                  text,
                  Opacity(
                    opacity: active
                        ? 1
                        : states.hovered
                        ? _unsortedHoverOpacity
                        : _unsortedOpacity,
                    child: IconTheme(
                      data: IconThemeData(
                        color: color,
                        size: _fontSize * _sortGlyphScale,
                        applyTextScaling: true,
                      ),
                      child: Glyph(glyph),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
