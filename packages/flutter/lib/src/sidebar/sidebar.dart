import 'dart:math' as math;
// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../internal/disclosure.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import '../tooltip/tooltip.dart';
import 'sidebar_item.dart';

// Sizes the web Sidebar sets in its own stylesheet.
const double _width = 240;
const double _railWidth = 56;
const double _padding = 12;
const double _gap = 12;
const double _itemGap = 2;
const double _iconGap = 10;
const double _iconEm = 1.1;
const EdgeInsetsDirectional _itemPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 10,
  vertical: 8,
);
const EdgeInsetsDirectional _railItemPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 6,
  vertical: 8,
);
const EdgeInsets _togglePadding = EdgeInsets.all(6);
const EdgeInsets _logoPadding = EdgeInsets.symmetric(
  horizontal: 8,
  vertical: 4,
);
const EdgeInsetsDirectional _headingPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 8,
  vertical: 4,
);
const EdgeInsetsDirectional _plainHeadingPadding =
    EdgeInsetsDirectional.symmetric(horizontal: 8);
const EdgeInsetsDirectional _railHeadingPadding =
    EdgeInsetsDirectional.symmetric(vertical: 4);
const double _headingGap = 4;
const double _headingSize = 11;
const double _headingTracking = 0.05 * _headingSize;
const double _footerSpace = 8;
const double _activeTint = 0.1;

/// The application's side navigation: an optional [logo], sections of
/// destinations and a [footer], in a navigation named [label].
///
/// Every destination reports its value through [onSelected]; the app
/// navigates. One with a `uri` is announced as a link with that address and
/// pressed by a tap or Enter; one without is a button that a tap, Enter or
/// Space presses. The current destination, [value], is tinted, bold and
/// read as the current page. Tab moves through the destinations in order.
///
/// A collapsible section's heading shows and hides its destinations. Left
/// to itself ([expandedSections] null), the sidebar keeps the set: it
/// starts from the sections marked `initiallyExpanded` and the one holding
/// the current destination, and opens the section holding the current
/// destination whenever that changes, without a report. Given
/// [expandedSections], the app owns the set: a press only reports the set
/// it asks for through [onExpandedSectionsChanged], and nothing else moves
/// it. Handing back null continues from the set on screen.
///
/// [collapsed] shows the rail: icons only, each named by its label and with
/// a tooltip. The rail toggle shows when [onCollapsedChanged] is given and
/// every destination has an icon, and reports the state it asks for. The
/// app owns [collapsed]. Without an icon on every destination there is no
/// rail: debug builds fail an assertion, release builds keep the labels.
///
/// The sidebar is 240 wide, 56 as a rail, and never wider than its parent.
/// Given a bounded height, it fills it: the sections scroll between the
/// logo and the footer, and the footer sits at the bottom. The app decides
/// where and when to show it; the sidebar reads no screen size.
class Sidebar<T> extends StatefulWidget {
  /// Creates the navigation from [sections].
  const Sidebar({
    super.key,
    required this.sections,
    this.value,
    this.label,
    this.onSelected,
    this.collapsed = false,
    this.onCollapsedChanged,
    this.expandedSections,
    this.onExpandedSectionsChanged,
    this.logo,
    this.footer,
  });

  /// The sections, in order.
  final List<SidebarSection<T>> sections;

  /// The current destination's value. The app owns it.
  final T? value;

  /// The accessible name of the navigation. Defaults to
  /// [InvisibleMessages.sidebarLabel].
  final String? label;

  /// Called with a destination's value when the user presses it.
  final ValueChanged<T>? onSelected;

  /// Whether the sidebar shows as a rail of icons.
  final bool collapsed;

  /// Called with the requested state when the user presses the rail toggle,
  /// or a section heading in the rail. Given, the rail toggle shows.
  final ValueChanged<bool>? onCollapsedChanged;

  /// The ids of the expanded collapsible sections, when the app owns them.
  final Set<String>? expandedSections;

  /// Called with the requested set of expanded section ids when the user
  /// presses a section heading.
  final ValueChanged<Set<String>>? onExpandedSectionsChanged;

  /// The logo at the top.
  final Widget? logo;

  /// The footer at the bottom.
  final Widget? footer;

  @override
  State<Sidebar<T>> createState() => _SidebarState<T>();
}

class _SidebarState<T> extends State<Sidebar<T>> {
  late List<String> _ids;
  List<String> _mistakes = const [];

  /// The set the sidebar keeps. While the app owns the set, this copy
  /// follows it, so handing it back continues from the set on screen.
  late Set<String> _own;

  /// The collapsible section that held the current destination last time.
  String? _lastHolder;

  @override
  void initState() {
    super.initState();
    _resolve();
    _own = {
      ...(widget.expandedSections ??
          {
            for (final (index, section) in widget.sections.indexed)
              if (section.collapsible &&
                  (section.initiallyExpanded || _holdsCurrent(section)))
                _ids[index],
          }),
    };
    _lastHolder = _holder();
  }

  void _resolve() {
    final resolved = resolveSectionIds(widget.sections);
    _ids = resolved.ids;
    _mistakes = resolved.mistakes;
  }

  Set<String> get _expanded => widget.expandedSections ?? _own;

  bool get _rail => widget.collapsed && canRail(widget.sections);

  bool _holdsCurrent(SidebarSection<T> section) {
    final value = widget.value;
    return value != null && section.items.any((item) => item.value == value);
  }

  /// The collapsible section holding the current destination.
  String? _holder() {
    for (final (index, section) in widget.sections.indexed) {
      if (section.collapsible && _holdsCurrent(section)) return _ids[index];
    }
    return null;
  }

  @override
  void didUpdateWidget(Sidebar<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _resolve();
    // The holder moves when the current destination moves and when the
    // sections change. Left to itself, the sidebar opens it silently; while
    // the app owns the set, nothing moves (ADR 0013).
    final holder = _holder();
    if (holder != _lastHolder) {
      _lastHolder = holder;
      if (widget.expandedSections == null && holder != null) {
        _own = {..._own, holder};
      }
    }
    final controlled = widget.expandedSections;
    if (controlled != null) _own = {...controlled};
  }

  void _pressSection(String id) {
    final opens = !_expanded.contains(id);
    final next = opens ? {..._expanded, id} : ({..._expanded}..remove(id));
    // A press in the rail opens the bar first: the section's destinations
    // would otherwise expand in a column too narrow to read them.
    final rail = _rail;
    final reportsSet = !rail || opens;
    // Owned by the app, the set waits for its answer (ADR 0013).
    if (reportsSet && widget.expandedSections == null) {
      setState(() => _own = next);
    }
    if (rail) widget.onCollapsedChanged?.call(false);
    if (reportsSet) {
      widget.onExpandedSectionsChanged?.call(Set.unmodifiable(next));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final railable = canRail(widget.sections);
    assert(_mistakes.isEmpty, _mistakes.join(' '));
    assert(
      !widget.collapsed || railable,
      'A collapsed sidebar needs an icon on every destination: without one a '
      'destination shows nothing once the labels are out of sight.',
    );
    final rail = widget.collapsed && railable;
    final expanded = _expanded;

    Widget items(SidebarSection<T> section, {String? name}) => Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: name,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: _itemGap,
        children: [
          for (final item in section.items)
            Semantics(
              key: ValueKey<T>(item.value),
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.listItem,
              child: _ItemButton(
                item: item,
                current: item.value == widget.value,
                rail: rail,
                onPressed: () => widget.onSelected?.call(item.value),
              ),
            ),
        ],
      ),
    );

    final headingStyle = TextStyle(
      color: colors.textSecondary,
      fontSize: _headingSize,
      fontWeight: FontWeight.w700,
      letterSpacing: _headingTracking,
    );

    Widget heading(String label) =>
        Text(label.toUpperCase(), semanticsLabel: label, style: headingStyle);

    Widget section(int index, SidebarSection<T> section) {
      final id = _ids[index];
      if (section.collapsible) {
        final label = section.label!;
        final open = expanded.contains(id);
        final rtl = Directionality.of(context) == TextDirection.rtl;
        return Column(
          key: ValueKey(id),
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: _headingGap,
          children: [
            DisclosureTrigger(
              expanded: open,
              onToggle: () => _pressSection(id),
              // In the rail the name leaves the screen and stays in the
              // semantics tree.
              label: rail
                  ? Semantics(label: label, child: const SizedBox.shrink())
                  : heading(label),
              chevron: GlyphShape.chevronEnd,
              // A quarter turn toward the content, mirrored right to left.
              openTurns: rtl ? -0.25 : 0.25,
              // The rail has room for the chevron alone.
              padding: rail ? _railHeadingPadding : _headingPadding,
              radius: theme.controlRadius,
              ringInside: true,
            ),
            DisclosurePanel(visible: open, child: items(section)),
          ],
        );
      }
      // The heading names the list, so the rail can hide it from sight
      // without hiding it from assistive technology.
      final label = section.label;
      return Column(
        key: ValueKey(id),
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: _headingGap,
        children: [
          if (label != null && !rail)
            ExcludeSemantics(
              child: Padding(
                padding: _plainHeadingPadding,
                child: heading(label),
              ),
            ),
          items(section, name: label),
        ],
      );
    }

    final sections = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: _gap,
      children: [
        for (final (index, entry) in widget.sections.indexed)
          section(index, entry),
      ],
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final bounded = constraints.hasBoundedHeight;
        return Semantics(
          container: true,
          explicitChildNodes: true,
          label: widget.label ?? theme.messages.sidebarLabel,
          child: SizedBox(
            // The web sets both widths in rem, which grow with the text size.
            width: math.min(
              MediaQuery.textScalerOf(
                context,
              ).scale(rail ? _railWidth : _width),
              constraints.maxWidth,
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: colors.background,
                border: Border.all(color: colors.border),
                borderRadius: BorderRadius.circular(
                  InvisibleRadiusTokens.surface,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(_padding),
                child: DefaultTextStyle(
                  style: theme.textStyle.copyWith(color: colors.text),
                  child: Column(
                    mainAxisSize: bounded ? MainAxisSize.max : MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: _gap,
                    children: [
                      if (widget.logo case final logo?)
                        Padding(padding: _logoPadding, child: logo),
                      if (widget.onCollapsedChanged != null && railable)
                        _RailToggle(
                          collapsed: widget.collapsed,
                          onPressed: () => widget.onCollapsedChanged?.call(
                            !widget.collapsed,
                          ),
                        ),
                      if (bounded)
                        Expanded(child: SingleChildScrollView(child: sections))
                      else
                        sections,
                      if (widget.footer case final footer?)
                        DecoratedBox(
                          decoration: BoxDecoration(
                            border: Border(
                              top: BorderSide(color: colors.border),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.only(top: _footerSpace),
                            child: footer,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// One destination: a link with a `uri`, a button without.
class _ItemButton<T> extends StatelessWidget {
  const _ItemButton({
    required this.item,
    required this.current,
    required this.rail,
    required this.onPressed,
  });

  final SidebarItem<T> item;
  final bool current;
  final bool rail;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final link = item.uri != null;
    final color = current ? colors.secondaryBodyText : colors.text;
    final icon = item.icon;
    final iconTheme = IconThemeData(
      color: color,
      size: theme.textStyle.fontSize! * _iconEm,
      applyTextScaling: true,
    );
    final Widget button = Semantics(
      container: true,
      button: !link,
      link: link,
      linkUrl: item.uri,
      label: item.label,
      value: current ? theme.messages.sidebarCurrent : null,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        keys: link ? PressKeys.link : PressKeys.button,
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          // Inside the item: the scrolling sections clip at their edges.
          inside: true,
          child: Container(
            width: double.infinity,
            padding: rail ? _railItemPadding : _itemPadding,
            decoration: BoxDecoration(
              color: current
                  ? colors.secondary.withValues(alpha: _activeTint)
                  : states.hovered
                  ? colors.stateHover
                  : null,
              borderRadius: BorderRadius.circular(theme.controlRadius),
            ),
            child: ExcludeSemantics(
              child: IconTheme(
                data: iconTheme,
                child: rail
                    ? Center(heightFactor: 1, child: icon)
                    : Row(
                        spacing: _iconGap,
                        children: [
                          ?icon,
                          // Long labels wrap rather than being cut.
                          Expanded(
                            child: Text(
                              item.label,
                              style: TextStyle(
                                color: color,
                                fontWeight: current ? FontWeight.w600 : null,
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
    );
    if (!rail) return button;
    return Tooltip(
      message: item.label,
      placement: TooltipPlacement.end,
      child: button,
    );
  }
}

/// The button that collapses the sidebar to the rail and expands it back.
class _RailToggle extends StatelessWidget {
  const _RailToggle({required this.collapsed, required this.onPressed});

  final bool collapsed;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    return Semantics(
      container: true,
      button: true,
      toggled: collapsed,
      label: collapsed ? messages.sidebarExpand : messages.sidebarCollapse,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: Container(
            width: double.infinity,
            alignment: Alignment.center,
            padding: _togglePadding,
            decoration: BoxDecoration(
              color: states.hovered ? colors.stateHover : null,
              borderRadius: BorderRadius.circular(theme.controlRadius),
            ),
            child: IconTheme(
              data: IconThemeData(
                color: colors.textSecondary,
                size: theme.textStyle.fontSize,
                applyTextScaling: true,
              ),
              // It points the way the sidebar will go.
              child: Glyph(
                collapsed ? GlyphShape.chevronEnd : GlyphShape.chevronStart,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
