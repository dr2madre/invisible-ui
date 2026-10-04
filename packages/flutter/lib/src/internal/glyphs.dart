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
  Widget build(BuildContext context) {
    final style = _glyphStyle(context);
    return CustomPaint(
      size: Size.square(style.size),
      painter: _HazardPainter(style.color),
    );
  }
}

class _HazardPainter extends CustomPainter {
  const _HazardPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24);
    const corner = Radius.circular(2);
    final triangle = Path()
      ..moveTo(10.29, 3.86)
      ..lineTo(1.82, 18)
      ..arcToPoint(const Offset(3.53, 21), radius: corner, clockwise: false)
      ..lineTo(20.47, 21)
      ..arcToPoint(const Offset(22.18, 18), radius: corner, clockwise: false)
      ..lineTo(13.71, 3.86)
      ..arcToPoint(const Offset(10.29, 3.86), radius: corner, clockwise: false)
      ..close();
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..color = color;
    canvas
      ..drawPath(triangle, paint)
      ..drawLine(const Offset(12, 9), const Offset(12, 13), paint)
      ..drawLine(const Offset(12, 17), const Offset(12, 17), paint);
  }

  @override
  bool shouldRepaint(_HazardPainter old) => old.color != color;
}

/// A plus or minus sign, for step buttons. Size and colour come from the
/// [IconTheme]; the button that shows it carries the name.
class SignGlyph extends StatelessWidget {
  /// A plus sign when [plus], a minus sign otherwise.
  const SignGlyph({super.key, required this.plus});

  /// Whether the sign is a plus.
  final bool plus;

  @override
  Widget build(BuildContext context) {
    final style = _glyphStyle(context);
    return CustomPaint(
      size: Size.square(style.size),
      painter: _SignPainter(color: style.color, plus: plus),
    );
  }
}

class _SignPainter extends CustomPainter {
  const _SignPainter({required this.color, required this.plus});

  final Color color;
  final bool plus;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawLine(const Offset(5, 12), const Offset(19, 12), paint);
    if (plus) canvas.drawLine(const Offset(12, 5), const Offset(12, 19), paint);
  }

  @override
  bool shouldRepaint(_SignPainter old) =>
      old.color != color || old.plus != plus;
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
