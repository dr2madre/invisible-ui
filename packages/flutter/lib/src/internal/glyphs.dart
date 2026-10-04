import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// The size and colour of a glyph, from the surrounding [IconTheme], scaled
/// with the text when the theme asks for it.
({double size, Color color}) _glyphStyle(BuildContext context) {
  final icons = IconTheme.of(context);
  final size = icons.size ?? 24;
  return (
    size: icons.applyTextScaling ?? false
        ? MediaQuery.textScalerOf(context).scale(size)
        : size,
    color: icons.color ?? const Color(0xFF000000),
  );
}

/// The hazard glyph a danger button shows, so its meaning never relies on
/// colour alone. The same 24 by 24 drawing as the web adapters' icon.
class HazardGlyph extends StatelessWidget {
  /// Creates the glyph; size and colour come from the [IconTheme].
  const HazardGlyph({super.key});

  @override
  Widget build(BuildContext context) => const Glyph(GlyphShape.warning);
}

/// The drawings the components show, on the web adapters' 24 by 24 grid.
enum GlyphShape {
  /// A chevron pointing down: a closed menu trigger.
  chevronDown,

  /// A chevron pointing to the inline-end: a submenu trigger. It mirrors
  /// under right-to-left.
  chevronEnd,

  /// A tick: a checked menu item.
  check,

  /// A cross: a close button.
  close,

  /// A circled "i": the info status.
  info,

  /// A bold tick: the success status.
  success,

  /// A triangle with "!": the warning status, and the danger button's hazard.
  warning,

  /// An octagon with a cross: the danger status.
  danger,

  /// A light bulb: the neutral status, a tip.
  neutral,
}

/// A stroked glyph, sized and coloured by the surrounding [IconTheme]. It has
/// no semantics: the control that shows it carries the meaning.
class Glyph extends StatelessWidget {
  /// Creates the glyph [shape].
  const Glyph(this.shape, {super.key});

  /// The drawing.
  final GlyphShape shape;

  @override
  Widget build(BuildContext context) {
    final style = _glyphStyle(context);
    final mirror =
        shape == GlyphShape.chevronEnd &&
        Directionality.of(context) == TextDirection.rtl;
    return CustomPaint(
      size: Size.square(style.size),
      painter: _GlyphPainter(shape, style.color, mirror: mirror),
    );
  }
}

class _GlyphPainter extends CustomPainter {
  const _GlyphPainter(this.shape, this.color, {required this.mirror});

  final GlyphShape shape;
  final Color color;
  final bool mirror;

  static Path _polyline(List<double> points, {bool close = false}) {
    final path = Path()..moveTo(points[0], points[1]);
    for (var i = 2; i < points.length; i += 2) {
      path.lineTo(points[i], points[i + 1]);
    }
    if (close) path.close();
    return path;
  }

  static Path _line(double x1, double y1, double x2, double y2) => Path()
    ..moveTo(x1, y1)
    ..lineTo(x2, y2);

  static List<Path> _paths(GlyphShape shape) {
    const corner = Radius.circular(2);
    return switch (shape) {
      GlyphShape.chevronDown => [
        _polyline([6, 9, 12, 15, 18, 9]),
      ],
      GlyphShape.chevronEnd => [
        _polyline([9, 6, 15, 12, 9, 18]),
      ],
      GlyphShape.check || GlyphShape.success => [
        _polyline([20, 6, 9, 17, 4, 12]),
      ],
      GlyphShape.close => [_line(18, 6, 6, 18), _line(6, 6, 18, 18)],
      GlyphShape.info => [
        Path()
          ..addOval(Rect.fromCircle(center: const Offset(12, 12), radius: 10)),
        _line(12, 11, 12, 16),
        _line(12, 8, 12, 8),
      ],
      GlyphShape.warning => [
        Path()
          ..moveTo(10.29, 3.86)
          ..lineTo(1.82, 18)
          ..arcToPoint(const Offset(3.53, 21), radius: corner, clockwise: false)
          ..lineTo(20.47, 21)
          ..arcToPoint(
            const Offset(22.18, 18),
            radius: corner,
            clockwise: false,
          )
          ..lineTo(13.71, 3.86)
          ..arcToPoint(
            const Offset(10.29, 3.86),
            radius: corner,
            clockwise: false,
          )
          ..close(),
        _line(12, 9, 12, 13),
        _line(12, 17, 12, 17),
      ],
      GlyphShape.danger => [
        _polyline([
          7.86, 2, 16.14, 2, 22, 7.86, 22, 16.14, //
          16.14, 22, 7.86, 22, 2, 16.14, 2, 7.86,
        ], close: true),
        _line(15, 9, 9, 15),
        _line(9, 9, 15, 15),
      ],
      GlyphShape.neutral => [
        _line(9, 18, 15, 18),
        _line(10, 22, 14, 22),
        Path()
          ..moveTo(15.09, 14)
          ..relativeCubicTo(0.18, -0.98, 0.65, -1.74, 1.41, -2.5)
          ..arcToPoint(
            const Offset(18, 8),
            radius: const Radius.circular(4.65),
            clockwise: false,
          )
          ..arcToPoint(
            const Offset(6, 8),
            radius: const Radius.circular(6),
            clockwise: false,
          )
          ..relativeCubicTo(0, 1, 0.23, 2.23, 1.5, 3.5)
          ..arcToPoint(
            const Offset(8.91, 14),
            radius: const Radius.circular(4.61),
          ),
      ],
    };
  }

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24);
    if (mirror) {
      canvas
        ..translate(24, 0)
        ..scale(-1, 1);
    }
    final bold = shape == GlyphShape.success;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = bold ? 2.5 : 2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = color;
    for (final path in _paths(shape)) {
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_GlyphPainter old) =>
      old.shape != shape || old.color != color || old.mirror != mirror;
}

/// A rotating arc that shows work in progress. It stands still when the
/// platform asks for reduced motion. It has no semantics: the control that
/// shows it announces the busy state.
class Spinner extends StatefulWidget {
  /// Creates the spinner; size and colour come from the [IconTheme].
  const Spinner({super.key});

  @override
  State<Spinner> createState() => _SpinnerState();
}

class _SpinnerState extends State<Spinner> with SingleTickerProviderStateMixin {
  late final AnimationController _turns = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeDisableAnimationsOf(context) ?? false) {
      _turns.stop();
    } else if (!_turns.isAnimating) {
      _turns.repeat();
    }
  }

  @override
  void dispose() {
    _turns.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final style = _glyphStyle(context);
    return RotationTransition(
      turns: _turns,
      child: CustomPaint(
        size: Size.square(style.size),
        painter: _ArcPainter(style.color),
      ),
    );
  }
}

class _ArcPainter extends CustomPainter {
  const _ArcPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24);
    canvas.drawArc(
      Rect.fromCircle(center: const Offset(12, 12), radius: 9),
      0,
      1.6 * math.pi,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..color = color,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.color != color;
}
