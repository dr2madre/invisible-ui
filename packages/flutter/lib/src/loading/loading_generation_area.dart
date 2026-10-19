import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// Where the label zone of a [LoadingGenerationArea] sits.
enum LoadingAreaLabelPosition {
  /// In the middle, the default.
  center,

  /// At the top, centred across.
  top,

  /// At the bottom, centred across.
  bottom,

  /// At the inline-start, centred down: left in a left-to-right layout.
  start,

  /// At the inline-end, centred down: right in a left-to-right layout.
  end,
}

// Sizes the web Loading Area sets in its own stylesheet.
const double _gap = 17.6;
const double _dot = 1;
const double _litDot = 2.5;
const double _restAlpha = 0.1;
const double _minHeight = 96;
const Duration _driftPeriod = Duration(seconds: 7);
const Duration _revealDuration = Duration(milliseconds: 240);
const EdgeInsets _zoneMargin = EdgeInsets.all(12);
const EdgeInsets _zonePadding = EdgeInsets.symmetric(
  horizontal: 12,
  vertical: 8,
);
const double _zoneGapEm = 0.3;
const double _zoneEm = 0.8125;
const double _zoneAlpha = 0.78;

/// The two glows that light the dots: their size as a share of the area,
/// and where they sit at each quarter of the drift, as the web's mask
/// positions (a share of the room the glow leaves on each axis).
const List<double> _glowSizes = [0.62, 0.46];
const List<List<Offset>> _glowStops = [
  [Offset(0.12, 0.16), Offset(0.82, 0.72)],
  [Offset(0.84, 0.26), Offset(0.24, 0.80)],
  [Offset(0.68, 0.84), Offset(0.26, 0.22)],
  [Offset(0.18, 0.66), Offset(0.84, 0.38)],
];
const List<Offset> _stillGlows = [Offset(0.30, 0.35), Offset(0.72, 0.68)];

/// A surface that shows a process in progress until its result is ready.
///
/// While [loading], the area fills the space its parent gives it (at least
/// 96 high, scaled with the text) with a field of faint dots that two soft
/// glows drift across, so parts of it seem to render in turn. Under reduced
/// motion the glows hold still. Set [field] to false for a plain area and
/// put another loader in [indicator], such as a decorative [Loading]
/// spinner: the field and an indicator are alternatives, never both.
///
/// A label zone, placed by [labelPosition], shows any of [indicator], a
/// [status] message, a percentage [value] and a [detail] line ("3 of 8
/// files"). When [loading] turns false, [child] takes the area's place,
/// fading in unless motion is reduced.
///
/// The area is a polite live region named [label], the theme's
/// `loadingLabel` when not given; a [status] replaces the name and is
/// announced each time it changes. The percentage and the detail show but
/// are not announced, so a fast-moving value is not read on every tick.
/// [decorative] hides the area from assistive technology, for a region that
/// announces its busy state itself. The dots take the colour of the
/// surrounding text.
///
/// Use [Loading] for an indicator inline with text or in a button.
class LoadingGenerationArea extends StatefulWidget {
  /// Creates the area.
  const LoadingGenerationArea({
    super.key,
    this.loading = true,
    this.label,
    this.decorative = false,
    this.field = true,
    this.labelPosition = LoadingAreaLabelPosition.center,
    this.status,
    this.value,
    this.detail,
    this.indicator,
    this.child,
  });

  /// Whether the process is still running. False shows [child].
  final bool loading;

  /// The accessible name. Defaults to the theme's `loadingLabel`.
  final String? label;

  /// Whether the area is hidden from assistive technology.
  final bool decorative;

  /// Whether the dot field shows.
  final bool field;

  /// Where the label zone sits.
  final LoadingAreaLabelPosition labelPosition;

  /// A running description of the work, shown and announced on each change.
  final String? status;

  /// The completion percentage, 0 to 100, shown as text. Values outside the
  /// range are clamped.
  final double? value;

  /// An extra line, such as "48 MB of 128 MB".
  final String? detail;

  /// A loader shown in the label zone in place of the field.
  final Widget? indicator;

  /// The result, shown once [loading] is false.
  final Widget? child;

  @override
  State<LoadingGenerationArea> createState() => _LoadingGenerationAreaState();
}

class _LoadingGenerationAreaState extends State<LoadingGenerationArea>
    with TickerProviderStateMixin {
  late final AnimationController _drift = AnimationController(
    vsync: this,
    duration: _driftPeriod,
  );
  late final AnimationController _reveal = AnimationController(
    vsync: this,
    duration: _revealDuration,
    value: 1,
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncDrift();
  }

  @override
  void didUpdateWidget(LoadingGenerationArea oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncDrift();
    if (oldWidget.loading && !widget.loading) {
      if (reducedMotion(context)) {
        _reveal.value = 1;
      } else {
        _reveal.forward(from: 0);
      }
    }
  }

  @override
  void dispose() {
    _drift.dispose();
    _reveal.dispose();
    super.dispose();
  }

  void _syncDrift() {
    final moving = widget.loading && widget.field && !reducedMotion(context);
    if (!moving) {
      _drift.stop();
    } else if (!_drift.isAnimating) {
      _drift.repeat();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.loading) {
      return FadeTransition(
        opacity: CurvedAnimation(parent: _reveal, curve: Curves.easeOut),
        child: widget.child ?? const SizedBox.shrink(),
      );
    }
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final scaler = MediaQuery.textScalerOf(context);
    final dotColor = DefaultTextStyle.of(context).style.color ?? colors.text;
    final fontSize = surroundingFontSize(context) * _zoneEm;
    final value = widget.value?.clamp(0, 100).toDouble();
    final status = widget.status;
    final hasZone =
        widget.indicator != null ||
        status != null ||
        value != null ||
        widget.detail != null;

    final zone = !hasZone
        ? null
        : Container(
            margin: _zoneMargin,
            padding: _zonePadding,
            decoration: BoxDecoration(
              color: colors.background.withValues(alpha: _zoneAlpha),
              borderRadius: BorderRadius.circular(theme.controlRadius),
            ),
            child: DefaultTextStyle(
              textAlign: TextAlign.center,
              style: theme.textStyle.copyWith(
                fontSize: fontSize,
                color: colors.text,
                height: InvisibleTypographyTokens.lineHeightDefault,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                spacing: fontSize * _zoneGapEm / _zoneEm,
                children: [
                  ?widget.indicator,
                  if (status != null) Text(status),
                  if (value != null)
                    Text(
                      '${value.round()}%',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                    ),
                  if (widget.detail case final detail?)
                    Text(
                      detail,
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                ],
              ),
            ),
          );

    final area = LayoutBuilder(
      builder: (context, constraints) {
        final minHeight = scaler.scale(_minHeight);
        return ConstrainedBox(
          constraints: BoxConstraints(minHeight: minHeight),
          child: SizedBox(
            width: constraints.hasBoundedWidth ? constraints.maxWidth : null,
            // An open height grows with the zone, from the minimum.
            height: constraints.hasBoundedHeight ? constraints.maxHeight : null,
            child: ClipRect(
              child: CustomPaint(
                painter: widget.field
                    ? _DotFieldPainter(
                        drift: _drift,
                        still: reducedMotion(context),
                        color: dotColor,
                        gap: scaler.scale(_gap),
                      )
                    : null,
                child: Align(
                  alignment: switch (widget.labelPosition) {
                    LoadingAreaLabelPosition.center => Alignment.center,
                    LoadingAreaLabelPosition.top => Alignment.topCenter,
                    LoadingAreaLabelPosition.bottom => Alignment.bottomCenter,
                    LoadingAreaLabelPosition.start =>
                      AlignmentDirectional.centerStart,
                    LoadingAreaLabelPosition.end =>
                      AlignmentDirectional.centerEnd,
                  },
                  child: zone,
                ),
              ),
            ),
          ),
        );
      },
    );

    if (widget.decorative) return ExcludeSemantics(child: area);
    // The texts are visible only; the region's name carries the state.
    return Semantics(
      container: true,
      liveRegion: true,
      label: status ?? widget.label ?? theme.messages.loadingLabel,
      child: ExcludeSemantics(child: area),
    );
  }
}

/// The dot lattice and the glows that light it, as the web draws them with
/// two background layers and a moving mask.
class _DotFieldPainter extends CustomPainter {
  _DotFieldPainter({
    required this.drift,
    required this.still,
    required this.color,
    required this.gap,
  }) : super(repaint: drift);

  final Animation<double> drift;
  final bool still;
  final Color color;
  final double gap;

  /// Where the glows sit now, as shares of the room they leave.
  List<Offset> _positions() {
    if (still) return _stillGlows;
    final t = drift.value * _glowStops.length;
    final index = t.floor() % _glowStops.length;
    final from = _glowStops[index];
    final to = _glowStops[(index + 1) % _glowStops.length];
    // CSS eases each step of the keyframes on its own.
    final eased = Curves.easeInOut.transform(t - t.floor());
    return [
      for (var i = 0; i < from.length; i++) Offset.lerp(from[i], to[i], eased)!,
    ];
  }

  /// The mask's strength at [point]: two radial glows laid over each other.
  double _light(Offset point, Size size, List<Offset> positions) {
    var alpha = 0.0;
    for (var i = 0; i < positions.length; i++) {
      final w = size.width * _glowSizes[i];
      final h = size.height * _glowSizes[i];
      final left = (size.width - w) * positions[i].dx;
      final top = (size.height - h) * positions[i].dy;
      if (point.dx < left ||
          point.dx > left + w ||
          point.dy < top ||
          point.dy > top + h) {
        continue;
      }
      final center = Offset(left + w / 2, top + h / 2);
      // A circle gradient reaches the farthest corner of its box.
      final reach = math.sqrt(w * w + h * h) / 2;
      final share = (point - center).distance / reach;
      final glow = share <= 0.38
          ? lerpDouble(1, 0.45, share / 0.38)!
          : share <= 0.68
          ? lerpDouble(0.45, 0, (share - 0.38) / 0.30)!
          : 0.0;
      alpha = alpha + glow * (1 - alpha);
    }
    return alpha;
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (size.isEmpty || gap <= 0) return;
    final rest = Paint()..color = color.withValues(alpha: color.a * _restAlpha);
    final lit = Paint();
    final positions = _positions();
    // The lattice is centred, as `background-position: center` sets it.
    final startX = size.width / 2 - (size.width / 2 / gap).floor() * gap;
    final startY = size.height / 2 - (size.height / 2 / gap).floor() * gap;
    for (var y = startY; y <= size.height; y += gap) {
      for (var x = startX; x <= size.width; x += gap) {
        final point = Offset(x, y);
        canvas.drawCircle(point, _dot, rest);
        final light = _light(point, size, positions);
        if (light <= 0) continue;
        lit.color = color.withValues(alpha: color.a * light);
        canvas.drawCircle(point, _litDot, lit);
      }
    }
  }

  @override
  bool shouldRepaint(_DotFieldPainter oldDelegate) =>
      oldDelegate.still != still ||
      oldDelegate.color != color ||
      oldDelegate.gap != gap ||
      oldDelegate.drift != drift;
}
