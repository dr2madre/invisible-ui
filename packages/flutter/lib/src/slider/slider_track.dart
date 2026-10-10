import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/open_width.dart';
import '../internal/roving.dart';
import '../number_field/number_format.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'slider_logic.dart';

// Sizes the web Slider and RangeSlider set in their own stylesheets.
const double _length = 224;
const double _gap = 10;
const double _rowGap = 4;
const double _valueSize = 14;
const double _rangeSize = 12;
const double _iconEm = 1.2;
const int _maxTicks = 20;
const double _disabledOpacity = 0.5;

/// The keys a slider thumb takes: the roving keys and Page Up and Down.
const Map<ShortcutActivator, Intent> sliderShortcuts = {
  ...rovingShortcuts,
  SingleActivator(LogicalKeyboardKey.pageUp): RovingKeyIntent(
    LogicalKeyboardKey.pageUp,
  ),
  SingleActivator(LogicalKeyboardKey.pageDown): RovingKeyIntent(
    LogicalKeyboardKey.pageDown,
  ),
};

/// The text a slider shows and announces for [value]: [format]'s, or the
/// number written in the symbols of [locale], the app's locale or English.
String sliderText(
  BuildContext context,
  double value,
  String Function(double value)? format,
  Locale? locale,
) {
  if (format != null) return format(value);
  final symbols = NumberSymbols.forLocale(
    locale ?? Localizations.maybeLocaleOf(context) ?? const Locale('en'),
  );
  return formatNumber(value, symbols);
}

/// The positions of the tick marks, one per step when there are at most 20:
/// spaced by the step and only on reachable grid points when [whole], as the
/// RangeSlider draws them, or spread evenly over the track, as the Slider
/// does.
List<double> sliderTicks(
  double min,
  double max,
  double step, {
  required bool whole,
}) {
  if (step <= 0 || max <= min) return const [];
  final span = (max - min) / step;
  final count = whole ? span.floor() : (span + 0.5).floor();
  if (count <= 0 || count > _maxTicks) return const [];
  return [
    for (var i = 0; i <= count; i++) whole ? i * step / (max - min) : i / count,
  ];
}

/// The layout around a slider [control]: a decorative [icon] before it, the
/// [valueText] after it, and [minText] and [maxText] under its ends, all
/// hidden from assistive technology since the control announces the value.
/// A horizontal slider takes the width its parent gives, or 224 when the
/// width is open; a vertical one is [verticalLength] tall.
class SliderFrame extends StatelessWidget {
  /// Lays out [control].
  const SliderFrame({
    super.key,
    required this.axis,
    required this.verticalLength,
    required this.enabled,
    required this.control,
    this.icon,
    this.valueText,
    this.minText,
    this.maxText,
  });

  /// The direction the thumbs travel.
  final Axis axis;

  /// The height of a vertical track.
  final double verticalLength;

  /// Dims the whole slider when false.
  final bool enabled;

  /// The track with its semantics and focus.
  final Widget control;

  /// A decorative icon before the track.
  final Widget? icon;

  /// The value shown after the track.
  final String? valueText;

  /// The minimum shown under the start of the track.
  final String? minText;

  /// The maximum shown under the end of the track.
  final String? maxText;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final horizontal = axis == Axis.horizontal;
    final minText = this.minText;
    final maxText = this.maxText;
    final rangeStyle = theme.textStyle.copyWith(
      fontSize: _rangeSize,
      color: colors.textSecondary,
    );

    final row = Row(
      mainAxisSize: horizontal ? MainAxisSize.max : MainAxisSize.min,
      spacing: _gap,
      children: [
        if (icon case final icon?)
          ExcludeSemantics(
            child: IconTheme(
              data: IconThemeData(
                color: colors.textSecondary,
                size: theme.textStyle.fontSize! * _iconEm,
                applyTextScaling: true,
              ),
              child: icon,
            ),
          ),
        if (horizontal)
          Expanded(child: control)
        else
          SizedBox(height: verticalLength, child: control),
        if (valueText case final text?)
          ExcludeSemantics(
            child: Text(
              text,
              softWrap: false,
              style: theme.textStyle.copyWith(
                fontSize: _valueSize,
                color: colors.text,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
      ],
    );

    final Widget body = Opacity(
      opacity: enabled ? 1 : _disabledOpacity,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: horizontal
            ? CrossAxisAlignment.stretch
            : CrossAxisAlignment.start,
        spacing: _rowGap,
        children: [
          row,
          if (minText != null && maxText != null)
            ExcludeSemantics(
              child: Row(
                mainAxisSize: horizontal ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                spacing: _gap,
                children: [
                  Text(minText, style: rangeStyle),
                  Text(maxText, style: rangeStyle),
                ],
              ),
            ),
        ],
      ),
    );
    return horizontal ? OpenWidth(width: _length, child: body) : body;
  }
}

/// How tick marks look: a short mark under the track, as the Slider draws
/// them, or a dot on it, as the RangeSlider does.
enum TickStyle {
  /// A 2 by 6 mark under the track.
  mark,

  /// A 2 by 2 dot on the track.
  dot,
}

/// What a pointer gesture on a track reports: where it is, as a fraction of
/// the track from the minimum end.
typedef TrackPointer = void Function(double fraction);

/// The painted track of [Slider] and [RangeSlider] and its pointer input.
///
/// The thumbs travel between the two ends inset by half a thumb, so a thumb
/// at either end stays on the track, and the fill and the ticks follow the
/// thumb centres. The minimum is at the inline-start of a horizontal track,
/// so it mirrors under right-to-left, and at the bottom of a vertical one.
/// The cross size is never smaller than [InvisibleThemeData.minTargetSize],
/// so the thumbs keep the target size.
///
/// A press anywhere on the track moves the nearest thumb there at once and
/// drags it; [onStart], [onUpdate] and [onEnd] report the gesture.
class SliderTrack extends StatelessWidget {
  /// Creates the track.
  const SliderTrack({
    super.key,
    required this.axis,
    required this.thickness,
    required this.thumbSize,
    required this.fill,
    required this.fillFrom,
    required this.fillTo,
    required this.thumbs,
    required this.thumbBuilder,
    required this.enabled,
    required this.onStart,
    required this.onUpdate,
    required this.onEnd,
    this.ticks = const [],
    this.tickStyle = TickStyle.mark,
  });

  /// The direction the thumbs travel.
  final Axis axis;

  /// The track's thickness.
  final double thickness;

  /// The thumbs' side.
  final double thumbSize;

  /// The fill colour.
  final Color fill;

  /// Where the fill starts, as a fraction.
  final double fillFrom;

  /// Where the fill ends, as a fraction.
  final double fillTo;

  /// Each thumb's position, as a fraction.
  final List<double> thumbs;

  /// Wraps thumb [index]'s painted circle with its focus and semantics.
  final Widget Function(int index, double side) thumbBuilder;

  /// Whether pointers move the thumbs.
  final bool enabled;

  /// Called when a press lands on the track.
  final TrackPointer onStart;

  /// Called as the press moves.
  final TrackPointer onUpdate;

  /// Called once when the press ends or is taken by another gesture.
  final VoidCallback onEnd;

  /// The fractions with a tick mark.
  final List<double> ticks;

  /// How the ticks look.
  final TickStyle tickStyle;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final horizontal = axis == Axis.horizontal;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final cross = math.max(
      horizontal ? theme.minTargetSize.height : theme.minTargetSize.width,
      thumbSize,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final length = horizontal
            ? constraints.maxWidth
            : constraints.maxHeight;
        final travel = math.max(0.0, length - thumbSize);

        // The offset of a fraction's centre from the physical start (left or
        // top) of the track.
        double centre(double fraction) {
          final along = thumbSize / 2 + fraction * travel;
          if (horizontal) return rtl ? length - along : along;
          return length - along;
        }

        // The thumb centres' travel, inset half a thumb from each end.
        final inset = thumbSize / 2;
        final box = horizontal
            ? Rect.fromLTWH(inset, 0, travel, cross)
            : Rect.fromLTWH(0, inset, cross, travel);
        double fractionAt(Offset local) => pointerFraction(
          axis: axis,
          rtl: horizontal ? rtl : true,
          box: box,
          point: local,
        );

        // The fill reaches the track's own end when it starts or stops at
        // the minimum or the maximum, so no unfilled sliver shows there.
        double edge(double fraction) {
          if (fraction > 0 && fraction < 1) return centre(fraction);
          final minimum = fraction <= 0;
          // Left or top is the minimum's end left to right, the maximum's
          // end right to left and on a vertical track.
          final leftOrTop = horizontal ? minimum != rtl : !minimum;
          return leftOrTop ? 0 : length;
        }

        Rect band(double from, double to, double size) {
          final a = edge(from);
          final b = edge(to);
          final start = math.min(a, b);
          final extent = (a - b).abs();
          return horizontal
              ? Rect.fromLTWH(start, (cross - size) / 2, extent, size)
              : Rect.fromLTWH((cross - size) / 2, start, size, extent);
        }

        final radius = BorderRadius.circular(InvisibleRadiusTokens.pill);
        final children = <Widget>[
          // The track spans the whole length, past the end centres, as a
          // native range track spans its input.
          Positioned.fromRect(
            rect: horizontal
                ? Rect.fromLTWH(0, (cross - thickness) / 2, length, thickness)
                : Rect.fromLTWH((cross - thickness) / 2, 0, thickness, length),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colors.border,
                borderRadius: radius,
              ),
            ),
          ),
          Positioned.fromRect(
            rect: band(fillFrom, fillTo, thickness),
            child: DecoratedBox(
              decoration: BoxDecoration(color: fill, borderRadius: radius),
            ),
          ),
          for (final tick in ticks)
            Positioned.fromRect(
              rect: _tickRect(centre(tick), cross, horizontal),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: tickStyle == TickStyle.mark
                      ? theme.colors.border
                      : theme.colors.background,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ),
          for (final (index, fraction) in thumbs.indexed)
            Positioned(
              left: horizontal ? centre(fraction) - cross / 2 : 0,
              top: horizontal ? 0 : centre(fraction) - cross / 2,
              width: cross,
              height: cross,
              child: Center(child: thumbBuilder(index, thumbSize)),
            ),
        ];

        final track = SizedBox(
          width: horizontal ? length : cross,
          height: horizontal ? cross : length,
          child: Stack(clipBehavior: Clip.none, children: children),
        );

        if (!enabled) return track;
        void down(DragDownDetails d) => onStart(fractionAt(d.localPosition));
        void update(DragUpdateDetails d) =>
            onUpdate(fractionAt(d.localPosition));
        void end(DragEndDetails _) => onEnd();
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          dragStartBehavior: DragStartBehavior.down,
          onHorizontalDragDown: horizontal ? down : null,
          onHorizontalDragUpdate: horizontal ? update : null,
          onHorizontalDragEnd: horizontal ? end : null,
          onHorizontalDragCancel: horizontal ? onEnd : null,
          onVerticalDragDown: horizontal ? null : down,
          onVerticalDragUpdate: horizontal ? null : update,
          onVerticalDragEnd: horizontal ? null : end,
          onVerticalDragCancel: horizontal ? null : onEnd,
          child: MouseRegion(cursor: SystemMouseCursors.click, child: track),
        );
      },
    );
  }

  Rect _tickRect(double centre, double cross, bool horizontal) {
    final mark = tickStyle == TickStyle.mark;
    final long = mark ? 6.0 : 2.0;
    // A mark sits just past the track; a dot on its centre line.
    final offset = mark ? thickness / 2 + 2 : -1.0;
    final from = cross / 2 + offset;
    return horizontal
        ? Rect.fromLTWH(centre - 1, from, 2, long)
        : Rect.fromLTWH(from, centre - 1, long, 2);
  }
}
