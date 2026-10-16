import 'dart:math' as math;

import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/rendering.dart';
// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/widgets.dart';

// The grid's two-axis viewport: every row is laid out (no virtualization,
// docs/editable-grid-spec.md, "Performance"), the column header row sticks to
// the top, the totals row to the bottom and the row header column to the
// inline start. Rows are render objects of their own so that each carries the
// row role in semantics, between the table and its cells.

/// The viewport of a data grid: [rows] laid out as a table, scrolled by
/// [vertical] and [horizontal].
class GridViewport extends MultiChildRenderObjectWidget {
  /// Lays out [rows], each a [GridRow] of the same number of cells.
  const GridViewport({
    super.key,
    required this.vertical,
    required this.horizontal,
    required this.textDirection,
    required this.label,
    required this.pinLastRow,
    required this.rowHeaderWidth,
    required this.maxRowHeaderShare,
    required List<GridRow> rows,
  }) : super(children: rows);

  /// The vertical scroll offset.
  final ViewportOffset vertical;

  /// The horizontal scroll offset, from the inline start.
  final ViewportOffset horizontal;

  /// The reading direction: the row header column sits at its start.
  final TextDirection textDirection;

  /// The grid's name, on the table node.
  final String label;

  /// Whether the last row (the totals row) sticks to the bottom edge.
  final bool pinLastRow;

  /// The row header column's width; null takes its widest cell.
  final double? rowHeaderWidth;

  /// The largest share of a bounded viewport's width the row header column
  /// takes, so the data stays visible beside it.
  final double maxRowHeaderShare;

  @override
  RenderGridViewport createRenderObject(BuildContext context) =>
      RenderGridViewport(
        vertical: vertical,
        horizontal: horizontal,
        textDirection: textDirection,
        label: label,
        pinLastRow: pinLastRow,
        rowHeaderWidth: rowHeaderWidth,
        maxRowHeaderShare: maxRowHeaderShare,
      );

  @override
  void updateRenderObject(
    BuildContext context,
    RenderGridViewport renderObject,
  ) {
    renderObject
      ..vertical = vertical
      ..horizontal = horizontal
      ..textDirection = textDirection
      ..label = label
      ..pinLastRow = pinLastRow
      ..rowHeaderWidth = rowHeaderWidth
      ..maxRowHeaderShare = maxRowHeaderShare;
  }
}

/// One row of a [GridViewport]: its cells, in logical column order.
class GridRow extends MultiChildRenderObjectWidget {
  /// A row of [cells].
  const GridRow({super.key, required List<Widget> cells})
    : super(children: cells);

  @override
  RenderGridRow createRenderObject(BuildContext context) => RenderGridRow();
}

class _RowParentData extends ContainerBoxParentData<RenderGridRow> {}

/// A row's size with the grid's column widths, so a change of widths lays
/// the row out again.
class _RowConstraints extends BoxConstraints {
  _RowConstraints(super.size, {required this.widths, required this.lefts})
    : super.tight();

  final List<double> widths;
  final List<double> lefts;

  @override
  bool operator ==(Object other) =>
      other is _RowConstraints &&
      super == other &&
      listEquals(other.widths, widths) &&
      listEquals(other.lefts, lefts);

  @override
  int get hashCode => Object.hash(
    super.hashCode,
    Object.hashAll(widths),
    Object.hashAll(lefts),
  );
}

class _CellParentData extends ContainerBoxParentData<RenderBox> {}

/// The render object of a [GridRow].
class RenderGridRow extends RenderBox
    with
        ContainerRenderObjectMixin<RenderBox, _CellParentData>,
        RenderBoxContainerDefaultsMixin<RenderBox, _CellParentData> {
  List<double> _widths = const [];
  List<double> _lefts = const [];

  RenderGridViewport get _viewport => parent! as RenderGridViewport;

  // A cell whose size changes can change its column's width and every row's
  // height, so the viewport lays out again, though the row's constraints
  // are tight.
  @override
  void markNeedsLayout() {
    super.markNeedsLayout();
    parent?.markNeedsLayout();
  }

  List<RenderBox> get _cells {
    final cells = <RenderBox>[];
    var child = firstChild;
    while (child != null) {
      cells.add(child);
      child = childAfter(child);
    }
    return cells;
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! _CellParentData) {
      child.parentData = _CellParentData();
    }
  }

  @override
  void describeSemanticsConfiguration(SemanticsConfiguration config) {
    super.describeSemanticsConfiguration(config);
    config
      ..isSemanticBoundary = true
      ..explicitChildNodes = true
      ..role = SemanticsRole.row;
  }

  /// Where the cell at [index] paints, in this row's coordinates: pinned at
  /// the inline start for the row header, scrolled for the others, mirrored
  /// in right-to-left text.
  double _cellX(int index) {
    final viewport = _viewport;
    final width = _widths[index];
    final logical = index == 0
        ? 0.0
        : _lefts[index] - viewport._horizontal.pixels;
    return viewport.textDirection == TextDirection.rtl
        ? viewport.size.width - logical - width
        : logical;
  }

  @override
  void performLayout() {
    final columns = constraints as _RowConstraints;
    _widths = columns.widths;
    _lefts = columns.lefts;
    final cells = _cells;
    final height = constraints.maxHeight;
    for (final (index, cell) in cells.indexed) {
      final width = index < _widths.length ? _widths[index] : 0.0;
      cell.layout(BoxConstraints.tight(Size(width, height)));
    }
    size = constraints.biggest;
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final cells = _cells;
    final visible = _viewport.size.width;
    // The row header paints last, over the cells scrolled under it. Cells
    // scrolled out of the viewport are not painted.
    for (final index in [for (var i = 1; i < cells.length; i++) i, 0]) {
      if (index >= cells.length) continue;
      final x = _cellX(index);
      if (x >= visible || x + _widths[index] <= 0) continue;
      context.paintChild(cells[index], offset + Offset(x, 0));
    }
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    final cells = _cells;
    // The row header first: it paints on top.
    for (final index in [0, for (var i = cells.length - 1; i > 0; i--) i]) {
      if (index >= cells.length) continue;
      final cell = cells[index];
      final hit = result.addWithPaintOffset(
        offset: Offset(_cellX(index), 0),
        position: position,
        hitTest: (result, transformed) =>
            cell.hitTest(result, position: transformed),
      );
      if (hit) return true;
    }
    return false;
  }

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    final index = _cells.indexOf(child);
    if (index >= 0) {
      transform.multiply(Matrix4.translationValues(_cellX(index), 0, 0));
    }
  }

  @override
  double computeMinIntrinsicHeight(double width) => _heightFor(_widths);

  @override
  double computeMaxIntrinsicHeight(double width) => _heightFor(_widths);

  /// The height of the tallest cell at the given column [widths].
  double _heightFor(List<double> widths) {
    var height = 0.0;
    for (final (index, cell) in _cells.indexed) {
      final width = index < widths.length ? widths[index] : double.infinity;
      height = math.max(height, cell.getMaxIntrinsicHeight(width));
    }
    return height;
  }
}

/// The render object of a [GridViewport].
class RenderGridViewport extends RenderBox
    with
        ContainerRenderObjectMixin<RenderGridRow, _RowParentData>,
        RenderBoxContainerDefaultsMixin<RenderGridRow, _RowParentData>
    implements RenderAbstractViewport {
  /// Creates the viewport.
  RenderGridViewport({
    required ViewportOffset vertical,
    required ViewportOffset horizontal,
    required TextDirection textDirection,
    required String label,
    required bool pinLastRow,
    required double? rowHeaderWidth,
    required double maxRowHeaderShare,
  }) : _vertical = vertical,
       _horizontal = horizontal,
       _textDirection = textDirection,
       _label = label,
       _pinLastRow = pinLastRow,
       _rowHeaderWidth = rowHeaderWidth,
       _maxRowHeaderShare = maxRowHeaderShare;

  ViewportOffset _vertical;
  set vertical(ViewportOffset value) {
    if (value == _vertical) return;
    if (attached) _vertical.removeListener(_scrolled);
    _vertical = value;
    if (attached) _vertical.addListener(_scrolled);
    markNeedsLayout();
  }

  ViewportOffset _horizontal;
  set horizontal(ViewportOffset value) {
    if (value == _horizontal) return;
    if (attached) _horizontal.removeListener(_scrolled);
    _horizontal = value;
    if (attached) _horizontal.addListener(_scrolled);
    markNeedsLayout();
  }

  TextDirection _textDirection;

  /// The reading direction.
  TextDirection get textDirection => _textDirection;
  set textDirection(TextDirection value) {
    if (value == _textDirection) return;
    _textDirection = value;
    markNeedsPaint();
    markNeedsSemanticsUpdate();
  }

  String _label;
  set label(String value) {
    if (value == _label) return;
    _label = value;
    markNeedsSemanticsUpdate();
  }

  bool _pinLastRow;
  set pinLastRow(bool value) {
    if (value == _pinLastRow) return;
    _pinLastRow = value;
    markNeedsPaint();
  }

  double? _rowHeaderWidth;
  set rowHeaderWidth(double? value) {
    if (value == _rowHeaderWidth) return;
    _rowHeaderWidth = value;
    markNeedsLayout();
  }

  double _maxRowHeaderShare;
  set maxRowHeaderShare(double value) {
    if (value == _maxRowHeaderShare) return;
    _maxRowHeaderShare = value;
    markNeedsLayout();
  }

  List<double> _widths = const [];
  List<double> _lefts = const [];
  List<double> _tops = const [];
  List<double> _heights = const [];
  Size _content = Size.zero;

  void _scrolled() {
    markNeedsPaint();
    markNeedsSemanticsUpdate();
  }

  @override
  void attach(PipelineOwner owner) {
    super.attach(owner);
    _vertical.addListener(_scrolled);
    _horizontal.addListener(_scrolled);
  }

  @override
  void detach() {
    _vertical.removeListener(_scrolled);
    _horizontal.removeListener(_scrolled);
    super.detach();
  }

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! _RowParentData) {
      child.parentData = _RowParentData();
    }
  }

  List<RenderGridRow> get _rows {
    final rows = <RenderGridRow>[];
    var child = firstChild;
    while (child != null) {
      rows.add(child);
      child = childAfter(child);
    }
    return rows;
  }

  @override
  void describeSemanticsConfiguration(SemanticsConfiguration config) {
    super.describeSemanticsConfiguration(config);
    config
      ..isSemanticBoundary = true
      ..explicitChildNodes = true
      ..role = SemanticsRole.table
      ..label = _label
      ..textDirection = _textDirection;
  }

  @override
  Rect describeSemanticsClip(RenderObject? child) => Offset.zero & size;

  // ---------------------------------------------------------------- layout

  List<double> _measureWidths(List<RenderGridRow> rows, double maxWidth) {
    var columns = 0;
    for (final row in rows) {
      columns = math.max(columns, row.childCount);
    }
    final widths = List<double>.filled(columns, 0);
    for (final row in rows) {
      for (final (index, cell) in row._cells.indexed) {
        widths[index] = math.max(
          widths[index],
          cell.getMaxIntrinsicWidth(double.infinity),
        );
      }
    }
    if (columns == 0) return widths;
    // The data columns and the total column share one width.
    var shared = 0.0;
    for (var i = 1; i < columns; i++) {
      shared = math.max(shared, widths[i]);
    }
    for (var i = 1; i < columns; i++) {
      widths[i] = shared;
    }
    var header = _rowHeaderWidth ?? widths[0];
    if (maxWidth.isFinite) {
      header = math.min(header, maxWidth * _maxRowHeaderShare);
    }
    widths[0] = header;
    return widths;
  }

  @override
  void performLayout() {
    final rows = _rows;
    final widths = _measureWidths(rows, constraints.maxWidth);
    final lefts = <double>[];
    var x = 0.0;
    for (final width in widths) {
      lefts.add(x);
      x += width;
    }
    final tops = <double>[];
    final heights = <double>[];
    var y = 0.0;
    for (final row in rows) {
      final height = row._heightFor(widths);
      tops.add(y);
      heights.add(height);
      y += height;
    }
    _widths = widths;
    _lefts = lefts;
    _tops = tops;
    _heights = heights;
    _content = Size(x, y);
    size = constraints.constrain(_content);
    for (final (index, row) in rows.indexed) {
      row.layout(
        _RowConstraints(
          Size(size.width, heights[index]),
          widths: widths,
          lefts: lefts,
        ),
        parentUsesSize: true,
      );
    }
    _vertical.applyViewportDimension(size.height);
    _vertical.applyContentDimensions(0, math.max(0, y - size.height));
    _horizontal.applyViewportDimension(size.width);
    _horizontal.applyContentDimensions(0, math.max(0, x - size.width));
  }

  @override
  double computeMinIntrinsicWidth(double height) => _intrinsicContent().width;

  @override
  double computeMaxIntrinsicWidth(double height) => _intrinsicContent().width;

  @override
  double computeMinIntrinsicHeight(double width) => _intrinsicContent().height;

  @override
  double computeMaxIntrinsicHeight(double width) => _intrinsicContent().height;

  Size _intrinsicContent() {
    final rows = _rows;
    final widths = _measureWidths(rows, double.infinity);
    final width = widths.fold(0.0, (sum, w) => sum + w);
    var height = 0.0;
    for (final row in rows) {
      height += row._heightFor(widths);
    }
    return Size(width, height);
  }

  // ------------------------------------------------------- sticky geometry

  bool _pinned(int row) =>
      row == 0 || (_pinLastRow && row == _tops.length - 1 && row > 0);

  double get _topPin => _heights.isEmpty ? 0 : _heights.first;

  double get _bottomPin =>
      _pinLastRow && _heights.length > 1 ? _heights.last : 0;

  double get _startPin => _widths.isEmpty ? 0 : _widths.first;

  double _rowY(int row) {
    if (row == 0) return 0;
    final natural = _tops[row] - _vertical.pixels;
    if (_pinned(row)) return math.min(natural, size.height - _heights[row]);
    return natural;
  }

  /// Body rows fully visible between the sticky rows, at least one.
  int get pageRows {
    final top = _topPin;
    final bottom = size.height - _bottomPin;
    var count = 0;
    final last = _pinLastRow ? _tops.length - 1 : _tops.length;
    for (var row = 1; row < last; row++) {
      final y = _rowY(row);
      if (y >= top - 0.5 && y + _heights[row] <= bottom + 0.5) count++;
    }
    return math.max(1, count);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final rows = _rows;
    if (rows.isEmpty) return;
    context.pushClipRect(needsCompositing, offset, Offset.zero & size, (
      context,
      offset,
    ) {
      // Scrolled rows first, then the sticky rows over them.
      final order = [
        for (var row = 1; row < rows.length; row++)
          if (!_pinned(row)) row,
        for (var row = rows.length - 1; row >= 0; row--)
          if (_pinned(row)) row,
      ];
      for (final row in order) {
        final y = _rowY(row);
        if (y >= size.height || y + _heights[row] <= 0) continue;
        context.paintChild(rows[row], offset + Offset(0, y));
      }
    });
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) {
    final rows = _rows;
    final order = [
      for (var row = 0; row < rows.length; row++)
        if (_pinned(row)) row,
      for (var row = rows.length - 1; row > 0; row--)
        if (!_pinned(row)) row,
    ];
    for (final row in order) {
      final hit = result.addWithPaintOffset(
        offset: Offset(0, _rowY(row)),
        position: position,
        hitTest: (result, transformed) =>
            rows[row].hitTest(result, position: transformed),
      );
      if (hit) return true;
    }
    return false;
  }

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    final row = _rows.indexOf(child as RenderGridRow);
    if (row >= 0) {
      transform.multiply(Matrix4.translationValues(0, _rowY(row), 0));
    }
  }

  // -------------------------------------------------------------- reveal

  /// The row and column of the cell that holds [target], or null.
  (int, int)? _cellOf(RenderObject target) {
    RenderObject? child = target;
    while (child != null) {
      final parent = child.parent;
      if (parent is RenderGridRow && parent.parent == this) {
        final column = parent._cells.indexOf(child as RenderBox);
        final row = _rows.indexOf(parent);
        return row < 0 || column < 0 ? null : (row, column);
      }
      child = parent;
    }
    return null;
  }

  double _offsetFor(int row, int column, Axis axis, double alignment) {
    if (axis == Axis.vertical) {
      if (_pinned(row)) return _vertical.pixels;
      final band = size.height - _topPin - _bottomPin;
      return _tops[row] - _topPin - alignment * (band - _heights[row]);
    }
    if (column == 0) return _horizontal.pixels;
    final band = size.width - _startPin;
    return _lefts[column] - _startPin - alignment * (band - _widths[column]);
  }

  @override
  RevealedOffset getOffsetToReveal(
    RenderObject target,
    double alignment, {
    Rect? rect,
    Axis? axis,
  }) {
    final axisToReveal = axis ?? Axis.vertical;
    final cell = _cellOf(target);
    final current = axisToReveal == Axis.vertical
        ? _vertical.pixels
        : _horizontal.pixels;
    final bounds = target.paintBounds;
    if (cell == null) {
      return RevealedOffset(offset: current, rect: bounds);
    }
    final (row, column) = cell;
    final offset = _offsetFor(row, column, axisToReveal, alignment);
    final shift = offset - current;
    final visual = MatrixUtils.transformRect(
      target.getTransformTo(this),
      rect ?? bounds,
    );
    final rtl = _textDirection == TextDirection.rtl;
    return RevealedOffset(
      offset: offset,
      rect: axisToReveal == Axis.vertical
          ? visual.shift(Offset(0, -shift))
          : visual.shift(Offset(rtl ? shift : -shift, 0)),
    );
  }

  /// Scrolls the least on each axis so the cell that holds [target] shows
  /// whole between the sticky rows and column.
  void revealNearest(RenderObject target, {required bool animate}) {
    final cell = _cellOf(target);
    if (cell == null) return;
    final (row, column) = cell;
    for (final (axis, offset) in [
      (Axis.vertical, _vertical),
      (Axis.horizontal, _horizontal),
    ]) {
      final start = _offsetFor(row, column, axis, 0);
      final end = _offsetFor(row, column, axis, 1);
      final pixels = offset.pixels;
      var target = pixels;
      if (pixels > start) {
        target = start;
      } else if (pixels < end) {
        target = end;
      }
      final position = offset is ScrollPosition ? offset : null;
      if (position != null) {
        target = target.clamp(
          position.minScrollExtent,
          position.maxScrollExtent,
        );
      }
      if (target == pixels) continue;
      if (animate) {
        offset.animateTo(
          target,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOut,
        );
      } else {
        offset.jumpTo(target);
      }
    }
  }

  @override
  void showOnScreen({
    RenderObject? descendant,
    Rect? rect,
    Duration duration = Duration.zero,
    Curve curve = Curves.ease,
  }) {
    if (descendant != null && _cellOf(descendant) != null) {
      revealNearest(descendant, animate: duration > Duration.zero);
      return super.showOnScreen(duration: duration, curve: curve);
    }
    super.showOnScreen(
      descendant: descendant,
      rect: rect,
      duration: duration,
      curve: curve,
    );
  }
}
