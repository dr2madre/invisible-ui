import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/focus_ring.dart';
import '../internal/roving.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import 'slider_logic.dart';
import 'slider_track.dart';

// Sizes the web Slider sets in its own stylesheet.
const double _length = 224;
const double _thickness = 6;
const double _thumb = 16;
const double _thumbBorder = 2;

/// A single-thumb slider that picks a number in a range, following the
/// WAI-ARIA slider pattern, as the web's native range input does.
///
/// The arrows move one [step]: right and up increase, and the horizontal
/// arrows follow the reading direction. Page Up and Page Down move a tenth
/// of the range (at least one step), Home and End go to [min] and [max]. A
/// press on the track moves the thumb there and drags it. Every value lands
/// on the step grid from [min].
///
/// [onChanged] reports each new value while it moves; [onChangeEnd] reports
/// the value once a gesture ends (a drag released, a tap, a key) when it
/// moved. Controlled, [Slider] shows [value], snapped to the grid, and a
/// changed [value] is shown without a report; [Slider.uncontrolled] keeps
/// its own value from [initialValue]. Inside a [Form] it saves with
/// [onSaved], and a form reset restores the current default silently.
///
/// [label] names the slider for assistive technology; it is not shown, as
/// on the web. The value is announced as text: [format]'s, or the number in
/// the locale's digits. A horizontal slider takes the width its parent
/// gives, or 224 when the width is open; a vertical one is 224 tall. The
/// hit area is never thinner than [InvisibleThemeData.minTargetSize].
///
/// The name collides with Material's `Slider`: an app that imports both
/// libraries hides one, or imports this package with a prefix.
class Slider extends StatefulWidget {
  /// A slider that shows [value], controlled by the parent.
  const Slider({
    super.key,
    required this.label,
    required double this.value,
    this.onChanged,
    this.onChangeEnd,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.showValue = false,
    this.showRange = false,
    this.ticks = false,
    this.format,
    this.locale,
    this.icon,
    this.focusNode,
    this.autofocus = false,
    this.onSaved,
  }) : initialValue = null,
       _controlled = true;

  /// A slider that keeps its own value, starting from [initialValue], or
  /// [min] when it is null.
  const Slider.uncontrolled({
    super.key,
    required this.label,
    this.initialValue,
    this.onChanged,
    this.onChangeEnd,
    this.min = 0,
    this.max = 100,
    this.step = 1,
    this.orientation = Axis.horizontal,
    this.enabled = true,
    this.showValue = false,
    this.showRange = false,
    this.ticks = false,
    this.format,
    this.locale,
    this.icon,
    this.focusNode,
    this.autofocus = false,
    this.onSaved,
  }) : value = null,
       _controlled = false;

  /// The accessible name.
  final String label;

  /// The value when the parent controls it.
  final double? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final double? initialValue;

  /// Called with each new value while it moves. Never called for a changed
  /// [value] or a form reset.
  final ValueChanged<double>? onChanged;

  /// Called with the value when a drag, a tap or a key that moved it ends.
  final ValueChanged<double>? onChangeEnd;

  /// The smallest value.
  final double min;

  /// The largest value.
  final double max;

  /// The distance between two values; 0 or less allows any value.
  final double step;

  /// The direction the thumb travels; a vertical slider fills upward.
  final Axis orientation;

  /// Whether the slider takes focus and changes.
  final bool enabled;

  /// Shows the value beside the track.
  final bool showValue;

  /// Shows [min] and [max] under the ends of the track.
  final bool showRange;

  /// Shows a tick at each step, when there are at most 20.
  final bool ticks;

  /// Writes a value for display and announcement, such as with a unit.
  final String Function(double value)? format;

  /// The locale whose digits write the value without [format].
  final Locale? locale;

  /// A decorative icon before the track, sized and coloured by the
  /// surrounding [IconTheme], which the slider sets.
  final Widget? icon;

  /// The focus node.
  final FocusNode? focusNode;

  /// Whether the slider takes focus when it first appears.
  final bool autofocus;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<double>? onSaved;

  final bool _controlled;

  @override
  State<Slider> createState() => _SliderState();
}

class _SliderState extends State<Slider> with ValueControl<double, Slider> {
  FocusNode? _ownNode;
  FocusNode get _node =>
      widget.focusNode ?? (_ownNode ??= FocusNode(debugLabel: 'Slider'));
  bool _focusVisible = false;
  bool _focused = false;

  /// The value when the current pointer gesture began, or null between
  /// gestures.
  double? _gestureStart;

  late final Map<Type, Action<Intent>> _actions = {
    RovingKeyIntent: CallbackAction<RovingKeyIntent>(onInvoke: _key),
  };

  double _snap(double v, [Slider? of]) {
    final w = of ?? widget;
    return snapSlider(v, w.min, w.max, w.step);
  }

  @override
  bool get isControlled => widget._controlled;

  /// The last value shown, or null before the first build.
  double? _shown;

  // A value that is not a number is not a position on the track: the slider
  // keeps the one it shows, or starts at the minimum.
  @override
  double controlledValueOf(Slider widget) {
    final next = widget.value!;
    if (next.isFinite) return _snap(next, widget);
    return _shown ?? _snap(widget.min, widget);
  }

  @override
  double get initialValueOfWidget => _snap(widget.initialValue ?? widget.min);

  @override
  void didUpdateWidget(Slider oldWidget) {
    super.didUpdateWidget(oldWidget);
    // New bounds or a new step snap the value silently.
    if (oldWidget.min != widget.min ||
        oldWidget.max != widget.max ||
        oldWidget.step != widget.step) {
      value = _snap(value);
    }
  }

  @override
  void dispose() {
    _ownNode?.dispose();
    super.dispose();
  }

  /// A user change, reported once when the value moved.
  bool _move(double raw) {
    final next = _snap(raw);
    if (!commitValue(next)) return false;
    widget.onChanged?.call(next);
    return true;
  }

  void _key(RovingKeyIntent intent) {
    final target = sliderKeyTarget(
      key: intent.key,
      value: value,
      min: widget.min,
      max: widget.max,
      step: widget.step,
      direction: Directionality.of(context),
    );
    if (target != null && _move(target)) widget.onChangeEnd?.call(value);
  }

  void _startGesture(double fraction) {
    _node.requestFocus();
    _gestureStart = value;
    _move(
      sliderValueFromFraction(fraction, widget.min, widget.max, widget.step),
    );
  }

  void _updateGesture(double fraction) {
    if (_gestureStart == null) return;
    _move(
      sliderValueFromFraction(fraction, widget.min, widget.max, widget.step),
    );
  }

  void _endGesture() {
    final start = _gestureStart;
    _gestureStart = null;
    if (start != null && start != value) widget.onChangeEnd?.call(value);
  }

  double get _unit =>
      widget.step > 0 ? widget.step : (widget.max - widget.min) / 100;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = widget.enabled;
    String text(double v) =>
        sliderText(context, v, widget.format, widget.locale);

    _shown = value;
    final increased = _snap(value + _unit);
    final decreased = _snap(value - _unit);

    final track = SliderTrack(
      axis: widget.orientation,
      thickness: _thickness,
      thumbSize: _thumb,
      fill: colors.secondary,
      fillFrom: 0,
      fillTo: valueFraction(value, widget.min, widget.max),
      thumbs: [valueFraction(value, widget.min, widget.max)],
      ticks: widget.ticks
          ? sliderTicks(widget.min, widget.max, widget.step, whole: false)
          : const [],
      enabled: enabled,
      onStart: _startGesture,
      onUpdate: _updateGesture,
      onEnd: _endGesture,
      thumbBuilder: (index, side) => FocusRingPainter(
        visible: _focusVisible && enabled,
        ring: theme.focusRing,
        radius: side / 2,
        child: Container(
          width: side,
          height: side,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: colors.background,
            border: Border.all(color: colors.secondary, width: _thumbBorder),
          ),
        ),
      ),
    );

    final control = Semantics(
      container: true,
      slider: true,
      label: widget.label,
      value: text(value),
      increasedValue: text(increased),
      decreasedValue: text(decreased),
      enabled: enabled,
      focusable: enabled,
      focused: _focused,
      onIncrease: enabled && increased != value
          ? () => _key(const RovingKeyIntent(LogicalKeyboardKey.arrowUp))
          : null,
      onDecrease: enabled && decreased != value
          ? () => _key(const RovingKeyIntent(LogicalKeyboardKey.arrowDown))
          : null,
      // The node above carries the focus state; the detector's own would
      // split the slider into two nodes.
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: enabled,
          focusNode: _node,
          autofocus: widget.autofocus,
          shortcuts: sliderShortcuts,
          actions: _actions,
          onFocusChange: (focused) => setState(() => _focused = focused),
          onShowFocusHighlight: (visible) =>
              setState(() => _focusVisible = visible),
          child: track,
        ),
      ),
    );

    return buildFormField(
      enabled: enabled,
      onSaved: widget.onSaved,
      builder: (_) => SliderFrame(
        axis: widget.orientation,
        verticalLength: _length,
        enabled: enabled,
        control: control,
        icon: widget.icon,
        valueText: widget.showValue ? text(value) : null,
        minText: widget.showRange ? text(widget.min) : null,
        maxText: widget.showRange ? text(widget.max) : null,
      ),
    );
  }
}
