import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../calendar/calendar.dart';
import '../calendar/calendar_date.dart';
import '../calendar/date_symbols.dart';
import '../field/field.dart';
import '../internal/field_button.dart';
import '../internal/glyphs.dart';
import '../internal/text_box.dart';
import '../internal/value_control.dart';
import '../popover/popover.dart';
import '../theme/theme.dart';

// Sizes the web date pickers set in their own stylesheets.
const double _gap = 8;
const double _popupWidth = 352;
const double _rangePopupWidth = 640;

/// A date field that opens a [Calendar] in a popup.
///
/// The field is a button that opens a dialog: a tap, Enter, Space or Down
/// opens it, and focus moves to the calendar's focused day, the picked one
/// or today, where the date grid keys apply. Picking a day fills the field,
/// closes the popup and puts focus back on the field; Escape closes it the
/// same way without a pick, and a press outside closes it in place. With
/// [clearable], a clear button empties the field while it holds a date.
///
/// The field shows the date in the locale's medium style ([locale], the
/// app's locale from [Localizations], or English; [symbols] overrides the
/// names). The value is a [DateTime] whose year, month and day are the
/// date: the time of day is ignored, and the picker reports local
/// midnight, as Flutter's own date pickers do. [min], [max] and
/// [weekStartsOn] go to the calendar.
///
/// Controlled, [DatePicker] shows [value] and reports each pick or clear
/// through [onChanged], after the popup has closed; [DatePicker.uncontrolled]
/// keeps its own. A changed [value] is shown without a report. Inside a
/// [Form] it validates, saves and resets like the other value controls.
class DatePicker extends StatefulWidget {
  /// A picker that shows [value], controlled by the parent.
  const DatePicker({
    super.key,
    required this.value,
    this.onChanged,
    this.label,
    this.placeholder,
    this.min,
    this.max,
    this.weekStartsOn = DateTime.monday,
    this.locale,
    this.symbols,
    this.clearable = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A picker that keeps its own date, starting from [initialValue].
  const DatePicker.uncontrolled({
    super.key,
    this.initialValue,
    this.onChanged,
    this.label,
    this.placeholder,
    this.min,
    this.max,
    this.weekStartsOn = DateTime.monday,
    this.locale,
    this.symbols,
    this.clearable = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The date when the parent controls it; null shows the placeholder.
  final DateTime? value;

  /// The starting date of the uncontrolled picker, and its reset default.
  final DateTime? initialValue;

  /// Called with the picked day at local midnight, or null when cleared,
  /// after a user action that changed it.
  final ValueChanged<DateTime?>? onChanged;

  /// The visible label, and the accessible name. Defaults to
  /// [InvisibleMessages.datePickerLabel].
  final String? label;

  /// Shown while no date is picked. Defaults to
  /// [InvisibleMessages.datePickerPlaceholder].
  final String? placeholder;

  /// The earliest day that can be picked, inclusive.
  final DateTime? min;

  /// The latest day that can be picked, inclusive.
  final DateTime? max;

  /// The first day of a calendar week, [DateTime.monday] to
  /// [DateTime.sunday].
  final int weekStartsOn;

  /// The locale of the field and the calendar; defaults to the app's.
  final Locale? locale;

  /// The names, overriding the locale's.
  final DateSymbols? symbols;

  /// Whether a clear button shows while a date is picked.
  final bool clearable;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid.
  final String? error;

  /// Whether the field takes focus and opens.
  final bool enabled;

  /// Whether a date is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// The focus node of the field.
  final FocusNode? focusNode;

  /// Checks the date when the enclosing [Form] validates.
  final FormFieldValidator<DateTime?>? validator;

  /// Called with the date when the enclosing [Form] saves.
  final FormFieldSetter<DateTime?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<DatePicker> createState() => _DatePickerState();
}

class _DatePickerState extends State<DatePicker>
    with ValueControl<DateTime?, DatePicker> {
  final PopoverController _popup = PopoverController();
  final GlobalKey _calendar = GlobalKey();

  @override
  bool get isControlled => widget._controlled;

  @override
  DateTime? controlledValueOf(DatePicker widget) => widget.value;

  @override
  DateTime? get initialValueOfWidget => widget.initialValue;

  @override
  bool sameValue(DateTime? a, DateTime? b) => sameDay(a, b);

  @override
  void didUpdateWidget(DatePicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    _closeWhenDisabled(widget.enabled, _popup);
  }

  void _set(DateTime? next) {
    final day = next == null ? null : localDay(next);
    if (commitValue(day)) widget.onChanged?.call(day);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final symbols = DateSymbols.resolve(
      context,
      locale: widget.locale,
      symbols: widget.symbols,
    );
    final label = widget.label ?? messages.datePickerLabel;
    final value = this.value;
    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) => _PickerField(
        label: label,
        hideLabel: widget.hideLabel,
        placeholder: widget.placeholder ?? messages.datePickerPlaceholder,
        clearLabel: messages.datePickerClear,
        text: value == null ? null : symbols.formatMedium(value),
        clearable: widget.clearable,
        enabled: widget.enabled,
        required: widget.required,
        description: widget.description,
        error: widget.error ?? errorText,
        focusNode: widget.focusNode,
        controller: _popup,
        popupWidth: _popupWidth,
        initialFocus: () => calendarFocusedDay(_calendar),
        onClear: () => _set(null),
        calendar: (context) => Calendar(
          key: _calendar,
          value: value,
          min: widget.min,
          max: widget.max,
          weekStartsOn: widget.weekStartsOn,
          locale: widget.locale,
          symbols: widget.symbols,
          label: label,
          onChanged: (day) {
            // Closed before the pick is reported (ADR 0011).
            _popup.close();
            _set(day);
          },
        ),
      ),
    );
  }
}

/// A field that opens a range [Calendar] in a popup.
///
/// It shares [DatePicker]'s field and popup: the first pick sets the start,
/// the next sets the end, with the days between banded, and the popup
/// closes once both are picked, with focus back on the field. A pick before
/// the start becomes the new start. The field shows both dates in the
/// locale's medium style. The calendar shows two months unless [view] says
/// otherwise.
///
/// The value is a [DateRange] of calendar days, its end null while the
/// range is half made. Controlled, [DateRangePicker] shows [value] and
/// reports each pick through [onChanged], and null when cleared;
/// [DateRangePicker.uncontrolled] keeps its own. A changed [value] is shown
/// without a report. Inside a [Form] it validates, saves and resets like
/// the other value controls.
class DateRangePicker extends StatefulWidget {
  /// A picker that shows [value], controlled by the parent.
  const DateRangePicker({
    super.key,
    required this.value,
    this.onChanged,
    this.label,
    this.placeholder,
    this.min,
    this.max,
    this.weekStartsOn = DateTime.monday,
    this.view = CalendarView.twoMonth,
    this.locale,
    this.symbols,
    this.clearable = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A picker that keeps its own range, starting from [initialValue].
  const DateRangePicker.uncontrolled({
    super.key,
    this.initialValue,
    this.onChanged,
    this.label,
    this.placeholder,
    this.min,
    this.max,
    this.weekStartsOn = DateTime.monday,
    this.view = CalendarView.twoMonth,
    this.locale,
    this.symbols,
    this.clearable = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.required = false,
    this.focusNode,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The range when the parent controls it; null shows the placeholder.
  final DateRange? value;

  /// The starting range of the uncontrolled picker, and its reset default.
  final DateRange? initialValue;

  /// Called after each pick, with a null end while the range is half made,
  /// and with null when cleared.
  final ValueChanged<DateRange?>? onChanged;

  /// The visible label, and the accessible name. Defaults to
  /// [InvisibleMessages.dateRangePickerLabel].
  final String? label;

  /// Shown while no range is started. Defaults to
  /// [InvisibleMessages.dateRangePickerPlaceholder].
  final String? placeholder;

  /// The earliest day that can be picked, inclusive.
  final DateTime? min;

  /// The latest day that can be picked, inclusive.
  final DateTime? max;

  /// The first day of a calendar week, [DateTime.monday] to
  /// [DateTime.sunday].
  final int weekStartsOn;

  /// The months the calendar shows; two by default.
  final CalendarView view;

  /// The locale of the field and the calendar; defaults to the app's.
  final Locale? locale;

  /// The names, overriding the locale's.
  final DateSymbols? symbols;

  /// Whether a clear button shows while a range is started.
  final bool clearable;

  /// Hides the label visually while it still names the field.
  final bool hideLabel;

  /// A hint shown under the field and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the field invalid.
  final String? error;

  /// Whether the field takes focus and opens.
  final bool enabled;

  /// Whether a range is required. The label shows an asterisk; checking it
  /// is the [validator]'s work.
  final bool required;

  /// The focus node of the field.
  final FocusNode? focusNode;

  /// Checks the range when the enclosing [Form] validates.
  final FormFieldValidator<DateRange?>? validator;

  /// Called with the range when the enclosing [Form] saves.
  final FormFieldSetter<DateRange?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<DateRangePicker> createState() => _DateRangePickerState();
}

class _DateRangePickerState extends State<DateRangePicker>
    with ValueControl<DateRange?, DateRangePicker> {
  final PopoverController _popup = PopoverController();
  final GlobalKey _calendar = GlobalKey();

  @override
  bool get isControlled => widget._controlled;

  @override
  DateRange? controlledValueOf(DateRangePicker widget) => widget.value;

  @override
  DateRange? get initialValueOfWidget => widget.initialValue;

  @override
  void didUpdateWidget(DateRangePicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    _closeWhenDisabled(widget.enabled, _popup);
  }

  void _set(DateRange? next) {
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final symbols = DateSymbols.resolve(
      context,
      locale: widget.locale,
      symbols: widget.symbols,
    );
    final label = widget.label ?? messages.dateRangePickerLabel;
    final range = value;
    final end = range?.end;
    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) => _PickerField(
        label: label,
        hideLabel: widget.hideLabel,
        placeholder: widget.placeholder ?? messages.dateRangePickerPlaceholder,
        clearLabel: messages.dateRangePickerClear,
        text: range == null
            ? null
            : '${symbols.formatMedium(range.start)} – '
                  '${end == null ? '…' : symbols.formatMedium(end)}',
        clearable: widget.clearable,
        enabled: widget.enabled,
        required: widget.required,
        description: widget.description,
        error: widget.error ?? errorText,
        focusNode: widget.focusNode,
        controller: _popup,
        popupWidth: _rangePopupWidth,
        initialFocus: () => calendarFocusedDay(_calendar),
        onClear: () => _set(null),
        calendar: (context) => Calendar.range(
          key: _calendar,
          range: range,
          view: widget.view,
          min: widget.min,
          max: widget.max,
          weekStartsOn: widget.weekStartsOn,
          locale: widget.locale,
          symbols: widget.symbols,
          label: label,
          onRangeChanged: (next) {
            // A finished range closes before it is reported (ADR 0011).
            if (next.isComplete) _popup.close();
            _set(next);
          },
        ),
      ),
    );
  }
}

/// A control turned off shows no popup: nothing on it answers.
void _closeWhenDisabled(bool enabled, PopoverController popup) {
  if (enabled || !popup.isOpen) return;
  SchedulerBinding.instance.addPostFrameCallback((_) => popup.close());
}

/// The field and popup the date pickers share: a button-like field showing
/// the value or the placeholder, a calendar glyph, an optional clear button,
/// and the calendar in a popover anchored to the field.
class _PickerField extends StatefulWidget {
  const _PickerField({
    required this.label,
    required this.hideLabel,
    required this.placeholder,
    required this.clearLabel,
    required this.text,
    required this.clearable,
    required this.enabled,
    required this.required,
    required this.description,
    required this.error,
    required this.focusNode,
    required this.controller,
    required this.popupWidth,
    required this.initialFocus,
    required this.onClear,
    required this.calendar,
  });

  final String label;
  final bool hideLabel;
  final String placeholder;
  final String clearLabel;
  final String? text;
  final bool clearable;
  final bool enabled;
  final bool required;
  final String? description;
  final String? error;
  final FocusNode? focusNode;
  final PopoverController controller;
  final double popupWidth;
  final FocusNode? Function() initialFocus;
  final VoidCallback onClear;
  final WidgetBuilder calendar;

  @override
  State<_PickerField> createState() => _PickerFieldState();
}

class _PickerFieldState extends State<_PickerField> {
  FocusNode? _ownFocus;
  bool _focusVisible = false;

  FocusNode get _focus =>
      widget.focusNode ?? (_ownFocus ??= FocusNode(debugLabel: 'DatePicker'));

  @override
  void dispose() {
    _ownFocus?.dispose();
    super.dispose();
  }

  KeyEventResult _onKey(KeyEvent event, bool open, VoidCallback toggle) {
    if (!widget.enabled || open || event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter ||
        key == LogicalKeyboardKey.space ||
        key == LogicalKeyboardKey.arrowDown) {
      toggle();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  void _clear({required bool keyboard}) {
    if (!widget.enabled) return;
    widget.onClear();
    // The button goes away with the value; focus stays in the control.
    if (keyboard) _focus.requestFocus();
  }

  Widget _buildField(
    BuildContext context,
    FocusNode focus,
    bool open,
    VoidCallback toggle,
  ) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = widget.enabled;
    final text = widget.text;
    final error = widget.error;
    final invalid = error != null && error.isNotEmpty;
    void pointerToggle() {
      if (enabled) toggle();
    }

    final box = FieldBox(
      enabled: enabled,
      invalid: invalid,
      focused: _focusVisible,
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              button: true,
              value: text,
              onTap: enabled ? pointerToggle : null,
              child: ExcludeSemantics(
                child: Focus(
                  canRequestFocus: false,
                  skipTraversal: true,
                  onKeyEvent: (_, event) => _onKey(event, open, toggle),
                  child: FocusableActionDetector(
                    enabled: enabled,
                    focusNode: focus,
                    mouseCursor: enabled
                        ? SystemMouseCursors.click
                        : SystemMouseCursors.forbidden,
                    onShowFocusHighlight: (visible) =>
                        setState(() => _focusVisible = visible),
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      excludeFromSemantics: true,
                      onTap: enabled ? pointerToggle : null,
                      child: Row(
                        children: [
                          IconTheme.merge(
                            // Once a date is picked, the glyph takes the
                            // selection colour.
                            data: IconThemeData(
                              color: text != null && enabled
                                  ? colors.secondary
                                  : colors.textSecondary,
                            ),
                            child: const Glyph(GlyphShape.calendar),
                          ),
                          const SizedBox(width: _gap),
                          Expanded(
                            child: Text(
                              text ?? widget.placeholder,
                              style: theme.textStyle.copyWith(
                                color: !enabled
                                    ? colors.textDisabled
                                    : text == null
                                    ? colors.textSecondary
                                    : colors.text,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (widget.clearable)
            FieldButton(
              label: widget.clearLabel,
              visible: text != null && enabled,
              focusable: true,
              onPressed: _clear,
              child: const Glyph(GlyphShape.close),
            ),
        ],
      ),
    );

    return FieldSemantics(
      label: widget.label,
      description: widget.description,
      error: error,
      placeholder: text == null ? widget.placeholder : null,
      required: widget.required,
      enabled: enabled,
      expanded: open,
      child: box,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FieldFrame(
      label: widget.label,
      hideLabel: widget.hideLabel,
      required: widget.required,
      enabled: widget.enabled,
      description: widget.description,
      error: widget.error,
      onLabelTap: _focus.requestFocus,
      control: fieldPopover(
        label: widget.label,
        controller: widget.controller,
        triggerFocusNode: _focus,
        maxWidth: widget.popupWidth,
        initialFocus: widget.initialFocus,
        field: _buildField,
        builder: (context, _) => widget.calendar(context),
      ),
    );
  }
}
