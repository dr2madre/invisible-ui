import 'package:flutter/widgets.dart';

import '../theme/theme.dart';

/// Paints the focus ring around [child] while [visible], outside its bounds,
/// so the layout never moves.
///
/// The ring and halo sit on the control's edge, as the web's box-shadow ring
/// does. Under high contrast the ring is drawn alone, [InvisibleFocusRing.offset]
/// away, as the web's forced-colours outline is.
class FocusRingPainter extends StatelessWidget {
  /// Paints [ring] around [child] with [radius] corners while [visible].
  const FocusRingPainter({
    super.key,
    required this.visible,
    required this.ring,
    required this.radius,
    required this.child,
  });

  /// Whether the ring shows.
  final bool visible;

  /// The ring's colours and sizes.
  final InvisibleFocusRing ring;

  /// The corner radius of the control the ring follows.
  final double radius;

  /// The control.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      foregroundPainter: visible
          ? _RingPainter(
              ring: ring,
              radius: radius,
              highContrast: MediaQuery.maybeHighContrastOf(context) ?? false,
            )
          : null,
      child: child,
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.ring,
    required this.radius,
    required this.highContrast,
  });

  final InvisibleFocusRing ring;
  final double radius;
  final bool highContrast;

  void _stroke(Canvas canvas, Size size, double from, double width, Color c) {
    final grow = from + width / 2;
    final rect = RRect.fromRectAndRadius(
      (Offset.zero & size).inflate(grow),
      Radius.circular(radius + grow),
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
      old.radius != radius ||
      old.highContrast != highContrast;
}
