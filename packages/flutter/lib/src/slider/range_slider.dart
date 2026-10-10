import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../internal/focus_ring.dart';
import '../internal/roving.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import 'slider_logic.dart';
import 'slider_track.dart';

// Sizes the web RangeSlider sets in its own stylesheet.
const double _verticalLength = 192;
const double _thickness = 4;
const double _thumb = 24;
const double _thumbBorder = 2;

/// A two-thumb slider that picks a range, such as a price from 20 to 80. Each
/// thumb follows the WAI-ARIA slider pattern, as the web's two native range
/// inputs do, and the pair is one value.
///
/// Each thumb is a tab stop with the keys of [Slider]: the arrows move one
/// [step], following the reading direction, Page Up and Page Down a tenth of
/// the range, Home and End to the ends. A press on the track moves the
/// nearer thumb there and drags it. The thumbs never cross and stay
/// [minDistance] apart; the lower thumb is always the first value. Each
/// thumb announces its value with the bound it may not pass.
///
/// [onChanged] reports the whole pair each time it moves; [onChangeEnd]
/// reports it once a gesture ends, when it moved. Controlled, [RangeSlider]
/// shows [value], made legal (on the grid, inside the bounds, in order and
/// apart), and a changed [value] is shown without a report;
/// [RangeSlider.uncontrolled] keeps its own pair from [initialValue].
/// Inside a [Form] it saves with [onSaved], and a form reset restores the
/// current default silently.
///
/// [label] names the pair and [thumbLabels] each thumb; neither is shown,
/// as on the web.
class RangeSlider extends StatefulWidget {
  /// A range slider that shows [value], controlled by the parent.
  const RangeSlider({
    super.key,
    required this.label,
    required this.thumbLabels,
    required (double, double) this.value,
    this.onChanged,
    this.onChangeEnd,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.minDistance = 0,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.showValue = false,
    this.showRange = false,
    this.ticks = false,
    this.format,
    this.locale,
    this.icon,
    this.onSaved,
  }) : initialValue = null,
       _controlled = true;

  /// A range slider that keeps its own pair, starting from [initialValue],
  /// or from ([min], [max]) when it is null.
  const RangeSlider.uncontrolled({
    super.key,
    required this.label,
    required this.thumbLabels,
    this.initialValue,
    this.onChanged,
    this.onChangeEnd,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.minDistance = 0,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.showValue = false,
    this.showRange = false,
    this.ticks = false,
    this.format,
    this.locale,
    this.icon,
    this.onSaved,
  }) : value = null,
       _controlled = false;

  /// The accessible name of the pair.
  final String label;

  /// The accessible names of the lower and the upper thumb.
  final (String, String) thumbLabels;

  /// The lower and upper values when the parent controls them.
  final (double, double)? value;

  /// The starting pair of the uncontrolled form, and its reset default.
  final (double, double)? initialValue;

  /// Called with the whole pair each time it moves. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<(double, double)>? onChanged;

  /// Called with the pair when a drag, a tap or a key that moved it ends.
  final ValueChanged<(double, double)>? onChangeEnd;

  /// The smallest value. Reversed bounds are read smaller first.
  final double min;

  /// The largest value.
  final double max;

  /// The distance between two values; 0 or less allows any value.
  final double step;

  /// The gap the thumbs keep, rounded up to the step grid. 0 lets them
  /// touch; they never cross.
  final double minDistance;

  /// The direction the thumbs travel; a vertical slider fills upward.
  final Axis orientation;

  /// Whether the slider takes focus and changes.
  final bool enabled;

  /// Shows the pair beside the track.
  final bool showValue;

  /// Shows [min] and [max] under the ends of the track.
  final bool showRange;

  /// Shows a tick at each step, when there are at most 20.
  final bool ticks;

  /// Writes a value for display and announcement, such as with a unit.
  final String Function(double value)? format;

  /// The locale whose digits write the values without [format].
  final Locale? locale;

  /// A decorative icon before the track.
  final Widget? icon;

  /// Called with the pair when the enclosing [Form] saves.
  final FormFieldSetter<(double, double)>? onSaved;

  final bool _controlled;

  @override
  State<RangeSlider> createState() => _RangeSliderState();
}

class _RangeSliderState extends State<RangeSlider>
    with ValueControl<(double, double), RangeSlider> {
  final List<FocusNode> _nodes = [
    FocusNode(debugLabel: 'RangeSlider lower'),
    FocusNode(debugLabel: 'RangeSlider upper'),
  ];
  final List<bool> _focusVisible = [false, false];
  final List<bool> _focused = [false, false];

  /// The thumb a pointer gesture moves and the pair when it began.
  ({int thumb, (double, double) start})? _gesture;

  ({double min, double max, double step, double distance}) _bounds(
    RangeSlider w,
  ) {
    final (min, max) = orderBounds(w.min, w.max);
    return (
      min: min,
      max: max,
      step: w.step,
      distance: effectiveMinDistance(w.minDistance, min, max, w.step),
    );
  }

  (double, double) _normalize((double, double) pair, RangeSlider w) {
    final b = _bounds(w);
    return normalizePair(pair, b.min, b.max, b.step, b.distance);
  }

  @override
  bool get isControlled => widget._controlled;

  @override
  (double, double) controlledValueOf(RangeSlider widget) =>
      _normalize(widget.value!, widget);

  @override
  (double, double) get initialValueOfWidget {
    final b = _bounds(widget);
    return _normalize(widget.initialValue ?? (b.min, b.max), widget);
  }

  @override
  void didUpdateWidget(RangeSlider oldWidget) {
    super.didUpdateWidget(oldWidget);
    // New constraints make the pair legal again, silently.
    if (_bounds(oldWidget) != _bounds(widget)) {
      value = _normalize(value, widget);
    }
  }

  @override
  void dispose() {
    for (final node in _nodes) {
      node.dispose();
    }
    super.dispose();
  }

  bool _move(int thumb, double raw) {
    final b = _bounds(widget);
    final next = clampPair(value, thumb, raw, b.min, b.max, b.step, b.distance);
    if (!commitValue(next)) return false;
    widget.onChanged?.call(next);
    return true;
  }

  void _key(int thumb, LogicalKeyboardKey key) {
    final b = _bounds(widget);
    final current = thumb == 0 ? value.$1 : value.$2;
    final target = sliderKeyTarget(
      key: key,
      value: current,
      min: b.min,
      max: b.max,
      step: b.step,
      direction: Directionality.of(context),
    );
    if (target != null && _move(thumb, target)) {
      widget.onChangeEnd?.call(value);
    }
  }

  double _valueAt(double fraction) {
    final b = _bounds(widget);
    return b.min + fraction * (b.max - b.min);
  }

  (double, double) get _fractions {
    final b = _bounds(widget);
    return (
      valueFraction(value.$1, b.min, b.max),
      valueFraction(value.$2, b.min, b.max),
    );
  }

  void _startGesture(double fraction) {
    final (lower, upper) = _fractions;
    final thumb = nearerThumb(fraction, lower, upper);
    _nodes[thumb].requestFocus();
    _gesture = (thumb: thumb, start: value);
    _move(thumb, _valueAt(fraction));
  }

  void _updateGesture(double fraction) {
    final gesture = _gesture;
    if (gesture != null) _move(gesture.thumb, _valueAt(fraction));
  }

  void _endGesture() {
    final gesture = _gesture;
    _gesture = null;
    if (gesture != null && gesture.start != value) {
      widget.onChangeEnd?.call(value);
    }
  }

  Widget _buildThumb(int index, double side) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final enabled = widget.enabled;
    final b = _bounds(widget);
    String text(double v) =>
        sliderText(context, v, widget.format, widget.locale);
    final current = index == 0 ? value.$1 : value.$2;
    String valueText((double, double) pair) {
      final v = index == 0 ? pair.$1 : pair.$2;
      // The bound named is the one the clamp uses, so text and limit agree.
      final limit = index == 0
          ? onGrid(pair.$2 - b.distance, b.step)
          : onGrid(pair.$1 + b.distance, b.step);
      return InvisibleMessages.fill(
        index == 0
            ? messages.rangeSliderLowerText
            : messages.rangeSliderUpperText,
        {'value': text(v), 'bound': text(limit)},
      );
    }

    final unit = b.step > 0 ? b.step : (b.max - b.min) / 100;
    final increased = clampPair(
      value,
      index,
      current + unit,
      b.min,
      b.max,
      b.step,
      b.distance,
    );
    final decreased = clampPair(
      value,
      index,
      current - unit,
      b.min,
      b.max,
      b.step,
      b.distance,
    );

    return Semantics(
      container: true,
      slider: true,
      label: index == 0 ? widget.thumbLabels.$1 : widget.thumbLabels.$2,
      value: valueText(value),
      increasedValue: valueText(increased),
      decreasedValue: valueText(decreased),
      enabled: enabled,
      focusable: enabled,
      focused: _focused[index],
      onIncrease: enabled && increased != value
          ? () => _key(index, LogicalKeyboardKey.arrowUp)
          : null,
      onDecrease: enabled && decreased != value
          ? () => _key(index, LogicalKeyboardKey.arrowDown)
          : null,
      // The node above carries the focus state; the detector's own would
      // split the slider into two nodes.
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: enabled,
          focusNode: _nodes[index],
          shortcuts: sliderShortcuts,
          actions: {
            RovingKeyIntent: CallbackAction<RovingKeyIntent>(
              onInvoke: (intent) => _key(index, intent.key),
            ),
          },
          onFocusChange: (focused) => setState(() => _focused[index] = focused),
          onShowFocusHighlight: (visible) =>
              setState(() => _focusVisible[index] = visible),
          child: FocusRingPainter(
            visible: _focusVisible[index] && enabled,
            ring: theme.focusRing,
            radius: side / 2,
            child: Container(
              width: side,
              height: side,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: colors.primary,
                border: Border.all(
                  color: colors.background,
                  width: _thumbBorder,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = widget.enabled;
    final b = _bounds(widget);
    final (lower, upper) = _fractions;
    String text(double v) =>
        sliderText(context, v, widget.format, widget.locale);

    final track = SliderTrack(
      axis: widget.orientation,
      thickness: _thickness,
      thumbSize: _thumb,
      fill: colors.primary,
      fillFrom: lower,
      fillTo: upper,
      thumbs: [lower, upper],
      ticks: widget.ticks
          ? sliderTicks(b.min, b.max, b.step, whole: true)
          : const [],
      tickStyle: TickStyle.dot,
      enabled: enabled,
      onStart: _startGesture,
      onUpdate: _updateGesture,
      onEnd: _endGesture,
      thumbBuilder: _buildThumb,
    );

    final group = Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      child: track,
    );

    return buildFormField(
      enabled: enabled,
      onSaved: widget.onSaved,
      builder: (_) => SliderFrame(
        axis: widget.orientation,
        verticalLength: _verticalLength,
        enabled: enabled,
        control: group,
        icon: widget.icon,
        valueText: widget.showValue
            ? '${text(value.$1)} – ${text(value.$2)}'
            : null,
        minText: widget.showRange ? text(b.min) : null,
        maxText: widget.showRange ? text(b.max) : null,
      ),
    );
  }
}
