import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

// The value rules of `core/src/slider/state.ts` and
// `core/src/range-slider/state.ts` and `geometry.ts`, in Dart. They take data
// and return data, so the shared vectors in core/src/slider/__vectors__ and
// core/src/range-slider/__vectors__ hold both implementations to the same
// answers.

/// The number of decimals of [step] as JavaScript's `String(step)` writes
/// it: none for a whole number or an exponent form.
int _decimals(double step) {
  if (step == step.truncateToDouble()) return 0;
  final text = step.toString();
  if (text.contains('e')) return 0;
  final dot = text.indexOf('.');
  return dot == -1 ? 0 : text.length - dot - 1;
}

/// [value] rounded to the decimals of [step], which removes the drift of a
/// multiplication (`0.9 - 0.3` is `0.6000000000000001`).
double onGrid(double value, double step) {
  if (step <= 0) return value;
  final decimals = _decimals(step);
  return decimals == 0 ? value : double.parse(value.toStringAsFixed(decimals));
}

double _clamp(double value, double min, double max) =>
    math.min(math.max(value, min), max);

/// The slider's snap: the nearest step from [min], then clamped. A [max]
/// the grid does not reach stays reachable, as in `core/src/slider`.
double snapSlider(double value, double min, double max, double step) {
  if (step <= 0) return _clamp(value, min, max);
  final snapped = min + ((value - min) / step).roundHalfUp() * step;
  return _clamp(onGrid(snapped, step), min, max);
}

/// The filled share, 0 to 100; 0 when the track has no span.
double sliderPercentage(double value, double min, double max) {
  final span = max - min;
  if (span <= 0) return 0;
  return (value - min) / span * 100;
}

/// The snapped value at [fraction] (0 to 1) of the track.
double sliderValueFromFraction(
  double fraction,
  double min,
  double max,
  double step,
) => snapSlider(min + fraction * (max - min), min, max, step);

/// The range slider's snap: the nearest step from [min], kept inside the
/// bounds; past [max] it steps down to the last grid point at or below it,
/// so the pair stays on the grid the arrows move on. A value that is not a
/// number reads as [min].
double snapRange(double value, double min, double max, double step) {
  final safe = value.isFinite ? value : min;
  if (step <= 0) return _clamp(safe, min, max);
  final snapped = onGrid(
    min + ((safe - min) / step).roundHalfUp() * step,
    step,
  );
  if (snapped > max) {
    return math.max(
      min,
      onGrid(min + ((max - min) / step).floorToDouble() * step, step),
    );
  }
  return math.max(min, snapped);
}

/// The distance the two thumbs really keep: [minDistance] rounded up to the
/// grid and capped at the widest distance the grid holds in the span.
double effectiveMinDistance(
  double minDistance,
  double min,
  double max,
  double step,
) {
  final span = math.max(0.0, max - min);
  final wanted = minDistance.isFinite ? math.max(0.0, minDistance) : 0.0;
  if (step <= 0) return math.min(wanted, span);
  final gridSpan = onGrid((span / step).floorToDouble() * step, step);
  final up = math.max(
    0.0,
    onGrid((wanted / step - 1e-9).ceilToDouble() * step, step),
  );
  return math.min(up, gridSpan);
}

/// The pair after thumb [moved] (0 or 1) asks for [raw]: snapped, then held
/// the distance away from the other thumb, which never moves.
(double, double) clampPair(
  (double, double) value,
  int moved,
  double raw,
  double min,
  double max,
  double step,
  double minDistance,
) {
  final aligned = effectiveMinDistance(minDistance, min, max, step);
  final requested = snapRange(raw, min, max, step);
  if (moved == 0) {
    final ceiling = onGrid(value.$2 - aligned, step);
    return (math.max(min, math.min(requested, ceiling)), value.$2);
  }
  final floor = onGrid(value.$1 + aligned, step);
  return (value.$1, math.min(max, math.max(requested, floor)));
}

/// An incoming pair made legal: on the grid, inside the bounds, in order
/// and at least the distance apart. The lower value is kept where it can
/// be; with no room above, the pair slides down from [max].
(double, double) normalizePair(
  (double, double) value,
  double min,
  double max,
  double step,
  double minDistance,
) {
  final distance = effectiveMinDistance(minDistance, min, max, step);
  var lower = snapRange(value.$1, min, max, step);
  var upper = math.max(snapRange(value.$2, min, max, step), lower);
  bool short() => onGrid(upper - lower, step) < distance;
  if (short()) upper = snapRange(lower + distance, min, max, step);
  if (short()) {
    upper = snapRange(max, min, max, step);
    lower = snapRange(upper - distance, min, max, step);
  }
  return (lower, upper);
}

/// [min] and [max] with the smaller first; a bound that is not a number
/// reads as 0.
(double, double) orderBounds(double min, double max) {
  final a = min.isFinite ? min : 0.0;
  final b = max.isFinite ? max : 0.0;
  return a <= b ? (a, b) : (b, a);
}

/// The thumb a press at [pointer] reaches, both as fractions of the track:
/// the nearer one, the lower one midway. Stacked thumbs: the side of the
/// stack the pointer is on, and dead on the stack the one that can move.
int nearerThumb(double pointer, double lower, double upper) {
  if (lower == upper) {
    if (pointer > lower) return 1;
    if (pointer < lower) return 0;
    return lower >= 1 ? 0 : 1;
  }
  return (pointer - lower).abs() <= (pointer - upper).abs() ? 0 : 1;
}

/// Where [point] is along [box], 0 at the minimum end and 1 at the maximum
/// end, clamped. A horizontal track has its minimum at the left, or at the
/// right when [rtl]; a vertical one at the top, or at the bottom when [rtl],
/// which is how the sliders draw it.
double pointerFraction({
  required Axis axis,
  required bool rtl,
  required Rect box,
  required Offset point,
}) {
  final double fraction;
  if (axis == Axis.vertical) {
    if (box.height <= 0) return 0;
    fraction = rtl
        ? (box.bottom - point.dy) / box.height
        : (point.dy - box.top) / box.height;
  } else {
    if (box.width <= 0) return 0;
    fraction = rtl
        ? (box.right - point.dx) / box.width
        : (point.dx - box.left) / box.width;
  }
  return _clamp(fraction, 0, 1);
}

/// [value]'s position on the track, 0 at [min] and 1 at [max].
double valueFraction(double value, double min, double max) {
  final span = max - min;
  if (span <= 0) return 0;
  return _clamp((value - min) / span, 0, 1);
}

/// The value a slider key moves [value] to, or null when [key] is not a
/// slider key. Arrows move one [step]: right and up increase, and in
/// right-to-left text the horizontal arrows swap, as the track does. Page Up
/// and Page Down move a tenth of the span or one step, whichever is larger,
/// as a native range input does; Home and End go to the ends. The caller
/// snaps the result.
double? sliderKeyTarget({
  required LogicalKeyboardKey key,
  required double value,
  required double min,
  required double max,
  required double step,
  required TextDirection direction,
}) {
  final unit = step > 0 ? step : (max - min) / 100;
  final page = math.max(unit, (max - min) / 10);
  final rtl = direction == TextDirection.rtl;
  if (key == LogicalKeyboardKey.home) return min;
  if (key == LogicalKeyboardKey.end) return max;
  if (key == LogicalKeyboardKey.pageUp) return value + page;
  if (key == LogicalKeyboardKey.pageDown) return value - page;
  if (key == LogicalKeyboardKey.arrowUp) return value + unit;
  if (key == LogicalKeyboardKey.arrowDown) return value - unit;
  if (key == LogicalKeyboardKey.arrowRight) {
    return rtl ? value - unit : value + unit;
  }
  if (key == LogicalKeyboardKey.arrowLeft) {
    return rtl ? value + unit : value - unit;
  }
  return null;
}

extension on double {
  /// Rounds half up, as JavaScript's `Math.round` does: `-2.5` rounds to
  /// `-2`, where Dart's `round` gives `-3`.
  double roundHalfUp() => (this + 0.5).floorToDouble();
}
