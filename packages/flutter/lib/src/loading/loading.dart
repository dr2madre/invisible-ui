import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/glyphs.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The shape of a [Loading] indicator.
enum LoadingVariant {
  /// Three dots that pulse in turn.
  dots,

  /// A rotating arc.
  spinner,

  /// A full-width track: a sliding segment, or a growing fill when
  /// [Loading.value] is set.
  bar,

  /// Bouncing dots, as a chat shows while a reply is written.
  typing,

  /// One shape blending between a square and a circle.
  morph,
}

// Sizes the web Loading sets in its own stylesheet, in em of the text size.
const double _dotEm = 0.3;
const double _dotGapEm = 0.25;
const double _labelGapEm = 0.625;
const double _barLabelGapEm = 0.375;
const double _labelEm = 0.8125;
const double _barHeight = 3;
const double _segmentShare = 0.4;
const double _veilAlpha = 0.65;

/// A loading indicator, in the colour of the surrounding text.
///
/// By default it is a polite live region named by [label], the theme's
/// `loadingLabel` when not given, so it is announced when it appears. A
/// [status] message replaces the name and is announced each time it changes.
/// A determinate bar ([LoadingVariant.bar] with a [value]) reports its
/// percentage as its value instead, and is not a live region. The visible
/// texts ([showLabel], [showValue], [detail]) are hidden from assistive
/// technology, since the name and value already carry them.
///
/// Set [decorative] when the surrounding control announces the busy state
/// itself. Under reduced motion the indicator stays visible and still.
class Loading extends StatefulWidget {
  /// Creates a loading indicator.
  const Loading({
    super.key,
    this.variant = LoadingVariant.dots,
    this.value,
    this.label,
    this.showLabel = false,
    this.showValue = false,
    this.detail,
    this.status,
    this.decorative = false,
    this.delay = Duration.zero,
    this.overlay = false,
    this.veil = true,
  });

  /// The shape of the indicator.
  final LoadingVariant variant;

  /// The completion percentage, 0 to 100, of a bar. Null keeps the bar
  /// indeterminate. Values outside the range are clamped.
  final double? value;

  /// The accessible name. Defaults to the theme's `loadingLabel`.
  final String? label;

  /// Whether the name also shows as text beside the indicator.
  final bool showLabel;

  /// Whether the percentage of [value] shows as text.
  final bool showValue;

  /// Extra visible detail, such as "3 of 8 files". On a determinate bar it
  /// is also the value assistive technology reads.
  final String? detail;

  /// A running description of the work ("Connecting…", "Fetching
  /// records…"). It shows as text and is announced whenever it changes. On a
  /// determinate bar it is the value read, unless [detail] is set.
  final String? status;

  /// Whether the indicator is hidden from assistive technology.
  final bool decorative;

  /// How long the indicator stays hidden, so a fast operation never flashes
  /// it. Read once, when the indicator first appears.
  final Duration delay;

  /// Whether the indicator fills its parent and centres itself, as a busy
  /// layer over content. Place it in a [Stack], for example in a
  /// [Positioned.fill].
  final bool overlay;

  /// With [overlay], whether a translucent veil covers the content and
  /// blocks the pointer while it is busy.
  final bool veil;

  @override
  State<Loading> createState() => _LoadingState();
}

class _LoadingState extends State<Loading> with SingleTickerProviderStateMixin {
  late final AnimationController _motion = AnimationController(vsync: this);
  Timer? _noFlash;
  late bool _visible = widget.delay <= Duration.zero;

  @override
  void initState() {
    super.initState();
    if (!_visible) {
      _noFlash = Timer(widget.delay, () {
        setState(() => _visible = true);
        _syncMotion();
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncMotion();
  }

  @override
  void didUpdateWidget(Loading oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.variant != widget.variant ||
        (oldWidget.value == null) != (widget.value == null)) {
      _syncMotion();
    }
  }

  @override
  void dispose() {
    _noFlash?.cancel();
    _motion.dispose();
    super.dispose();
  }

  bool get _determinate =>
      widget.variant == LoadingVariant.bar && widget.value != null;

  void _syncMotion() {
    final still =
        !_visible ||
        reducedMotion(context) ||
        _determinate ||
        // The spinner glyph turns by itself.
        widget.variant == LoadingVariant.spinner;
    if (still) {
      _motion.stop();
      return;
    }
    final period = switch (widget.variant) {
      LoadingVariant.morph => const Duration(milliseconds: 2000),
      LoadingVariant.bar => const Duration(milliseconds: 1400),
      _ => const Duration(milliseconds: 1200),
    };
    if (_motion.duration != period || !_motion.isAnimating) {
      _motion
        ..duration = period
        ..repeat();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();
    final theme = InvisibleTheme.of(context);
    final ambient = DefaultTextStyle.of(context).style;
    final color = ambient.color ?? theme.colors.text;
    final fontSize = ambient.fontSize ?? theme.textStyle.fontSize!;
    final em = MediaQuery.textScalerOf(context).scale(fontSize);
    final still = reducedMotion(context);
    final label = widget.label ?? theme.messages.loadingLabel;
    final value = widget.value?.clamp(0, 100).toDouble();
    final bar = widget.variant == LoadingVariant.bar;

    final textStyle = theme.textStyle.copyWith(
      color: color,
      fontSize: fontSize * _labelEm,
      height: InvisibleTypographyTokens.lineHeightTight,
    );
    final texts = [
      if (widget.showLabel) label,
      if (widget.showValue && value != null) '${value.round()}%',
      ?widget.detail,
    ];

    final Widget indicator = switch (widget.variant) {
      LoadingVariant.spinner => IconTheme(
        data: IconThemeData(color: color, size: em),
        child: const Spinner(),
      ),
      LoadingVariant.bar => _Bar(
        motion: _motion,
        value: value,
        color: color,
        still: still,
      ),
      LoadingVariant.morph => _Morph(motion: _motion, side: em, color: color),
      LoadingVariant.dots || LoadingVariant.typing => _Dots(
        motion: _motion,
        em: em,
        color: color,
        bounce: widget.variant == LoadingVariant.typing,
      ),
    };

    final status = widget.status == null
        ? null
        : Text(widget.status!, style: textStyle);
    final visibleText = texts.isEmpty
        ? null
        : bar
        ? Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (final text in texts)
                Flexible(child: Text(text, style: textStyle)),
            ],
          )
        : Wrap(
            spacing: 0.75 * em,
            children: [for (final text in texts) Text(text, style: textStyle)],
          );

    // The visible texts are hidden from assistive technology: the node's
    // name and value carry them, and a ticking percentage would otherwise be
    // read on every change.
    final Widget body = bar
        ? Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: _barLabelGapEm * em,
            children: [
              indicator,
              if (status != null) ExcludeSemantics(child: status),
              if (visibleText != null) ExcludeSemantics(child: visibleText),
            ],
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            spacing: _labelGapEm * em,
            children: [
              indicator,
              if (status != null)
                Flexible(child: ExcludeSemantics(child: status)),
              if (visibleText != null)
                Flexible(child: ExcludeSemantics(child: visibleText)),
            ],
          );

    final Widget announced = widget.decorative
        ? ExcludeSemantics(child: body)
        : _determinate
        ? Semantics(
            container: true,
            label: label,
            value: widget.detail ?? widget.status ?? '${value!.round()}%',
            child: body,
          )
        : Semantics(
            container: true,
            liveRegion: true,
            label: widget.status ?? label,
            child: ExcludeSemantics(child: body),
          );

    if (!widget.overlay) return announced;
    final layer = SizedBox.expand(child: Center(child: announced));
    return widget.veil
        ? AbsorbPointer(
            child: ColoredBox(
              color: theme.colors.background.withValues(alpha: _veilAlpha),
              child: layer,
            ),
          )
        : IgnorePointer(child: layer);
  }
}

/// The value of a repeating ease-in-out pulse at [t] (0 to 1): 0 at the
/// ends of the period, 1 in the middle.
double _pulse(double t) =>
    Curves.easeInOut.transform(t < 0.5 ? t * 2 : (1 - t) * 2);

class _Dots extends StatelessWidget {
  const _Dots({
    required this.motion,
    required this.em,
    required this.color,
    required this.bounce,
  });

  final AnimationController motion;
  final double em;
  final Color color;
  final bool bounce;

  @override
  Widget build(BuildContext context) {
    final dot = _dotEm * em;
    return SizedBox(
      height: em,
      child: AnimatedBuilder(
        animation: motion,
        builder: (context, _) {
          final animating = motion.isAnimating;
          return Row(
            mainAxisSize: MainAxisSize.min,
            spacing: _dotGapEm * em,
            children: [
              for (var i = 0; i < 3; i++)
                Builder(
                  builder: (context) {
                    // Each dot runs a sixth of the period behind the last.
                    final phase = _pulse((motion.value - i / 6) % 1);
                    final opacity = !animating
                        ? 1.0
                        : bounce
                        ? 0.5 + 0.5 * phase
                        : 0.3 + 0.7 * phase;
                    final lift = animating && bounce ? -0.4 * dot * phase : 0.0;
                    return Transform.translate(
                      offset: Offset(0, lift),
                      child: Opacity(
                        opacity: opacity,
                        child: Container(
                          width: dot,
                          height: dot,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    );
                  },
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Morph extends StatelessWidget {
  const _Morph({required this.motion, required this.side, required this.color});

  final AnimationController motion;
  final double side;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: motion,
      builder: (context, _) {
        // Square to circle and half a turn, then back.
        final phase = motion.isAnimating ? _pulse(motion.value) : 0.0;
        return Transform.rotate(
          angle: math.pi * phase,
          child: Container(
            width: side,
            height: side,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(side * (0.15 + 0.35 * phase)),
            ),
          ),
        );
      },
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({
    required this.motion,
    required this.value,
    required this.color,
    required this.still,
  });

  final AnimationController motion;
  final double? value;
  final Color color;
  final bool still;

  @override
  Widget build(BuildContext context) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final radius = BorderRadius.circular(InvisibleRadiusTokens.pill);
    final fill = DecoratedBox(
      decoration: BoxDecoration(color: color, borderRadius: radius),
    );
    final Widget mark = value != null
        ? Align(
            alignment: AlignmentDirectional.centerStart,
            child: AnimatedFractionallySizedBox(
              duration: still
                  ? Duration.zero
                  : const Duration(milliseconds: 200),
              alignment: AlignmentDirectional.centerStart,
              widthFactor: value! / 100,
              heightFactor: 1,
              child: fill,
            ),
          )
        : LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth * _segmentShare;
              return AnimatedBuilder(
                animation: motion,
                builder: (context, child) {
                  // From one segment before the start to one and a half past
                  // the end, start to end in the reading direction.
                  final t = still
                      ? 0.0
                      : Curves.easeInOut.transform(motion.value);
                  final x = width * (-1 + 3.5 * t);
                  return Transform.translate(
                    offset: Offset(
                      rtl ? constraints.maxWidth - width - x : x,
                      0,
                    ),
                    child: child,
                  );
                },
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: SizedBox(
                    width: width,
                    height: _barHeight,
                    child: fill,
                  ),
                ),
              );
            },
          );
    return SizedBox(
      height: _barHeight,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: radius,
        child: ColoredBox(color: color.withValues(alpha: 0.2), child: mark),
      ),
    );
  }
}
