import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/open_width.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The shape of a [Skeleton].
enum SkeletonVariant {
  /// One or more lines of text, the last one shorter. The default.
  text,

  /// A circle, such as an avatar.
  circle,

  /// A rectangle, such as an image or a card.
  rect,
}

/// How a [Skeleton] moves while it waits.
enum SkeletonAnimation {
  /// A slow fade in and out, the default.
  pulse,

  /// A highlight that sweeps across.
  wave,

  /// No movement.
  none,
}

// Sizes and timings the web Skeleton sets in its own stylesheet.
const double _lineGap = 8;
const double _lineHeightEm = 0.8;
const double _circleSide = 40;
const double _rectHeight = 40;
const double _defaultWidth = 256;
const double _lastLineFactor = 0.6;
const Duration _pulse = Duration(milliseconds: 1500);
const Duration _wave = Duration(milliseconds: 1600);

/// A loading placeholder in the shape of the content it stands for: lines of
/// text, a circle or a rectangle.
///
/// It is purely visual, so it stays out of the semantics tree: say that the
/// region is loading on the region itself. With [semanticLabel] it is a live
/// region with that name instead, so the loading is announced.
///
/// It moves only while the platform allows animation: under reduced motion
/// it stays still.
class Skeleton extends StatefulWidget {
  /// Creates the placeholder.
  const Skeleton({
    super.key,
    this.variant = SkeletonVariant.text,
    this.lines = 1,
    this.width,
    this.height,
    this.radius,
    this.animation = SkeletonAnimation.pulse,
    this.semanticLabel,
  });

  /// The shape.
  final SkeletonVariant variant;

  /// The number of lines of the text shape.
  final int lines;

  /// The width; for a circle, also the height. Null takes the parent's
  /// width, or 256 when the width is open; a circle is 40 across.
  final double? width;

  /// The height of a rectangle; 40 when null. A text line follows the
  /// surrounding text size instead.
  final double? height;

  /// The corner radius, in place of the control radius.
  final double? radius;

  /// The movement.
  final SkeletonAnimation animation;

  /// The accessible name, which makes the placeholder a live region.
  final String? semanticLabel;

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(Skeleton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.animation != widget.animation) _sync();
  }

  bool get _still =>
      widget.animation == SkeletonAnimation.none || reducedMotion(context);

  // Runs the loop for the current movement, or stops it.
  void _sync() {
    if (_still) {
      _controller
        ..stop()
        ..value = 0;
      return;
    }
    _controller.duration = widget.animation == SkeletonAnimation.wave
        ? _wave
        : _pulse;
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final scale = MediaQuery.textScalerOf(context);
    final radius = BorderRadius.circular(widget.radius ?? theme.controlRadius);
    final animation = _still ? SkeletonAnimation.none : widget.animation;

    Widget bar({double? width, required double height, BorderRadius? shape}) =>
        SizedBox(
          width: width,
          height: height,
          child: _Bar(
            animation: animation,
            progress: _controller,
            radius: shape ?? radius,
          ),
        );

    // The given width, or the parent's, or 256 when the parent's is open.
    final width = widget.width;
    Widget sized(Widget child) => width == null
        ? OpenWidth(width: _defaultWidth, child: child)
        : SizedBox(width: width, child: child);

    final Widget drawn = switch (widget.variant) {
      SkeletonVariant.text => sized(
        LayoutBuilder(
          builder: (context, constraints) {
            final fontSize = surroundingFontSize(context);
            final height = scale.scale(fontSize * _lineHeightEm);
            final lines = widget.lines < 1 ? 1 : widget.lines;
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: _lineGap,
              children: [
                for (var i = 0; i < lines; i++)
                  bar(
                    width: lines > 1 && i == lines - 1
                        ? constraints.maxWidth * _lastLineFactor
                        : constraints.maxWidth,
                    height: height,
                  ),
              ],
            );
          },
        ),
      ),
      SkeletonVariant.circle => bar(
        width: width ?? scale.scale(_circleSide),
        height: width ?? scale.scale(_circleSide),
        shape: BorderRadius.circular(InvisibleRadiusTokens.pill),
      ),
      SkeletonVariant.rect => sized(bar(height: widget.height ?? _rectHeight)),
    };

    final label = widget.semanticLabel;
    if (label == null || label.isEmpty) return ExcludeSemantics(child: drawn);
    return Semantics(
      container: true,
      liveRegion: true,
      label: label,
      child: ExcludeSemantics(child: drawn),
    );
  }
}

/// One placeholder bar, faded or swept by [progress].
class _Bar extends AnimatedWidget {
  const _Bar({
    required this.animation,
    required Animation<double> progress,
    required this.radius,
  }) : super(listenable: progress);

  final SkeletonAnimation animation;
  final BorderRadius radius;

  @override
  Widget build(BuildContext context) {
    final t = (listenable as Animation<double>).value;
    // The web's bar colour, the neutral primitive in both modes.
    const color = InvisiblePalette.grey200;
    // 1 to 0.4 and back, eased.
    final alpha = animation == SkeletonAnimation.pulse
        ? 1 - 0.6 * Curves.easeInOut.transform(t < 0.5 ? t * 2 : 2 - t * 2)
        : 1.0;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color.withValues(alpha: alpha),
        borderRadius: radius,
      ),
      // Over the bar, a translucent white band that sweeps from beyond the
      // left edge to beyond the right one.
      child: animation == SkeletonAnimation.wave
          ? DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: radius,
                gradient: LinearGradient(
                  begin: Alignment(-3 + 4 * t, 0),
                  end: Alignment(-1 + 4 * t, 0),
                  colors: const [
                    Color(0x00FFFFFF),
                    Color(0x80FFFFFF),
                    Color(0x00FFFFFF),
                  ],
                ),
              ),
              child: const SizedBox.expand(),
            )
          : const SizedBox.expand(),
    );
  }
}
