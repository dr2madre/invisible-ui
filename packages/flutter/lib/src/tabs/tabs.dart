import 'dart:async';
// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../internal/collection.dart';
import '../internal/focus_ring.dart';
import '../internal/pressable.dart';
import '../internal/roving.dart';
import '../internal/single_choice.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'tab_keys.dart';

// Sizes the web Tabs sets in its own stylesheet.
const double _listGap = 4;
const double _tabGap = 6.4;
const EdgeInsetsDirectional _tabPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12.8,
  vertical: 6.4,
);
const double _iconOnlyPaddingX = 8.8;
const double _indicatorWidth = 2;
const double _iconEm = 1.1;
const double _countSize = 12;
const double _countMinWidth = 20;
const double _countPaddingX = 5.6;
const double _panelPaddingY = 12;
const double _disabledOpacity = 0.5;
const Duration _fade = Duration(milliseconds: 120);

/// When a tab is selected during arrow-key movement.
enum TabActivationMode {
  /// The arrows move focus and select the tab they land on.
  automatic,

  /// The arrows move focus only; Enter or Space selects the focused tab.
  manual,
}

/// One tab of [Tabs]: its [label], its panel [child], and optionally an
/// [icon] and a [count] badge.
class TabItem<T> extends ChoiceItem<T> {
  /// Creates a tab.
  const TabItem({
    required super.value,
    required super.label,
    required this.child,
    super.icon,
    super.disabled,
    this.count,
    this.iconOnly = false,
  });

  /// The panel shown while the tab is selected.
  final Widget child;

  /// A number shown as a badge after the label, and read as part of the
  /// tab's name.
  final int? count;

  /// Shows only the [icon]; the label still names the tab.
  final bool iconOnly;
}

/// Tabs, following the WAI-ARIA tabs pattern: a list of tabs named [label],
/// each showing its panel while selected.
///
/// The list is one tab stop, on the selected tab or, when it is disabled,
/// the first enabled one; Tab moves on to the panel. The arrows along
/// [orientation] move focus between the enabled tabs, wrapping, and Home
/// and End jump to the ends; in a horizontal list right and left follow
/// the reading direction. Under [TabActivationMode.automatic] a move also
/// selects; under [TabActivationMode.manual] Enter or Space does. A tap
/// selects. The selected tab is bold and underlined, so the selection never
/// relies on colour alone.
///
/// A horizontal list wider than its parent scrolls sideways, and a focused
/// tab scrolls into view. A vertical list sits at the inline-start of the
/// panels. Hidden panels keep their state and leave the focus order.
///
/// Controlled, [Tabs] shows [value] and reports each selection through
/// [onChanged]; [Tabs.uncontrolled] keeps its own. With no value, or one
/// that names no tab, the first enabled tab is selected. A changed [value]
/// is shown without a report.
class Tabs<T> extends StatefulWidget {
  /// Tabs that show [value], controlled by the parent.
  const Tabs({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    this.onChanged,
    this.activationMode = TabActivationMode.automatic,
    this.orientation = Axis.horizontal,
  }) : initialValue = null,
       _controlled = true;

  /// Tabs that keep their own selection, starting from [initialValue].
  const Tabs.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValue,
    this.onChanged,
    this.activationMode = TabActivationMode.automatic,
    this.orientation = Axis.horizontal,
  }) : value = null,
       _controlled = false;

  /// The accessible name of the tab list.
  final String label;

  /// The tabs, in order.
  final List<TabItem<T>> items;

  /// The selected tab when the parent controls it.
  final T? value;

  /// The tab the uncontrolled tabs start on.
  final T? initialValue;

  /// Called with the selected tab after a user selection. Never called for
  /// a changed [value].
  final ValueChanged<T>? onChanged;

  /// Whether the arrows select as they move.
  final TabActivationMode activationMode;

  /// A row of tabs above the panels, or a column beside them.
  final Axis orientation;

  final bool _controlled;

  @override
  State<Tabs<T>> createState() => _TabsState<T>();
}

class _TabsState<T> extends State<Tabs<T>> with ValueControl<T?, Tabs<T>> {
  final SingleChoiceFocus<T> _focus = SingleChoiceFocus<T>();

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(Tabs<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  /// The tab whose panel shows: the value when it names a tab, else the
  /// first enabled one.
  T? get _selected => widget.items.any((item) => item.value == value)
      ? value
      : firstEnabled(widget.items);

  void _select(T next) {
    if (next == _selected) return;
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  ({T? focus, T? select})? _key(RovingKeyIntent intent) {
    final from = _focus.focused;
    if (from == null) return null;
    final result = tabKey(
      widget.items,
      from,
      intent.key,
      orientation: widget.orientation,
      direction: Directionality.of(context),
      manual: widget.activationMode == TabActivationMode.manual,
    );
    return result.focus == null ? null : result;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final items = widget.items;
    final selected = _selected;
    final horizontal = widget.orientation == Axis.horizontal;
    _focus.sync(items, selected, enabled: true);

    final tabs = [
      for (final item in items)
        _Tab<T>(
          key: ValueKey(item.value),
          item: item,
          selected: item.value == selected,
          horizontal: horizontal,
          focusNode: _focus.nodeFor(item.value),
          onSelect: () => _select(item.value),
        ),
    ];

    final rule = BorderSide(color: colors.border);
    final Widget list = Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.tabBar,
      label: widget.label,
      child: DecoratedBox(
        // The rule sits under the tabs, so the selected tab's underline
        // covers it, as the web's inset shadow is.
        decoration: BoxDecoration(
          border: horizontal
              ? Border(bottom: rule)
              : BorderDirectional(end: rule),
        ),
        child: Flex(
          direction: widget.orientation,
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: _listGap,
          children: tabs,
        ),
      ),
    );

    final keyed = Shortcuts(
      shortcuts: rovingShortcuts,
      child: Actions(
        actions: {
          RovingKeyIntent: RovingKeyAction(
            handles: (intent) => _key(intent) != null,
            onKey: (intent) {
              final result = _key(intent)!;
              _focus.nodeFor(result.focus as T).requestFocus();
              if (result.select case final next?) _select(next);
            },
          ),
        },
        child: horizontal
            ? Align(
                alignment: AlignmentDirectional.centerStart,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: IntrinsicHeight(child: list),
                ),
              )
            : IntrinsicWidth(child: list),
      ),
    );

    final panels = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final item in items)
          _Panel(
            key: ValueKey(item.value),
            label: item.label,
            visible: item.value == selected,
            child: item.child,
          ),
      ],
    );

    return horizontal
        ? Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [keyed, panels],
          )
        : Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: _tabPadding.end,
            children: [
              keyed,
              Flexible(child: panels),
            ],
          );
  }
}

class _Tab<T> extends StatelessWidget {
  const _Tab({
    super.key,
    required this.item,
    required this.selected,
    required this.horizontal,
    required this.focusNode,
    required this.onSelect,
  });

  final TabItem<T> item;
  final bool selected;
  final bool horizontal;
  final FocusNode focusNode;
  final VoidCallback onSelect;

  void _focusChanged(BuildContext context, bool focused) {
    // A tab the list has scrolled away comes into view.
    if (!focused) return;
    for (final policy in [
      ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
      ScrollPositionAlignmentPolicy.keepVisibleAtStart,
    ]) {
      unawaited(Scrollable.ensureVisible(context, alignmentPolicy: policy));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = !item.disabled;
    final still = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final count = item.count;
    final iconOnly = item.iconOnly && item.icon != null;
    final name = count == null ? item.label : '${item.label} ($count)';
    final indicator = BorderSide(
      color: selected ? colors.selected : const Color(0x00000000),
      width: _indicatorWidth,
    );

    return Semantics(
      container: true,
      role: SemanticsRole.tab,
      label: name,
      selected: selected,
      enabled: enabled,
      onTap: enabled ? onSelect : null,
      child: Pressable(
        onPressed: enabled ? onSelect : null,
        focusNode: focusNode,
        onFocusChange: (focused) => _focusChanged(context, focused),
        alignment: horizontal
            ? Alignment.center
            : AlignmentDirectional.centerStart,
        builder: (context, states) => Opacity(
          opacity: enabled ? 1 : _disabledOpacity,
          // The list scrolls and clips, so the ring goes inside.
          child: FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: 0,
            inside: true,
            child: AnimatedContainer(
              duration: still ? Duration.zero : _fade,
              decoration: BoxDecoration(
                border: horizontal
                    ? Border(bottom: indicator)
                    : BorderDirectional(end: indicator),
              ),
              padding: iconOnly
                  ? _tabPadding.copyWith(
                      start: _iconOnlyPaddingX,
                      end: _iconOnlyPaddingX,
                    )
                  : _tabPadding,
              // The node's label carries the name and the count.
              child: ExcludeSemantics(
                child: IconTheme(
                  data: IconThemeData(
                    color: colors.text,
                    size: theme.textStyle.fontSize! * _iconEm,
                    applyTextScaling: true,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: _tabGap,
                    children: [
                      ?item.icon,
                      if (!iconOnly)
                        Flexible(
                          child: Text(
                            item.label,
                            style: theme.textStyle.copyWith(
                              color: colors.text,
                              fontWeight: selected
                                  ? FontWeight.w700
                                  : FontWeight.w400,
                            ),
                          ),
                        ),
                      if (count != null)
                        _Count(count: count, selected: selected),
                    ],
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

class _Count extends StatelessWidget {
  const _Count({required this.count, required this.selected});

  final int count;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    return Container(
      constraints: const BoxConstraints(minWidth: _countMinWidth),
      padding: const EdgeInsets.symmetric(horizontal: _countPaddingX),
      decoration: BoxDecoration(
        color: selected ? colors.selected : colors.neutralSurface,
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.pill),
      ),
      child: Text(
        '$count',
        textAlign: TextAlign.center,
        style: theme.textStyle.copyWith(
          fontSize: _countSize,
          fontWeight: FontWeight.w600,
          height: InvisibleTypographyTokens.lineHeight,
          color: selected ? colors.onSelected : colors.textSecondary,
        ),
      ),
    );
  }
}

/// A tab's panel: a tab stop of its own, as the web panel's `tabindex="0"`
/// is, so the keyboard reaches content that holds nothing focusable.
class _Panel extends StatefulWidget {
  const _Panel({
    super.key,
    required this.label,
    required this.visible,
    required this.child,
  });

  final String label;
  final bool visible;
  final Widget child;

  @override
  State<_Panel> createState() => _PanelState();
}

class _PanelState extends State<_Panel> {
  bool _focusVisible = false;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return Visibility(
      visible: widget.visible,
      maintainState: true,
      child: ExcludeFocus(
        excluding: !widget.visible,
        child: Semantics(
          container: true,
          explicitChildNodes: true,
          role: SemanticsRole.tabPanel,
          label: widget.label,
          child: FocusableActionDetector(
            onShowFocusHighlight: (value) =>
                setState(() => _focusVisible = value),
            child: FocusRingPainter(
              visible: _focusVisible,
              ring: theme.focusRing,
              radius: theme.controlRadius,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: _panelPaddingY),
                child: DefaultTextStyle(
                  style: theme.textStyle.copyWith(
                    color: theme.colors.textSecondary,
                  ),
                  child: widget.child,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
