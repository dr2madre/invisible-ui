import 'dart:math' as math;

import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../theme/theme.dart';
import 'calendar_date.dart';
import 'date_symbols.dart';

/// The months a [Calendar] shows.
enum CalendarView {
  /// One month.
  month,

  /// Two consecutive months, side by side when there is room, else stacked.
  twoMonth,
}

// Sizes the web calendar sets in its own stylesheet.
const double _gap = 12;
const double _navGap = 4;
const double _monthGap = 24;
const double _monthMinWidth = 240;
const double _dayMinHeight = 40;
const double _titleSize = 18;
const double _monthTitleSize = 15.2;
const double _weekdaySize = 12;
const double _dayNumberSize = 14.4;
const double _bandAlpha = 0.12;
const double _disabledOpacity = 0.35;

/// A month grid of days to pick a date or a range from, following the
/// WAI-ARIA date grid pattern.
///
/// One day is a tab stop: the focused day, the selected one at first, else
/// today. Arrow keys move a day or a week, and follow the reading
/// direction, so in right-to-left text the left arrow is the next day; Home
/// and End go to the edges of the week; Page Up and Page Down move a month,
/// with Shift a year; Enter and Space pick the focused day. Focus never
/// leaves [min] and [max]: a key that would cross a bound lands on it, and
/// the days outside are disabled. The grid follows the focused day into
/// another month. The header shows the month, a Today button and the
/// previous and next buttons, which move focus a month.
///
/// Each day is a button named by its full date in the locale ([locale], the
/// app's locale from [Localizations], or English), with "today" added to
/// today's name; a picked day is selected. Weekday and month names come
/// from [DateSymbols], or [symbols] when given.
///
/// [Calendar] picks one date: controlled, it shows [value] and reports a
/// new pick through [onChanged]; [Calendar.uncontrolled] keeps its own.
/// [Calendar.range] picks a start and an end: the first pick starts the
/// range, the next ends it, and a pick before the start becomes the start.
/// Every day of the range is selected, the ends say "range start" and
/// "range end" in their names, and the days between show a band closed by
/// lines, so the range never relies on colour alone. A changed [value] or
/// [range] is shown without a report. Dates are calendar days: the time of
/// day is ignored, and the widget reports local midnight.
class Calendar extends StatefulWidget {
  /// A calendar that shows [value], controlled by the parent.
  const Calendar({
    super.key,
    required this.value,
    this.onChanged,
    this.focusedDate,
    this.onFocusChanged,
    this.view = CalendarView.month,
    this.weekStartsOn = DateTime.monday,
    this.min,
    this.max,
    this.locale,
    this.symbols,
    this.label,
    this.showToday = true,
  }) : initialValue = null,
       range = null,
       initialRange = null,
       onRangeChanged = null,
       _controlled = true,
       _isRange = false;

  /// A calendar that keeps its own date, starting from [initialValue].
  const Calendar.uncontrolled({
    super.key,
    this.initialValue,
    this.onChanged,
    this.focusedDate,
    this.onFocusChanged,
    this.view = CalendarView.month,
    this.weekStartsOn = DateTime.monday,
    this.min,
    this.max,
    this.locale,
    this.symbols,
    this.label,
    this.showToday = true,
  }) : value = null,
       range = null,
       initialRange = null,
       onRangeChanged = null,
       _controlled = false,
       _isRange = false;

  /// A calendar that picks a range, shows [range] and reports each pick
  /// through [onRangeChanged], controlled by the parent.
  const Calendar.range({
    super.key,
    required this.range,
    this.onRangeChanged,
    this.focusedDate,
    this.onFocusChanged,
    this.view = CalendarView.month,
    this.weekStartsOn = DateTime.monday,
    this.min,
    this.max,
    this.locale,
    this.symbols,
    this.label,
    this.showToday = true,
  }) : value = null,
       initialValue = null,
       initialRange = null,
       onChanged = null,
       _controlled = true,
       _isRange = true;

  /// A calendar that picks a range and keeps its own, starting from
  /// [initialRange].
  const Calendar.rangeUncontrolled({
    super.key,
    this.initialRange,
    this.onRangeChanged,
    this.focusedDate,
    this.onFocusChanged,
    this.view = CalendarView.month,
    this.weekStartsOn = DateTime.monday,
    this.min,
    this.max,
    this.locale,
    this.symbols,
    this.label,
    this.showToday = true,
  }) : value = null,
       initialValue = null,
       range = null,
       onChanged = null,
       _controlled = false,
       _isRange = true;

  /// The picked date when the parent controls it; null when none is.
  final DateTime? value;

  /// The starting date of the uncontrolled calendar.
  final DateTime? initialValue;

  /// Called with the picked day, at local midnight, after a pick that
  /// changed it.
  final ValueChanged<DateTime>? onChanged;

  /// The picked range when the parent controls it; null when none is
  /// started.
  final DateRange? range;

  /// The starting range of the uncontrolled range calendar.
  final DateRange? initialRange;

  /// Called after each pick in a range calendar, with a null end while the
  /// range is half made.
  final ValueChanged<DateRange>? onRangeChanged;

  /// The day that has focus and decides the month shown. A changed one
  /// moves the calendar there without a report.
  final DateTime? focusedDate;

  /// Called with the newly focused day after the user moves focus.
  final ValueChanged<DateTime>? onFocusChanged;

  /// One month, or two.
  final CalendarView view;

  /// The first day of a week row, [DateTime.monday] to [DateTime.sunday].
  final int weekStartsOn;

  /// The earliest day that can be picked, inclusive.
  final DateTime? min;

  /// The latest day that can be picked, inclusive.
  final DateTime? max;

  /// The locale of the names; defaults to the app's locale.
  final Locale? locale;

  /// The names, overriding the locale's.
  final DateSymbols? symbols;

  /// The name of the day grid. Defaults to
  /// [InvisibleMessages.calendarLabel].
  final String? label;

  /// Whether the header shows the Today button.
  final bool showToday;

  final bool _controlled;
  final bool _isRange;

  @override
  State<Calendar> createState() => _CalendarState();
}

/// The focus node of the day that takes focus in [key]'s calendar, for a
/// picker that opens the calendar and moves focus into it. Package-internal.
FocusNode? calendarFocusedDay(GlobalKey key) =>
    (key.currentState as _CalendarState?)?._focusedNode;

class _CalendarState extends State<Calendar> {
  DateTime? _value;
  DateRange? _range;
  late DateTime _focused;
  final Map<DateTime, FocusNode> _nodes = {};

  DateTime? get _min => widget.min == null ? null : dateOnly(widget.min!);
  DateTime? get _max => widget.max == null ? null : dateOnly(widget.max!);
  int get _weekStart => widget.weekStartsOn % 7;

  FocusNode? get _focusedNode => _nodes[_focused];

  static DateTime? _day(DateTime? date) => date == null ? null : dateOnly(date);

  static DateRange? _days(DateRange? range) =>
      range == null ? null : DateRange(dateOnly(range.start), _day(range.end));

  @override
  void initState() {
    super.initState();
    _value = _day(widget._controlled ? widget.value : widget.initialValue);
    _range = _days(widget._controlled ? widget.range : widget.initialRange);
    _focused =
        _day(widget.focusedDate) ??
        _value ??
        _range?.start ??
        dateOnly(DateTime.now());
  }

  @override
  void didUpdateWidget(Calendar oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): only what the parent changed, never reported.
    if (widget._controlled) {
      if (!sameDay(widget.value, oldWidget.value)) _value = _day(widget.value);
      if (widget.range != oldWidget.range) _range = _days(widget.range);
    }
    if (widget.focusedDate != null &&
        !sameDay(widget.focusedDate, oldWidget.focusedDate)) {
      _focused = dateOnly(widget.focusedDate!);
    }
  }

  @override
  void dispose() {
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  FocusNode _nodeFor(DateTime date) =>
      _nodes[date] ??= FocusNode(debugLabel: 'Calendar ${isoDate(date)}');

  /// Moves focus to [date], kept inside the bounds; the grid follows it
  /// into another month, and keyboard focus lands on it once it is built.
  void _moveFocus(DateTime date) {
    final next = clampDate(date, _min, _max);
    if (next != _focused) {
      setState(() => _focused = next);
      widget.onFocusChanged?.call(localDay(next));
    }
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (mounted) _nodes[_focused]?.requestFocus();
    });
  }

  void _pick(DateTime date) {
    if (!inRange(date, _min, _max)) return;
    if (date != _focused) {
      setState(() => _focused = date);
      widget.onFocusChanged?.call(localDay(date));
    }
    _nodes[date]?.requestFocus();
    if (widget._isRange) {
      final next = extendRange(_range, date);
      setState(() => _range = next);
      final end = next.end;
      widget.onRangeChanged?.call(
        DateRange(localDay(next.start), end == null ? null : localDay(end)),
      );
      return;
    }
    if (date == _value) return;
    setState(() => _value = date);
    widget.onChanged?.call(localDay(date));
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter ||
        key == LogicalKeyboardKey.space) {
      _pick(_focused);
      return KeyEventResult.handled;
    }
    final target = gridKeyTarget(
      key,
      _focused,
      weekStart: _weekStart,
      shift: HardwareKeyboard.instance.isShiftPressed,
      rtl: Directionality.of(context) == TextDirection.rtl,
    );
    if (target == null) return KeyEventResult.ignored;
    _moveFocus(target);
    return KeyEventResult.handled;
  }

  /// The first day of each month shown.
  List<DateTime> get _months {
    final first = DateTime.utc(_focused.year, _focused.month);
    return widget.view == CalendarView.month
        ? [first]
        : [first, addMonths(first, 1)];
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
    final today = dateOnly(DateTime.now());
    final months = _months;
    final title = months.map(symbols.formatMonth).join(' – ');
    final shown = <DateTime>{};
    final grids = [
      for (final month in months)
        _MonthGrid(
          month: month,
          titled: months.length > 1,
          label: months.length > 1
              ? symbols.formatMonth(month)
              : widget.label ?? messages.calendarLabel,
          symbols: symbols,
          weekStart: _weekStart,
          builder: (date, outside) {
            shown.add(date);
            return _buildDay(context, symbols, date, outside, today);
          },
        ),
    ];
    // Nodes of days no longer shown go once the new grid is in place.
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _nodes.removeWhere((date, node) {
        if (shown.contains(date)) return false;
        node.dispose();
        return true;
      });
    });

    final header = Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: _gap,
      runSpacing: _gap,
      children: [
        Semantics(
          header: true,
          liveRegion: true,
          child: Text(
            title,
            style: theme.textStyle.copyWith(
              fontSize: _titleSize,
              fontWeight: FontWeight.w600,
              color: theme.colors.text,
            ),
          ),
        ),
        // The controls wrap too, so a large text scale never overflows.
        Wrap(
          spacing: _navGap,
          runSpacing: _navGap,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            if (widget.showToday)
              Button(
                onPressed: () => _moveFocus(dateOnly(DateTime.now())),
                child: Text(messages.calendarToday),
              ),
            Button.icon(
              onPressed: () => _moveFocus(addMonths(_focused, -1)),
              icon: const Glyph(GlyphShape.chevronStart),
              semanticLabel: messages.calendarPrevious,
            ),
            Button.icon(
              onPressed: () => _moveFocus(addMonths(_focused, 1)),
              icon: const Glyph(GlyphShape.chevronEnd),
              semanticLabel: messages.calendarNext,
            ),
          ],
        ),
      ],
    );

    final body = grids.length == 1
        ? grids.first
        : LayoutBuilder(
            builder: (context, constraints) =>
                constraints.maxWidth >= _monthMinWidth * 2 + _monthGap
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: grids[0]),
                      const SizedBox(width: _monthGap),
                      Expanded(child: grids[1]),
                    ],
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      grids[0],
                      const SizedBox(height: _monthGap),
                      grids[1],
                    ],
                  ),
          );

    return DefaultTextStyle.merge(
      style: theme.textStyle.copyWith(color: theme.colors.text),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          header,
          const SizedBox(height: _gap),
          Focus(
            canRequestFocus: false,
            skipTraversal: true,
            onKeyEvent: _onKey,
            child: body,
          ),
        ],
      ),
    );
  }

  Widget _buildDay(
    BuildContext context,
    DateSymbols symbols,
    DateTime date,
    bool outside,
    DateTime today,
  ) {
    final messages = InvisibleTheme.of(context).messages;
    final range = _range;
    final isStart = widget._isRange && range != null && date == range.start;
    final isEnd = widget._isRange && range?.end == date;
    final between = widget._isRange && isWithinRange(range, date);
    final selected = widget._isRange
        ? isStart || isEnd || between
        : date == _value;
    final name = [
      symbols.formatDay(date),
      if (isStart) messages.calendarRangeStart,
      if (isEnd) messages.calendarRangeEnd,
      if (date == today) messages.calendarCurrent,
    ].join(', ');
    return _Day(
      key: ValueKey(date),
      focusNode: _nodeFor(date),
      number: symbols.formatNumber(date.day),
      label: name,
      tabStop: date == _focused,
      enabled: inRange(date, _min, _max),
      selected: selected,
      filled: widget._isRange ? isStart || isEnd : selected,
      banded: between,
      today: date == today,
      outside: outside,
      onPressed: () => _pick(date),
    );
  }
}

/// A month: its title in a two-month calendar, the weekday row and six
/// weeks. In a two-month calendar each day shows once, in its own month,
/// and a week with none of the month's days is left out.
class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.titled,
    required this.label,
    required this.symbols,
    required this.weekStart,
    required this.builder,
  });

  final DateTime month;
  final bool titled;
  final String label;
  final DateSymbols symbols;
  final int weekStart;
  final Widget Function(DateTime date, bool outside) builder;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final weeks = monthMatrix(month.year, month.month, weekStart);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (titled) ...[
            ExcludeSemantics(
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: theme.textStyle.copyWith(
                  fontSize: _monthTitleSize,
                  fontWeight: FontWeight.w600,
                  color: colors.text,
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
          // Each day's name carries its weekday, so the column headers stay
          // out of the semantics tree.
          ExcludeSemantics(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  for (final weekday in weekdayOrder(weekStart))
                    Expanded(
                      child: Text(
                        symbols.shortWeekdays[weekday],
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.clip,
                        style: theme.textStyle.copyWith(
                          fontSize: _weekdaySize,
                          fontWeight: FontWeight.w600,
                          color: colors.textSecondary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          for (final week in weeks)
            if (!titled || week.any((day) => day.month == month.month))
              Row(
                children: [
                  for (final day in week)
                    Expanded(
                      child: titled && day.month != month.month
                          ? const SizedBox.shrink()
                          : builder(day, day.month != month.month),
                    ),
                ],
              ),
        ],
      ),
    );
  }
}

/// A day button: a tab stop only while it is the focused day.
class _Day extends StatefulWidget {
  const _Day({
    super.key,
    required this.focusNode,
    required this.number,
    required this.label,
    required this.tabStop,
    required this.enabled,
    required this.selected,
    required this.filled,
    required this.banded,
    required this.today,
    required this.outside,
    required this.onPressed,
  });

  final FocusNode focusNode;
  final String number;
  final String label;
  final bool tabStop;
  final bool enabled;
  final bool selected;
  final bool filled;
  final bool banded;
  final bool today;
  final bool outside;
  final VoidCallback onPressed;

  @override
  State<_Day> createState() => _DayState();
}

class _DayState extends State<_Day> {
  bool _focusVisible = false;
  bool _hovered = false;

  @override
  void initState() {
    super.initState();
    _applyTabStop();
  }

  @override
  void didUpdateWidget(_Day oldWidget) {
    super.didUpdateWidget(oldWidget);
    _applyTabStop();
  }

  // Only the focused day is a tab stop; the arrow keys reach the rest.
  void _applyTabStop() => widget.focusNode.skipTraversal = !widget.tabStop;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final radius = theme.controlRadius;
    final enabled = widget.enabled;
    final background = widget.filled
        ? colors.primary
        : widget.banded
        ? colors.selected.withValues(alpha: _bandAlpha)
        : _hovered && enabled
        ? colors.neutralSurface
        : null;
    final textColor = widget.filled
        ? colors.onPrimary
        : widget.today
        ? colors.primary
        : widget.outside
        ? colors.textSecondary
        : colors.text;
    final target = theme.minTargetSize;

    Widget day = ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: target.width,
        minHeight: math.max(target.height, _dayMinHeight),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: background,
          // The band's tint alone is too faint to read as a boundary, so
          // lines in the selection colour close it above and below.
          border: widget.banded
              ? Border.symmetric(horizontal: BorderSide(color: colors.selected))
              : null,
          borderRadius: widget.banded ? null : BorderRadius.circular(radius),
        ),
        child: Center(
          child: Text(
            widget.number,
            textAlign: TextAlign.center,
            style: theme.textStyle.copyWith(
              fontSize: _dayNumberSize,
              fontWeight: widget.today || widget.filled
                  ? FontWeight.w700
                  : FontWeight.w400,
              color: textColor,
            ),
          ),
        ),
      ),
    );
    if (!enabled) day = Opacity(opacity: _disabledOpacity, child: day);

    return Semantics(
      container: true,
      button: true,
      label: widget.label,
      selected: widget.selected,
      enabled: enabled,
      focusable: enabled,
      onTap: enabled ? widget.onPressed : null,
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          focusNode: widget.focusNode,
          enabled: enabled,
          onShowFocusHighlight: (visible) =>
              setState(() => _focusVisible = visible),
          onShowHoverHighlight: (hovered) => setState(() => _hovered = hovered),
          mouseCursor: enabled
              ? SystemMouseCursors.click
              : SystemMouseCursors.forbidden,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: enabled ? widget.onPressed : null,
            child: FocusRingPainter(
              visible: _focusVisible,
              ring: theme.focusRing,
              radius: radius,
              child: day,
            ),
          ),
        ),
      ),
    );
  }
}
