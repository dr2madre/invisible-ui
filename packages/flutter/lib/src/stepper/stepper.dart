import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web Stepper sets in its own stylesheet.
const double _indicator = 28;
const double _indicatorBorder = 2;
const double _indicatorText = 13;
const double _labelGap = 8;
const double _stepGap = 4;
const EdgeInsets _padding = EdgeInsets.symmetric(horizontal: 6.4, vertical: 4);
const double _descriptionSize = 13;
const double _connectorLength = 24;
const double _connectorMinLength = 20;
const double _connectorThickness = 3;
const double _connectorMargin = 4;
const double _dotGap = 5;
const double _narrow = 480;
const double _currentTint = 0.1;
const double _currentBorder = 0.35;

// The progress rules of `core/src/stepper/state.ts`, in Dart. They take data
// and return data, so the shared vectors in core/src/stepper/__vectors__ hold
// both implementations to the same answers.

/// Where a step stands against the current one.
enum StepStatus {
  /// Before the current step.
  complete,

  /// The current step.
  current,

  /// After the current step.
  upcoming,
}

/// [index] kept within the steps, 0 when there are none.
int clampStep(int index, int count) =>
    count <= 0 ? 0 : math.max(0, math.min(index, count - 1));

/// The status of step [index] when [current] is the current one.
StepStatus stepStatus(int current, int index) => index < current
    ? StepStatus.complete
    : index == current
    ? StepStatus.current
    : StepStatus.upcoming;

/// Whether step [index] can be chosen: never while disabled; in linear mode
/// only the current and the completed steps; otherwise any step.
bool canGoTo({
  required int current,
  required int count,
  required int index,
  required bool linear,
  required bool enabled,
}) {
  if (!enabled || index < 0 || index >= count) return false;
  return !linear || index <= current;
}

/// One step of a [Stepper].
@immutable
class StepItem {
  /// Creates a step titled [label].
  const StepItem({required this.label, this.description});

  /// The short title.
  final String label;

  /// An optional second line.
  final String? description;
}

/// An ordered sequence of steps that shows which are complete, which is
/// current and which come next, such as Account, Profile and Review.
///
/// Each step is a button. In [linear] mode (the default) the current and
/// the completed steps can be chosen, and the steps ahead are disabled and
/// leave the focus order; with [linear] false any step can be chosen. A
/// completed step shows a tick and is read as completed; the current step is
/// read as the current step; the others show their number. Too narrow for
/// one row (under 480 at text scale 1), a horizontal stepper stacks its
/// steps as a vertical one does; the order stays the same.
///
/// Controlled, [Stepper] shows [currentStep] and reports each choice through
/// [onStepChanged]; [Stepper.uncontrolled] keeps its own step from
/// [initialStep]. A changed [currentStep] is shown without a report. The
/// steps are named together by [semanticLabel], or
/// [InvisibleMessages.stepperLabel].
///
/// The name collides with Material's `Stepper`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class Stepper extends StatefulWidget {
  /// A stepper that shows [currentStep], controlled by the parent.
  const Stepper({
    super.key,
    required this.steps,
    required int this.currentStep,
    this.onStepChanged,
    this.linear = true,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.semanticLabel,
  }) : initialStep = 0,
       _controlled = true;

  /// A stepper that keeps its own step, starting from [initialStep].
  const Stepper.uncontrolled({
    super.key,
    required this.steps,
    this.initialStep = 0,
    this.onStepChanged,
    this.linear = true,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.semanticLabel,
  }) : currentStep = null,
       _controlled = false;

  /// The steps, in order.
  final List<StepItem> steps;

  /// The current step, from 0, when the parent controls it.
  final int? currentStep;

  /// The starting step of the uncontrolled form.
  final int initialStep;

  /// Called with the chosen step after a user choice. Never called for a
  /// changed [currentStep].
  final ValueChanged<int>? onStepChanged;

  /// Whether only the current and the completed steps can be chosen.
  final bool linear;

  /// A row of steps, or a column.
  final Axis orientation;

  /// Whether the steps can be chosen.
  final bool enabled;

  /// The accessible name of the steps.
  final String? semanticLabel;

  final bool _controlled;

  @override
  State<Stepper> createState() => _StepperState();
}

class _StepperState extends State<Stepper> with ValueControl<int, Stepper> {
  @override
  bool get isControlled => widget._controlled;

  @override
  int controlledValueOf(Stepper widget) =>
      clampStep(widget.currentStep!, widget.steps.length);

  @override
  int get initialValueOfWidget =>
      clampStep(widget.initialStep, widget.steps.length);

  void _go(int index) {
    if (commitValue(index)) widget.onStepChanged?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final count = widget.steps.length;
    final current = clampStep(value, count);
    final narrow = MediaQuery.textScalerOf(context).scale(_narrow);

    Widget step(int index, Axis axis, {required bool fill}) {
      final status = stepStatus(current, index);
      final reachable = canGoTo(
        current: current,
        count: count,
        index: index,
        linear: widget.linear,
        enabled: widget.enabled,
      );
      final trigger = _StepTrigger(
        item: widget.steps[index],
        number: index + 1,
        status: status,
        onPressed: reachable ? () => _go(index) : null,
      );
      final active = status != StepStatus.upcoming;
      if (axis == Axis.horizontal) {
        final row = Row(
          mainAxisSize: fill ? MainAxisSize.max : MainAxisSize.min,
          children: [
            if (index > 0) _Connector(axis: axis, active: active),
            Flexible(child: trigger),
          ],
        );
        // The steps share a bounded row equally, as the web's flex: 1.
        return fill ? Expanded(child: row) : row;
      }
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (index > 0) _Connector(axis: axis, active: active),
          trigger,
        ],
      );
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.semanticLabel ?? theme.messages.stepperLabel,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final axis =
              widget.orientation == Axis.vertical ||
                  (constraints.hasBoundedWidth && constraints.maxWidth < narrow)
              ? Axis.vertical
              : Axis.horizontal;
          final fill = constraints.hasBoundedWidth;
          final steps = [
            for (var i = 0; i < count; i++) step(i, axis, fill: fill),
          ];
          return axis == Axis.horizontal
              ? Row(
                  mainAxisSize: fill ? MainAxisSize.max : MainAxisSize.min,
                  spacing: _stepGap,
                  children: steps,
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: _stepGap,
                  children: steps,
                );
        },
      ),
    );
  }
}

class _StepTrigger extends StatelessWidget {
  const _StepTrigger({
    required this.item,
    required this.number,
    required this.status,
    required this.onPressed,
  });

  final StepItem item;
  final int number;
  final StepStatus status;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final description = item.description;
    return Semantics(
      container: true,
      button: true,
      enabled: onPressed != null,
      label: item.label,
      value: switch (status) {
        StepStatus.complete => messages.stepperCompleted,
        StepStatus.current => messages.stepperCurrent,
        StepStatus.upcoming => null,
      },
      hint: description,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: Padding(
            padding: _padding,
            child: ExcludeSemantics(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: _labelGap,
                children: [
                  _Indicator(number: number, status: status),
                  Flexible(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.label,
                          style: theme.textStyle.copyWith(
                            fontWeight: FontWeight.w600,
                            height: InvisibleTypographyTokens.lineHeightTight,
                            color: colors.text,
                          ),
                        ),
                        if (description != null)
                          Text(
                            description,
                            style: theme.textStyle.copyWith(
                              fontSize: _descriptionSize,
                              color: colors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The circle before a step's label: a tick when complete, the number
/// otherwise; the current one tinted, the upcoming ones dashed.
class _Indicator extends StatelessWidget {
  const _Indicator({required this.number, required this.status});

  final int number;
  final StepStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final (fill, border, text) = switch (status) {
      StepStatus.complete => (colors.surface, colors.border, colors.text),
      StepStatus.current => (
        colors.selected.withValues(alpha: _currentTint),
        colors.selected.withValues(alpha: _currentBorder),
        colors.selected,
      ),
      StepStatus.upcoming => (null, colors.text, colors.text),
    };
    final side = MediaQuery.textScalerOf(context).scale(_indicator);
    return CustomPaint(
      painter: _RingPainter(
        fill: fill,
        border: border,
        dashed: status == StepStatus.upcoming,
      ),
      child: SizedBox.square(
        dimension: side,
        child: Center(
          child: status == StepStatus.complete
              ? IconTheme(
                  data: IconThemeData(
                    color: text,
                    size: _indicatorText,
                    applyTextScaling: true,
                  ),
                  child: const Glyph(GlyphShape.check),
                )
              : Text(
                  '$number',
                  style: theme.textStyle.copyWith(
                    fontSize: _indicatorText,
                    fontWeight: FontWeight.w600,
                    height: 1,
                    color: text,
                  ),
                ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.fill,
    required this.border,
    required this.dashed,
  });

  final Color? fill;
  final Color border;
  final bool dashed;

  @override
  void paint(Canvas canvas, Size size) {
    final centre = size.center(Offset.zero);
    final radius = size.shortestSide / 2;
    if (fill case final fill?) {
      canvas.drawCircle(centre, radius, Paint()..color = fill);
    }
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = _indicatorBorder
      ..color = border;
    final ring = radius - _indicatorBorder / 2;
    if (!dashed) {
      canvas.drawCircle(centre, ring, stroke);
      return;
    }
    // A dash and a gap of about three border widths each, as a dashed CSS
    // border draws them.
    final dashes = (2 * math.pi * ring / (_indicatorBorder * 3 * 2)).floor();
    final sweep = 2 * math.pi / dashes;
    final rect = Rect.fromCircle(center: centre, radius: ring);
    for (var i = 0; i < dashes; i++) {
      canvas.drawArc(rect, i * sweep, sweep / 2, false, stroke);
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.fill != fill || old.border != border || old.dashed != dashed;
}

/// The dotted line before every step but the first, in the selection colour
/// when it leads to a completed or the current step.
class _Connector extends StatelessWidget {
  const _Connector({required this.axis, required this.active});

  final Axis axis;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final horizontal = axis == Axis.horizontal;
    return Padding(
      padding: horizontal
          ? const EdgeInsets.symmetric(horizontal: _connectorMargin)
          : const EdgeInsets.symmetric(vertical: _connectorMargin),
      child: CustomPaint(
        size: horizontal
            ? const Size(_connectorLength, _connectorThickness)
            : const Size(_connectorThickness, _connectorMinLength),
        painter: _DotsPainter(
          color: active ? colors.secondary : colors.border,
          horizontal: horizontal,
        ),
      ),
    );
  }
}

class _DotsPainter extends CustomPainter {
  const _DotsPainter({required this.color, required this.horizontal});

  final Color color;
  final bool horizontal;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final length = horizontal ? size.width : size.height;
    final radius = _connectorThickness * 0.42;
    for (var at = _dotGap / 2; at < length; at += _dotGap) {
      canvas.drawCircle(
        horizontal ? Offset(at, size.height / 2) : Offset(size.width / 2, at),
        radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_DotsPainter old) =>
      old.color != color || old.horizontal != horizontal;
}
