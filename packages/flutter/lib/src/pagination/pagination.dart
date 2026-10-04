import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../i18n/messages.dart';
import '../internal/collection.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../internal/roving.dart';
import '../internal/single_choice.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import 'page_items.dart';

// Sizes the web Pagination sets in its own stylesheet.
const double _gap = 4;
const double _side = 32;
const double _paddingX = 8;
const double _ellipsisWidth = 24;
const double _disabledOpacity = 0.5;

const String _previous = 'previous';
const String _next = 'next';

/// A pager: previous, the page numbers around the current page with gaps,
/// and next, in a navigation named [label].
///
/// The controls are one tab stop, on the current page. The arrows move
/// focus between the enabled controls, wrapping, right and left following
/// the reading direction; Home and End jump to the ends. A tap, Enter or
/// Space goes to a page. Previous and next are disabled at the first and
/// the last page; when one is pressed with the keyboard and so disables
/// itself, focus moves to the page that is now current. The current page is
/// filled and bold, and read as the current page.
///
/// A long list wraps onto more rows instead of overflowing.
///
/// Controlled, [Pagination] shows [page] and reports each move through
/// [onPageChanged]; [Pagination.uncontrolled] keeps its own page, starting
/// from [initialPage]. A changed [page] is shown, clamped to [pageCount],
/// without a report.
class Pagination extends StatefulWidget {
  /// A pager that shows [page], controlled by the parent.
  const Pagination({
    super.key,
    required int this.page,
    required this.pageCount,
    this.onPageChanged,
    this.siblingCount = 1,
    this.boundaryCount = 1,
    this.enabled = true,
    this.label,
  }) : initialPage = 1,
       _controlled = true;

  /// A pager that keeps its own page, starting from [initialPage].
  const Pagination.uncontrolled({
    super.key,
    required this.pageCount,
    this.initialPage = 1,
    this.onPageChanged,
    this.siblingCount = 1,
    this.boundaryCount = 1,
    this.enabled = true,
    this.label,
  }) : page = null,
       _controlled = false;

  /// The current page, from 1, when the parent controls it.
  final int? page;

  /// The page the uncontrolled pager starts on.
  final int initialPage;

  /// The number of pages.
  final int pageCount;

  /// Called with the new page after the user moves. Never called for a
  /// changed [page].
  final ValueChanged<int>? onPageChanged;

  /// The pages shown on each side of the current page.
  final int siblingCount;

  /// The pages always shown at each end.
  final int boundaryCount;

  /// Whether the controls take focus and move.
  final bool enabled;

  /// The accessible name of the navigation. Defaults to
  /// [InvisibleMessages.paginationLabel].
  final String? label;

  final bool _controlled;

  @override
  State<Pagination> createState() => _PaginationState();
}

class _PaginationState extends State<Pagination>
    with ValueControl<int, Pagination> {
  final SingleChoiceFocus<String> _focus = SingleChoiceFocus<String>();

  @override
  bool get isControlled => widget._controlled;

  @override
  int controlledValueOf(Pagination widget) => widget.page!;

  @override
  int get initialValueOfWidget => widget.initialPage;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  int get _page => clampPage(value, widget.pageCount);

  void _go(int target, String control) {
    final next = clampPage(target, widget.pageCount);
    if (next == _page) return;
    final hadFocus = _focus.focused == control;
    if (!commitValue(next)) return;
    // A control the press disabled cannot keep focus: the page that is now
    // current takes it.
    final atEnd =
        (control == _previous && next <= 1) ||
        (control == _next && next >= widget.pageCount);
    if (hadFocus && atEnd) _focus.nodeFor('$next').requestFocus();
    widget.onPageChanged?.call(next);
  }

  String? _target(List<ChoiceItem<String>> controls, RovingKeyIntent intent) {
    if (_focus.focused == null) return null;
    return switch (intent.key) {
      LogicalKeyboardKey.home => firstEnabled(controls),
      LogicalKeyboardKey.end => lastEnabled(controls),
      _ => _focus.target(controls, intent.key, Directionality.of(context)),
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final page = _page;
    final pageCount = widget.pageCount;
    final enabled = widget.enabled;
    final items = pageItems(
      page: page,
      pageCount: math.max(pageCount, 1),
      siblingCount: widget.siblingCount,
      boundaryCount: widget.boundaryCount,
    );

    // The focusable controls, in order, for the roving tab stop.
    final controls = [
      ChoiceItem(value: _previous, label: '', disabled: !enabled || page <= 1),
      for (final number in items.nonNulls)
        ChoiceItem(value: '$number', label: '', disabled: !enabled),
      ChoiceItem(
        value: _next,
        label: '',
        disabled: !enabled || page >= pageCount,
      ),
    ];
    _focus.sync(controls, '$page', enabled: enabled);

    Widget control(String value, {required String label, int? number}) {
      final disabled = controls.firstWhere((c) => c.value == value).disabled;
      return _PageButton(
        key: ValueKey(value),
        label: label,
        current: number == page,
        step: number == null,
        focusNode: _focus.nodeFor(value),
        onPressed: disabled
            ? null
            : () => _go(switch (value) {
                _previous => page - 1,
                _next => page + 1,
                _ => number!,
              }, value),
        child: number == null
            ? Glyph(
                value == _previous
                    ? GlyphShape.chevronStart
                    : GlyphShape.chevronEnd,
              )
            : Text('$number'),
      );
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label ?? messages.paginationLabel,
      child: Shortcuts(
        shortcuts: rovingShortcuts,
        child: Actions(
          actions: {
            RovingKeyIntent: RovingKeyAction(
              handles: (intent) => _target(controls, intent) != null,
              onKey: (intent) =>
                  _focus.nodeFor(_target(controls, intent)!).requestFocus(),
            ),
          },
          child: Wrap(
            spacing: _gap,
            runSpacing: _gap,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              control(_previous, label: messages.paginationPrevious),
              for (final (index, number) in items.indexed)
                if (number == null)
                  _Gap(key: ValueKey('gap $index'))
                else
                  control(
                    '$number',
                    number: number,
                    label: InvisibleMessages.fill(messages.paginationPage, {
                      'page': '$number',
                    }),
                  ),
              control(_next, label: messages.paginationNext),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageButton extends StatelessWidget {
  const _PageButton({
    super.key,
    required this.label,
    required this.current,
    required this.focusNode,
    required this.onPressed,
    required this.child,
    this.step = false,
  });

  final String label;
  final bool current;
  final bool step;
  final FocusNode focusNode;
  final VoidCallback? onPressed;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = onPressed != null;
    final textScaler = MediaQuery.textScalerOf(context);
    final side = textScaler.scale(_side);
    final foreground = current ? colors.onEmphasis : colors.text;
    return Semantics(
      container: true,
      button: true,
      enabled: enabled,
      label: label,
      value: current ? theme.messages.paginationCurrent : null,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        focusNode: focusNode,
        // Only previous and next dim when disabled, as on the web.
        builder: (context, states) => Opacity(
          opacity: enabled || !step ? 1 : _disabledOpacity,
          child: FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: theme.controlRadius,
            child: Container(
              constraints: BoxConstraints(minWidth: side, minHeight: side),
              padding: const EdgeInsets.symmetric(horizontal: _paddingX),
              decoration: BoxDecoration(
                color: current ? colors.secondary : colors.background,
                border: Border.all(
                  color: current ? colors.secondary : colors.controlBorder,
                ),
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: Center(
                widthFactor: 1,
                heightFactor: 1,
                child: ExcludeSemantics(
                  child: IconTheme(
                    data: IconThemeData(
                      color: foreground,
                      size: theme.textStyle.fontSize,
                      applyTextScaling: true,
                    ),
                    child: DefaultTextStyle(
                      style: theme.textStyle.copyWith(
                        color: foreground,
                        fontWeight: current ? FontWeight.w600 : FontWeight.w400,
                        height: 1,
                      ),
                      child: child,
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

class _Gap extends StatelessWidget {
  const _Gap({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return ExcludeSemantics(
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: _ellipsisWidth),
        child: Text(
          '…',
          textAlign: TextAlign.center,
          style: theme.textStyle.copyWith(color: theme.colors.textSecondary),
        ),
      ),
    );
  }
}
