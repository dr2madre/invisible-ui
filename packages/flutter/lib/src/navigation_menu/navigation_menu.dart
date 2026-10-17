import 'dart:async';
// widgets.dart exports SemanticsRole only in releases after Flutter 3.35.
// ignore: unnecessary_import
import 'package:flutter/semantics.dart' show SemanticsRole;
import 'package:flutter/gestures.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/anchored_layout.dart';
import '../internal/elevation.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes and timings the web Navigation Menu sets in its own stylesheet and
// adapter.
const double _barGap = 4;
const double _triggerGap = 4;
const EdgeInsetsDirectional _triggerPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12,
  vertical: 8,
);
const double _panelGap = 8;
const double _panelMinWidth = 288;
const EdgeInsets _panelPadding = EdgeInsets.all(8);
const double _linkGap = 2;
const EdgeInsetsDirectional _linkPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 10,
  vertical: 8,
);
const double _descriptionSize = 14;
const Duration _hoverDelay = Duration(milliseconds: 150);
const Duration _turn = Duration(milliseconds: 150);
// The current page carries a bar besides its colour, so the state never
// rests on colour alone. The tint is the 10% the package's selected states
// use.
const double _markWidth = 2;
const double _currentTint = 0.1;

/// A link inside a [NavigationMenuItem.panel].
@immutable
class NavigationMenuLink {
  /// Creates a link named [label] that opens its destination through
  /// [onPressed].
  const NavigationMenuLink({
    required this.label,
    required this.onPressed,
    this.description,
    this.uri,
    this.current = false,
  });

  /// The visible label and accessible name.
  final String label;

  /// Opens the destination: the app's route, or a URL the app opens.
  final VoidCallback onPressed;

  /// A line of text under the label.
  final String? description;

  /// The destination, announced as the link's address.
  final Uri? uri;

  /// Whether the link leads to the page on screen. The app says which link
  /// is current: it is read as the current page, and the trigger that holds
  /// it is marked on screen only.
  final bool current;
}

/// One top-level item of a [NavigationMenu]: a plain link or a trigger that
/// reveals a panel of links.
@immutable
sealed class NavigationMenuItem<T> {
  const NavigationMenuItem._({required this.value, required this.label});

  /// A plain link in the bar.
  const factory NavigationMenuItem.link({
    required T value,
    required String label,
    required VoidCallback onPressed,
    Uri? uri,
    bool current,
  }) = NavigationMenuTopLink<T>;

  /// A trigger that reveals [links] in a panel below it.
  const factory NavigationMenuItem.panel({
    required T value,
    required String label,
    required List<NavigationMenuLink> links,
  }) = NavigationMenuPanel<T>;

  /// Identifies the item; unique within the menu.
  final T value;

  /// The visible label and accessible name.
  final String label;
}

/// A plain link in a [NavigationMenu] bar. Create it with
/// [NavigationMenuItem.link].
final class NavigationMenuTopLink<T> extends NavigationMenuItem<T> {
  /// Creates the link.
  const NavigationMenuTopLink({
    required super.value,
    required super.label,
    required this.onPressed,
    this.uri,
    this.current = false,
  }) : super._();

  /// Opens the destination.
  final VoidCallback onPressed;

  /// The destination, announced as the link's address.
  final Uri? uri;

  /// Whether the link leads to the page on screen, read as the current page.
  final bool current;
}

/// A [NavigationMenu] trigger with its panel of links. Create it with
/// [NavigationMenuItem.panel].
final class NavigationMenuPanel<T> extends NavigationMenuItem<T> {
  /// Creates the trigger and its panel.
  const NavigationMenuPanel({
    required super.value,
    required super.label,
    required this.links,
  }) : super._();

  /// The links the panel shows.
  final List<NavigationMenuLink> links;
}

/// A site navigation bar named [label], where some items reveal a panel of
/// links.
///
/// Plain items are links. Panel items are disclosure buttons, at most one
/// open at a time. The pointer resting on a trigger opens its panel while
/// it stays: after 150 ms, or at once while another panel is open; leaving
/// the trigger and the panel closes it after 150 ms. A tap, a click, Enter
/// or Space opens a panel and keeps it open, also one the pointer opened;
/// the next press closes it. Touch has no hover. ArrowDown on a trigger
/// opens its panel, keeps it open and moves focus to the first link.
/// Escape closes the panel and focus returns to its trigger. A press
/// outside closes it without moving focus back. A panel closed by a press
/// or Escape opens by hover again only after the pointer leaves its
/// trigger.
///
/// Links open through their callback on a tap or Enter, as [Link] does. A
/// link closes the open panel before its callback runs, and focus goes
/// where the callback puts it, never back to the trigger by itself; only
/// when it lands nowhere does it go to the trigger. The app marks the link
/// of the page on screen with `current`: that link is read as the current
/// page, and the trigger that holds it is marked on screen only.
///
/// The open panel belongs to the component; [onOpenChanged] reports each
/// change once, with the open item's value or null. A crowded bar wraps
/// onto more rows.
class NavigationMenu<T> extends StatefulWidget {
  /// Creates the bar from [items].
  const NavigationMenu({
    super.key,
    required this.label,
    required this.items,
    this.onOpenChanged,
  });

  /// The accessible name of the navigation.
  final String label;

  /// The items, in order.
  final List<NavigationMenuItem<T>> items;

  /// Called with the open item's value, or null, after a panel opens,
  /// closes or switches.
  final ValueChanged<T?>? onOpenChanged;

  @override
  State<NavigationMenu<T>> createState() => _NavigationMenuState<T>();
}

/// What one panel item keeps across builds.
class _Slot {
  final OverlayPortalController portal = OverlayPortalController();
  final GlobalKey triggerKey = GlobalKey();
  final FocusNode trigger = FocusNode(debugLabel: 'NavigationMenu trigger');
  // Never focused itself: it tells whether focus is inside the panel.
  final FocusNode panel = FocusNode(
    debugLabel: 'NavigationMenu panel',
    canRequestFocus: false,
    skipTraversal: true,
  );

  void dispose() {
    trigger.dispose();
    panel.dispose();
  }
}

class _NavigationMenuState<T> extends State<NavigationMenu<T>> {
  final Map<T, _Slot> _slots = {};
  T? _open;
  // Whether a press keeps the open panel open, so the pointer leaving it
  // closes nothing.
  bool _kept = false;
  Timer? _timer;

  _Slot _slot(T value) => _slots.putIfAbsent(value, _Slot.new);

  @override
  void didUpdateWidget(NavigationMenu<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    final panels = {
      for (final item in widget.items)
        if (item is NavigationMenuPanel<T>) item.value,
    };
    // A panel whose item is gone closes silently: no one asked for it.
    if (_open != null && !panels.contains(_open)) {
      _open = null;
      _kept = false;
    }
    _slots.removeWhere((value, slot) {
      if (panels.contains(value)) return false;
      slot.dispose();
      return true;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final slot in _slots.values) {
      slot.dispose();
    }
    super.dispose();
  }

  /// Opens the panel of [value], or closes every panel for null, and reports
  /// it once. [keep] says whether a press opened it. Focus inside a panel
  /// that closes returns to its trigger, unless [restoreFocus] is false.
  void _set(T? value, {bool keep = false, bool restoreFocus = true}) {
    _timer?.cancel();
    _timer = null;
    if (!mounted) return;
    if (value == _open) {
      _kept = value != null && (_kept || keep);
      return;
    }
    // A hover delay may outlive its item.
    if (value != null && !_slots.containsKey(value)) return;
    final previous = _open == null ? null : _slots[_open];
    final focusInside = previous?.panel.hasFocus ?? false;
    setState(() {
      previous?.portal.hide();
      if (value != null) _slots[value]!.portal.show();
      _open = value;
      // A press keeps the menu open across a switch by hover.
      _kept = value != null && (_kept || keep);
    });
    if (focusInside && restoreFocus) previous!.trigger.requestFocus();
    widget.onOpenChanged?.call(value);
  }

  /// A press on a trigger keeps a panel the pointer opened and closes one a
  /// press kept. Hover opens only on entering a trigger, so a panel closed
  /// here stays closed while the pointer rests on it.
  void _press(T value) {
    if (_open == value && _kept) {
      _set(null);
    } else {
      _set(value, keep: true);
    }
  }

  /// Runs a link's [onPressed] once the open panel is closed.
  ///
  /// Focus inside the panel goes to its scope, not back to the trigger, so
  /// the callback can move it, for example into the page it opens. If it is
  /// still nowhere after the next frame, it goes to the trigger.
  void _activate(VoidCallback onPressed) {
    final slot = _open == null ? null : _slots[_open];
    final focusInside = slot?.panel.hasFocus ?? false;
    final scope = slot?.panel.enclosingScope;
    if (focusInside) {
      FocusManager.instance.primaryFocus?.unfocus(
        disposition: UnfocusDisposition.scope,
      );
    }
    _set(null, restoreFocus: false);
    onPressed();
    if (slot == null || !focusInside) return;
    SchedulerBinding.instance.addPostFrameCallback((_) {
      // The trigger may have gone with its item or with the whole menu.
      if (!mounted || !_slots.containsValue(slot)) return;
      final trigger = slot.trigger;
      if (trigger.context == null || !trigger.canRequestFocus) return;
      final focus = FocusManager.instance.primaryFocus;
      if (focus == null || focus == scope) trigger.requestFocus();
    });
    SchedulerBinding.instance.ensureVisualUpdate();
  }

  void _enterTrigger(PointerEnterEvent event, T value) {
    // Touch has no hover: the tap toggles.
    if (event.kind == PointerDeviceKind.touch) return;
    _timer?.cancel();
    final open = _open;
    if (open == null) {
      _timer = Timer(_hoverDelay, () => _set(value));
    } else if (open != value) {
      _set(value);
    }
  }

  void _scheduleClose() {
    _timer?.cancel();
    _timer = null;
    // A panel a press opened or kept waits for a press, Escape or a press
    // outside.
    if (_kept) return;
    _timer = Timer(_hoverDelay, () => _set(null));
  }

  void _pressOutside() {
    final slot = _open == null ? null : _slots[_open];
    if (slot == null) return;
    // Focus leaves the panel for its scope, as a press on an empty page
    // leaves it nowhere on the web, instead of falling back to the trigger.
    if (slot.panel.hasFocus) {
      FocusManager.instance.primaryFocus?.unfocus(
        disposition: UnfocusDisposition.scope,
      );
    }
    _set(null, restoreFocus: false);
  }

  KeyEventResult _onTriggerKey(T value, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey == LogicalKeyboardKey.arrowDown) {
      _set(value, keep: true);
      // The panel builds in this frame; focus moves in once it is there.
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _open != value) return;
        _slots[value]?.panel.traversalDescendants.firstOrNull?.requestFocus();
      });
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.escape) {
      // Every Escape cancels a pending hover; with nothing open, the key
      // still reaches the rest of the app.
      _timer?.cancel();
      _timer = null;
      if (_open == null) return KeyEventResult.ignored;
      _set(null);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  KeyEventResult _onPanelKey(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.escape &&
        _open != null) {
      _set(null);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  Widget _buildPanel(
    BuildContext context,
    NavigationMenuPanel<T> item,
    _Slot slot,
  ) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final anchor = anchorRectIn(context, slot.triggerKey.currentContext!);
    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchor,
        side: AnchorSide.bottom,
        direction: Directionality.of(context),
        gap: _panelGap,
      ),
      child: TapRegion(
        groupId: slot,
        onTapOutside: (_) => _pressOutside(),
        child: MouseRegion(
          onEnter: (_) => _timer?.cancel(),
          onExit: (_) => _scheduleClose(),
          child: Focus(
            focusNode: slot.panel,
            onKeyEvent: _onPanelKey,
            child: ConstrainedBox(
              constraints: const BoxConstraints(minWidth: _panelMinWidth),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: colors.background,
                  border: Border.all(color: colors.border),
                  borderRadius: BorderRadius.circular(
                    InvisibleRadiusTokens.surface,
                  ),
                  boxShadow: overlayShadow(theme.brightness),
                ),
                // A panel taller than the room it has scrolls.
                child: SingleChildScrollView(
                  padding: _panelPadding,
                  child: Semantics(
                    container: true,
                    explicitChildNodes: true,
                    role: SemanticsRole.list,
                    label: item.label,
                    // As wide as the widest link, as the web panel shrinks
                    // to fit its content.
                    child: IntrinsicWidth(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        spacing: _linkGap,
                        children: [
                          for (final link in item.links)
                            Semantics(
                              container: true,
                              explicitChildNodes: true,
                              role: SemanticsRole.listItem,
                              child: _PanelLink(
                                link: link,
                                onPressed: () => _activate(link.onPressed),
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
        ),
      ),
    );
  }

  Widget _buildItem(NavigationMenuItem<T> item) {
    switch (item) {
      case NavigationMenuTopLink<T>():
        return _BarButton(
          label: item.label,
          onPressed: () => _activate(item.onPressed),
          uri: item.uri,
          link: true,
          current: item.current,
        );
      case NavigationMenuPanel<T>():
        final value = item.value;
        final slot = _slot(value);
        final open = _open == value;
        return OverlayPortal(
          controller: slot.portal,
          overlayChildBuilder: (context) => _buildPanel(context, item, slot),
          child: TapRegion(
            groupId: slot,
            enabled: open,
            child: Focus(
              canRequestFocus: false,
              skipTraversal: true,
              onKeyEvent: (_, event) => _onTriggerKey(value, event),
              child: MouseRegion(
                key: slot.triggerKey,
                onEnter: (event) => _enterTrigger(event, value),
                onExit: (_) => _scheduleClose(),
                child: _BarButton(
                  label: item.label,
                  onPressed: () => _press(value),
                  focusNode: slot.trigger,
                  expanded: open,
                  // Marked on screen only: the link itself is read as the
                  // current page.
                  holdsCurrent: item.links.any((link) => link.current),
                ),
              ),
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    assert(
      widget.items.map((item) => item.value).toSet().length ==
          widget.items.length,
      'Each navigation menu item needs a value of its own.',
    );
    assert(
      widget.items
              .expand(_currentFlags<T>)
              .where((current) => current)
              .length <=
          1,
      'At most one navigation menu link leads to the current page.',
    );
    final theme = InvisibleTheme.of(context);
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: widget.label,
      child: DefaultTextStyle(
        style: theme.textStyle.copyWith(color: theme.colors.text),
        child: Wrap(
          spacing: _barGap,
          runSpacing: _barGap,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            for (final item in widget.items)
              // Each item is one stop in the reading order, so Tab enters an
              // open panel right after its trigger.
              FocusTraversalGroup(
                key: ValueKey<T>(item.value),
                child: Semantics(
                  container: true,
                  explicitChildNodes: true,
                  role: SemanticsRole.listItem,
                  child: _buildItem(item),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Whether each link of [item] leads to the current page.
Iterable<bool> _currentFlags<T>(NavigationMenuItem<T> item) => switch (item) {
  NavigationMenuTopLink<T>(:final current) => [current],
  NavigationMenuPanel<T>(:final links) => links.map((link) => link.current),
};

/// A trigger or a plain link in the bar. A trigger has [expanded] and
/// [holdsCurrent]; a link has [link], an optional [uri] and [current].
class _BarButton extends StatelessWidget {
  const _BarButton({
    required this.label,
    required this.onPressed,
    this.focusNode,
    this.expanded,
    this.link = false,
    this.uri,
    this.current = false,
    this.holdsCurrent = false,
  });

  final String label;
  final VoidCallback onPressed;
  final FocusNode? focusNode;
  final bool? expanded;
  final bool link;
  final Uri? uri;

  /// The link leads to the current page: read and marked.
  final bool current;

  /// The trigger's panel holds the current page: marked, not read.
  final bool holdsCurrent;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final open = expanded ?? false;
    final fontSize = theme.textStyle.fontSize!;
    final marked = current || holdsCurrent;
    return Semantics(
      container: true,
      button: !link,
      link: link,
      linkUrl: uri,
      expanded: expanded,
      label: label,
      value: current ? theme.messages.navigationMenuCurrent : null,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        keys: link ? PressKeys.link : PressKeys.button,
        focusNode: focusNode,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: CustomPaint(
            foregroundPainter: marked
                ? _CurrentMark(
                    color: colors.secondaryBodyText,
                    bottom: true,
                    direction: Directionality.of(context),
                  )
                : null,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: states.hovered || open ? colors.stateHover : null,
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: Padding(
                padding: _triggerPadding,
                child: ExcludeSemantics(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: _triggerGap,
                    children: [
                      Flexible(
                        child: Text(
                          label,
                          style: TextStyle(
                            color: marked
                                ? colors.secondaryBodyText
                                : colors.text,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      if (expanded != null)
                        IconTheme(
                          data: IconThemeData(
                            color: colors.textSecondary,
                            size: fontSize,
                            applyTextScaling: true,
                          ),
                          child: AnimatedRotation(
                            turns: open ? 0.5 : 0,
                            duration: reducedMotion(context)
                                ? Duration.zero
                                : _turn,
                            curve: Curves.ease,
                            child: const Glyph(GlyphShape.chevronDown),
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
    );
  }
}

/// A link in a panel: a bold label over an optional description.
class _PanelLink extends StatelessWidget {
  const _PanelLink({required this.link, required this.onPressed});

  final NavigationMenuLink link;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final description = link.description;
    final current = link.current;
    return Semantics(
      container: true,
      link: true,
      linkUrl: link.uri,
      label: link.label,
      value: current ? theme.messages.navigationMenuCurrent : null,
      hint: description,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        keys: PressKeys.link,
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: CustomPaint(
            foregroundPainter: current
                ? _CurrentMark(
                    color: colors.secondaryBodyText,
                    bottom: false,
                    direction: Directionality.of(context),
                  )
                : null,
            // The tint fills the panel's width, not only the text's.
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: states.hovered || states.focusVisible
                    ? colors.stateHover
                    : current
                    ? colors.secondary.withValues(alpha: _currentTint)
                    : null,
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: Padding(
                padding: _linkPadding,
                child: ExcludeSemantics(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: _linkGap,
                    children: [
                      Text(
                        link.label,
                        style: TextStyle(
                          color: current
                              ? colors.secondaryBodyText
                              : colors.text,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (description != null)
                        Text(
                          description,
                          style: TextStyle(
                            color: colors.textSecondary,
                            fontSize: _descriptionSize,
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
    );
  }
}

/// The bar that marks the current page: under the label of a bar item,
/// along the inline-start edge of a panel link.
class _CurrentMark extends CustomPainter {
  const _CurrentMark({
    required this.color,
    required this.bottom,
    required this.direction,
  });

  final Color color;
  final bool bottom;
  final TextDirection direction;

  @override
  void paint(Canvas canvas, Size size) {
    final Rect bar;
    if (bottom) {
      // Within the padding under the label, clear of the rounded corners.
      final inset = _triggerPadding.start;
      bar = Rect.fromLTWH(
        inset,
        size.height - _markWidth - 2,
        size.width - 2 * inset,
        _markWidth,
      );
    } else {
      final inset = _linkPadding.top / 2;
      final left = direction == TextDirection.ltr
          ? 0.0
          : size.width - _markWidth;
      bar = Rect.fromLTWH(left, inset, _markWidth, size.height - 2 * inset);
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(bar, const Radius.circular(_markWidth / 2)),
      Paint()..color = color,
    );
  }

  @override
  bool shouldRepaint(_CurrentMark oldDelegate) =>
      oldDelegate.color != color ||
      oldDelegate.bottom != bottom ||
      oldDelegate.direction != direction;
}
