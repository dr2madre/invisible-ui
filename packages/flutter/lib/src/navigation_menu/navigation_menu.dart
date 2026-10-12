import 'dart:async';
// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

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
  });

  /// The visible label and accessible name.
  final String label;

  /// Opens the destination: the app's route, or a URL the app opens.
  final VoidCallback onPressed;

  /// A line of text under the label.
  final String? description;

  /// The destination, announced as the link's address.
  final Uri? uri;
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
  }) : super._();

  /// Opens the destination.
  final VoidCallback onPressed;

  /// The destination, announced as the link's address.
  final Uri? uri;
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
/// open at a time. The pointer resting on a trigger opens its panel after
/// 150 ms, or at once while another panel is open; leaving the trigger and
/// the panel closes it after 150 ms. A tap, a click, Enter or Space toggles
/// a panel; touch has no hover. ArrowDown on a trigger opens its panel and
/// moves focus to the first link. Escape closes the panel and focus returns
/// to its trigger. A press outside closes it without moving focus back.
/// Links open through their callback on a tap or Enter, as [Link] does.
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
    if (_open != null && !panels.contains(_open)) _open = null;
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
  /// it once. Focus inside a panel that closes returns to its trigger,
  /// unless [restoreFocus] is false.
  void _set(T? value, {bool restoreFocus = true}) {
    _timer?.cancel();
    _timer = null;
    if (!mounted || value == _open) return;
    // A hover delay may outlive its item.
    if (value != null && !_slots.containsKey(value)) return;
    final previous = _open == null ? null : _slots[_open];
    final focusInside = previous?.panel.hasFocus ?? false;
    setState(() {
      previous?.portal.hide();
      if (value != null) _slots[value]!.portal.show();
      _open = value;
    });
    if (focusInside && restoreFocus) previous!.trigger.requestFocus();
    widget.onOpenChanged?.call(value);
  }

  void _toggle(T value) => _set(_open == value ? null : value);

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
      _set(value);
      // The panel builds in this frame; focus moves in once it is there.
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _open != value) return;
        _slots[value]?.panel.traversalDescendants.firstOrNull?.requestFocus();
      });
      return KeyEventResult.handled;
    }
    if (event.logicalKey == LogicalKeyboardKey.escape && _open != null) {
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
                              child: _PanelLink(link: link),
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
          onPressed: item.onPressed,
          uri: item.uri,
          link: true,
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
                  onPressed: () => _toggle(value),
                  focusNode: slot.trigger,
                  expanded: open,
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

/// A trigger or a plain link in the bar. A trigger has [expanded]; a link
/// has [link] and an optional [uri].
class _BarButton extends StatelessWidget {
  const _BarButton({
    required this.label,
    required this.onPressed,
    this.focusNode,
    this.expanded,
    this.link = false,
    this.uri,
  });

  final String label;
  final VoidCallback onPressed;
  final FocusNode? focusNode;
  final bool? expanded;
  final bool link;
  final Uri? uri;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final open = expanded ?? false;
    final fontSize = theme.textStyle.fontSize!;
    return Semantics(
      container: true,
      button: !link,
      link: link,
      linkUrl: uri,
      expanded: expanded,
      label: label,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        keys: link ? PressKeys.link : PressKeys.button,
        focusNode: focusNode,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
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
                          color: colors.text,
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
    );
  }
}

/// A link in a panel: a bold label over an optional description.
class _PanelLink extends StatelessWidget {
  const _PanelLink({required this.link});

  final NavigationMenuLink link;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final description = link.description;
    return Semantics(
      container: true,
      link: true,
      linkUrl: link.uri,
      label: link.label,
      hint: description,
      onTap: link.onPressed,
      child: Pressable(
        onPressed: link.onPressed,
        keys: PressKeys.link,
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          // The tint fills the panel's width, not only the text's.
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: states.hovered || states.focusVisible
                  ? colors.stateHover
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
                        color: colors.text,
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
    );
  }
}
