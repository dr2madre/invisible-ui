import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// The side of its anchor an overlay prefers.
enum AnchorSide {
  /// Above the anchor.
  top,

  /// Below the anchor.
  bottom,

  /// Beside the anchor at the inline-start: left in left-to-right text.
  start,

  /// Beside the anchor at the inline-end: right in left-to-right text.
  end,
}

/// Places an overlay against an [anchor] rectangle, as the web adapters'
/// Floating UI setup does (`offset`, `flip`, `shift`): on the preferred
/// [side] with a [gap], on the opposite side when the preferred one has no
/// room, and shifted to stay [padding] inside the overlay. Both the anchor and
/// the result are in the overlay's coordinates.
class AnchoredLayout extends SingleChildLayoutDelegate {
  /// Creates the layout.
  const AnchoredLayout({
    required this.anchor,
    required this.side,
    required this.direction,
    this.gap = 4,
    this.padding = 8,
    this.centered = false,
    this.matchAnchorWidth = false,
  });

  /// The anchor's rectangle.
  final Rect anchor;

  /// The preferred side.
  final AnchorSide side;

  /// The reading direction, which decides where start and end are.
  final TextDirection direction;

  /// The space between the anchor and the overlay.
  final double gap;

  /// The space kept free at the overlay's edges.
  final double padding;

  /// Whether the overlay centres on the anchor; otherwise it lines up with
  /// the anchor's inline-start edge.
  final bool centered;

  /// Whether the overlay is at least as wide as the anchor.
  final bool matchAnchorWidth;

  bool get _vertical => side == AnchorSide.top || side == AnchorSide.bottom;

  bool get _endOnRight => direction == TextDirection.ltr;

  ({double before, double after}) _room(Size viewport) => _vertical
      ? (
          before: anchor.top - gap - padding,
          after: viewport.height - padding - anchor.bottom - gap,
        )
      : (
          before: anchor.left - gap - padding,
          after: viewport.width - padding - anchor.right - gap,
        );

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    final viewport = constraints.biggest;
    final room = _room(viewport);
    final across = math.max(0.0, math.max(room.before, room.after));
    final maxWidth = math.max(0.0, viewport.width - padding * 2);
    final maxHeight = math.max(0.0, viewport.height - padding * 2);
    return BoxConstraints(
      minWidth: matchAnchorWidth ? math.min(anchor.width, maxWidth) : 0,
      maxWidth: _vertical ? maxWidth : across,
      maxHeight: _vertical ? across : maxHeight,
    );
  }

  @override
  // ignore: avoid_renaming_method_parameters
  Offset getPositionForChild(Size viewport, Size child) {
    final room = _room(viewport);
    final extent = _vertical ? child.height : child.width;
    // Physical "after" is below or to the right.
    final prefersAfter = switch (side) {
      AnchorSide.bottom => true,
      AnchorSide.top => false,
      AnchorSide.end => _endOnRight,
      AnchorSide.start => !_endOnRight,
    };
    final preferred = prefersAfter ? room.after : room.before;
    final other = prefersAfter ? room.before : room.after;
    final after = extent <= preferred
        ? prefersAfter
        : extent <= other
        ? !prefersAfter
        : (preferred >= other) == prefersAfter;

    double clamp(double value, double size, double limit) =>
        math.max(padding, math.min(value, limit - padding - size));

    if (_vertical) {
      final y = after ? anchor.bottom + gap : anchor.top - gap - child.height;
      final x = centered
          ? anchor.center.dx - child.width / 2
          : _endOnRight
          ? anchor.left
          : anchor.right - child.width;
      return Offset(clamp(x, child.width, viewport.width), y);
    }
    final x = after ? anchor.right + gap : anchor.left - gap - child.width;
    final y = anchor.center.dy - child.height / 2;
    return Offset(
      clamp(x, child.width, viewport.width),
      clamp(y, child.height, viewport.height),
    );
  }

  @override
  bool shouldRelayout(AnchoredLayout old) =>
      old.anchor != anchor ||
      old.side != side ||
      old.direction != direction ||
      old.gap != gap ||
      old.padding != padding ||
      old.centered != centered ||
      old.matchAnchorWidth != matchAnchorWidth;
}

/// The rectangle of [anchor]'s render box in the coordinates of the overlay
/// that [overlayContext] belongs to.
Rect anchorRectIn(BuildContext overlayContext, BuildContext anchor) {
  final overlay =
      Overlay.of(overlayContext).context.findRenderObject()! as RenderBox;
  final box = anchor.findRenderObject()! as RenderBox;
  final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
  return topLeft & box.size;
}
