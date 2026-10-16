import 'dart:math' as math;
// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/widgets.dart';

import '../dialog/dialog_route.dart';
import '../dialog/sheet_dialog.dart';
import '../i18n/messages.dart';
import '../internal/disclosure.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../navigation_bar/badge_announcer.dart';
import '../navigation_bar/navigation_bar_logic.dart';
import '../notification/modal_observer.dart';
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
// The rail's current mark: a bar at the inline start, never colour alone.
const double _railMarkWidth = 3;
const double _railMarkInset = 8;
const double _reasonSize = 13;
const double _lockEm = 0.875;
const double _badgeMin = 16;
const double _badgeSize = 11;
const double _badgePaddingX = 4;
const double _dot = 8;
// In the rail the badge and the lock start this far past the item's centre.
const double _railCornerOffset = 4;

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
/// Items take a `NavigationBar`'s destinations as they are, through
/// [SidebarItem.fromDestination]. A badge shows its count or a dot after the
/// label, or on the icon in the rail, and its label is read with the
/// destination. When a badge's label appears or changes, the sidebar
/// announces it once, politely; while [modals] reports a modal open, the
/// announcements wait, and the latest per destination is made after the last
/// modal closes (ADR 0016). A sidebar in its own drawer is on screen and
/// announces. An unavailable destination stays focusable, shows a lock and
/// its reason under the label (in the rail's tooltip), reads the reason as
/// its hint, and pressing it does nothing.
///
/// [collapsed] shows the rail: icons only, each named by its label and with
/// a tooltip. The current destination shows a bar at its inline start. The rail toggle shows when [onCollapsedChanged] is given and
/// every destination has an icon, and reports the state it asks for. The
/// app owns [collapsed]. Without an icon on every destination there is no
/// rail: debug builds fail an assertion, release builds keep the labels.
///
/// The sidebar is 240 wide, 56 as a rail, and never wider than its parent.
/// Given a bounded height, it fills it: the sections scroll between the
/// logo and the footer, and the footer sits at the bottom. The app decides
/// where and when to show it; the sidebar reads no screen size. On a narrow
/// screen the app can show the same navigation as a drawer with
/// [showSidebarDrawer].
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
    this.modals,
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

  /// Tells the sidebar when a modal is open, so badge announcements wait for
  /// it to close. The same observer a `NotificationRegion` reads.
  final ModalObserver? modals;

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

  late final BadgeAnnouncer<T> _announcer = BadgeAnnouncer<T>(this);

  List<SidebarItem<T>> _items(List<SidebarSection<T>> sections) => [
    for (final section in sections) ...section.items,
  ];

  @override
  void initState() {
    super.initState();
    _announcer.modals = widget.modals;
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

  bool get _rail =>
      widget.collapsed &&
      canRail(widget.sections) &&
      context.getInheritedWidgetOfExactType<_SidebarDrawerScope>() == null;

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
  void didChangeDependencies() {
    super.didChangeDependencies();
    // In its drawer the sidebar is on screen while that modal is open.
    _announcer.route = ModalRoute.of(context);
  }

  @override
  void dispose() {
    _announcer.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(Sidebar<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _announcer.modals = widget.modals;
    _announcer.changed(
      _items(oldWidget.sections),
      _items(widget.sections),
      InvisibleTheme.of(context).messages,
    );
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
      !widget.collapsed ||
          railable ||
          _SidebarDrawerScope.maybeOf(context) != null,
      'A collapsed sidebar needs an icon on every destination: without one a '
      'destination shows nothing once the labels are out of sight.',
    );
    final drawer = _SidebarDrawerScope.maybeOf(context);
    // A drawer shows the labels: it has the room, and no rail toggle.
    final rail = widget.collapsed && railable && drawer == null;
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
                onPressed: () {
                  // Following a destination closes the drawer first, then
                  // reports it (ADR 0011).
                  if (drawer?.closeOnNavigate ?? false) {
                    final navigator = Navigator.maybeOf(context);
                    if (navigator != null && navigator.canPop()) {
                      navigator.pop();
                    }
                  }
                  widget.onSelected?.call(item.value);
                },
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
              hoverTint: true,
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
            // In a drawer the sheet sets the width.
            width: drawer != null
                ? constraints.maxWidth
                : math.min(
                    MediaQuery.textScalerOf(
                      context,
                    ).scale(rail ? _railWidth : _width),
                    constraints.maxWidth,
                  ),
            child: DecoratedBox(
              decoration: drawer != null
                  ? const BoxDecoration()
                  : BoxDecoration(
                      color: colors.background,
                      border: Border.all(color: colors.border),
                      borderRadius: BorderRadius.circular(
                        InvisibleRadiusTokens.surface,
                      ),
                    ),
              child: Padding(
                padding: drawer != null
                    ? EdgeInsets.zero
                    : const EdgeInsets.all(_padding),
                child: DefaultTextStyle(
                  style: theme.textStyle.copyWith(color: colors.text),
                  child: Column(
                    mainAxisSize: bounded ? MainAxisSize.max : MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: _gap,
                    children: [
                      if (widget.logo case final logo?)
                        Padding(padding: _logoPadding, child: logo),
                      if (widget.onCollapsedChanged != null &&
                          railable &&
                          drawer == null)
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
    final messages = theme.messages;
    final link = item.uri != null;
    final unavailable = item.unavailable;
    final reason = item.unavailableReason;
    final badge = item.badge;
    final color = unavailable
        ? colors.textDisabled
        : current
        ? colors.secondaryBodyText
        : colors.text;
    final fontSize = theme.textStyle.fontSize!;
    final icon = item.icon;
    final iconTheme = IconThemeData(
      color: color,
      size: fontSize * _iconEm,
      applyTextScaling: true,
    );
    final lock = IconTheme(
      data: iconTheme.copyWith(size: fontSize * _lockEm),
      child: const Glyph(GlyphShape.lock),
    );
    final glyph = badge == null ? null : _Badge(content: badge.content);

    final Widget face;
    if (rail) {
      // The badge and the lock sit at the icon's corners; the current mark
      // is a bar at the inline start. The icon's box: its centre is the item's centre.
      final iconSize = MediaQuery.textScalerOf(
        context,
      ).scale(fontSize * _iconEm);
      final corner = iconSize / 2 + _railCornerOffset;
      face = Center(
        heightFactor: 1,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            SizedBox.square(
              dimension: iconSize,
              child: Center(child: icon),
            ),
            if (glyph != null)
              PositionedDirectional(
                start: corner,
                // A count at the item's top edge, a dot a little lower.
                top: badge!.content == null ? -2 : -6,
                child: glyph,
              ),
            if (unavailable)
              PositionedDirectional(start: corner, bottom: -4, child: lock),
          ],
        ),
      );
    } else {
      face = Row(
        spacing: _iconGap,
        children: [
          ?icon,
          // Long labels wrap rather than being cut.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item.label,
                  style: TextStyle(
                    color: color,
                    fontWeight: current ? FontWeight.w600 : null,
                  ),
                ),
                if (reason != null)
                  Text(
                    reason,
                    style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: _reasonSize,
                    ),
                  ),
              ],
            ),
          ),
          if (unavailable) lock,
          ?glyph,
        ],
      );
    }

    final Widget button = Semantics(
      container: true,
      button: !link,
      link: link,
      linkUrl: item.uri,
      enabled: !unavailable,
      label: describeDestination(
        label: item.label,
        badge: badge?.label,
        messages: messages,
      ),
      value: current ? messages.sidebarCurrent : null,
      hint: reason,
      onTap: unavailable ? null : onPressed,
      child: Pressable(
        // Unavailable, it stays in the focus order and a press does nothing.
        onPressed: unavailable ? () {} : onPressed,
        mouseCursor: unavailable ? SystemMouseCursors.basic : null,
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
            foregroundDecoration: rail && current
                ? _RailMark(color: color)
                : null,
            child: ExcludeSemantics(
              child: IconTheme(data: iconTheme, child: face),
            ),
          ),
        ),
      ),
    );
    if (!rail) return button;
    return Tooltip(
      message: reason == null
          ? item.label
          : InvisibleMessages.fill(messages.sidebarUnavailableTooltip, {
              'label': item.label,
              'reason': reason,
            }),
      placement: TooltipPlacement.end,
      // The item reads the reason as its hint; the tooltip only shows it.
      excludeFromSemantics: reason != null,
      child: button,
    );
  }
}

/// The rail's current mark: a bar at the inline start of the item.
class _RailMark extends Decoration {
  const _RailMark({required this.color});

  final Color color;

  @override
  BoxPainter createBoxPainter([VoidCallback? onChanged]) =>
      _RailMarkPainter(color);
}

class _RailMarkPainter extends BoxPainter {
  _RailMarkPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Offset offset, ImageConfiguration configuration) {
    final size = configuration.size;
    if (size == null) return;
    final rtl = configuration.textDirection == TextDirection.rtl;
    final left = rtl ? offset.dx + size.width - _railMarkWidth : offset.dx;
    canvas.drawRect(
      Rect.fromLTWH(
        left,
        offset.dy + _railMarkInset,
        _railMarkWidth,
        size.height - 2 * _railMarkInset,
      ),
      Paint()..color = color,
    );
  }
}

/// A count pill or, without [content], a dot: the Navigation Bar's badge.
class _Badge extends StatelessWidget {
  const _Badge({required this.content});

  final String? content;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final highContrast = MediaQuery.maybeHighContrastOf(context) ?? false;
    final border = highContrast ? Border.all(color: colors.text) : null;
    final text = content;
    if (text == null) {
      return Container(
        width: _dot,
        height: _dot,
        decoration: BoxDecoration(
          color: colors.danger,
          shape: BoxShape.circle,
          border: border,
        ),
      );
    }
    return Container(
      constraints: const BoxConstraints(
        minWidth: _badgeMin,
        minHeight: _badgeMin,
      ),
      padding: const EdgeInsets.symmetric(horizontal: _badgePaddingX),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: colors.danger,
        borderRadius: BorderRadius.circular(_badgeMin),
        border: border,
      ),
      child: Text(
        text,
        softWrap: false,
        style: theme.textStyle.copyWith(
          fontSize: _badgeSize,
          height: 1,
          fontWeight: FontWeight.w600,
          color: colors.onStatus,
        ),
      ),
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

/// Shows the navigation [builder] returns, a [Sidebar], as a drawer: a
/// [SheetDialog] at the inline-start edge ([side]), named [title] or the
/// sidebar's catalog label, as ADR 0013 decides.
///
/// It is modal like every dialog of the family: focus moves into it, Tab
/// stays inside, and Escape, the barrier and the close button close it. The
/// app owns the button that opens it, usually in its header, named for
/// example by the theme's `sidebarOpen`; when the drawer closes, focus goes
/// back to [returnFocus], or to the element that had focus when it opened.
/// With [closeOnNavigate], the default, following a destination closes the
/// drawer first and then reports it through the sidebar's `onSelected`.
/// [draggable] adds the sheet's grab handle.
///
/// The drawer shows the labels whatever the sidebar's `collapsed` says, and
/// no rail toggle. [builder] runs inside the drawer's route: a sidebar that
/// should follow the app's state while the drawer stays open reads it there,
/// for example through a `ValueListenableBuilder`.
///
/// ```dart
/// iu.Button(
///   onPressed: () => iu.showSidebarDrawer<String>(
///     context: context,
///     builder: (context) => iu.Sidebar<String>(
///       sections: sections,
///       value: current,
///       onSelected: navigate,
///     ),
///   ),
///   child: Text(iu.InvisibleTheme.of(context).messages.sidebarOpen),
/// )
/// ```
Future<void> showSidebarDrawer<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  SheetDialogSide side = SheetDialogSide.start,
  String? title,
  bool closeOnNavigate = true,
  bool draggable = false,
  FocusNode? returnFocus,
}) {
  assert(
    side == SheetDialogSide.start || side == SheetDialogSide.end,
    'A navigation drawer comes from the inline-start or the inline-end edge.',
  );
  final label = title ?? InvisibleTheme.of(context).messages.sidebarLabel;
  return showInvisibleDialog<void>(
    context: context,
    returnFocus: returnFocus,
    builder: (context) => SheetDialog(
      title: label,
      side: side,
      draggable: draggable,
      child: _SidebarDrawerScope(
        closeOnNavigate: closeOnNavigate,
        child: Builder(builder: builder),
      ),
    ),
  );
}

/// Tells a [Sidebar] it shows in a drawer.
class _SidebarDrawerScope extends InheritedWidget {
  const _SidebarDrawerScope({
    required this.closeOnNavigate,
    required super.child,
  });

  final bool closeOnNavigate;

  static _SidebarDrawerScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_SidebarDrawerScope>();

  @override
  bool updateShouldNotify(_SidebarDrawerScope oldWidget) =>
      closeOnNavigate != oldWidget.closeOnNavigate;
}
