import 'package:flutter/gestures.dart' show PointerDeviceKind;
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../field/field.dart' show FieldSemantics;
import '../i18n/locale_provider.dart';
import '../i18n/messages.dart';
import '../internal/anchored_layout.dart';
import '../internal/announce.dart';
import '../internal/elevation.dart';
import '../internal/focus_ring.dart';
import '../internal/form_binding.dart';
import '../internal/glyphs.dart';
import '../internal/text_box.dart';
import '../number_field/number_field.dart' show numberValidityMessage;
import '../number_field/number_format.dart';
import '../theme/theme.dart';
import '../tooltip/tooltip.dart';
import 'data_grid_layout.dart';
import 'data_grid_logic.dart';

// Sizes the web Table sets in its own stylesheet, which the grid shares.
const double _cellPaddingY = 10;
const double _cellPaddingX = 12;
const double _fontSize = 15;
const double _smallFontSize = 13;
const double _captionGap = 8;
const double _contentGap = 6;
const double _editorInset = 4;
const double _editingBorder = 1.5;
const double _maxRowHeaderShare = 0.4;
const double _bubbleMaxWidth = 288;
const EdgeInsets _bubblePadding = EdgeInsets.symmetric(
  horizontal: 8,
  vertical: 4.8,
);

/// A column of a [DataGrid].
@immutable
class DataGridColumn {
  /// A column named [label], with [header] as its visible content.
  const DataGridColumn({
    required this.id,
    required this.label,
    this.header,
    this.secondaryLabel,
    this.editor,
  }) : assert(
         secondaryLabel != '',
         'A secondary column needs words for its secondaryLabel.',
       );

  /// The stable id, unique in the grid.
  final String id;

  /// The accessible name, such as "Monday 6 October".
  final String label;

  /// The visible header content. It holds the words of [label],
  /// abbreviated if needed. Defaults to [label] as text.
  final Widget? header;

  /// The application's words for the secondary emphasis, shown in the
  /// column header and read with each cell. Non-null gives every body cell
  /// of the column the secondary emphasis: allowed but outside the usual
  /// schedule, such as a weekend.
  final String? secondaryLabel;

  /// Whether every body cell of the column has the secondary emphasis.
  bool get secondary => secondaryLabel != null;

  /// The column's own editor settings, in place of the grid's.
  final DataGridEditor? editor;
}

/// A body row of a [DataGrid].
@immutable
class DataGridRow {
  /// A row whose header shows [code] and [name].
  const DataGridRow({required this.id, required this.name, this.code});

  /// The stable id, unique in the grid.
  final String id;

  /// The name, such as "Project X". It truncates visually in a narrow row
  /// header and stays whole in the label and on hover.
  final String name;

  /// A short code shown before the name, such as "PX-12".
  final String? code;

  /// The row's label: the code and the name.
  String get label => [?code, name].where((s) => s.isNotEmpty).join(' ');
}

/// What a [DataGrid.cell] accessor returns for a body cell.
@immutable
class DataGridCell {
  /// A cell of [kind] holding [value].
  const DataGridCell({
    required this.kind,
    this.value,
    this.badge,
    this.secondaryLabel,
    this.error,
  }) : assert(
         secondaryLabel != '',
         'A secondary cell needs words for its secondaryLabel.',
       );

  /// How the cell behaves.
  final DataGridCellKind kind;

  /// The number. Null is "no value", distinct from 0.
  final double? value;

  /// Summary cells: visible and read text, such as "2 entries".
  final String? badge;

  /// The application's words for the secondary emphasis, such as
  /// "Non-working day", shown in the cell and read with it. Non-null gives
  /// the cell the secondary emphasis; it keeps its kind: an editable cell
  /// stays editable.
  final String? secondaryLabel;

  /// Whether the cell has the secondary emphasis.
  bool get secondary => secondaryLabel != null;

  /// The application's validation message, such as "More than 24 hours on
  /// this day".
  final String? error;
}

/// How the cells of a [DataGrid] edit their numbers.
@immutable
class DataGridEditor {
  /// Editor settings. Anything but a positive [step] counts as 1.
  const DataGridEditor({
    this.min,
    this.max,
    this.step = 1,
    this.locale,
    this.symbols,
  });

  /// The smallest valid number.
  final double? min;

  /// The largest valid number.
  final double? max;

  /// The step of the arrow keys; typed numbers are checked against it.
  final double step;

  /// The locale that reads and writes numbers; defaults to the app's.
  final Locale? locale;

  /// The symbols that read and write numbers, in place of the locale's.
  final NumberSymbols? symbols;
}

/// A cell of a [DataGrid], by its ids.
@immutable
class DataGridCellRef {
  /// The cell in row [rowId] and column [columnId].
  const DataGridCellRef({required this.rowId, required this.columnId});

  /// The row's id.
  final String rowId;

  /// The column's id.
  final String columnId;

  @override
  bool operator ==(Object other) =>
      other is DataGridCellRef &&
      other.rowId == rowId &&
      other.columnId == columnId;

  @override
  int get hashCode => Object.hash(rowId, columnId);

  @override
  String toString() => 'DataGridCellRef($rowId, $columnId)';
}

/// A committed change, reported by [DataGrid.onCellChanged].
@immutable
class DataGridCellChange {
  /// The change of the cell in [rowId] and [columnId].
  const DataGridCellChange({
    required this.rowId,
    required this.columnId,
    required this.value,
    required this.previousValue,
    this.error,
  });

  /// The row's id.
  final String rowId;

  /// The column's id.
  final String columnId;

  /// The committed number; null is empty.
  final double? value;

  /// The number before the commit, for an application's undo.
  final double? previousValue;

  /// The editor's own validity error: out of range or off the step. A
  /// number that does not parse is never committed.
  final NumberFieldError? error;
}

/// Whether a [DataGrid] derives its totals.
enum DataGridTotals {
  /// A Total column and a totals row.
  derived,

  /// No totals: the application shows its own.
  none,
}

/// Where a [DataGrid]'s Total column sits.
enum DataGridRowTotalPosition {
  /// After the data columns.
  end,

  /// Right after the row header.
  start,
}

// The parts of the grid that are not the application's columns and rows.
final class _Part {
  const _Part(this.name);

  final String name;

  @override
  String toString() => name;
}

const _Part _rowHeaderColumn = _Part('row header');
const _Part _totalColumn = _Part('total column');
const _Part _totalsRow = _Part('totals row');

typedef _Key = (Object, Object);

/// An editable data grid: a table whose cells take keyboard focus one at a
/// time and whose number cells are edited in place, following the WAI-ARIA
/// Grid pattern (docs/editable-grid-spec.md).
///
/// The data is the application's: [columns], [rows] and the [cell]
/// accessor. The grid holds the active cell, the mode and the draft, and a
/// copy of each committed number until the application's data catches up.
/// [onCellChanged] reports once per commit, after the totals are updated,
/// with the number before it; a commit that lands on the same number
/// reports nothing.
///
/// The grid is one tab stop. In navigation mode the arrows move between
/// cells without wrapping, mirrored in right-to-left text; Home, End,
/// Control+Home, Control+End, Page Up and Page Down jump. Enter, F2, a digit
/// of the locale (Arabic-Indic and Persian digits in any locale), Backspace
/// and Delete start editing an editable cell; Enter or a press on a summary
/// cell calls [onCellActivated]. In editing mode the arrows Up and Down step
/// the draft, Enter and F2 commit and stay on the cell, Tab and Shift+Tab
/// commit and edit the next or previous editable cell, and leave the grid
/// after the last one, and Escape puts the committed number back. A draft
/// that does not parse never commits and keeps editing mode with its error;
/// a number out of range or off the step commits and keeps its error.
/// Escape in navigation mode is left to an enclosing dialog.
///
/// [onCellDetails] adds a details button to the cells [hasDetails] allows
/// (every editable and summary cell by default), out of the tab order, with
/// a custom semantics action and the optional [detailsShortcut].
///
/// Each cell reads one label composed from the column label, the row label,
/// the value text, the badge, the secondary label and the error, in the
/// order of the message catalog; the table, its rows, cells and column
/// headers carry the table roles of Flutter's semantics as well. The column
/// header row sticks to the top, the totals row to the bottom and the row
/// header column to the inline start; the grid scrolls on both axes inside
/// its own area.
class DataGrid extends StatefulWidget {
  /// A grid of [rows] in [columns], each cell from [cell].
  const DataGrid({
    super.key,
    required this.label,
    required this.columns,
    required this.rows,
    required this.cell,
    this.hideLabel = false,
    this.editor = const DataGridEditor(),
    this.formatValue,
    this.valueText,
    this.totals = DataGridTotals.derived,
    this.rowTotalPosition = DataGridRowTotalPosition.end,
    this.totalError,
    this.rowTotalError,
    this.hasDetails,
    this.detailsShortcut,
    this.detailsShortcutLabel,
    this.activationHint,
    this.rowHeaderLabel,
    this.rowHeaderWidth,
    this.onCellChanged,
    this.onCellActivated,
    this.onCellDetails,
  });

  /// The grid's name, shown above it unless [hideLabel].
  final String label;

  /// Hides the label while it still names the grid.
  final bool hideLabel;

  /// The data columns, in order.
  final List<DataGridColumn> columns;

  /// The body rows, in order.
  final List<DataGridRow> rows;

  /// The cell in a row and a column, by their ids.
  final DataGridCell Function(String rowId, String columnId) cell;

  /// How editable cells edit; a column's own [DataGridColumn.editor] wins.
  final DataGridEditor editor;

  /// The visible text of a number. Defaults to the locale's format.
  final String Function(double value)? formatValue;

  /// The read text of a number or of null, such as "5 hours". Defaults to
  /// the visible text, and the catalog's "empty" for null.
  final String Function(double? value)? valueText;

  /// Whether the grid shows a Total column and a totals row.
  final DataGridTotals totals;

  /// Where the Total column sits.
  final DataGridRowTotalPosition rowTotalPosition;

  /// The error of a column's total, such as "More than 24 hours on this
  /// day".
  final String? Function(String columnId)? totalError;

  /// The error of a row's total.
  final String? Function(String rowId)? rowTotalError;

  /// Whether a body cell offers details; defaults to every editable and
  /// summary cell.
  final bool Function(String rowId, String columnId)? hasDetails;

  /// The key combination that opens the active cell's details, such as
  /// Alt+Enter. The grid has none by default.
  final SingleActivator? detailsShortcut;

  /// The shortcut's text in the cell's hint. Defaults to its keys, such as
  /// "Alt+Enter".
  final String? detailsShortcutLabel;

  /// The hint of a summary cell, such as "Show entries".
  final String? activationHint;

  /// The header over the row headers, such as "Project".
  final String? rowHeaderLabel;

  /// The width of the row header column at text scale 1; it grows with the
  /// text. Defaults to the widest row header, at most 40% of the grid.
  final double? rowHeaderWidth;

  /// Called once per commit that moves a number, after the totals are
  /// updated.
  final ValueChanged<DataGridCellChange>? onCellChanged;

  /// Called when a summary cell is activated by Enter or a press.
  final ValueChanged<DataGridCellRef>? onCellActivated;

  /// Called by a cell's details button, its custom action or the shortcut.
  final ValueChanged<DataGridCellRef>? onCellDetails;

  @override
  State<DataGrid> createState() => DataGridState();
}

/// The state of a [DataGrid]: the active cell, the mode, the draft and the
/// committed numbers.
class DataGridState extends State<DataGrid> {
  final TextEditingController _draft = TextEditingController();
  final GlobalKey<EditableTextState> _editableKey =
      GlobalKey<EditableTextState>();
  final GlobalKey _viewportKey = GlobalKey();
  final ScrollController _vertical = ScrollController();
  final ScrollController _horizontal = ScrollController();
  final Map<_Key, FocusNode> _nodes = {};
  final Map<_Key, ({double? value, double? consumer})> _commits = {};
  final Map<_Key, ({double? value, NumberFieldError error})> _editorErrors = {};

  FocusNode _editorFocus = FocusNode(debugLabel: 'DataGrid editor');
  _Key? _active;
  _Key? _editing;
  bool _touch = false;
  List<Object> _rowKeys = const [];
  List<Object> _columnKeys = const [];
  Map<String, DataGridColumn> _columnById = const {};
  Map<String, DataGridRow> _rowById = const {};
  Map<_Key, String> _errors = const {};

  /// The body cell that holds the grid's tab stop, or null when a header
  /// or a total holds it.
  DataGridCellRef? get activeCell => _refOf(_active);

  /// Whether a cell is being edited.
  bool get isEditing => _editing != null;

  /// The number a body cell shows: the last commit, until the application's
  /// data changes it.
  double? valueOf(String rowId, String columnId) =>
      _valueOf((rowId, columnId), widget.cell(rowId, columnId));

  /// A row's total, from the numbers the cells show.
  double? rowTotal(String rowId) =>
      sumGridValues([for (final c in widget.columns) valueOf(rowId, c.id)]);

  /// A column's total, from the numbers the cells show.
  double? columnTotal(String columnId) =>
      sumGridValues([for (final r in widget.rows) valueOf(r.id, columnId)]);

  /// The sum of every body cell.
  double? get grandTotal => sumGridValues([
    for (final r in widget.rows)
      for (final c in widget.columns) valueOf(r.id, c.id),
  ]);

  bool get _derived => widget.totals == DataGridTotals.derived;

  @override
  void initState() {
    super.initState();
    _editorFocus.addListener(_editorFocusChanged);
    _keys();
  }

  @override
  void didUpdateWidget(DataGrid oldWidget) {
    super.didUpdateWidget(oldWidget);
    final rowsBefore = _rowKeys;
    final columnsBefore = _columnKeys;
    _keys();
    final active = _active;
    if (active != null) {
      final next = gridResolveActive<Object, Object>(
        active,
        rowsBefore: rowsBefore,
        columnsBefore: columnsBefore,
        rowsAfter: _rowKeys,
        columnsAfter: _columnKeys,
      );
      if (next != active) {
        final hadFocus = _gridHasFocus;
        _active = next;
        if (hadFocus && next != null) _focusAfterFrame(next);
      }
    }
    final editing = _editing;
    if (editing != null && !_exists(editing)) _editing = null;
    _pruneNodes();
  }

  @override
  void dispose() {
    _draft.dispose();
    _editorFocus.dispose();
    _vertical.dispose();
    _horizontal.dispose();
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  // ------------------------------------------------------------- structure

  void _keys() {
    assert(() {
      final rowIds = widget.rows.map((r) => r.id).toSet();
      final columnIds = widget.columns.map((c) => c.id).toSet();
      if (rowIds.length != widget.rows.length) {
        throw FlutterError('DataGrid row ids must be unique.');
      }
      if (columnIds.length != widget.columns.length) {
        throw FlutterError('DataGrid column ids must be unique.');
      }
      return true;
    }());
    final start = widget.rowTotalPosition == DataGridRowTotalPosition.start;
    _rowKeys = [
      for (final row in widget.rows) row.id,
      if (_derived) _totalsRow,
    ];
    _columnById = {for (final column in widget.columns) column.id: column};
    _rowById = {for (final row in widget.rows) row.id: row};
    _columnKeys = [
      _rowHeaderColumn,
      if (_derived && start) _totalColumn,
      for (final column in widget.columns) column.id,
      if (_derived && !start) _totalColumn,
    ];
  }

  bool _exists(_Key key) =>
      _rowKeys.contains(key.$1) && _columnKeys.contains(key.$2);

  GridPos? _posOf(_Key key) {
    final row = _rowKeys.indexOf(key.$1);
    final column = _columnKeys.indexOf(key.$2);
    return row < 0 || column < 0 ? null : GridPos(row, column);
  }

  _Key _keyAt(GridPos pos) => (_rowKeys[pos.row], _columnKeys[pos.column]);

  DataGridCellRef? _refOf(_Key? key) {
    if (key == null) return null;
    final (row, column) = key;
    if (row is! String || column is! String) return null;
    return DataGridCellRef(rowId: row, columnId: column);
  }

  /// The body cell at [key], or null for a header or a total.
  DataGridCell? _bodyCell(_Key key) {
    final (row, column) = key;
    return row is String && column is String ? widget.cell(row, column) : null;
  }

  DataGridCellKind _kindOf(_Key key) =>
      _bodyCell(key)?.kind ?? DataGridCellKind.readOnly;

  bool _hasDetails(_Key key) {
    if (widget.onCellDetails == null) return false;
    final (row, column) = key;
    if (row is! String || column is! String) return false;
    final custom = widget.hasDetails;
    if (custom != null) return custom(row, column);
    return _kindOf(key) != DataGridCellKind.readOnly;
  }

  GridShape get _shape => GridShape(
    rowCount: _rowKeys.length,
    columnCount: _columnKeys.length,
    kindAt: (pos) => _kindOf(_keyAt(pos)),
    hasDetails: (pos) => _hasDetails(_keyAt(pos)),
  );

  _Key _initialActive() {
    final firstData = _columnKeys.indexWhere((key) => key is String);
    final fallback = GridPos(0, firstData < 0 ? 0 : firstData);
    return _keyAt(gridInitialActive(_shape, fallback));
  }

  DataGridColumn? _column(Object key) => _columnById[key];

  DataGridRow? _row(Object key) => _rowById[key];

  // ---------------------------------------------------------------- values

  double? _valueOf(_Key key, DataGridCell cell) {
    final commit = _commits[key];
    if (commit != null) {
      // The application changed the value since the commit: its value wins.
      if (commit.consumer == cell.value) return commit.value;
      _commits.remove(key);
    }
    return cell.value;
  }

  DataGridEditor _editorOf(Object column) =>
      _column(column)?.editor ?? widget.editor;

  NumberSymbols _symbolsOf(DataGridEditor editor) =>
      editor.symbols ??
      NumberSymbols.forLocale(resolveLocale(context, editor.locale));

  double _stepOf(DataGridEditor editor) =>
      editor.step.isFinite && editor.step > 0 ? editor.step : 1;

  double? _bound(double? value) =>
      value != null && value.isFinite ? value : null;

  String _visible(double? value, NumberSymbols symbols) {
    if (value == null) return '';
    return widget.formatValue?.call(value) ?? formatNumber(value, symbols);
  }

  String _valueText(double? value, NumberSymbols symbols) {
    final custom = widget.valueText;
    if (custom != null) return custom(value);
    if (value == null) return InvisibleTheme.of(context).messages.dataGridEmpty;
    return _visible(value, symbols);
  }

  String? _editorErrorText(_Key key, double? value) {
    final entry = _editorErrors[key];
    if (entry == null) return null;
    if (entry.value != value) {
      _editorErrors.remove(key);
      return null;
    }
    return _validity(entry.error, _editorOf(key.$2));
  }

  String? _validity(NumberFieldError? error, DataGridEditor editor) {
    final symbols = _symbolsOf(editor);
    return numberValidityMessage(
      InvisibleTheme.of(context).messages,
      error,
      format: (n) => formatNumber(n, symbols),
      min: _bound(editor.min),
      max: _bound(editor.max),
      step: _stepOf(editor),
    );
  }

  NumberParseResult _readDraft(DataGridEditor editor) => readNumber(
    _draft.text,
    _symbolsOf(editor),
    _bound(editor.min),
    _bound(editor.max),
    _stepOf(editor),
  );

  // ----------------------------------------------------------------- focus

  FocusNode _nodeFor(_Key key) =>
      _nodes.putIfAbsent(key, () => FocusNode(debugLabel: 'DataGrid $key'));

  bool get _gridHasFocus =>
      _editorFocus.hasFocus || _nodes.values.any((node) => node.hasFocus);

  void _pruneNodes() {
    final stale = [
      for (final entry in _nodes.entries)
        if (!_exists(entry.key)) entry.key,
    ];
    if (stale.isEmpty) return;
    final nodes = [for (final key in stale) _nodes.remove(key)!];
    // Disposed after the frame that unmounts their cells.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (final node in nodes) {
        node.dispose();
      }
    });
  }

  void _focusAfterFrame(_Key key) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_exists(key)) return;
      _nodeFor(key).requestFocus();
      _reveal(key);
    });
  }

  void _reveal(_Key key) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final target = _nodes[key]?.context?.findRenderObject();
      final viewport = _viewportKey.currentContext?.findRenderObject();
      if (target == null || viewport is! RenderGridViewport) return;
      final instant = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
      viewport.revealNearest(target, animate: !instant);
    });
  }

  void _moveTo(_Key key) {
    if (_active != key) setState(() => _active = key);
    _nodeFor(key).requestFocus();
    _reveal(key);
  }

  void _cellFocusChanged(_Key key, bool focused) {
    if (!focused) return;
    if (_active != key && _editing == null) setState(() => _active = key);
    // A draft kept when focus left the grid resumes when it comes back.
    if (_editing == key) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && _editing == key) _editorFocus.requestFocus();
      });
    }
    _reveal(key);
  }

  // --------------------------------------------------------------- editing

  void _startEdit(
    _Key key,
    GridEditSeed seed, {
    String? text,
    Offset? caretAt,
  }) {
    final cell = _bodyCell(key);
    if (cell == null) return;
    final symbols = _symbolsOf(_editorOf(key.$2));
    final committed = formatNumber(_valueOf(key, cell), symbols);
    final draft = switch (seed) {
      GridEditSeed.select || GridEditSeed.end => committed,
      GridEditSeed.replace => text ?? '',
      GridEditSeed.clear => '',
    };
    // A fresh node per edit: the previous one leaves with its cell, and its
    // focus loss must not end this edit.
    final previous = _editorFocus;
    previous.removeListener(_editorFocusChanged);
    _editorFocus = FocusNode(debugLabel: 'DataGrid editor')
      ..addListener(_editorFocusChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) => previous.dispose());
    setState(() {
      _active = key;
      _editing = key;
      _draft.value = TextEditingValue(
        text: draft,
        selection: seed == GridEditSeed.select
            ? TextSelection(baseOffset: 0, extentOffset: draft.length)
            : TextSelection.collapsed(offset: draft.length),
      );
    });
    final focus = _editorFocus;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _editing != key) return;
      focus.requestFocus();
      if (caretAt != null) {
        _editableKey.currentState?.renderEditable.selectPositionAt(
          from: caretAt,
          cause: SelectionChangedCause.tap,
        );
      }
      _reveal(key);
    });
  }

  /// Commits the draft. False when it does not parse: editing goes on.
  bool _commit() {
    final key = _editing;
    if (key == null) return true;
    final cell = _bodyCell(key);
    if (cell == null) {
      setState(() => _editing = null);
      return true;
    }
    final read = _readDraft(_editorOf(key.$2));
    // Text that does not parse stays as typed: committing it would lose
    // what the user wrote.
    if (read.error == NumberFieldError.parse) {
      setState(() {});
      return false;
    }
    final value = read.value;
    final previous = _valueOf(key, cell);
    final errorsBefore = _errors;
    setState(() {
      _editing = null;
      _commits[key] = (value: value, consumer: cell.value);
      final error = read.error;
      if (error != null) {
        _editorErrors[key] = (value: value, error: error);
      } else {
        _editorErrors.remove(key);
      }
    });
    if (value != previous) {
      final (row, column) = key;
      widget.onCellChanged?.call(
        DataGridCellChange(
          rowId: row as String,
          columnId: column as String,
          value: value,
          previousValue: previous,
          error: read.error,
        ),
      );
    }
    _announceNewErrors(errorsBefore);
    return true;
  }

  void _cancel() {
    final key = _editing;
    if (key == null) return;
    setState(() => _editing = null);
    _nodeFor(key).requestFocus();
  }

  void _step(int direction) {
    final key = _editing;
    if (key == null) return;
    final editor = _editorOf(key.$2);
    final cell = _bodyCell(key);
    final base = _readDraft(editor).value ?? _valueOf(key, cell!);
    final next = snapToStep(
      base,
      direction,
      _bound(editor.min),
      _bound(editor.max),
      _stepOf(editor),
    );
    final text = formatNumber(next, _symbolsOf(editor));
    setState(() {
      _draft.value = TextEditingValue(
        text: text,
        selection: TextSelection.collapsed(offset: text.length),
      );
    });
  }

  void _editorFocusChanged() {
    if (_editorFocus.hasFocus || _editing == null) return;
    // Focus left the editor without a grid key: a press elsewhere, another
    // control. The draft commits when it parses; the active cell stays.
    _commit();
  }

  /// Discards the draft and the committed copies when an enclosing form
  /// resets: the application passes its own data back in (ADR 0012).
  void _formReset() {
    final editing = _editing;
    final hadFocus = _editorFocus.hasFocus;
    setState(() {
      _editing = null;
      _commits.clear();
      _editorErrors.clear();
    });
    if (editing != null && hadFocus) _nodeFor(editing).requestFocus();
  }

  // -------------------------------------------------------------- commands

  void _activate(_Key key) {
    final ref = _refOf(key);
    if (ref != null) widget.onCellActivated?.call(ref);
  }

  void _details(_Key key) {
    final ref = _refOf(key);
    if (ref != null) widget.onCellDetails?.call(ref);
  }

  KeyEventResult _onKey(_Key key, KeyEvent event) {
    if (event is KeyUpEvent) return KeyEventResult.ignored;
    final pos = _posOf(key);
    if (pos == null) return KeyEventResult.ignored;
    final keyboard = HardwareKeyboard.instance;
    final ctrl = keyboard.isControlPressed;
    final meta = keyboard.isMetaPressed;
    final alt = keyboard.isAltPressed;
    final editing = _editing == key;
    final editor = _editorOf(key.$2);
    final min = _bound(editor.min);
    final symbols = _symbolsOf(editor);
    final shortcut = widget.detailsShortcut;
    final command = gridKeyCommand(
      editing: editing,
      active: pos,
      key: GridKey(
        gridKeyName(
          event.logicalKey,
          character: event.character,
          command: ctrl || meta || alt,
        ),
        ctrl: ctrl,
        meta: meta,
        alt: alt,
        shift: keyboard.isShiftPressed,
        composing: editing && isComposing(_draft.value),
      ),
      shape: _shape,
      direction: Directionality.of(context),
      pageRows: _pageRows,
      accepts: (char) =>
          gridAcceptsCharacter(char, symbols, min == null || min < 0),
      detailsShortcut: shortcut == null ? null : gridShortcutOf(shortcut),
    );
    switch (command) {
      case GridNone():
        return KeyEventResult.ignored;
      case GridMove(:final to):
        _moveTo(_keyAt(to));
      case GridEdit(:final seed, :final text):
        _startEdit(key, seed, text: text);
      case GridCommit(:final then, :final to, :final forward):
        if (!_commit()) return KeyEventResult.handled;
        switch (then) {
          case GridThen.stay:
            _moveTo(key);
          case GridThen.next || GridThen.previous:
            _startEdit(_keyAt(to!), GridEditSeed.select);
          case GridThen.leave:
            final node = _nodeFor(key);
            node.requestFocus();
            // From the cell, once the editor has left: the grid's other
            // cells are out of the tab order, so focus leaves the grid.
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted || !node.hasPrimaryFocus) return;
              forward ? node.nextFocus() : node.previousFocus();
            });
        }
      case GridCancel():
        _cancel();
      case GridActivate():
        _activate(key);
      case GridDetails(:final commitFirst):
        if (commitFirst) {
          if (!_commit()) return KeyEventResult.handled;
          _moveTo(key);
        }
        _details(key);
      case GridStep(:final direction):
        _step(direction);
    }
    return KeyEventResult.handled;
  }

  int get _pageRows {
    final viewport = _viewportKey.currentContext?.findRenderObject();
    return viewport is RenderGridViewport && viewport.hasSize
        ? viewport.pageRows
        : 1;
  }

  /// A press on a cell, or its semantics tap: an editable cell edits, a
  /// summary cell activates, a read-only cell becomes active.
  void _press(_Key key, {Offset? at}) {
    final editing = _editing;
    if (editing == key) return;
    // A draft that does not parse keeps its cell: nothing typed is lost.
    if (editing != null && !_commit()) {
      _editorFocus.requestFocus();
      return;
    }
    switch (_kindOf(key)) {
      case DataGridCellKind.editable:
        _startEdit(key, GridEditSeed.end, caretAt: at);
      case DataGridCellKind.summary:
        _moveTo(key);
        _activate(key);
      case DataGridCellKind.readOnly:
        _moveTo(key);
    }
  }

  // ---------------------------------------------------------- announcement

  /// Announces, once and politely, each error that appeared with the
  /// commit, on its cell or on a total, after the application has had the
  /// frame to answer with its own.
  void _announceNewErrors(Map<_Key, String> before) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final messages = InvisibleTheme.of(context).messages;
      for (final MapEntry(:key, :value) in _errors.entries) {
        if (before[key] == value) continue;
        final (row, column) = key;
        announce(
          context,
          gridErrorAnnouncement(
            _column(column)?.label ?? messages.dataGridTotal,
            _row(row)?.label ?? messages.dataGridTotal,
            value,
            messages,
          ),
        );
      }
    });
  }

  // ----------------------------------------------------------------- build

  String _shortcutText(SingleActivator activator) {
    final label = widget.detailsShortcutLabel;
    if (label != null) return label;
    return [
      if (activator.control) 'Ctrl',
      if (activator.alt) 'Alt',
      if (activator.shift) 'Shift',
      if (activator.meta) 'Meta',
      activator.trigger.keyLabel,
    ].join('+');
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final colors = theme.colors;
    final direction = Directionality.of(context);
    final gridSymbols = _symbolsOf(widget.editor);
    // A grid with no row has no cell to hold the tab stop.
    final active = _rowKeys.isEmpty
        ? (_active = null)
        : _active != null && _exists(_active!)
        ? _active!
        : (_active = _initialActive());

    // Every body value once, for the cells and the totals.
    final cells = <_Key, DataGridCell>{};
    final values = <List<double?>>[];
    for (final row in widget.rows) {
      values.add([
        for (final column in widget.columns)
          _valueOf((
            row.id,
            column.id,
          ), cells[(row.id, column.id)] = widget.cell(row.id, column.id)),
      ]);
    }
    final totals = gridTotals(values);
    final errors = <_Key, String>{};

    String? shortcutHint(_Key key) {
      final shortcut = widget.detailsShortcut;
      if (shortcut == null || !_hasDetails(key)) return null;
      return InvisibleMessages.fill(messages.dataGridDetailsShortcut, {
        'shortcut': _shortcutText(shortcut),
      });
    }

    String? joinHint(List<String?> parts) {
      final text = parts
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .join(messages.dataGridSeparator);
      return text.isEmpty ? null : text;
    }

    Widget bodyCell(
      DataGridRow row,
      int rowIndex,
      DataGridColumn column,
      int columnIndex,
    ) {
      final _Key key = (row.id, column.id);
      final cell = cells[key]!;
      final value = values[rowIndex][columnIndex];
      final editor = _editorOf(column.id);
      final symbols = _symbolsOf(editor);
      final editing = _editing == key;
      final secondary = cell.secondary || column.secondary;
      final secondaryLabel = cell.secondary
          ? cell.secondaryLabel
          : column.secondaryLabel;
      String joined(List<String?> parts) => parts
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .join(messages.dataGridSeparator);
      // Only committed errors are announced; the draft's shows as typed.
      final committedError = joined([cell.error, _editorErrorText(key, value)]);
      if (committedError.isNotEmpty) errors[key] = committedError;
      // While editing, the draft's own error shows as typed; the cell and
      // its editor follow each keystroke without rebuilding the grid.
      String? liveError() {
        final error = editing
            ? joined([cell.error, _validity(_readDraft(editor).error, editor)])
            : committedError;
        return error.isEmpty ? null : error;
      }

      String liveLabel() => gridCellLabel((
        kind: GridLabelKind.cell,
        column: column.label,
        row: row.label,
        value: _valueText(value, symbols),
        badge: cell.badge,
        secondary: secondary ? secondaryLabel : null,
        error: liveError(),
      ), messages);
      final details = _hasDetails(key);
      final min = _bound(editor.min);
      return _GridCell(
        key: ValueKey(key),
        focusNode: _nodeFor(key),
        tabStop: active == key,
        label: liveLabel(),
        liveLabel: editing ? liveLabel : null,
        liveError: editing ? liveError : null,
        listenable: editing ? _draft : null,
        hint: joinHint([
          switch (cell.kind) {
            DataGridCellKind.editable => messages.dataGridEdit,
            DataGridCellKind.summary => widget.activationHint,
            DataGridCellKind.readOnly => null,
          },
          shortcutHint(key),
        ]),
        readOnly: cell.kind != DataGridCellKind.editable,
        error: liveError(),
        surface: secondary
            ? colors.gridCellSecondarySurface
            : colors.background,
        align: AlignmentDirectional.centerEnd,
        onKey: (event) => _onKey(key, event),
        onFocusChange: (focused) => _cellFocusChanged(key, focused),
        onPress: editing ? null : (at) => _press(key, at: at),
        semanticsTap: cell.kind == DataGridCellKind.readOnly
            ? null
            : () => _press(key),
        onPointerKind: (touch) => _touch = touch,
        editing: editing,
        details: details
            ? _DetailsSpec(
                label: gridDetailsLabel(column.label, row.label, messages),
                actionLabel: messages.dataGridDetails,
                showOnActive:
                    _touch ||
                    theme.touchPlatform ||
                    theme.density == InvisibleDensity.touch,
                onPressed: () => _details(key),
              )
            : null,
        content: editing
            ? _Editor(
                controller: _draft,
                focusNode: _editorFocus,
                editableKey: _editableKey,
                label: liveLabel,
                invalid: () => liveError() != null,
                allowNegative: min == null || min < 0,
                onSubmitted: () {
                  if (_commit()) _moveTo(key);
                },
                stepText: (direction) => formatNumber(
                  snapToStep(
                    _readDraft(editor).value ?? value,
                    direction,
                    min,
                    _bound(editor.max),
                    _stepOf(editor),
                  ),
                  symbols,
                ),
                onStep: _step,
              )
            : _CellText(
                value: _visible(value, symbols),
                badge: cell.badge,
                secondaryLabel: cell.secondary ? cell.secondaryLabel : null,
              ),
      );
    }

    // The cells the grid derives: row headers and totals, all read-only.
    Widget derivedCell(
      _Key key, {
      required GridLabelParts label,
      required Widget content,
      bool rowHeader = false,
      bool emphasis = false,
    }) {
      final error = label.error;
      if (error != null && error.isNotEmpty) errors[key] = error;
      return _GridCell(
        key: ValueKey(key),
        focusNode: _nodeFor(key),
        tabStop: active == key,
        label: gridCellLabel(label, messages),
        readOnly: true,
        error: error == null || error.isEmpty ? null : error,
        surface: colors.background,
        align: rowHeader
            ? AlignmentDirectional.centerStart
            : AlignmentDirectional.centerEnd,
        onKey: (event) => _onKey(key, event),
        onFocusChange: (focused) => _cellFocusChanged(key, focused),
        onPress: (at) => _press(key, at: at),
        onPointerKind: (touch) => _touch = touch,
        emphasis: emphasis,
        content: content,
      );
    }

    Widget total(
      _Key key,
      GridLabelKind kind,
      double? value, {
      String? column,
      String? row,
      String? error,
      bool emphasis = true,
    }) => derivedCell(
      key,
      label: (
        kind: kind,
        column: column,
        row: row,
        value: _valueText(value, gridSymbols),
        badge: null,
        secondary: null,
        error: error,
      ),
      emphasis: emphasis,
      content: _CellText(value: _visible(value, gridSymbols)),
    );

    final start = widget.rowTotalPosition == DataGridRowTotalPosition.start;
    final header = GridRow(
      key: const ValueKey('header row'),
      cells: [
        for (final column in _columnKeys)
          if (column == _rowHeaderColumn)
            _HeaderCell(
              key: const ValueKey(_rowHeaderColumn),
              label: widget.rowHeaderLabel ?? '',
              align: AlignmentDirectional.centerStart,
              child: Text(widget.rowHeaderLabel ?? ''),
            )
          else if (column == _totalColumn)
            _HeaderCell(
              key: const ValueKey(_totalColumn),
              label: messages.dataGridTotal,
              child: Text(messages.dataGridTotal),
            )
          else
            _columnHeader(_column(column)!, messages),
      ],
    );

    final body = <GridRow>[];
    for (final (rowIndex, row) in widget.rows.indexed) {
      final rowTotal = _derived
          ? total(
              (row.id, _totalColumn),
              GridLabelKind.rowTotal,
              totals.rows[rowIndex],
              row: row.label,
              error: widget.rowTotalError?.call(row.id),
              emphasis: false,
            )
          : null;
      body.add(
        GridRow(
          key: ValueKey(row.id),
          cells: [
            derivedCell(
              (row.id, _rowHeaderColumn),
              rowHeader: true,
              label: (
                kind: GridLabelKind.rowHeader,
                column: null,
                row: row.label,
                value: _derived
                    ? _valueText(totals.rows[rowIndex], gridSymbols)
                    : null,
                badge: null,
                secondary: null,
                error: null,
              ),
              content: _RowHeaderText(code: row.code, name: row.name),
            ),
            if (start) ?rowTotal,
            for (final (columnIndex, column) in widget.columns.indexed)
              bodyCell(row, rowIndex, column, columnIndex),
            if (!start) ?rowTotal,
          ],
        ),
      );
    }

    GridRow? totalsRow;
    if (_derived) {
      final grand = total(
        (_totalsRow, _totalColumn),
        GridLabelKind.grandTotal,
        totals.grand,
      );
      totalsRow = GridRow(
        key: const ValueKey(_totalsRow),
        cells: [
          derivedCell(
            (_totalsRow, _rowHeaderColumn),
            rowHeader: true,
            emphasis: true,
            label: (
              kind: GridLabelKind.rowHeader,
              column: null,
              row: messages.dataGridTotal,
              value: null,
              badge: null,
              secondary: null,
              error: null,
            ),
            content: Text(messages.dataGridTotal),
          ),
          if (start) grand,
          for (final (columnIndex, column) in widget.columns.indexed)
            total(
              (_totalsRow, column.id),
              GridLabelKind.columnTotal,
              totals.columns[columnIndex],
              column: column.label,
              error: widget.totalError?.call(column.id),
            ),
          if (!start) grand,
        ],
      );
    }
    _errors = errors;

    final grid = FocusTraversalGroup(
      child: TwoDimensionalScrollable(
        horizontalDetails: ScrollableDetails.horizontal(
          controller: _horizontal,
          reverse: direction == TextDirection.rtl,
        ),
        verticalDetails: ScrollableDetails.vertical(controller: _vertical),
        diagonalDragBehavior: DiagonalDragBehavior.free,
        viewportBuilder: (context, vertical, horizontal) => GridViewport(
          key: _viewportKey,
          vertical: vertical,
          horizontal: horizontal,
          textDirection: direction,
          label: widget.label,
          pinLastRow: _derived,
          rowHeaderWidth: widget.rowHeaderWidth == null
              ? null
              : MediaQuery.textScalerOf(context).scale(widget.rowHeaderWidth!),
          maxRowHeaderShare: _maxRowHeaderShare,
          rows: [header, ...body, ?totalsRow],
        ),
      ),
    );

    final style = theme.textStyle.copyWith(
      color: colors.text,
      fontSize: _fontSize,
    );
    return FormBinding<Object?>(
      value: null,
      restore: _formReset,
      builder: (_) => DefaultTextStyle(
        style: style,
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (widget.hideLabel) return grid;
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: _captionGap),
                  // The table node carries the name.
                  child: ExcludeSemantics(
                    child: Text(
                      widget.label,
                      style: style.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                if (constraints.hasBoundedHeight)
                  Flexible(child: grid)
                else
                  grid,
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _columnHeader(DataGridColumn column, InvisibleMessages messages) {
    final secondary = column.secondary ? column.secondaryLabel : null;
    final theme = InvisibleTheme.of(context);
    return _HeaderCell(
      key: ValueKey(column.id),
      label: [column.label, ?secondary].join(messages.dataGridSeparator),
      surface: secondary == null ? null : theme.colors.gridCellSecondarySurface,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          column.header ?? Text(column.label, textAlign: TextAlign.end),
          if (secondary != null)
            Text(
              secondary,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: _smallFontSize,
                fontWeight: FontWeight.w400,
                color: theme.colors.textSecondary,
              ),
            ),
        ],
      ),
    );
  }
}

/// A column header: visible content, and the column's label in semantics.
class _HeaderCell extends StatelessWidget {
  const _HeaderCell({
    super.key,
    required this.label,
    required this.child,
    this.surface,
    this.align = AlignmentDirectional.centerEnd,
  });

  final String label;
  final Widget child;
  final Color? surface;
  final AlignmentGeometry align;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final style = DefaultTextStyle.of(
      context,
    ).style.copyWith(fontWeight: FontWeight.w600, color: colors.textSecondary);
    return Semantics(
      container: true,
      role: SemanticsRole.columnHeader,
      label: label,
      child: ExcludeSemantics(
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: surface ?? colors.background,
            border: BorderDirectional(
              bottom: BorderSide(color: colors.border, width: 2),
              end: BorderSide(color: colors.border),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: _cellPaddingY,
              horizontal: _cellPaddingX,
            ),
            child: Align(
              alignment: align,
              widthFactor: 1,
              child: DefaultTextStyle(style: style, child: child),
            ),
          ),
        ),
      ),
    );
  }
}

/// A row header's code and name; the name truncates and shows whole on
/// hover.
class _RowHeaderText extends StatelessWidget {
  const _RowHeaderText({required this.code, required this.name});

  final String? code;
  final String name;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final code = this.code;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (code != null && code.isNotEmpty)
          Text(code, style: const TextStyle(fontWeight: FontWeight.w600)),
        Tooltip(
          message: name,
          excludeFromSemantics: true,
          child: Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: colors.textSecondary),
          ),
        ),
      ],
    );
  }
}

/// A cell's visible value, its badge and its own secondary label.
class _CellText extends StatelessWidget {
  const _CellText({required this.value, this.badge, this.secondaryLabel});

  final String value;
  final String? badge;
  final String? secondaryLabel;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final badge = this.badge;
    final secondaryLabel = this.secondaryLabel;
    final small = TextStyle(
      fontSize: _smallFontSize,
      color: colors.textSecondary,
    );
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text.rich(
          TextSpan(
            text: value,
            children: [
              if (badge != null && badge.isNotEmpty)
                TextSpan(
                  text: value.isEmpty ? badge : ' · $badge',
                  style: small,
                ),
            ],
          ),
          textAlign: TextAlign.end,
        ),
        if (secondaryLabel != null)
          Text(secondaryLabel, style: small, textAlign: TextAlign.end),
      ],
    );
  }
}

class _DetailsSpec {
  const _DetailsSpec({
    required this.label,
    required this.actionLabel,
    required this.showOnActive,
    required this.onPressed,
  });

  final String label;
  final String actionLabel;
  final bool showOnActive;
  final VoidCallback onPressed;
}

/// One focusable cell: its semantics, keys, focus ring, hover, error and
/// details button.
class _GridCell extends StatefulWidget {
  const _GridCell({
    super.key,
    required this.focusNode,
    required this.tabStop,
    required this.label,
    required this.readOnly,
    required this.surface,
    required this.align,
    required this.onKey,
    required this.onFocusChange,
    required this.onPointerKind,
    required this.content,
    this.onPress,
    this.semanticsTap,
    this.liveLabel,
    this.liveError,
    this.listenable,
    this.hint,
    this.error,
    this.details,
    this.editing = false,
    this.emphasis = false,
  });

  final FocusNode focusNode;
  final bool tabStop;
  final String label;

  /// While editing: the label and the error as of the latest keystroke,
  /// read again whenever [listenable] notifies.
  final String Function()? liveLabel;
  final String? Function()? liveError;
  final Listenable? listenable;
  final String? hint;
  final bool readOnly;
  final String? error;
  final Color surface;
  final AlignmentGeometry align;
  final KeyEventResult Function(KeyEvent event) onKey;
  final ValueChanged<bool> onFocusChange;
  final void Function(Offset at)? onPress;
  final VoidCallback? semanticsTap;
  final ValueChanged<bool> onPointerKind;
  final _DetailsSpec? details;
  final bool editing;
  final bool emphasis;
  final Widget content;

  @override
  State<_GridCell> createState() => _GridCellState();
}

class _GridCellState extends State<_GridCell> {
  final OverlayPortalController _bubble = OverlayPortalController();
  bool _hovered = false;

  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_focusChanged);
    widget.listenable?.addListener(_focusChanged);
  }

  @override
  void didUpdateWidget(_GridCell oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode.removeListener(_focusChanged);
      widget.focusNode.addListener(_focusChanged);
    }
    if (oldWidget.listenable != widget.listenable) {
      oldWidget.listenable?.removeListener(_focusChanged);
      widget.listenable?.addListener(_focusChanged);
    }
    _syncBubble();
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_focusChanged);
    widget.listenable?.removeListener(_focusChanged);
    super.dispose();
  }

  String? get _error => widget.liveError?.call() ?? widget.error;

  void _focusChanged() {
    if (!mounted) return;
    setState(() {});
    _syncBubble();
  }

  void _hover(bool hovered) {
    if (_hovered == hovered) return;
    setState(() => _hovered = hovered);
    _syncBubble();
  }

  bool get _focused => widget.focusNode.hasFocus;

  // The error message shows on focus and hover; it is always in the label.
  void _syncBubble() {
    final show =
        _error != null &&
        (_hovered || _focused) &&
        Overlay.maybeOf(context) != null;
    if (show == _bubble.isShowing) return;
    // Not during a build: the portal's overlay entry rebuilds then.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final want =
          _error != null &&
          (_hovered || _focused) &&
          Overlay.maybeOf(context) != null;
      want ? _bubble.show() : _bubble.hide();
    });
  }

  Widget _buildBubble(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final box = this.context.findRenderObject();
    if (box is! RenderBox || !box.attached) return const SizedBox.shrink();
    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchorRectIn(context, this.context),
        side: AnchorSide.bottom,
        direction: Directionality.of(context),
        centered: true,
      ),
      child: ExcludeSemantics(
        child: IgnorePointer(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: _bubbleMaxWidth),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colors.emphasisSurface,
                borderRadius: BorderRadius.circular(theme.controlRadius),
                boxShadow: overlayShadow(theme.brightness),
              ),
              child: Padding(
                padding: _bubblePadding,
                child: Text(
                  _error ?? '',
                  style: theme.textStyle.copyWith(
                    fontSize: _smallFontSize,
                    color: theme.colors.onEmphasis,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final highContrast = MediaQuery.maybeHighContrastOf(context) ?? false;
    final details = widget.details;
    final primary = widget.focusNode.hasPrimaryFocus;
    final showDetails =
        details != null &&
        (widget.editing ||
            _hovered ||
            primary ||
            (widget.tabStop && details.showOnActive));
    final error = _error;

    final Widget content = Row(
      mainAxisAlignment: widget.align == AlignmentDirectional.centerStart
          ? MainAxisAlignment.start
          : MainAxisAlignment.end,
      spacing: _contentGap,
      children: [
        if (error != null)
          IconTheme(
            data: IconThemeData(
              color: colors.dangerText,
              size: _fontSize,
              applyTextScaling: true,
            ),
            child: const Glyph(GlyphShape.danger),
          ),
        if (widget.editing)
          Expanded(child: widget.content)
        else
          Flexible(
            // The cell's label reads the value.
            child: ExcludeSemantics(
              child: DefaultTextStyle.merge(
                style: TextStyle(
                  fontWeight: widget.emphasis ? FontWeight.w600 : null,
                ),
                child: widget.content,
              ),
            ),
          ),
        if (details != null)
          _DetailsButton(spec: details, visible: showDetails),
      ],
    );
    Widget cell = DecoratedBox(
      decoration: BoxDecoration(
        color: _hovered && !widget.editing
            ? Color.alphaBlend(colors.stateHover, widget.surface)
            : widget.surface,
        border: BorderDirectional(
          bottom: BorderSide(color: colors.border),
          end: BorderSide(color: colors.border),
        ),
      ),
      child: FocusRingPainter(
        visible: primary,
        ring: highContrast
            ? theme.focusRing.copyWith(color: colors.text)
            : theme.focusRing,
        radius: 0,
        inside: true,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: theme.minTargetSize.width,
            minHeight: theme.minTargetSize.height,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: _cellPaddingY,
              horizontal: _cellPaddingX,
            ),
            child: Align(
              alignment: widget.align,
              widthFactor: 1,
              heightFactor: 1,
              child: content,
            ),
          ),
        ),
      ),
    );

    // Always in place, so an error that comes and goes keeps the tree.
    cell = OverlayPortal(
      controller: _bubble,
      overlayChildBuilder: _buildBubble,
      child: cell,
    );

    final onPress = widget.onPress;
    return Semantics(
      container: true,
      role: SemanticsRole.cell,
      label: widget.liveLabel?.call() ?? widget.label,
      hint: widget.hint,
      readOnly: widget.readOnly,
      validationResult: error == null
          ? SemanticsValidationResult.none
          : SemanticsValidationResult.invalid,
      onTap: widget.editing ? null : widget.semanticsTap,
      customSemanticsActions: details == null
          ? null
          : {
              CustomSemanticsAction(label: details.actionLabel):
                  details.onPressed,
            },
      child: Focus(
        focusNode: widget.focusNode,
        skipTraversal: !widget.tabStop,
        onKeyEvent: (_, event) => widget.onKey(event),
        onFocusChange: widget.onFocusChange,
        child: Listener(
          onPointerDown: (event) => widget.onPointerKind(
            event.kind == PointerDeviceKind.touch ||
                event.kind == PointerDeviceKind.stylus,
          ),
          child: MouseRegion(
            onEnter: (_) => _hover(true),
            onExit: (_) => _hover(false),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTapUp: onPress == null
                  ? null
                  : (details) => onPress(details.globalPosition),
              child: cell,
            ),
          ),
        ),
      ),
    );
  }
}

/// The details button: out of the tab order, reachable by pointer, by the
/// shortcut and by the screen reader's reading cursor. It keeps its place
/// while hidden, so the cell's width never changes.
class _DetailsButton extends StatelessWidget {
  const _DetailsButton({required this.spec, required this.visible});

  final _DetailsSpec spec;
  final bool visible;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final target = theme.minTargetSize;
    return Semantics(
      container: true,
      button: true,
      label: spec.label,
      onTap: spec.onPressed,
      child: ExcludeSemantics(
        child: MouseRegion(
          cursor: visible ? SystemMouseCursors.click : MouseCursor.defer,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: visible ? spec.onPressed : null,
            child: SizedBox(
              width: target.width,
              height: target.height,
              child: Opacity(
                opacity: visible ? 1 : 0,
                child: Center(
                  child: IconTheme(
                    data: IconThemeData(
                      color: theme.colors.textSecondary,
                      size: _fontSize,
                      applyTextScaling: true,
                    ),
                    child: const Glyph(GlyphShape.chevronEnd),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The editor inside an editing cell: the Number Field's text with the
/// cell's label, a field border inside the cell and the spin semantics.
class _Editor extends StatelessWidget {
  const _Editor({
    required this.controller,
    required this.focusNode,
    required this.editableKey,
    required this.label,
    required this.invalid,
    required this.allowNegative,
    required this.onSubmitted,
    required this.stepText,
    required this.onStep,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final GlobalKey<EditableTextState> editableKey;
  final String Function() label;
  final bool Function() invalid;
  final bool allowNegative;
  final VoidCallback onSubmitted;

  /// The draft one step up or down.
  final String Function(int direction) stepText;
  final ValueChanged<int> onStep;

  @override
  Widget build(BuildContext context) =>
      ListenableBuilder(listenable: controller, builder: _build);

  Widget _build(BuildContext context, Widget? _) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final highContrast = MediaQuery.maybeHighContrastOf(context) ?? false;
    final invalid = this.invalid();
    // An empty draft has no value to announce, so its steps go unannounced
    // too, as Flutter requires.
    final empty = controller.text.isEmpty;
    return FieldSemantics(
      label: label(),
      child: Semantics(
        increasedValue: empty ? null : stepText(1),
        decreasedValue: empty ? null : stepText(-1),
        onIncrease: () => onStep(1),
        onDecrease: () => onStep(-1),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: colors.background,
            border: Border.all(
              width: highContrast ? 2 : _editingBorder,
              color: invalid
                  ? colors.danger
                  : highContrast
                  ? colors.text
                  : colors.focusRing,
            ),
            borderRadius: BorderRadius.circular(theme.controlRadius),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: _editorInset),
            child: TextBox(
              controller: controller,
              focusNode: focusNode,
              editableKey: editableKey,
              framed: false,
              invalid: invalid,
              keyboardType: TextInputType.numberWithOptions(
                signed: allowNegative,
                decimal: true,
              ),
              textAlign: TextAlign.end,
              onSubmitted: (_) => onSubmitted(),
            ),
          ),
        ),
      ),
    );
  }
}
