import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

// The pure carousel logic of `core/src/carousel`: index bounds, stepping
// and the arrow keys. The shared vectors in `core/src/carousel/__vectors__`
// hold both to the same answers.

/// [index] held inside `[0, count - 1]`, or 0 when there are no slides.
int clampSlide(int index, int count) =>
    count <= 0 ? 0 : index.clamp(0, count - 1);

/// The slide after [index], wrapping to the first when [loop].
int nextSlide(int index, int count, {required bool loop}) {
  if (count <= 0) return 0;
  if (index >= count - 1) return loop ? 0 : index;
  return index + 1;
}

/// The slide before [index], wrapping to the last when [loop].
int previousSlide(int index, int count, {required bool loop}) {
  if (count <= 0) return 0;
  if (index <= 0) return loop ? count - 1 : index;
  return index - 1;
}

/// Whether a step forward moves.
bool canGoNext(int index, int count, {required bool loop}) =>
    count > 1 && (loop || index < count - 1);

/// Whether a step back moves.
bool canGoPrevious(int index, int count, {required bool loop}) =>
    count > 1 && (loop || index > 0);

/// The slide [key] moves to from [index], or null for a key the carousel
/// does not take. A horizontal carousel takes the left and right arrows,
/// swapped in right-to-left text; a vertical one takes up and down.
int? carouselKeyTarget({
  required LogicalKeyboardKey key,
  required int index,
  required int count,
  required bool loop,
  required Axis orientation,
  required TextDirection direction,
}) {
  final vertical = orientation == Axis.vertical;
  final rtl = direction == TextDirection.rtl;
  final forward = vertical
      ? LogicalKeyboardKey.arrowDown
      : (rtl ? LogicalKeyboardKey.arrowLeft : LogicalKeyboardKey.arrowRight);
  final back = vertical
      ? LogicalKeyboardKey.arrowUp
      : (rtl ? LogicalKeyboardKey.arrowRight : LogicalKeyboardKey.arrowLeft);
  if (key == forward) return nextSlide(index, count, loop: loop);
  if (key == back) return previousSlide(index, count, loop: loop);
  return null;
}
