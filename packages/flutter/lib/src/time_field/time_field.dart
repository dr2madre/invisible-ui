import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../calendar/date_symbols.dart';
import '../field/field.dart';
import '../i18n/messages.dart';
import '../internal/roving.dart';
import '../internal/text_box.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import 'time_logic.dart';

// Sizes the web time field sets in its own stylesheet.
const double _segmentPadding = 3.2;
const double _dragStep = 16;

/// A segmented time input: hour, minute, an optional second and, in a
/// 12-hour field, AM or PM, following the WAI-ARIA spinbutton pattern per
/// segment.
///
/// Each segment is a tab stop. Digits type into it and move on once it is
/// complete; an impossible digit is ignored, so typing 2 then 5 in a
/// 24-hour hour keeps 02. Up and Down step with wrapping, Left and Right
/// move between segments, Backspace and Delete clear one, A and P set the
/// period, a tap on the period toggles it, and a vertical drag on a
/// segment steps it. Escape puts back the last finished value and is
/// consumed only when it undid something, so an enclosing dialog still
/// closes on it. The segments read left to right in any direction, as
/// times are written.
///
/// The value is the canonical 24-hour string, `HH:mm`, or `HH:mm:ss` with
/// [withSeconds]; null while a segment is empty. [hourCycle] changes the
/// display only: 9:30 PM is the value `21:30`. It defaults to the locale's
/// cycle ([locale], the app's locale from [Localizations], or English). In
/// a 12-hour field AM or PM is never assumed.
///
/// Controlled, [TimeField] shows [value] and reports each change through
/// [onChanged]; [TimeField.uncontrolled] keeps its own. A changed [value]
/// is shown without a report. [onChangeEnd] reports the value when the
/// user finishes editing: focus leaves the field, or Enter. A value from
/// outside that is malformed or at the wrong precision, and a time outside
/// [min] and [max], are reported, never corrected: the field shows why, and
/// [onValidationChanged] reports the error after a user edit changes it.
/// Inside a [Form] it validates, saves and resets like the other value
/// controls.
class TimeField extends StatefulWidget {
  /// A field that shows [value], controlled by the parent. Null is empty.
  const TimeField({
    super.key,
    required this.value,
    this.onChanged,
    this.onChangeEnd,
    this.onValidationChanged,
    this.label,
    this.hourCycle,
    this.withSeconds = false,
    this.min,
    this.max,
    this.locale,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A field that keeps its own value, starting from [initialValue].
  const TimeField.uncontrolled({
    super.key,
    this.initialValue,
    this.onChanged,
    this.onChangeEnd,
    this.onValidationChanged,
    this.label,
    this.hourCycle,
    this.withSeconds = false,
    this.min,
    this.max,
    this.locale,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The value when the parent controls it: `HH:mm` or `HH:mm:ss`, or null.
  final String? value;

  /// The starting value of the uncontrolled field, and its reset default.
  final String? initialValue;

  /// Called with the canonical value when a user edit changes it; null
  /// once a segment is empty.
  final ValueChanged<String?>? onChanged;

  /// Called with the value when the user finishes editing, if it changed.
  final ValueChanged<String?>? onChangeEnd;

  /// Called after a user edit changes the error; null means none.
  final ValueChanged<TimeFieldError?>? onValidationChanged;

  /// The visible label, and the accessible name. Defaults to
  /// [InvisibleMessages.timeFieldLabel].
  final String? label;

  /// 12 or 24; defaults to the locale's cycle.
  final int? hourCycle;

  /// Whether the field has a seconds segment.
  final bool withSeconds;

  /// The earliest time accepted without an error, `HH:mm[:ss]`.
  final String? min;

  /// The latest time accepted without an error, `HH:mm[:ss]`.
  final String? max;

  /// The locale whose hour cycle applies; defaults to the app's locale.
  final Locale? locale;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An application error, such as a closed booking slot. A non-empty one
  /// marks the field invalid and replaces the field's own message.
  final String? error;

  /// Whether the field takes focus and edits. A disabled field keeps its
  /// value readable and leaves the focus order.
  final bool enabled;

  /// Whether a value is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<String?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<String?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<TimeField> createState() => _TimeFieldState();
}

class _TimeFieldState extends State<TimeField>
    with ValueControl<String?, TimeField> {
  TimeEditor? _editor;
  final Map<TimeSegment, FocusNode> _nodes = {};
  bool _focused = false;
  double _drag = 0;

  @override
  bool get isControlled => widget._controlled;

  @override
  String? controlledValueOf(TimeField widget) => widget.value;

  @override
  String? get initialValueOfWidget => widget.initialValue;

  // A new value from outside or a reset reloads the segments, silently.
  @override
  void didReplaceValue() => _editor?.load(value);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncShape();
  }

  @override
  void didUpdateWidget(TimeField oldWidget) {
    super.didUpdateWidget(oldWidget);
    // A parent giving back the value the user typed has accepted it: Escape
    // must not put back anything older.
    final editor = _editor;
    if (widget._controlled &&
        widget.value != oldWidget.value &&
        editor != null &&
        widget.value == editor.value) {
      editor.committed = editor.parts;
    }
    _syncShape();
  }

  @override
  void dispose() {
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  int get _hourCycle =>
      widget.hourCycle ??
      DateSymbols.resolve(context, locale: widget.locale).hourCycle;

  /// A new hour cycle, precision or bounds keep what the field holds, so
  /// 21:30 keeps its PM.
  void _syncShape() {
    final editor = _editor;
    final cycle = _hourCycle;
    if (editor != null &&
        editor.hourCycle == cycle &&
        editor.withSeconds == widget.withSeconds &&
        editor.min == validBound(widget.min) &&
        editor.max == validBound(widget.max)) {
      return;
    }
    final held = editor?.value ?? value;
    _editor = TimeEditor(
      value: held,
      hourCycle: cycle,
      withSeconds: widget.withSeconds,
      min: widget.min,
      max: widget.max,
    );
  }

  FocusNode _node(TimeSegment segment) =>
      _nodes[segment] ??= FocusNode(debugLabel: 'TimeField ${segment.name}');

  /// After an edit: the value is reported when it moved, the error when an
  /// edit changed it.
  void _edited(String? before, TimeFieldError? errorBefore) {
    final editor = _editor!;
    setState(() {});
    final after = editor.value;
    if (after != before && commitValue(after)) widget.onChanged?.call(after);
    if (editor.error != errorBefore) {
      widget.onValidationChanged?.call(editor.error);
    }
  }

  void _run(void Function(TimeEditor editor) edit) {
    final editor = _editor!;
    final before = editor.value;
    final errorBefore = editor.error;
    edit(editor);
    _edited(before, errorBefore);
  }

  void _commit() {
    if (_editor!.commit()) widget.onChangeEnd?.call(_editor!.value);
  }

  static String? _keyName(KeyEvent event) {
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.arrowUp) return 'ArrowUp';
    if (key == LogicalKeyboardKey.arrowDown) return 'ArrowDown';
    if (key == LogicalKeyboardKey.arrowLeft) return 'ArrowLeft';
    if (key == LogicalKeyboardKey.arrowRight) return 'ArrowRight';
    if (key == LogicalKeyboardKey.backspace) return 'Backspace';
    if (key == LogicalKeyboardKey.delete) return 'Delete';
    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter) {
      return 'Enter';
    }
    if (key == LogicalKeyboardKey.escape) return 'Escape';
    return typedCharacter(event);
  }

  KeyEventResult _onKey(TimeSegment segment, KeyEvent event) {
    if (!widget.enabled ||
        (event is! KeyDownEvent && event is! KeyRepeatEvent)) {
      return KeyEventResult.ignored;
    }
    final name = _keyName(event);
    if (name == null) return KeyEventResult.ignored;
    if (name == 'Enter') {
      _commit();
      return KeyEventResult.ignored;
    }
    late TimeKeyResult result;
    _run((editor) => result = editor.key(segment, name));
    if (result.focus case final next?) _node(next).requestFocus();
    return result.handled ? KeyEventResult.handled : KeyEventResult.ignored;
  }

  void _focusChanged(bool focused) {
    setState(() => _focused = focused);
    // Moving between segments is editing; focus leaving the field ends it.
    if (!focused) _commit();
  }

  String? _message(InvisibleMessages messages, TimeFieldError? error) =>
      switch (error) {
        null => null,
        TimeFieldError.invalidFormat => messages.timeFieldInvalidFormat,
        TimeFieldError.outOfRange => messages.timeFieldOutOfRange,
        TimeFieldError.secondsRequired => messages.timeFieldSecondsRequired,
        TimeFieldError.secondsNotAllowed => messages.timeFieldSecondsNotAllowed,
        TimeFieldError.rangeUnderflow => InvisibleMessages.fill(
          messages.timeFieldRangeUnderflow,
          {'min': widget.min ?? ''},
        ),
        TimeFieldError.rangeOverflow => InvisibleMessages.fill(
          messages.timeFieldRangeOverflow,
          {'max': widget.max ?? ''},
        ),
      };

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final editor = _editor!;
    final label = widget.label ?? messages.timeFieldLabel;

    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error =
            widget.error ?? errorText ?? _message(messages, editor.error);
        final invalid = error != null && error.isNotEmpty;
        final segments = editor.segments;
        final row = <Widget>[];
        for (final segment in segments) {
          if (row.isNotEmpty) {
            row.add(
              ExcludeSemantics(
                child: Text(
                  segment == TimeSegment.dayPeriod ? ' ' : ':',
                  style: theme.textStyle.copyWith(
                    color: theme.colors.textSecondary,
                  ),
                ),
              ),
            );
          }
          row.add(_buildSegment(context, editor, segment, messages));
        }
        return FieldFrame(
          label: label,
          hideLabel: widget.hideLabel,
          required: widget.required,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: () => _node(segments.first).requestFocus(),
          control: FieldSemantics(
            label: label,
            description: widget.description,
            error: error,
            required: widget.required,
            enabled: widget.enabled,
            explicitChildNodes: true,
            child: Focus(
              canRequestFocus: false,
              skipTraversal: true,
              onFocusChange: _focusChanged,
              child: FieldBox(
                enabled: widget.enabled,
                invalid: invalid,
                focused: _focused,
                child: Directionality(
                  // Times read left to right in every script.
                  textDirection: TextDirection.ltr,
                  // A narrow column at a large text scale wraps the
                  // segments rather than cutting them off.
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: row,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSegment(
    BuildContext context,
    TimeEditor editor,
    TimeSegment segment,
    InvisibleMessages messages,
  ) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final node = _node(segment);
    final enabled = widget.enabled;
    final period = segment == TimeSegment.dayPeriod;
    final shown = period
        ? editor.parts.dayPeriod
        : editor.displayValue(segment);
    final segmentLabel = switch (segment) {
      TimeSegment.hour => messages.timeFieldHour,
      TimeSegment.minute => messages.timeFieldMinute,
      TimeSegment.second => messages.timeFieldSecond,
      TimeSegment.dayPeriod => messages.timeFieldDayPeriod,
    };

    // The value a step would show, for the increase and decrease actions.
    final focused = node.hasFocus;
    final target = theme.minTargetSize;
    return Semantics(
      container: true,
      label: segmentLabel,
      value: shown == null ? messages.timeFieldEmpty : editor.text(segment),
      increasedValue: enabled ? editor.steppedText(segment, 1) : null,
      decreasedValue: enabled ? editor.steppedText(segment, -1) : null,
      onIncrease: enabled ? () => _run((e) => e.step(segment, 1)) : null,
      onDecrease: enabled ? () => _run((e) => e.step(segment, -1)) : null,
      enabled: enabled,
      validationResult: editor.invalidSegment == segment
          ? SemanticsValidationResult.invalid
          : SemanticsValidationResult.none,
      child: ExcludeSemantics(
        child: Focus(
          focusNode: node,
          canRequestFocus: enabled,
          onKeyEvent: (_, event) => _onKey(segment, event),
          onFocusChange: (_) => setState(() {}),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: enabled
                ? () {
                    node.requestFocus();
                    if (period) _run((e) => e.step(segment, 1));
                  }
                : null,
            onVerticalDragStart: enabled
                ? (_) {
                    _drag = 0;
                    node.requestFocus();
                  }
                : null,
            onVerticalDragUpdate: enabled
                ? (details) {
                    _drag += details.delta.dy;
                    while (_drag.abs() >= _dragStep) {
                      final up = _drag < 0;
                      _drag += up ? _dragStep : -_dragStep;
                      _run((e) => e.step(segment, up ? 1 : -1));
                    }
                  }
                : null,
            child: MouseRegion(
              cursor: enabled
                  ? SystemMouseCursors.text
                  : SystemMouseCursors.forbidden,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: target.width,
                  minHeight: target.height,
                ),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    // The segment being edited shows on any focus, touch
                    // included, so which part changes stays clear.
                    color: focused ? colors.secondary : null,
                    borderRadius: BorderRadius.circular(theme.controlRadius),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: _segmentPadding,
                    ),
                    child: Center(
                      widthFactor: 1,
                      child: Text(
                        editor.text(segment),
                        style: theme.textStyle.copyWith(
                          fontFeatures: const [FontFeature.tabularFigures()],
                          color: focused
                              ? colors.onSecondary
                              : shown == null
                              ? colors.textSecondary
                              : enabled
                              ? colors.text
                              : colors.textDisabled,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
