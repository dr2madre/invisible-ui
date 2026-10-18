import 'dart:async';

import 'package:flutter/foundation.dart'
    show TargetPlatform, debugPrint, defaultTargetPlatform, kIsWeb;
import 'package:flutter/gestures.dart';
import 'package:flutter/scheduler.dart';
// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/anchored_layout.dart';
import '../internal/elevation.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../notification/modal_observer.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'badge_announcer.dart';
import 'navigation_bar_logic.dart';
import 'navigation_destination.dart';

// Sizes the web Navigation Bar sets in its own stylesheet. The label and the
// badge count grow with the text; the icon, its indicator and the glyphs at
// its corners keep their size, as on the web.
const EdgeInsets _padding = EdgeInsets.symmetric(vertical: 8, horizontal: 4);
const double _gap = 4;
const double _destinationGap = 4;
const double _indicatorWidth = 56;
const double _indicatorHeight = 32;
const double _iconSize = 24;
const double _labelSize = 12;
const double _badgeMin = 16;
const double _badgeSize = 11;
const double _badgePaddingX = 4;
const double _dot = 8;
const double _lockSize = 14;
// The badge and the lock start this far past the indicator's centre.
const double _cornerOffset = 6;
const double _currentBorder = 2;

// The reason bubble: the Tooltip's look.
const double _reasonGap = 4;
const double _reasonMaxWidth = 192;
const double _reasonFontSize = 13;
const EdgeInsets _reasonPadding = EdgeInsets.symmetric(
  horizontal: 8,
  vertical: 4.8,
);
const Duration _reasonExit = Duration(milliseconds: 100);

/// The application's primary navigation between a few top-level sections:
/// a row of [destinations], each with an icon above its label, one of them
/// current.
///
/// [value] names the current destination; the app owns it and passes its
/// router's state. Every press of an available destination reports its
/// value through [onSelected], the current one included, so the app can
/// return to the section's root. A value that names no destination marks
/// nothing current.
///
/// Every destination is its own Tab stop. The left and right arrows move
/// focus to the previous or next destination, following the reading
/// direction, with no wrap; they never press. Enter presses a destination;
/// Space presses one without a `uri`, as native links take Enter only.
///
/// Each destination takes an equal share of the width and fills the bar's
/// height, never smaller than the theme's [InvisibleThemeData.minTargetSize].
/// Labels wrap and are never cut, so the bar grows taller at large text
/// sizes. The current destination shows an indicator behind its icon and a
/// bolder label; the label keeps the bold width at all times, so the bar
/// never reflows. The bar paints the surface colour and nothing else: its
/// width, position, corners, shadow and safe-area padding are the app's,
/// and so is the decision to show it at all. It reads no screen size.
///
/// A destination with an `unavailableReason` stays focusable, shows a lock
/// at its icon ([unavailableIcon] replaces it), and shows its reason on
/// hover, keyboard focus and long press; Escape hides it. Pressing it does
/// nothing.
///
/// Assistive technology reads the bar the platform's way, chosen by
/// [semanticsProfile] or, when null, from [defaultTargetPlatform]: a tab bar
/// on iOS, Android and Fuchsia, a navigation holding a list on macOS,
/// Windows and Linux. When a badge's label appears or changes, the bar
/// announces it once, politely; while [modals] reports a modal open, the
/// announcements wait, and the latest per destination is made after the
/// last modal closes (ADR 0016). A bar shown inside the open modal is on
/// screen and announces.
///
/// ```dart
/// import 'package:invisible_ui/invisible_ui.dart' as iu;
///
/// iu.NavigationBar<Section>(
///   value: section,
///   onSelected: (next) => setState(() => section = next),
///   destinations: const [
///     iu.NavigationDestination(
///       value: Section.home,
///       label: 'Home',
///       icon: Icon(homeIcon),
///     ),
///     iu.NavigationDestination(
///       value: Section.profile,
///       label: 'Profile',
///       icon: Icon(profileIcon),
///       badge: iu.NavigationBadge(label: 'Needs attention'),
///     ),
///   ],
/// )
/// ```
class NavigationBar<T> extends StatefulWidget {
  /// Creates the bar from [destinations].
  const NavigationBar({
    super.key,
    required this.destinations,
    this.value,
    this.label,
    this.onSelected,
    this.semanticsProfile,
    this.unavailableIcon,
    this.modals,
  });

  /// The destinations, in reading order. Values are unique.
  final List<NavigationDestination<T>> destinations;

  /// The current destination's value, or null for none. The app owns it.
  final T? value;

  /// The accessible name of the navigation. Defaults to
  /// [InvisibleMessages.navigationBarLabel]. A Sidebar that carries the same
  /// destinations uses the same name.
  final String? label;

  /// Called with a destination's value on every press of an available
  /// destination.
  final ValueChanged<T>? onSelected;

  /// How assistive technology reads the bar. Null picks the platform's
  /// profile.
  final NavigationBarSemanticsProfile? semanticsProfile;

  /// The glyph an unavailable destination shows at its icon, in place of the
  /// lock. Sized and coloured by the surrounding [IconTheme].
  final Widget? unavailableIcon;

  /// Tells the bar when a modal is open, so badge announcements wait for it
  /// to close. The same observer a `NotificationRegion` reads.
  final ModalObserver? modals;

  @override
  State<NavigationBar<T>> createState() => _NavigationBarState<T>();
}

class _NavigationBarState<T> extends State<NavigationBar<T>> {
  final Map<T, FocusNode> _nodes = {};
  final Set<String> _warned = {};
  late final BadgeAnnouncer<T> _announcer = BadgeAnnouncer<T>(this);

  @override
  void initState() {
    super.initState();
    _announcer.modals = widget.modals;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // A bar shown inside the open modal is on screen and keeps announcing.
    _announcer.route = ModalRoute.of(context);
  }

  @override
  void didUpdateWidget(NavigationBar<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _announcer.modals = widget.modals;
    _releaseNodes();
    _announcer.changed(
      oldWidget.destinations,
      widget.destinations,
      InvisibleTheme.of(context).messages,
    );
  }

  @override
  void dispose() {
    _announcer.dispose();
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  FocusNode _nodeFor(T value) => _nodes.putIfAbsent(
    value,
    () => FocusNode(debugLabel: 'NavigationDestination($value)'),
  );

  /// Disposes the nodes of destinations no longer passed, after the frame
  /// that removes their widgets.
  void _releaseNodes() {
    final values = {for (final d in widget.destinations) d.value};
    final gone = [
      for (final entry in _nodes.entries)
        if (!values.contains(entry.key)) entry,
    ];
    if (gone.isEmpty) return;
    for (final entry in gone) {
      _nodes.remove(entry.key);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      for (final entry in gone) {
        entry.value.dispose();
      }
    });
  }

  void _move(LogicalKeyboardKey key) {
    final destinations = widget.destinations;
    final index = destinations.indexWhere(
      (d) => _nodes[d.value]?.hasFocus ?? false,
    );
    if (index < 0) return;
    final next = moveDestination(
      key: key,
      index: index,
      count: destinations.length,
      direction: Directionality.of(context),
    );
    if (next != null) _nodeFor(destinations[next].value).requestFocus();
  }

  NavigationBarSemanticsProfile get _profile =>
      widget.semanticsProfile ??
      switch (defaultTargetPlatform) {
        TargetPlatform.android ||
        TargetPlatform.iOS ||
        TargetPlatform.fuchsia => NavigationBarSemanticsProfile.tabBar,
        TargetPlatform.macOS ||
        TargetPlatform.windows ||
        TargetPlatform.linux => NavigationBarSemanticsProfile.navigationList,
      };

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final destinations = widget.destinations;
    assert(() {
      final mistakes = navigationBarMistakes(destinations, widget.value);
      assert(mistakes.repeated == null, mistakes.repeated);
      for (final warning in mistakes.warnings) {
        if (_warned.add(warning)) debugPrint('[invisible_ui] $warning');
      }
      return true;
    }());
    final profile = _profile;
    final count = destinations.length;
    final label = widget.label ?? theme.messages.navigationBarLabel;

    // Every destination as tall as the tallest, so each one's hit area
    // fills the bar.
    final Widget bar = DecoratedBox(
      decoration: BoxDecoration(color: theme.colors.surface),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: _destinationGap,
          children: [
            for (final (index, destination) in destinations.indexed)
              Expanded(
                child: _Destination<T>(
                  destination: destination,
                  current: destination.value == widget.value,
                  index: index,
                  count: count,
                  profile: profile,
                  focusNode: _nodeFor(destination.value),
                  unavailableIcon: widget.unavailableIcon,
                  onPressed: () => widget.onSelected?.call(destination.value),
                ),
              ),
          ],
        ),
      ),
    );

    final Widget semantics = switch (profile) {
      NavigationBarSemanticsProfile.tabBar => Semantics(
        container: true,
        explicitChildNodes: true,
        role: SemanticsRole.tabBar,
        label: label,
        child: bar,
      ),
      NavigationBarSemanticsProfile.navigationList => Semantics(
        container: true,
        explicitChildNodes: true,
        role: SemanticsRole.navigation,
        label: label,
        child: Semantics(
          container: true,
          explicitChildNodes: true,
          role: SemanticsRole.list,
          child: bar,
        ),
      ),
    };

    // The keys sit outside the semantics nodes: their focus annotation would
    // otherwise come between the bar and its destinations.
    return FocusTraversalGroup(
      policy: ReadingOrderTraversalPolicy(),
      child: Shortcuts(
        shortcuts: const {
          SingleActivator(LogicalKeyboardKey.arrowLeft): _ArrowIntent(
            LogicalKeyboardKey.arrowLeft,
          ),
          SingleActivator(LogicalKeyboardKey.arrowRight): _ArrowIntent(
            LogicalKeyboardKey.arrowRight,
          ),
        },
        child: Actions(
          actions: {
            _ArrowIntent: CallbackAction<_ArrowIntent>(
              onInvoke: (intent) {
                _move(intent.key);
                return null;
              },
            ),
          },
          child: semantics,
        ),
      ),
    );
  }
}

class _ArrowIntent extends Intent {
  const _ArrowIntent(this.key);

  final LogicalKeyboardKey key;
}

/// Presses a destination. Its own intent, so an app-wide Space mapped to
/// `ActivateIntent` never presses a destination with a `uri`.
class _PressIntent extends Intent {
  const _PressIntent();
}

class _Destination<T> extends StatefulWidget {
  const _Destination({
    required this.destination,
    required this.current,
    required this.index,
    required this.count,
    required this.profile,
    required this.focusNode,
    required this.unavailableIcon,
    required this.onPressed,
  });

  final NavigationDestination<T> destination;
  final bool current;
  final int index;
  final int count;
  final NavigationBarSemanticsProfile profile;
  final FocusNode focusNode;
  final Widget? unavailableIcon;
  final VoidCallback onPressed;

  @override
  State<_Destination<T>> createState() => _DestinationState<T>();
}

class _DestinationState<T> extends State<_Destination<T>> {
  static const Map<ShortcutActivator, Intent> _linkKeys = {
    SingleActivator(LogicalKeyboardKey.enter): _PressIntent(),
    SingleActivator(LogicalKeyboardKey.numpadEnter): _PressIntent(),
  };

  static const Map<ShortcutActivator, Intent> _buttonKeys = {
    ..._linkKeys,
    SingleActivator(LogicalKeyboardKey.space): _PressIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    _PressIntent: CallbackAction<_PressIntent>(onInvoke: (_) => _press()),
  };

  final OverlayPortalController _portal = OverlayPortalController();
  final GlobalKey _anchorKey = GlobalKey();
  Timer? _timer;

  bool _focusVisible = false;
  bool _hovered = false;
  bool _hoverReason = false;
  bool _pressReason = false;
  bool _dismissed = false;

  bool get _unavailable => widget.destination.unavailable;

  bool get _reasonVisible =>
      _unavailable &&
      !_dismissed &&
      (_focusVisible || _hoverReason || _pressReason);

  @override
  void initState() {
    super.initState();
    HardwareKeyboard.instance.addHandler(_onKey);
  }

  @override
  void didUpdateWidget(_Destination<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_unavailable) _syncPortal();
  }

  @override
  void dispose() {
    _timer?.cancel();
    HardwareKeyboard.instance.removeHandler(_onKey);
    super.dispose();
  }

  /// Applies [change] and shows or hides the reason to match.
  void _update(VoidCallback change) {
    setState(change);
    _syncPortal();
  }

  void _syncPortal() {
    // The portal cannot change while the tree builds; it follows after the
    // frame.
    if (SchedulerBinding.instance.schedulerPhase ==
        SchedulerPhase.persistentCallbacks) {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (mounted) _syncPortal();
      });
      return;
    }
    final visible = _reasonVisible;
    if (visible == _portal.isShowing) return;
    visible ? _portal.show() : _portal.hide();
  }

  // Read from the widget at the press, so a replaced callback is the one run.
  void _press() {
    if (!_unavailable) widget.onPressed();
  }

  // Escape hides the reason wherever focus is and stays available to the
  // rest of the app, as the Tooltip's handler does.
  bool _onKey(KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.escape &&
        _reasonVisible) {
      _update(() => _dismissed = true);
    }
    return false;
  }

  void _hover(bool over) {
    _timer?.cancel();
    if (over) {
      _update(() {
        _hovered = true;
        _hoverReason = true;
      });
    } else {
      _update(() => _hovered = false);
      _timer = Timer(_reasonExit, () {
        if (mounted) {
          _update(() {
            _hoverReason = false;
            _dismissed = false;
          });
        }
      });
    }
  }

  void _focusChanged(bool focused) {
    if (!focused) _update(() => _dismissed = false);
  }

  Widget _buildReason(BuildContext context) {
    final reason = widget.destination.unavailableReason;
    final anchor = _anchorKey.currentContext;
    if (reason == null || anchor == null) {
      return const SizedBox.shrink();
    }
    final theme = InvisibleTheme.of(context);
    final highContrast = MediaQuery.maybeHighContrastOf(context) ?? false;
    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchorRectIn(context, anchor),
        side: AnchorSide.top,
        direction: Directionality.of(context),
        gap: _reasonGap,
        centered: true,
      ),
      // The destination carries the reason as its hint; reading this copy
      // too would say it twice.
      child: ExcludeSemantics(
        child: MouseRegion(
          // Hoverable: the reason stays while the pointer is over it.
          onEnter: (_) => _timer?.cancel(),
          onExit: (_) => _hover(false),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: _reasonMaxWidth),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colors.emphasisSurface,
                borderRadius: BorderRadius.circular(theme.controlRadius),
                border: highContrast
                    ? Border.all(color: theme.colors.text)
                    : null,
                boxShadow: overlayShadow(theme.brightness),
              ),
              child: Padding(
                padding: _reasonPadding,
                child: Text(
                  reason,
                  style: theme.textStyle.copyWith(
                    fontSize: _reasonFontSize,
                    color: theme.colors.onEmphasis,
                  ),
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
    final messages = theme.messages;
    final destination = widget.destination;
    final unavailable = _unavailable;
    final current = widget.current;
    final link = destination.uri != null;
    final target = theme.minTargetSize;

    final Widget content = FocusRingPainter(
      visible: _focusVisible,
      ring: theme.focusRing,
      radius: theme.controlRadius,
      // Inside the destination: the bar often sits at the screen's edge.
      inside: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: _hovered ? colors.stateHover : null,
          borderRadius: BorderRadius.circular(theme.controlRadius),
        ),
        child: Align(
          alignment: Alignment.topCenter,
          child: Padding(
            padding: _padding,
            child: ExcludeSemantics(
              child: _DestinationFace(
                destination: destination,
                current: current,
                unavailableIcon: widget.unavailableIcon,
              ),
            ),
          ),
        ),
      ),
    );

    Widget body = FocusableActionDetector(
      focusNode: widget.focusNode,
      shortcuts: link ? _linkKeys : _buttonKeys,
      actions: _actions,
      mouseCursor: unavailable
          ? SystemMouseCursors.basic
          : SystemMouseCursors.click,
      onFocusChange: _focusChanged,
      onShowFocusHighlight: (value) => _update(() => _focusVisible = value),
      child: MouseRegion(
        key: _anchorKey,
        // Hover follows the mouse alone, as CSS :hover does.
        onEnter: (event) {
          if (event.kind == PointerDeviceKind.mouse) _hover(true);
        },
        onExit: (_) => _hover(false),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTap: unavailable ? null : _press,
          // A long press on an available destination does nothing: it wins
          // over the tap, so lifting the finger presses nothing.
          onLongPress: unavailable ? null : () {},
          onLongPressStart: unavailable
              ? (_) => _update(() {
                  _pressReason = true;
                  _dismissed = false;
                })
              : null,
          onLongPressEnd: unavailable
              ? (_) => _update(() => _pressReason = false)
              : null,
          onLongPressCancel: unavailable
              ? () => _update(() => _pressReason = false)
              : null,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minWidth: target.width,
              minHeight: target.height,
            ),
            child: content,
          ),
        ),
      ),
    );

    if (Overlay.maybeOf(context) != null) {
      body = OverlayPortal(
        controller: _portal,
        overlayChildBuilder: _buildReason,
        child: body,
      );
    }

    final badge = destination.badge?.label;
    final reason = destination.unavailableReason;
    return switch (widget.profile) {
      NavigationBarSemanticsProfile.tabBar => Semantics(
        container: true,
        role: SemanticsRole.tab,
        button: true,
        selected: current,
        enabled: !unavailable,
        // Material leaves the position out on the web, where the tab
        // role is mapped to ARIA and the browser reads it.
        label: describeDestination(
          label: destination.label,
          badge: badge,
          index: kIsWeb ? null : widget.index + 1,
          count: kIsWeb ? null : widget.count,
          messages: messages,
        ),
        hint: reason,
        onTap: unavailable ? null : _press,
        child: IndexedSemantics(index: widget.index, child: body),
      ),
      NavigationBarSemanticsProfile.navigationList => Semantics(
        container: true,
        explicitChildNodes: true,
        role: SemanticsRole.listItem,
        child: Semantics(
          container: true,
          button: !link,
          link: link,
          linkUrl: destination.uri,
          selected: current ? true : null,
          enabled: !unavailable,
          label: describeDestination(
            label: destination.label,
            badge: badge,
            messages: messages,
          ),
          value: current ? messages.navigationBarCurrent : null,
          hint: reason,
          onTap: unavailable ? null : _press,
          child: body,
        ),
      ),
    };
  }
}

/// What a destination paints: the indicator with the icon, the badge and
/// the lock, then the label.
class _DestinationFace<T> extends StatelessWidget {
  const _DestinationFace({
    required this.destination,
    required this.current,
    required this.unavailableIcon,
  });

  final NavigationDestination<T> destination;
  final bool current;
  final Widget? unavailableIcon;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final highContrast = MediaQuery.maybeHighContrastOf(context) ?? false;
    final unavailable = destination.unavailable;
    final color = unavailable
        ? colors.textDisabled
        : current
        ? colors.text
        : colors.textSecondary;
    const icon = _iconSize;
    const indicatorHeight = _indicatorHeight;
    // The icon sits centred in the indicator, so its box's centre is the
    // indicator's centre and its edges are this far inside the indicator's.
    const inset = (indicatorHeight - icon) / 2;
    const corner = icon / 2 + _cornerOffset;
    final badge = destination.badge;

    final Widget glyphs = Stack(
      clipBehavior: Clip.none,
      children: [
        SizedBox.square(
          dimension: icon,
          child: Center(
            child: IconTheme(
              data: IconThemeData(color: color, size: _iconSize),
              child: destination.icon,
            ),
          ),
        ),
        if (badge != null)
          PositionedDirectional(
            start: corner,
            // A count at the indicator's top edge, a dot a little lower.
            top: badge.content == null ? 4 - inset : -inset,
            child: _Badge(content: badge.content, highContrast: highContrast),
          ),
        if (unavailable)
          PositionedDirectional(
            start: corner,
            bottom: -inset,
            child: IconTheme(
              data: IconThemeData(color: color, size: _lockSize),
              child: unavailableIcon ?? const Glyph(GlyphShape.lock),
            ),
          ),
      ],
    );

    final style = theme.textStyle.copyWith(
      fontSize: _labelSize,
      height: InvisibleTypographyTokens.lineHeightTight,
      color: color,
      fontWeight: current ? FontWeight.w600 : null,
    );

    return Column(
      mainAxisSize: MainAxisSize.min,
      spacing: _gap,
      children: [
        Container(
          width: _indicatorWidth,
          height: indicatorHeight,
          alignment: Alignment.center,
          decoration: current
              ? BoxDecoration(
                  color: colors.navigationBarCurrentIndicator,
                  borderRadius: BorderRadius.circular(
                    InvisibleRadiusTokens.pill,
                  ),
                  border: highContrast
                      ? Border.all(color: colors.text, width: _currentBorder)
                      : null,
                )
              : null,
          child: glyphs,
        ),
        // The label reserves its bold size, so the current state never
        // reflows the bar. It wraps and is never cut.
        Stack(
          alignment: Alignment.topCenter,
          children: [
            Visibility.maintain(
              visible: false,
              child: Text(
                destination.label,
                textAlign: TextAlign.center,
                style: style.copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            Text(destination.label, textAlign: TextAlign.center, style: style),
          ],
        ),
      ],
    );
  }
}

/// A count pill or, without [content], a dot.
class _Badge extends StatelessWidget {
  const _Badge({required this.content, required this.highContrast});

  final String? content;
  final bool highContrast;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final text = content;
    if (text == null) {
      return Container(
        width: _dot,
        height: _dot,
        decoration: BoxDecoration(
          color: colors.danger,
          shape: BoxShape.circle,
          border: highContrast ? Border.all(color: colors.text) : null,
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
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.pill),
        border: highContrast ? Border.all(color: colors.text) : null,
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
