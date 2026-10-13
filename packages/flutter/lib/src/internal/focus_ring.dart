import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../theme/theme.dart';

/// Paints the focus ring around [child] while [visible], outside its bounds,
/// so the layout never moves.
///
/// The ring and halo sit on the control's edge, as the web's box-shadow ring
/// does. Under high contrast the ring is drawn alone, [InvisibleFocusRing.offset]
/// away, as the web's forced-colours outline is. With [inside], the ring
/// alone is drawn within the bounds, as the web's inset ring is for a
/// control inside a container that clips.
class FocusRingPainter extends StatelessWidget {
  /// Paints [ring] around [child] with [radius] corners while [visible].
  const FocusRingPainter({
    super.key,
    required this.visible,
    required this.ring,
    required this.radius,
    required this.child,
    this.inside = false,
    this.corners,
  });

  /// Whether the ring shows.
  final bool visible;

  /// The ring's colours and sizes.
  final InvisibleFocusRing ring;

  /// The corner radius of the control the ring follows.
  final double radius;

  /// The control.
  final Widget child;

  /// Whether the ring is drawn within the control's bounds.
  final bool inside;

  /// Corners of their own, in place of [radius] on every corner, for a
  /// control whose corners differ, such as the ends of a joined group.
  final BorderRadiusGeometry? corners;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      foregroundPainter: visible
          ? _RingPainter(
              ring: ring,
              corners: (corners ?? BorderRadius.circular(radius)).resolve(
                Directionality.maybeOf(context),
              ),
              highContrast: MediaQuery.maybeHighContrastOf(context) ?? false,
              inside: inside,
            )
          : null,
      child: child,
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.ring,
    required this.corners,
    required this.highContrast,
    required this.inside,
  });

  final InvisibleFocusRing ring;
  final BorderRadius corners;
  final bool highContrast;
  final bool inside;

  void _stroke(Canvas canvas, Size size, double from, double width, Color c) {
    final grow = from + width / 2;
    Radius out(Radius r) => Radius.circular(math.max(0, r.x + grow));
    final rect = RRect.fromRectAndCorners(
      (Offset.zero & size).inflate(grow),
      topLeft: out(corners.topLeft),
      topRight: out(corners.topRight),
      bottomLeft: out(corners.bottomLeft),
      bottomRight: out(corners.bottomRight),
    );
    canvas.drawRRect(
      rect,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = width
        ..color = c,
    );
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (inside) {
      _stroke(canvas, size, -ring.width, ring.width, ring.color);
      return;
    }
    if (highContrast) {
      _stroke(canvas, size, ring.offset, ring.width, ring.color);
      return;
    }
    _stroke(canvas, size, ring.width, ring.haloWidth, ring.haloColor);
    _stroke(canvas, size, 0, ring.width, ring.color);
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.ring != ring ||
      old.corners != corners ||
      old.highContrast != highContrast ||
      old.inside != inside;
}
