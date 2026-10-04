import 'package:flutter/widgets.dart';

import '../internal/value_bar.dart';
import '../progress/progress.dart';
import '../theme/theme.dart';

/// The band a [Meter]'s value falls in, against its thresholds.
enum MeterLevel {
  /// At or below the low threshold.
  low,

  /// Between the thresholds, or with none set.
  medium,

  /// At or above the high threshold.
  high,
}

/// How good a [Meter]'s value is, given where the good end of its scale
/// is.
enum MeterQuality {
  /// In the band of the good end.
  optimal,

  /// One band away from it.
  suboptimal,

  /// At the far end from it.
  poor,
}

/// The band of [value] between [min] and [max], the rule of `level` in
/// `core/src/meter/state.ts`.
MeterLevel meterLevel(
  double value, {
  double min = 0,
  double max = 100,
  double? low,
  double? high,
}) {
  final v = value.clamp(min, max);
  if (low != null && v <= low) return MeterLevel.low;
  if (high != null && v >= high) return MeterLevel.high;
  return MeterLevel.medium;
}

/// How good [value] is, the rule of `quality` in `core/src/meter/state.ts`
/// and of the native `<meter>`: the band [optimum] sits in is the good one,
/// the band next to it is middling, and the far one is poor. [optimum]
/// defaults to [max].
MeterQuality meterQuality(
  double value, {
  double min = 0,
  double max = 100,
  double? low,
  double? high,
  double? optimum,
}) {
  MeterLevel band(double v) =>
      meterLevel(v, min: min, max: max, low: low, high: high);
  final here = band(value);
  final good = band(optimum ?? max);
  if (here == good) return MeterQuality.optimal;
  // With the good end in the middle, neither outer band is the worst case.
  if (good == MeterLevel.medium) return MeterQuality.suboptimal;
  return here == MeterLevel.medium
      ? MeterQuality.suboptimal
      : MeterQuality.poor;
}

/// A gauge of a level right now within a known range, such as disk usage
/// or battery, following the WAI-ARIA meter pattern. For progress toward
/// completion, use [Progress].
///
/// It is named [label] and reads its value as a percentage of the range.
/// The fill is coloured by how good the value is: [low] and [high] set the
/// bands, and [optimum] the good end, [max] by default; set it near [min]
/// for a measure where less is better. A new value slides the fill over
/// 200 milliseconds, at once under reduced motion.
class Meter extends StatelessWidget {
  /// Creates the gauge.
  const Meter({
    super.key,
    required this.value,
    required this.label,
    this.min = 0,
    this.max = 100,
    this.low,
    this.high,
    this.optimum,
  });

  /// The measured value. Values outside [min] and [max] are clamped.
  final double value;

  /// The accessible name.
  final String label;

  /// The bottom of the range.
  final double min;

  /// The top of the range.
  final double max;

  /// The upper bound of the low band.
  final double? low;

  /// The lower bound of the high band.
  final double? high;

  /// Where the good end of the scale is. Defaults to [max].
  final double? optimum;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final percentage = progressPercentage(value, min, max);
    final quality = meterQuality(
      value,
      min: min,
      max: max,
      low: low,
      high: high,
      optimum: optimum,
    );
    return Semantics(
      container: true,
      label: label,
      value: '${percentage.round()}%',
      child: ExcludeSemantics(
        child: ValueBar(
          percentage: percentage,
          fill: switch (quality) {
            MeterQuality.poor => colors.danger,
            MeterQuality.suboptimal => colors.warning,
            MeterQuality.optimal => colors.success,
          },
        ),
      ),
    );
  }
}
