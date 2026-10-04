import 'dart:math' as math;
import 'dart:ui';

// The submenu geometry of core/src/internal/submenu-geometry.ts in Dart:
// numbers in, numbers out, held to the same shared vectors. Coordinates are
// logical pixels, x to the right and y down.

/// Whether [point] lies inside [polygon] (even-odd rule, ray casting). A
/// point exactly on an edge may fall either way.
bool pointInPolygon(Offset point, List<Offset> polygon) {
  var inside = false;
  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    final a = polygon[i];
    final b = polygon[j];
    final crosses =
        (a.dy > point.dy) != (b.dy > point.dy) &&
        point.dx < (b.dx - a.dx) * (point.dy - a.dy) / (b.dy - a.dy) + a.dx;
    if (crosses) inside = !inside;
  }
  return inside;
}

/// How far behind the exit point the grace area starts.
const double graceBleed = 5;

/// The grace area: a triangle from the point where the pointer left the
/// trigger, moved [graceBleed] away from the submenu, to the submenu's two
/// near corners. [submenuOnRight] is the physical side of the trigger the
/// submenu sits on.
List<Offset> graceArea(
  Offset exit,
  Rect submenu, {
  required bool submenuOnRight,
}) {
  final nearX = submenuOnRight ? submenu.left : submenu.right;
  final bleed = submenuOnRight ? -graceBleed : graceBleed;
  return [
    Offset(exit.dx + bleed, exit.dy),
    Offset(nearX, submenu.top),
    Offset(nearX, submenu.bottom),
  ];
}

/// Whether [pointer] is inside the grace area of a submenu.
bool isInGraceArea(
  Offset pointer,
  Offset exit,
  Rect submenu, {
  required bool submenuOnRight,
}) => pointInPolygon(
  pointer,
  graceArea(exit, submenu, submenuOnRight: submenuOnRight),
);

/// Where a submenu went.
enum SubmenuSide {
  /// Beside the trigger at the inline-end.
  inlineEnd,

  /// Beside the trigger at the inline-start: the inline-end had no room.
  inlineStart,

  /// Over its parent menu: neither side had room.
  overlap,
}

/// A submenu's position, side and maximum height.
class SubmenuPlacement {
  /// Creates a placement.
  const SubmenuPlacement({
    required this.side,
    required this.onRight,
    required this.offset,
    required this.maxHeight,
  });

  /// The side it opened on.
  final SubmenuSide side;

  /// The physical side, for the grace area: true for right, false for left,
  /// null when it overlaps its parent.
  final bool? onRight;

  /// The top-left corner.
  final Offset offset;

  /// The tallest it may be; it scrolls inside beyond this.
  final double maxHeight;
}

/// Chooses where a submenu opens: at the inline-end of its [anchor], top
/// aligned; at the inline-start when the inline-end has no room; over its
/// parent, shifted inside the [viewport], when neither side has room. It
/// shifts up to stay inside, and its maximum height is the viewport height
/// minus [padding] at both edges.
SubmenuPlacement placeSubmenu({
  required Rect anchor,
  required Size menu,
  required Size viewport,
  required TextDirection direction,
  double padding = 8,
}) {
  final right = anchor.right;
  final left = anchor.left - menu.width;
  final roomRight = right + menu.width <= viewport.width - padding;
  final roomLeft = left >= padding;
  final rtl = direction == TextDirection.rtl;

  final maxHeight = math.max(0.0, viewport.height - padding * 2);
  final y = _clamp(
    anchor.top,
    padding,
    viewport.height - padding - math.min(menu.height, maxHeight),
  );

  SubmenuPlacement at(SubmenuSide side, bool onRight) => SubmenuPlacement(
    side: side,
    onRight: onRight,
    offset: Offset(onRight ? right : left, y),
    maxHeight: maxHeight,
  );

  final endOnRight = !rtl;
  if (endOnRight ? roomRight : roomLeft) {
    return at(SubmenuSide.inlineEnd, endOnRight);
  }
  if (endOnRight ? roomLeft : roomRight) {
    return at(SubmenuSide.inlineStart, !endOnRight);
  }
  final x = _clamp(
    endOnRight ? right : left,
    padding,
    viewport.width - padding - menu.width,
  );
  return SubmenuPlacement(
    side: SubmenuSide.overlap,
    onRight: null,
    offset: Offset(x, y),
    maxHeight: maxHeight,
  );
}

// Math.max(min, Math.min(value, max)) as the core writes it: when max < min,
// min wins, unlike num.clamp, which throws.
double _clamp(double value, double min, double max) =>
    math.max(min, math.min(value, max));
