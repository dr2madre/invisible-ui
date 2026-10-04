import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../internal/value_bar.dart';
import '../theme/theme.dart';

// Sizes the web Progress sets in its own stylesheet.
const double _circleSide = 48;
const double _circleStroke = 3.5 / 36;
const double _valueEm = 0.75;

/// The completed share of [value] between [min] and [max], 0 to 100: the
/// value is clamped, and an empty range reads as nothing done. The rule of
/// `percentage` in `core/src/progress/state.ts`.
double progressPercentage(double value, double min, double max) {
  final span = max - min;
  if (span <= 0) return 0;
  return (value.clamp(min, max) - min) / span * 100;
}

/// The shape of a [Progress].
enum ProgressShape {
  /// A horizontal track that fills from the inline-start.
  bar,

  /// A ring that fills clockwise from the top.
  circle,
}

/// How far something has advanced toward completion, such as steps done or
/// a profile filled in: a value against a known end.
///
/// It is determinate by design. Work of unknown length is waiting, which
/// [Loading] shows: `Loading(variant: LoadingVariant.bar)` for a sliding
/// bar that stands still under reduced motion.
///
/// It is named [label] and reads its completion as a percentage. A new
/// value slides the fill over 200 milliseconds, at once under reduced
/// motion. [showValue] writes the percentage inside a circle.
class Progress extends StatelessWidget {
  /// Creates the indicator.
  const Progress({
    super.key,
    required this.value,
    required this.label,
    this.min = 0,
    this.max = 100,
    this.shape = ProgressShape.bar,
    this.showValue = false,
  });

  /// The current value. Values outside [min] and [max] are clamped.
  final double value;

  /// The accessible name.
  final String label;

  /// The value of nothing done.
  final double min;

  /// The value of done.
  final double max;

  /// A bar or a ring.
  final ProgressShape shape;

  /// Whether a circle shows its percentage.
  final bool showValue;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final percentage = progressPercentage(value, min, max);
    final Widget indicator = switch (shape) {
      ProgressShape.bar => ValueBar(percentage: percentage, fill: colors.text),
      ProgressShape.circle => _Ring(
        percentage: percentage,
        showValue: showValue,
      ),
    };
    return Semantics(
      container: true,
      label: label,
      value: '${percentage.round()}%',
      child: ExcludeSemantics(child: indicator),
    );
  }
}

class _Ring extends StatelessWidget {
  const _Ring({required this.percentage, required this.showValue});

  final double percentage;
  final bool showValue;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final side = MediaQuery.textScalerOf(context).scale(_circleSide);
    return TweenAnimationBuilder<double>(
      tween: Tween(end: percentage),
      duration: valueTransition(context),
      curve: Curves.ease,
      builder: (context, shown, _) => SizedBox.square(
        dimension: side,
        child: CustomPaint(
          painter: _RingPainter(
            share: shown / 100,
            track: colors.border,
            fill: colors.text,
          ),
          child: showValue
              ? Center(
                  child: Text(
                    '${percentage.round()}%',
                    style: theme.textStyle.copyWith(
                      color: colors.text,
                      fontSize: theme.textStyle.fontSize! * _valueEm,
                      fontWeight: FontWeight.w600,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.share,
    required this.track,
    required this.fill,
  });

  final double share;
  final Color track;
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = size.width * _circleStroke;
    final rect = (Offset.zero & size).deflate(stroke / 2);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    canvas.drawArc(rect, 0, 2 * math.pi, false, paint..color = track);
    if (share <= 0) return;
    canvas.drawArc(
      rect,
      -math.pi / 2,
      2 * math.pi * share,
      false,
      paint
        ..color = fill
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.share != share || old.track != track || old.fill != fill;
}
