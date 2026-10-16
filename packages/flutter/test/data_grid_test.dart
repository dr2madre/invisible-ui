import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

// Timelog's weekly timesheet, the spec's driving case
// (docs/editable-grid-spec.md): projects in rows, days in columns, hours in
// the cells, totals per day and per project.

const List<DataGridColumn> _days = [
  DataGridColumn(id: 'mon', label: 'Monday 6 October', header: Text('Mon 6')),
  DataGridColumn(id: 'tue', label: 'Tuesday 7 October', header: Text('Tue 7')),
  DataGridColumn(
    id: 'sat',
    label: 'Saturday 11 October',
    header: Text('Sat 11'),
    secondary: true,
    secondaryLabel: 'Non-working day',
  ),
];

const List<DataGridRow> _projects = [
  DataGridRow(id: 'px', code: 'PX-12', name: 'Project X'),
  DataGridRow(id: 'py', code: 'PY-3', name: 'Project Y'),
];

const Map<(String, String), double> _week = {
  ('px', 'mon'): 8,
  ('px', 'tue'): 7.5,
  ('py', 'mon'): 0.5,
};

/// A host that owns the hours, as an application does, and records what the
/// grid reports.
class _Timesheet extends StatefulWidget {
  const _Timesheet({
    super.key,
    this.initial = _week,
    this.summary = const {},
    this.errors = const {},
    this.changes,
    this.onActivated,
    this.details,
    this.detailsShortcut,
    this.totals = DataGridTotals.derived,
    this.rowTotalPosition = DataGridRowTotalPosition.end,
    this.rows = _projects,
    this.gridKey,
    this.editor = const DataGridEditor(min: 0, max: 24, step: 0.5),
    this.width = 760,
    this.height = 400,
    this.onChanged,
    this.validate,
  });

  final Map<(String, String), double> initial;
  final Set<(String, String)> summary;
  final Map<(String, String), String> errors;
  final List<DataGridCellChange>? changes;
  final void Function(BuildContext context, DataGridCellRef cell)? onActivated;
  final List<DataGridCellRef>? details;
  final SingleActivator? detailsShortcut;
  final DataGridTotals totals;
  final DataGridRowTotalPosition rowTotalPosition;
  final List<DataGridRow> rows;
  final GlobalKey<DataGridState>? gridKey;
  final DataGridEditor editor;
  final double width;
  final double height;
  final ValueChanged<DataGridCellChange>? onChanged;

  /// The application's own rule, run after each commit.
  final String? Function(Map<(String, String), double?> hours, String column)?
  validate;

  @override
  State<_Timesheet> createState() => _TimesheetState();
}

class _TimesheetState extends State<_Timesheet> {
  late final Map<(String, String), double?> hours = Map.of(widget.initial);

  void set(String row, String column, double? value) =>
      setState(() => hours[(row, column)] = value);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: DataGrid(
        key: widget.gridKey,
        label: 'Week 41',
        rowHeaderLabel: 'Project',
        columns: _days,
        rows: widget.rows,
        totals: widget.totals,
        rowTotalPosition: widget.rowTotalPosition,
        editor: widget.editor,
        detailsShortcut: widget.detailsShortcut,
        activationHint: 'Show entries',
        totalError: widget.validate == null
            ? null
            : (column) => widget.validate!(hours, column),
        cell: (row, column) {
          final summary = widget.summary.contains((row, column));
          return DataGridCell(
            kind: summary
                ? DataGridCellKind.summary
                : DataGridCellKind.editable,
            value: hours[(row, column)],
            badge: summary ? '2 entries' : null,
            error: widget.errors[(row, column)],
          );
        },
        onCellChanged: (change) {
          widget.changes?.add(change);
          widget.onChanged?.call(change);
          set(change.rowId, change.columnId, change.value);
        },
        onCellActivated: widget.onActivated == null
            ? null
            : (cell) => widget.onActivated!(context, cell),
        onCellDetails: widget.details?.add,
      ),
    );
  }
}

/// The cell whose label starts with [label].
Finder _cell(String label) => find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.label != null &&
      widget.properties.label!.startsWith(label) &&
      widget.properties.role == SemanticsRole.cell,
);

/// The label of the node with primary focus: a cell, or the editor.
String? _focused(WidgetTester tester) {
  final context = FocusManager.instance.primaryFocus?.context;
  if (context == null) return null;
  final node = tester.getSemantics(
    find.byElementPredicate((element) => element == context),
  );
  return node.getSemanticsData().label;
}

Future<void> _press(
  WidgetTester tester,
  LogicalKeyboardKey key, {
  List<LogicalKeyboardKey> holding = const [],
}) async {
  for (final modifier in holding) {
    await tester.sendKeyDownEvent(modifier);
  }
  await tester.sendKeyEvent(key);
  for (final modifier in holding.reversed) {
    await tester.sendKeyUpEvent(modifier);
  }
  await tester.pumpAndSettle();
}

Future<void> _type(WidgetTester tester, String character) async {
  // A character with no key of its own on the test keyboard, such as an
  // Arabic-Indic digit, comes from a digit key, as on an Arabic layout.
  final key = character.codeUnitAt(0) > 0x7f
      ? LogicalKeyboardKey.digit1
      : LogicalKeyboardKey(character.codeUnitAt(0));
  await tester.sendKeyDownEvent(key, character: character);
  await tester.sendKeyUpEvent(key);
  await tester.pumpAndSettle();
}

Future<void> _focusCell(WidgetTester tester, String label) async {
  Focus.of(
    tester.element(
      find
          .descendant(of: _cell(label), matching: find.byType(GestureDetector))
          .first,
    ),
  ).requestFocus();
  await tester.pumpAndSettle();
}

Future<void> _draft(WidgetTester tester, String text) async {
  await tester.enterText(find.byType(EditableText), text);
  await tester.pump();
}

Widget _app(Widget grid, {TextDirection direction = TextDirection.ltr}) =>
    appHarness(
      (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Button(onPressed: () {}, child: const Text('Before')),
          grid,
          Button(onPressed: () {}, child: const Text('After')),
        ],
      ),
      direction: direction,
    );

const String _monPx = 'Monday 6 October, PX-12 Project X';
const String _tuePx = 'Tuesday 7 October, PX-12 Project X';
const String _satPx = 'Saturday 11 October, PX-12 Project X';
const String _monPy = 'Monday 6 October, PY-3 Project Y';

void main() {
  group('structure', () {
    testWidgets('the headers, the cells, the secondary label and the totals', (
      tester,
    ) async {
      await tester.pumpWidget(harness(const _Timesheet()));
      expect(find.text('Week 41'), findsOneWidget);
      expect(find.text('Mon 6'), findsOneWidget);
      expect(find.text('Non-working day'), findsOneWidget);
      expect(find.text('PX-12'), findsOneWidget);
      expect(find.text('Project X'), findsOneWidget);
      expect(find.text('15.5'), findsOneWidget, reason: 'PX-12 row total');
      expect(find.text('8.5'), findsOneWidget, reason: 'Monday total');
      expect(find.text('16'), findsOneWidget, reason: 'grand total');
      expect(find.text('Total'), findsNWidgets(2));
    });

    testWidgets('totals none shows no Total column and no totals row', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(const _Timesheet(totals: DataGridTotals.none)),
      );
      expect(find.text('Total'), findsNothing);
      expect(find.text('15.5'), findsNothing);
    });

    testWidgets('the row total sits after the row header when asked, in '
        'structure, view and keyboard order', (tester) async {
      await tester.pumpWidget(
        harness(
          const _Timesheet(rowTotalPosition: DataGridRowTotalPosition.start),
        ),
      );
      final total = tester.getTopLeft(find.text('15.5')).dx;
      final monday = tester.getTopLeft(find.text('Mon 6')).dx;
      expect(total, lessThan(monday));
      await _focusCell(tester, 'PX-12 Project X');
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester), 'Total, PX-12 Project X, 15.5');
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester), startsWith(_monPx));
    });

    testWidgets('repeated row ids throw in development', (tester) async {
      await tester.pumpWidget(
        harness(
          const _Timesheet(
            rows: [
              DataGridRow(id: 'px', name: 'A'),
              DataGridRow(id: 'px', name: 'B'),
            ],
          ),
        ),
      );
      expect(tester.takeException(), isFlutterError);
    });
  });

  group('semantics', () {
    testWidgets('one composed label per cell, in the spec order', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const _Timesheet(
            summary: {('py', 'tue')},
            errors: {('py', 'sat'): 'More than 24 hours on this day'},
            detailsShortcut: SingleActivator(
              LogicalKeyboardKey.enter,
              alt: true,
            ),
            details: [],
          ),
        ),
      );
      expect(
        tester.getSemantics(_cell(_monPx)),
        semanticsWith(
          label: '$_monPx, 8',
          hint: 'Edit, Details: Alt+Enter',
          isFocusable: true,
          hasTapAction: true,
        ),
      );
      expect(
        tester.getSemantics(_cell(_satPx)).getSemanticsData().label,
        '$_satPx, empty, Non-working day',
      );
      final summary = tester.getSemantics(
        _cell('Tuesday 7 October, PY-3 Project Y'),
      );
      expect(
        summary,
        semanticsWith(
          label: 'Tuesday 7 October, PY-3 Project Y, empty, 2 entries',
          hint: 'Show entries, Details: Alt+Enter',
          isReadOnly: true,
        ),
      );
      expect(
        tester
            .getSemantics(_cell('Saturday 11 October, PY-3 Project Y'))
            .getSemanticsData()
            .label,
        'Saturday 11 October, PY-3 Project Y, empty, Non-working day, '
        'Error: More than 24 hours on this day',
      );
      expect(
        tester.getSemantics(_cell('Monday 6 October, Total')),
        semanticsWith(label: 'Monday 6 October, Total, 8.5', isReadOnly: true),
      );
      expect(
        tester.getSemantics(_cell('Total, PX-12')).getSemanticsData().label,
        'Total, PX-12 Project X, 15.5',
      );
      expect(
        tester.getSemantics(_cell('Total, 16')).getSemanticsData().label,
        'Total, 16',
      );
      expect(
        tester.getSemantics(_cell('PX-12 Project X, Total')),
        semanticsWith(label: 'PX-12 Project X, Total, 15.5', isReadOnly: true),
      );
      semantics.dispose();
    });

    testWidgets('table, row, cell and column header roles', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(const _Timesheet()));
      final roles = <SemanticsRole>{};
      void visit(SemanticsNode node) {
        roles.add(node.getSemanticsData().role);
        node.visitChildren((child) {
          visit(child);
          return true;
        });
      }

      var root = tester.getSemantics(_cell(_monPx));
      while (root.parent != null) {
        root = root.parent!;
      }
      visit(root);
      expect(
        roles,
        containsAll([
          SemanticsRole.table,
          SemanticsRole.row,
          SemanticsRole.cell,
          SemanticsRole.columnHeader,
        ]),
      );
      expect(find.bySemanticsLabel('Week 41'), findsOneWidget);
      expect(
        find.bySemanticsLabel('Saturday 11 October, Non-working day'),
        findsOneWidget,
        reason: 'the secondary column header reads its label',
      );
      semantics.dispose();
    });
  });

  group('navigation mode', () {
    testWidgets('one tab stop: Tab enters on the first editable cell and '
        'leaves on the next Tab', (tester) async {
      await tester.pumpWidget(_app(const _Timesheet()));
      await _press(tester, LogicalKeyboardKey.tab);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester), startsWith(_monPx));
      await _press(tester, LogicalKeyboardKey.arrowDown);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester), 'After');
      await _press(
        tester,
        LogicalKeyboardKey.tab,
        holding: [LogicalKeyboardKey.shiftLeft],
      );
      expect(
        _focused(tester),
        startsWith(_monPy),
        reason: 'Tab returns to the active cell',
      );
    });

    testWidgets('arrows move without wrapping; Home, End, Control+Home and '
        'Control+End jump', (tester) async {
      await tester.pumpWidget(harness(const _Timesheet()));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester), startsWith(_tuePx));
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focused(tester), 'PX-12 Project X, Total, 15.5');
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(
        _focused(tester),
        'PX-12 Project X, Total, 15.5',
        reason: 'no wrap at the row start',
      );
      await _press(tester, LogicalKeyboardKey.arrowUp);
      expect(_focused(tester), 'PX-12 Project X, Total, 15.5');
      await _press(tester, LogicalKeyboardKey.end);
      expect(_focused(tester), 'Total, PX-12 Project X, 15.5');
      await _press(tester, LogicalKeyboardKey.home);
      expect(_focused(tester), startsWith('PX-12 Project X'));
      await _press(
        tester,
        LogicalKeyboardKey.end,
        holding: [LogicalKeyboardKey.controlLeft],
      );
      expect(_focused(tester), 'Total, 16');
      await _press(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester), 'Total, 16', reason: 'no wrap at the bottom');
      await _press(
        tester,
        LogicalKeyboardKey.home,
        holding: [LogicalKeyboardKey.controlLeft],
      );
      expect(_focused(tester), startsWith('PX-12 Project X'));
    });

    testWidgets('right to left mirrors the columns and the arrows', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(const _Timesheet(), direction: TextDirection.rtl),
      );
      final monday = tester.getTopLeft(find.text('Mon 6')).dx;
      final tuesday = tester.getTopLeft(find.text('Tue 7')).dx;
      expect(tuesday, lessThan(monday), reason: 'columns run right to left');
      expect(
        tester.getTopLeft(find.text('PX-12')).dx,
        greaterThan(monday),
        reason: 'the row header sits at the right',
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focused(tester), startsWith(_tuePx));
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester), startsWith(_monPx));
      await _press(tester, LogicalKeyboardKey.home);
      expect(_focused(tester), startsWith('PX-12 Project X'));
    });

    testWidgets('Escape is left to the widgets above', (tester) async {
      final escapes = <KeyEvent>[];
      await tester.pumpWidget(
        harness(
          Focus(
            onKeyEvent: (_, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.escape) {
                escapes.add(event);
              }
              return KeyEventResult.ignored;
            },
            child: const _Timesheet(),
          ),
        ),
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.escape);
      expect(escapes, hasLength(1));
    });

    testWidgets('under reduced motion the active cell scrolls into view at '
        'once', (tester) async {
      final rows = [
        for (var i = 0; i < 30; i++) DataGridRow(id: 'r$i', name: 'Row $i'),
      ];
      await tester.pumpWidget(
        harness(
          _Timesheet(rows: rows, initial: const {}, height: 300),
          disableAnimations: true,
        ),
      );
      await _focusCell(tester, 'Monday 6 October, Row 0');
      await tester.sendKeyEvent(LogicalKeyboardKey.pageDown);
      await tester.sendKeyEvent(LogicalKeyboardKey.pageDown);
      // Two frames: the focus, then the scroll, with no animation between.
      await tester.pump();
      await tester.pump();
      final box =
          FocusManager.instance.primaryFocus!.context!.findRenderObject()!
              as RenderBox;
      final top = box.localToGlobal(Offset.zero).dy;
      expect(
        top,
        greaterThanOrEqualTo(tester.getRect(find.text('Mon 6')).bottom),
      );
      expect(tester.binding.hasScheduledFrame, isFalse);
    });

    testWidgets('PageDown moves by the visible body rows and keeps the '
        'active cell clear of the sticky rows', (tester) async {
      final rows = [
        for (var i = 0; i < 30; i++) DataGridRow(id: 'r$i', name: 'Row $i'),
      ];
      await tester.pumpWidget(
        harness(_Timesheet(rows: rows, initial: const {}, height: 300)),
      );
      final headerTop = tester.getTopLeft(find.text('Mon 6')).dy;
      await _focusCell(tester, 'Monday 6 October, Row 0');
      await _press(tester, LogicalKeyboardKey.pageDown);
      final label = _focused(tester)!;
      expect(label, isNot(startsWith('Monday 6 October, Row 0')));
      await _press(tester, LogicalKeyboardKey.pageDown);
      await _press(tester, LogicalKeyboardKey.pageDown);
      final focused = FocusManager.instance.primaryFocus!.context!;
      final box = focused.findRenderObject()! as RenderBox;
      final cellRect = box.localToGlobal(Offset.zero) & box.size;
      expect(
        tester.getTopLeft(find.text('Mon 6')).dy,
        headerTop,
        reason: 'the column header row sticks',
      );
      final header = tester.getRect(find.text('Mon 6'));
      final totals = tester.getRect(find.text('Total').last);
      expect(cellRect.top, greaterThanOrEqualTo(header.bottom));
      expect(cellRect.bottom, lessThanOrEqualTo(totals.top + 1));
    });
  });

  group('editing', () {
    testWidgets('Enter edits with the value selected, Enter commits, stays '
        'on the cell and reports once after the totals', (tester) async {
      final changes = <DataGridCellChange>[];
      final key = GlobalKey<DataGridState>();
      double? totalSeen;
      await tester.pumpWidget(
        harness(
          _Timesheet(
            gridKey: key,
            changes: changes,
            onChanged: (_) => totalSeen = key.currentState!.rowTotal('px'),
          ),
        ),
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      final editable = tester.widget<EditableText>(find.byType(EditableText));
      expect(editable.controller.text, '8');
      expect(editable.controller.selection.baseOffset, 0);
      expect(editable.controller.selection.extentOffset, 1);
      await _draft(tester, '6');
      expect(changes, isEmpty, reason: 'typing reports nothing');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(find.byType(EditableText), findsNothing);
      expect(_focused(tester), '$_monPx, 6');
      expect(changes, hasLength(1));
      expect(changes.single.value, 6);
      expect(changes.single.previousValue, 8);
      expect(changes.single.error, isNull);
      expect(totalSeen, 13.5, reason: 'the totals moved before the report');
      expect(find.text('13.5'), findsOneWidget);
    });

    testWidgets('a commit that lands on the same value reports nothing; a '
        'new value from the application reports nothing', (tester) async {
      final changes = <DataGridCellChange>[];
      final host = GlobalKey<_TimesheetState>();
      await tester.pumpWidget(harness(_Timesheet(key: host, changes: changes)));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.f2);
      await _draft(tester, '8.0');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes, isEmpty);
      host.currentState!.set('px', 'mon', 3);
      await tester.pumpAndSettle();
      expect(find.text('3'), findsOneWidget);
      expect(changes, isEmpty);
    });

    testWidgets('Escape reverts and returns to navigation; a second Escape '
        'reaches the widgets above', (tester) async {
      final escapes = <KeyEvent>[];
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(
        harness(
          Focus(
            onKeyEvent: (_, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.escape) {
                escapes.add(event);
              }
              return KeyEventResult.ignored;
            },
            child: _Timesheet(changes: changes),
          ),
        ),
      );
      await _focusCell(tester, _monPx);
      await _type(tester, '4');
      expect(
        tester.widget<EditableText>(find.byType(EditableText)).controller.text,
        '4',
      );
      await _press(tester, LogicalKeyboardKey.escape);
      expect(find.byType(EditableText), findsNothing);
      expect(_focused(tester), '$_monPx, 8');
      expect(escapes, isEmpty, reason: 'the first Escape is consumed');
      await _press(tester, LogicalKeyboardKey.escape);
      expect(escapes, hasLength(1));
      expect(changes, isEmpty);
    });

    testWidgets('Tab commits and edits the next editable cell, skipping a '
        'summary cell; Shift+Tab goes back; after the last one focus leaves', (
      tester,
    ) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(
        _app(_Timesheet(changes: changes, summary: const {('px', 'tue')})),
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '5');
      await _press(tester, LogicalKeyboardKey.tab);
      expect(changes.single.value, 5);
      expect(_focused(tester), startsWith(_satPx));
      expect(find.byType(EditableText), findsOneWidget);
      await _press(
        tester,
        LogicalKeyboardKey.tab,
        holding: [LogicalKeyboardKey.shiftLeft],
      );
      expect(_focused(tester), startsWith(_monPx));
      // To the last editable cell, then out of the grid.
      await _focusCell(tester, 'Saturday 11 October, PY-3 Project Y');
      await _press(tester, LogicalKeyboardKey.enter);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester), 'After');
      expect(find.byType(EditableText), findsNothing);
    });

    testWidgets('a digit, F2, Backspace and Delete start editing with the '
        'draft the spec gives', (tester) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await _focusCell(tester, _monPx);
      await _type(tester, '7');
      var controller = tester
          .widget<EditableText>(find.byType(EditableText))
          .controller;
      expect(controller.text, '7');
      await _press(tester, LogicalKeyboardKey.escape);
      await _press(tester, LogicalKeyboardKey.f2);
      controller = tester
          .widget<EditableText>(find.byType(EditableText))
          .controller;
      expect(controller.text, '8');
      expect(controller.selection, const TextSelection.collapsed(offset: 1));
      await _press(tester, LogicalKeyboardKey.escape);
      await _press(tester, LogicalKeyboardKey.backspace);
      controller = tester
          .widget<EditableText>(find.byType(EditableText))
          .controller;
      expect(controller.text, isEmpty);
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.single.value, isNull, reason: 'empty commits null');
      expect(changes.single.previousValue, 8);
      expect(_focused(tester), '$_monPx, empty');
      await _press(tester, LogicalKeyboardKey.arrowRight);
      await _press(tester, LogicalKeyboardKey.delete);
      expect(
        tester.widget<EditableText>(find.byType(EditableText)).controller.text,
        isEmpty,
      );
      await _press(tester, LogicalKeyboardKey.escape);
      await _type(tester, 'a');
      expect(find.byType(EditableText), findsNothing, reason: 'not a digit');
    });

    testWidgets('a summary cell activates on Enter and on a press; typing '
        'does nothing', (tester) async {
      final activated = <DataGridCellRef>[];
      await tester.pumpWidget(
        harness(
          _Timesheet(
            summary: const {('px', 'tue')},
            onActivated: (_, cell) => activated.add(cell),
          ),
        ),
      );
      await _focusCell(tester, _tuePx);
      await _press(tester, LogicalKeyboardKey.enter);
      expect(activated, [const DataGridCellRef(rowId: 'px', columnId: 'tue')]);
      await _type(tester, '5');
      expect(find.byType(EditableText), findsNothing);
      await tester.tap(_cell(_tuePx));
      await tester.pumpAndSettle();
      expect(activated, hasLength(2));
    });

    testWidgets('a draft that does not parse never commits and keeps '
        'editing with its error', (tester) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '1x');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(find.byType(EditableText), findsOneWidget);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(find.byType(EditableText), findsOneWidget);
      expect(changes, isEmpty);
      expect(
        tester.getSemantics(_cell(_monPx)).getSemanticsData().label,
        contains('Error: Enter a number.'),
      );
      await _press(tester, LogicalKeyboardKey.escape);
      expect(find.text('8'), findsOneWidget, reason: 'Escape still reverts');
    });

    testWidgets('a number out of range commits with its error, keeps it and '
        'announces it once', (tester) async {
      final log = recordAnnouncements(tester);
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '25');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.single.value, 25);
      expect(changes.single.error, NumberFieldError.rangeOverflow);
      expect(
        _focused(tester),
        '$_monPx, 25, Error: Enter a number that is at most 24.',
      );
      expect(log.map((a) => a.message), [
        '$_monPx: Enter a number that is at most 24.',
      ]);
      expect(log.single.assertive, isFalse);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      expect(log, hasLength(1), reason: 'announced once');
    });

    testWidgets("the application's error on a total is announced once after "
        'the commit that causes it', (tester) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(
        harness(
          _Timesheet(
            validate: (hours, column) {
              final sum = hours.entries
                  .where((e) => e.key.$2 == column)
                  .fold(0.0, (total, e) => total + (e.value ?? 0));
              return sum > 24 ? 'More than 24 hours on this day' : null;
            },
          ),
        ),
      );
      await _focusCell(tester, _monPy);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '20');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(log.map((a) => a.message), [
        'Monday 6 October, Total: More than 24 hours on this day',
      ]);
      expect(
        tester
            .getSemantics(_cell('Monday 6 October, Total'))
            .getSemanticsData()
            .label,
        'Monday 6 October, Total, 28, Error: More than 24 hours on this day',
      );
    });

    testWidgets('ArrowUp and ArrowDown step the draft and report nothing '
        'until F2 commits', (tester) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.f2);
      await _press(tester, LogicalKeyboardKey.arrowUp);
      await _press(tester, LogicalKeyboardKey.arrowUp);
      final controller = tester
          .widget<EditableText>(find.byType(EditableText))
          .controller;
      expect(controller.text, '9');
      await _press(tester, LogicalKeyboardKey.arrowDown);
      expect(controller.text, '8.5');
      expect(changes, isEmpty);
      await _press(tester, LogicalKeyboardKey.f2);
      expect(changes.single.value, 8.5, reason: 'F2 commits');
      expect(find.byType(EditableText), findsNothing);
      expect(_focused(tester), '$_monPx, 8.5');
    });

    testWidgets('Arabic-Indic and Persian digits start and fill a draft in '
        'any locale and commit ASCII numbers', (tester) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(
        harness(
          _Timesheet(
            changes: changes,
            editor: const DataGridEditor(locale: Locale('ar', 'EG')),
          ),
        ),
      );
      expect(find.text('٨'), findsOneWidget, reason: 'Arabic digits shown');
      await _focusCell(tester, 'Monday 6 October, PX-12 Project X');
      await _type(tester, '٥');
      expect(find.byType(EditableText), findsOneWidget);
      await _draft(tester, '٥٫٥');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.last.value, 5.5);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      await _type(tester, '۳');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.last.value, 3);
    });

    testWidgets('de-CH takes both apostrophes as group separators', (
      tester,
    ) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(
        harness(
          _Timesheet(
            changes: changes,
            initial: const {},
            editor: const DataGridEditor(locale: Locale('de', 'CH')),
          ),
        ),
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, "1'234.5");
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.last.value, 1234.5);
      expect(find.text('1’234.5'), findsWidgets);
      await _press(tester, LogicalKeyboardKey.arrowRight);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '2’000');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.last.value, 2000);
    });

    testWidgets('a press edits an editable cell; a press elsewhere commits', (
      tester,
    ) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await tester.tap(_cell(_monPx));
      await tester.pumpAndSettle();
      expect(find.byType(EditableText), findsOneWidget);
      await _draft(tester, '2');
      await tester.tap(_cell(_tuePx));
      await tester.pumpAndSettle();
      expect(changes.single.value, 2);
      expect(
        tester.widget<EditableText>(find.byType(EditableText)).controller.text,
        '7.5',
        reason: 'the pressed cell edits now',
      );
    });

    testWidgets('a draft that does not parse is kept when focus leaves the '
        'grid and resumes when it comes back', (tester) async {
      await tester.pumpWidget(_app(const _Timesheet()));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '1x');
      // Focus moves to another control, as a click on a field would.
      Focus.of(tester.element(find.text('After'))).requestFocus();
      await tester.pumpAndSettle();
      expect(_focused(tester), 'After');
      expect(
        tester.widget<EditableText>(find.byType(EditableText)).controller.text,
        '1x',
      );
      await _press(
        tester,
        LogicalKeyboardKey.tab,
        holding: [LogicalKeyboardKey.shiftLeft],
      );
      expect(
        FocusManager.instance.primaryFocus,
        tester.widget<EditableText>(find.byType(EditableText)).focusNode,
        reason: 'editing resumes with the kept draft',
      );
    });

    testWidgets('a form reset discards the draft and ends editing', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      await tester.pumpWidget(
        harness(Form(key: form, child: const _Timesheet())),
      );
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '3');
      form.currentState!.reset();
      await tester.pumpAndSettle();
      expect(find.byType(EditableText), findsNothing);
      expect(find.text('8'), findsOneWidget);
    });
  });

  group('secondary emphasis', () {
    testWidgets('a secondary cell stays editable, shows its label and the '
        'role surface', (tester) async {
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(harness(_Timesheet(changes: changes)));
      await _focusCell(tester, _satPx);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '4');
      await _press(tester, LogicalKeyboardKey.enter);
      expect(changes.single.columnId, 'sat');
      final surfaces = tester
          .widgetList<DecoratedBox>(
            find.descendant(
              of: _cell(_satPx),
              matching: find.byType(DecoratedBox),
            ),
          )
          .map((box) => (box.decoration as BoxDecoration).color);
      expect(
        surfaces,
        contains(InvisibleColors.light.gridCellSecondarySurface),
      );
    });

    testWidgets("a cell's own secondary label shows inside the cell", (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 600,
            height: 300,
            child: DataGrid(
              label: 'Week',
              columns: const [DataGridColumn(id: 'mon', label: 'Monday')],
              rows: const [DataGridRow(id: 'p', name: 'P')],
              cell: (_, _) => const DataGridCell(
                kind: DataGridCellKind.editable,
                value: 2,
                secondary: true,
                secondaryLabel: 'Holiday',
              ),
            ),
          ),
        ),
      );
      expect(find.text('Holiday'), findsOneWidget);
    });
  });

  group('errors', () {
    testWidgets('an error shows its icon at rest and its message on focus '
        'and on hover, out of semantics', (tester) async {
      const message = 'More than 24 hours on this day';
      await tester.pumpWidget(
        harness(const _Timesheet(errors: {('px', 'tue'): message})),
      );
      expect(find.text(message), findsNothing);
      await _focusCell(tester, _tuePx);
      await tester.pumpAndSettle();
      expect(find.text(message), findsOneWidget);
      await _press(tester, LogicalKeyboardKey.arrowLeft);
      expect(find.text(message), findsNothing);
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(_cell(_tuePx)));
      await tester.pumpAndSettle();
      expect(find.text(message), findsOneWidget);
      expect(
        find.bySemanticsLabel(message),
        findsNothing,
        reason: 'the cell label reads it',
      );
    });
  });

  group('details', () {
    testWidgets('the shortcut works in both modes and commits first while '
        'editing', (tester) async {
      final details = <DataGridCellRef>[];
      final changes = <DataGridCellChange>[];
      await tester.pumpWidget(
        harness(
          _Timesheet(
            details: details,
            changes: changes,
            detailsShortcut: const SingleActivator(
              LogicalKeyboardKey.enter,
              alt: true,
            ),
          ),
        ),
      );
      await _focusCell(tester, _monPx);
      await _press(
        tester,
        LogicalKeyboardKey.enter,
        holding: [LogicalKeyboardKey.altLeft],
      );
      expect(details, [const DataGridCellRef(rowId: 'px', columnId: 'mon')]);
      expect(find.byType(EditableText), findsNothing);
      await _press(tester, LogicalKeyboardKey.enter);
      await _draft(tester, '1');
      await _press(
        tester,
        LogicalKeyboardKey.enter,
        holding: [LogicalKeyboardKey.altLeft],
      );
      expect(changes.single.value, 1);
      expect(details, hasLength(2));
    });

    testWidgets('the button names its cell, has a custom action and stays '
        'out of the tab order', (tester) async {
      final semantics = tester.ensureSemantics();
      final details = <DataGridCellRef>[];
      await tester.pumpWidget(_app(_Timesheet(details: details)));
      expect(
        find.bySemanticsLabel('Details, Monday 6 October, PX-12 Project X'),
        findsOneWidget,
      );
      final node = tester.getSemantics(_cell(_monPx));
      final actions = node.getSemanticsData().customSemanticsActionIds!;
      expect(actions, isNotEmpty);
      node.owner!.performAction(
        node.id,
        SemanticsAction.customAction,
        actions.single,
      );
      await tester.pumpAndSettle();
      expect(details, hasLength(1));
      await _press(tester, LogicalKeyboardKey.tab);
      await _press(tester, LogicalKeyboardKey.tab);
      await _press(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester), 'After', reason: 'one tab stop');
      semantics.dispose();
    });

    testWidgets('the button shows on hover and on the focused cell, and a '
        'press on it keeps the mode', (tester) async {
      final details = <DataGridCellRef>[];
      await tester.pumpWidget(harness(_Timesheet(details: details)));
      double opacity(String label) => tester
          .widget<Opacity>(
            find.descendant(of: _cell(label), matching: find.byType(Opacity)),
          )
          .opacity;
      expect(opacity(_tuePx), 0);
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(_cell(_tuePx)));
      await tester.pumpAndSettle();
      expect(opacity(_tuePx), 1);
      await _focusCell(tester, _monPx);
      expect(opacity(_monPx), 1);
      await _press(tester, LogicalKeyboardKey.enter);
      final button = find.descendant(
        of: _cell(_monPx),
        matching: find.byType(Opacity),
      );
      await tester.tap(button);
      await tester.pumpAndSettle();
      expect(details, hasLength(1));
      expect(
        find.byType(EditableText),
        findsOneWidget,
        reason: 'still editing',
      );
    });
  });

  group('data changes and dialogs', () {
    testWidgets('the active cell survives a removed row and keeps focus', (
      tester,
    ) async {
      Widget build(List<DataGridRow> rows) =>
          harness(_Timesheet(rows: rows, key: const ValueKey('sheet')));
      await tester.pumpWidget(build(_projects));
      await _focusCell(tester, _monPx);
      await tester.pumpWidget(build([_projects[1]]));
      await tester.pumpAndSettle();
      expect(_focused(tester), startsWith(_monPy));
    });

    testWidgets('focus returns to the cell a dialog was opened from', (
      tester,
    ) async {
      await tester.pumpWidget(
        appHarness(
          (context) => _Timesheet(
            summary: const {('px', 'tue')},
            onActivated: (context, cell) => showInvisibleDialog<void>(
              context: context,
              builder: (context) => const AlertDialog(
                title: 'Entries',
                description: 'Two entries on this day.',
                dismissLabel: 'Close',
              ),
            ),
          ),
        ),
      );
      await _focusCell(tester, _tuePx);
      await _press(tester, LogicalKeyboardKey.enter);
      expect(find.text('Entries'), findsOneWidget);
      await _press(tester, LogicalKeyboardKey.escape);
      expect(find.text('Entries'), findsNothing);
      expect(_focused(tester), startsWith(_tuePx));
    });
  });

  group('look and accessibility guidelines', () {
    testWidgets('targets of 24 by 24 at regular density', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_Timesheet(details: const [])));
      await expectLater(tester, meetsGuideline(targetGuideline24));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('targets of 44 by 44 under touch density', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          _Timesheet(details: const []),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(targetGuideline44));
      semantics.dispose();
    });

    testWidgets('text scale 2.0 at 320 wide: nothing overflows, the grid '
        'scrolls on both axes', (tester) async {
      await tester.pumpWidget(
        harness(const _Timesheet(width: 320, height: 360), textScale: 2),
      );
      expect(tester.takeException(), isNull);
      final header = tester.getRect(find.text('PX-12'));
      expect(header.left, greaterThanOrEqualTo(0));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.end);
      expect(_focused(tester), 'Total, PX-12 Project X, 15.5');
      final box =
          FocusManager.instance.primaryFocus!.context!.findRenderObject()!
              as RenderBox;
      final rect = box.localToGlobal(Offset.zero) & box.size;
      final grid = tester.getRect(find.byType(DataGrid));
      expect(rect.right, lessThanOrEqualTo(grid.right + 0.5));
      expect(
        tester.getRect(find.text('PX-12')).left,
        header.left,
        reason: 'the row header column sticks',
      );
    });

    testWidgets('high contrast draws the editing border in the text colour', (
      tester,
    ) async {
      await tester.pumpWidget(harness(const _Timesheet(), highContrast: true));
      await _focusCell(tester, _monPx);
      await _press(tester, LogicalKeyboardKey.enter);
      final borders = tester
          .widgetList<DecoratedBox>(
            find.ancestor(
              of: find.byType(EditableText),
              matching: find.byType(DecoratedBox),
            ),
          )
          .map((box) => (box.decoration as BoxDecoration).border)
          .whereType<Border>();
      expect(
        borders.map((border) => border.top.color),
        contains(InvisibleColors.light.text),
      );
    });

    testWidgets('dark theme meets the text contrast guideline', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const _Timesheet(), theme: InvisibleThemeData.dark()),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });
}
