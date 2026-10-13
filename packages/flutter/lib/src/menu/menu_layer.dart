import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show SemanticsRole;

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/elevation.dart';
import '../internal/glyphs.dart';
import '../internal/roving.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'menu_entry.dart';
import 'menu_tree.dart';
import 'submenu_geometry.dart';

// The shared menu layer (ADR 0017 §4): the open state of a menu and its
// submenus, the keyboard map, typeahead, hover timing, the grace area, focus
// return and the rendering of each level. Dropdown Menu, Context Menu and
// Menubar build on it.
//
// Each level is a RawMenuAnchor with its own MenuController, nested in its
// parent's overlay. The session keeps the open path itself and drives the
// controllers from it, closing the deepest level first; it reports and
// returns focus only after the root is closed, in a post-frame callback. So
// the behaviour does not depend on the close order of RawMenuAnchor, which
// Flutter 3.44 changed.

/// The hover delay before a submenu opens or a sibling closes it.
const Duration submenuHoverDelay = Duration(milliseconds: 100);

/// How long the pointer may rest in the grace area before it ends.
const Duration graceRest = Duration(milliseconds: 300);

final Map<LogicalKeyboardKey, MenuKey> _menuKeys = {
  LogicalKeyboardKey.arrowDown: MenuKey.arrowDown,
  LogicalKeyboardKey.arrowUp: MenuKey.arrowUp,
  LogicalKeyboardKey.arrowLeft: MenuKey.arrowLeft,
  LogicalKeyboardKey.arrowRight: MenuKey.arrowRight,
  LogicalKeyboardKey.home: MenuKey.home,
  LogicalKeyboardKey.end: MenuKey.end,
  LogicalKeyboardKey.enter: MenuKey.enter,
  LogicalKeyboardKey.space: MenuKey.space,
  LogicalKeyboardKey.escape: MenuKey.escape,
  LogicalKeyboardKey.tab: MenuKey.tab,
};

/// The state of one open menu and its submenus, and what every level does
/// with keys, pointers and focus.
class MenuSession<T> extends ChangeNotifier {
  /// Creates a session. [onSelected] and [direction] are read when used, so
  /// a replaced callback is the one called.
  MenuSession({
    required this.triggerFocus,
    required this.onSelected,
    required this.direction,
    this.keepsUnusedArrows = false,
    this.returnFocus,
  });

  /// Whether the side arrows no level used stop at the menu. A Dropdown
  /// Menu keeps them, since nothing above it takes them; a Menubar lets them
  /// through to move between its top menus.
  final bool keepsUnusedArrows;

  /// The control that opens the menu and takes focus back when it closes.
  final FocusNode triggerFocus;

  /// Where focus returns when the menu closes, when that is not
  /// [triggerFocus]: a Context Menu returns it to the control that had it
  /// before the menu opened.
  final ValueGetter<FocusNode?>? returnFocus;

  /// The current selection callback.
  final ValueGetter<ValueChanged<T>?> onSelected;

  /// The current reading direction.
  final ValueGetter<TextDirection> direction;

  /// The controller of the root menu's anchor.
  final MenuController root = MenuController();

  MenuTree<T> _tree = MenuTree<T>(const []);
  MenuNavState<T> _nav = MenuNavState<T>();
  final Map<T, FocusNode> _focus = {};
  final Map<T, MenuController> _anchors = {};
  final Map<int, GlobalKey> _panels = {};
  bool _disposed = false;

  Timer? _hoverTimer;
  T? _hovered;
  _Grace? _grace;
  Timer? _graceTimer;
  String _query = '';
  List<T>? _queryScope;
  Timer? _queryTimer;

  /// The menu tree.
  MenuTree<T> get tree => _tree;

  /// Whether the root menu is open.
  bool get isOpen => _nav.open;

  /// The focused stop.
  T? get activeValue => _nav.activeValue;

  /// The open submenus, from the root outward.
  List<T> get openPath => _nav.openPath;

  /// Replaces the entries. A value on the open path that is gone cuts the
  /// path there, silently. Called while building, so it does not notify.
  set entries(List<MenuEntry<T>> entries) {
    if (identical(entries, _tree.entries)) return;
    _tree = MenuTree(entries);
    for (final value in _focus.keys.toList()) {
      if (_tree.find(value) == null) _focus.remove(value)?.dispose();
    }
    final old = _nav;
    _nav = _tree.resolve(_nav);
    if (old.openPath.length != _nav.openPath.length) {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!_disposed) _syncAnchors(old, _nav);
      });
    }
  }

  /// The focus node of the stop [value].
  FocusNode focusNodeFor(T value) => _focus.putIfAbsent(
    value,
    () => FocusNode(debugLabel: 'Menu item $value'),
  );

  /// The key of the panel at [depth], for measuring it.
  GlobalKey panelKey(int depth) => _panels.putIfAbsent(depth, GlobalKey.new);

  /// The actions every item of every level runs its keys through.
  late final Map<Type, Action<Intent>> actions = {
    RovingKeyIntent: RovingKeyAction(handles: _handles, onKey: _onKey),
  };

  @override
  void dispose() {
    _disposed = true;
    _hoverTimer?.cancel();
    _graceTimer?.cancel();
    _queryTimer?.cancel();
    for (final node in _focus.values) {
      node.dispose();
    }
    super.dispose();
  }

  // State and anchors.

  void _set(MenuNavState<T> next) {
    final old = _nav;
    _nav = _tree.resolve(next);
    if (_nav == old) return;
    _syncAnchors(old, _nav);
    notifyListeners();
    _focusActive();
  }

  void _syncAnchors(MenuNavState<T> old, MenuNavState<T> next) {
    if (!next.open) {
      if (root.isOpen) {
        root
          ..closeChildren()
          ..close();
      }
      return;
    }
    if (!root.isOpen) root.open();
    var keep = 0;
    final shorter = math.min(old.openPath.length, next.openPath.length);
    while (keep < shorter && old.openPath[keep] == next.openPath[keep]) {
      keep++;
    }
    // Deepest first, so no level outlives the one it opened from.
    for (var i = old.openPath.length - 1; i >= keep; i--) {
      _anchors[old.openPath[i]]?.close();
    }
    for (var i = keep; i < next.openPath.length; i++) {
      _anchors[next.openPath[i]]?.open();
    }
  }

  void _focusActive() {
    final value = _nav.activeValue;
    if (!_nav.open || value == null) return;
    void apply() {
      final node = _focus[value];
      final context = node?.context;
      if (_disposed ||
          _nav.activeValue != value ||
          context == null ||
          !context.mounted) {
        return;
      }
      if (!node!.hasPrimaryFocus) node.requestFocus();
      for (final policy in [
        ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
        ScrollPositionAlignmentPolicy.keepVisibleAtStart,
      ]) {
        unawaited(Scrollable.ensureVisible(context, alignmentPolicy: policy));
      }
    }

    final context = _focus[value]?.context;
    if (context != null && context.mounted) {
      apply();
    } else {
      // A level that has just opened builds its items in the next frame.
      SchedulerBinding.instance.addPostFrameCallback((_) => apply());
    }
  }

  /// Opens the root menu on its first enabled stop, or its last when [last].
  void open({bool last = false}) {
    if (_nav.open) return;
    _set(_tree.openRoot(last: last));
  }

  /// Closes every level. After the root is closed, focus returns to the
  /// trigger when [returnFocus], then [selected] is reported, then [after]
  /// runs.
  void close({bool returnFocus = true, T? selected, VoidCallback? after}) {
    _hoverTimer?.cancel();
    _endGrace();
    _query = '';
    final wasOpen = _nav.open;
    _set(MenuNavState<T>());
    if (!wasOpen && selected == null) return;
    SchedulerBinding.instance
      ..addPostFrameCallback((_) {
        if (_disposed) return;
        if (returnFocus) {
          // A control that has left the tree since gives way to the trigger.
          final target = this.returnFocus?.call();
          final attached = target?.context != null && target!.canRequestFocus;
          (attached ? target : triggerFocus).requestFocus();
          // Focus is back on the trigger before the report, so a dialog the
          // report opens returns focus there (ADR 0016).
          FocusManager.instance.applyFocusChangesIfNeeded();
        }
        if (selected != null) onSelected()?.call(selected);
        after?.call();
      })
      ..ensureVisualUpdate();
  }

  /// Activates an item by pointer: closes every level, then reports it.
  void select(T value) {
    final stop = _tree.find(value)?.stop;
    if (stop is! MenuItem<T> || isStopDisabled(stop)) return;
    close(selected: value);
  }

  /// A press outside every level: they all close and focus is not moved
  /// back. Focus leaves the menu for its scope, as a press on an empty page
  /// leaves it nowhere on the web, instead of falling back to the trigger.
  void pressOutside() {
    if (!_nav.open) return;
    if (_focus.values.any((node) => node.hasPrimaryFocus)) {
      FocusManager.instance.primaryFocus?.unfocus(
        disposition: UnfocusDisposition.scope,
      );
    }
    close(returnFocus: false);
  }

  /// The root anchor closed by itself (the view resized or scrolled).
  void rootClosed() {
    if (!_nav.open) return;
    final focusInside = _focus.values.any((node) => node.hasFocus);
    close(returnFocus: focusInside);
  }

  /// The submenu anchor of [value] closed by itself.
  void anchorClosed(T value) {
    final at = _nav.openPath.indexOf(value);
    if (at == -1) return;
    _set(_tree.closeLevel(_nav, _nav.openPath.sublist(0, at + 1)));
  }

  /// Records the controller of the submenu anchor of [value].
  void attachAnchor(T value, MenuController controller) =>
      _anchors[value] = controller;

  /// Forgets the controller of the submenu anchor of [value].
  void detachAnchor(T value, MenuController controller) {
    if (_anchors[value] == controller) _anchors.remove(value);
  }

  // Keys.

  bool _handles(RovingKeyIntent intent) {
    if (!_nav.open) return false;
    final key = _menuKeys[intent.key];
    if (key == null) return false;
    // Tab closes the menu and moves focus on from the trigger.
    if (key == MenuKey.tab) return true;
    return _tree.key(_nav, key, direction()).handled;
  }

  void _onKey(RovingKeyIntent intent) {
    final key = _menuKeys[intent.key]!;
    if (key == MenuKey.tab) {
      close(
        returnFocus: false,
        after: () => intent.shift
            ? triggerFocus.previousFocus()
            : triggerFocus.nextFocus(),
      );
      triggerFocus.requestFocus();
      return;
    }
    final result = _tree.key(_nav, key, direction());
    final selected = result.selected;
    if (!result.state.open) return close(selected: selected);
    _set(result.state);
    // Space on a checkable item: reported now, with every level still open.
    if (selected != null) onSelected()?.call(selected);
  }

  /// Typeahead over the level that has focus, and the side arrows no level
  /// used, when [keepsUnusedArrows].
  KeyEventResult onPanelKey(KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final character = typedCharacter(event);
    if (character != null) {
      _typeahead(character);
      return KeyEventResult.handled;
    }
    final arrow =
        event.logicalKey == LogicalKeyboardKey.arrowLeft ||
        event.logicalKey == LogicalKeyboardKey.arrowRight;
    return keepsUnusedArrows && arrow
        ? KeyEventResult.handled
        : KeyEventResult.ignored;
  }

  void _typeahead(String character) {
    final active = _nav.activeValue;
    final scope = active == null
        ? _nav.openPath
        : _tree.find(active)?.path ?? const [];
    // The query restarts when focus changes level.
    if (!listEquals(_queryScope, scope)) _query = '';
    _queryScope = scope;
    _query += character;
    _queryTimer?.cancel();
    _queryTimer = Timer(typeaheadReset, () => _query = '');
    final match = MenuTree.matchItem(_tree.entriesAt(scope), _query, active);
    if (match != null) _set(_nav.copyWith(activeValue: match));
  }

  // Pointer.

  /// The mouse entered the stop [value].
  void pointerEnter(T value, PointerEnterEvent event) {
    if (event.kind != PointerDeviceKind.mouse) return;
    _hovered = value;
    // Items crossed inside the grace area take no focus and open nothing.
    if (_grace?.contains(event.position) ?? false) return;
    _endGrace();
    _hover(value);
  }

  /// The mouse left the stop [value].
  void pointerExit(T value, PointerExitEvent event) {
    if (event.kind != PointerDeviceKind.mouse) return;
    if (_hovered == value) _hovered = null;
    final at = _tree.find(value);
    if (at == null) return;
    // Leaving a closed trigger before the delay cancels its opening.
    if (!_nav.openPath.contains(value)) {
      _hoverTimer?.cancel();
      return;
    }
    final panel = panelKey(at.path.length + 1).currentContext;
    final box = panel?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final submenu = box.localToGlobal(Offset.zero) & box.size;
    _grace = _Grace(
      exit: event.position,
      submenu: submenu,
      onRight: submenu.center.dx >= event.position.dx,
    );
    _graceTimer?.cancel();
    _graceTimer = Timer(graceRest, _resumeHover);
  }

  /// The mouse moved over a panel.
  void pointerHover(PointerHoverEvent event) {
    final grace = _grace;
    if (grace == null || event.kind != PointerDeviceKind.mouse) return;
    if (grace.contains(event.position)) {
      _graceTimer?.cancel();
      _graceTimer = Timer(graceRest, _resumeHover);
    } else {
      _resumeHover();
    }
  }

  /// The mouse entered the panel at [depth].
  void pointerEnterPanel(int depth) {
    if (depth > 0) _endGrace();
  }

  void _endGrace() {
    _grace = null;
    _graceTimer?.cancel();
  }

  void _resumeHover() {
    _endGrace();
    final hovered = _hovered;
    if (hovered != null) _hover(hovered);
  }

  void _hover(T value) {
    final at = _tree.find(value);
    if (at == null || !_nav.open) return;
    final disabled = isStopDisabled(at.stop);
    if (!disabled && _nav.activeValue != value) {
      _set(_nav.copyWith(activeValue: value));
    }
    _hoverTimer?.cancel();
    final level = at.path;
    final path = _nav.openPath;
    final opensHere = at.stop is MenuSubmenu<T> && !disabled;
    final siblingOpen =
        path.length > level.length && path[level.length] != value;
    if (opensHere && !path.contains(value)) {
      _hoverTimer = Timer(submenuHoverDelay, () {
        final next = _tree.openSubmenu(_nav, value, focusFirst: false);
        if (next != null) _set(next);
      });
    } else if (siblingOpen) {
      _hoverTimer = Timer(submenuHoverDelay, () {
        if (_nav.openPath.length > level.length) {
          _set(_nav.copyWith(openPath: level, activeValue: _nav.activeValue));
        }
      });
    }
  }

  /// A press on the submenu trigger [value] by a pointer of [kind]: it opens
  /// a closed submenu; a finger or a pen closes an open one, a mouse keeps it
  /// open, since hover has usually opened it a moment before.
  void pressSubmenu(T value, PointerDeviceKind kind) {
    final at = _tree.find(value);
    if (at == null || isStopDisabled(at.stop)) return;
    _hoverTimer?.cancel();
    if (!_nav.openPath.contains(value)) {
      final next = _tree.openSubmenu(_nav, value, focusFirst: false);
      if (next != null) _set(next.copyWith(activeValue: value));
    } else if (kind != PointerDeviceKind.mouse) {
      _set(_nav.copyWith(openPath: at.path, activeValue: value));
    } else {
      _set(_nav.copyWith(activeValue: value));
    }
  }
}

class _Grace {
  const _Grace({
    required this.exit,
    required this.submenu,
    required this.onRight,
  });

  final Offset exit;
  final Rect submenu;
  final bool onRight;

  bool contains(Offset point) =>
      isInGraceArea(point, exit, submenu, submenuOnRight: onRight);
}

// Sizes the web menus set in their own stylesheet.
const double _panelPadding = 4;
const double _panelBorder = 1;
const double _panelMinWidth = 192;
const EdgeInsets _itemPadding = EdgeInsets.symmetric(
  horizontal: 8.8,
  vertical: 7.2,
);
const double _itemGap = 8;
const double _checkSize = 16;
const double _groupLabelSize = 12;

/// One open level of a menu: the root menu or a submenu, at [path].
class MenuPanel<T> extends StatelessWidget {
  /// Creates the panel of the level [path] opens.
  const MenuPanel({
    super.key,
    required this.session,
    required this.path,
    required this.semanticLabel,
    required this.tapRegionGroupId,
  });

  /// The menu's session.
  final MenuSession<T> session;

  /// The submenu values that lead to this level; empty for the root menu.
  final List<T> path;

  /// The accessible name: the trigger's label.
  final String semanticLabel;

  /// The tap region group every level and the trigger share.
  final Object tapRegionGroupId;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final root = path.isEmpty;
    return TapRegion(
      groupId: tapRegionGroupId,
      // A press outside every level closes them all; focus stays where the
      // press put it.
      onTapOutside: root ? (_) => session.pressOutside() : null,
      child: MouseRegion(
        onEnter: (_) => session.pointerEnterPanel(path.length),
        onHover: session.pointerHover,
        child: Focus(
          canRequestFocus: false,
          skipTraversal: true,
          onKeyEvent: (_, event) => session.onPanelKey(event),
          child: Semantics(
            container: true,
            explicitChildNodes: true,
            role: SemanticsRole.menu,
            label: semanticLabel,
            child: DecoratedBox(
              key: session.panelKey(path.length),
              decoration: BoxDecoration(
                color: theme.colors.background,
                border: Border.all(
                  color: theme.colors.border,
                  width: _panelBorder,
                ),
                borderRadius: BorderRadius.circular(
                  InvisibleRadiusTokens.surface,
                ),
                boxShadow: overlayShadow(theme.brightness),
              ),
              child: Padding(
                padding: const EdgeInsets.all(_panelBorder),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(
                    InvisibleRadiusTokens.surface - _panelBorder,
                  ),
                  child: ListenableBuilder(
                    listenable: session,
                    builder: (context, _) => _levelItems(context),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _levelItems(BuildContext context) {
    final entries = session.tree.entriesAt(path);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(_panelPadding),
      child: LayoutBuilder(
        builder: (context, constraints) => ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: math.min(_panelMinWidth, constraints.maxWidth),
          ),
          child: IntrinsicWidth(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [for (final entry in entries) _entry(context, entry)],
            ),
          ),
        ),
      ),
    );
  }

  Widget _entry(BuildContext context, MenuEntry<T> entry) {
    final theme = InvisibleTheme.of(context);
    return switch (entry) {
      MenuSeparator() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.8, horizontal: 2.4),
        child: SizedBox(
          height: 1,
          child: ColoredBox(color: theme.colors.border),
        ),
      ),
      MenuGroup(:final label, :final items) => Semantics(
        container: true,
        explicitChildNodes: true,
        label: label,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ExcludeSemantics(
              child: Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(
                  8.8,
                  5.6,
                  8.8,
                  3.2,
                ),
                child: Text(
                  label,
                  style: theme.textStyle.copyWith(
                    fontSize: _groupLabelSize,
                    fontWeight: FontWeight.w600,
                    color: theme.colors.textSecondary,
                  ),
                ),
              ),
            ),
            for (final stop in items) _stop(stop, checkSlot: true),
          ],
        ),
      ),
      MenuStop() => _stop(entry, checkSlot: false),
    };
  }

  Widget _stop(MenuStop<T> stop, {required bool checkSlot}) {
    final tile = _MenuItemTile<T>(
      session: session,
      stop: stop,
      // The tick sits in a fixed column so labels line up; outside a group
      // only a checkable item keeps the column.
      checkSlot:
          checkSlot ||
          (stop is MenuItem<T> && stop.kind != MenuItemKind.action),
    );
    return switch (stop) {
      MenuSubmenu() => _SubmenuAnchor<T>(
        key: ValueKey(stop.value),
        session: session,
        submenu: stop,
        path: path,
        child: tile,
      ),
      MenuItem() => KeyedSubtree(key: ValueKey(stop.value), child: tile),
    };
  }
}

/// The anchor of one submenu: its controller, nested in the parent level.
class _SubmenuAnchor<T> extends StatefulWidget {
  const _SubmenuAnchor({
    super.key,
    required this.session,
    required this.submenu,
    required this.path,
    required this.child,
  });

  final MenuSession<T> session;
  final MenuSubmenu<T> submenu;
  final List<T> path;
  final Widget child;

  @override
  State<_SubmenuAnchor<T>> createState() => _SubmenuAnchorState<T>();
}

class _SubmenuAnchorState<T> extends State<_SubmenuAnchor<T>> {
  final MenuController _controller = MenuController();

  @override
  void initState() {
    super.initState();
    widget.session.attachAnchor(widget.submenu.value, _controller);
  }

  @override
  void dispose() {
    widget.session.detachAnchor(widget.submenu.value, _controller);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final value = widget.submenu.value;
    return RawMenuAnchor(
      controller: _controller,
      onClose: () => widget.session.anchorClosed(value),
      overlayBuilder: (context, info) => CustomSingleChildLayout(
        delegate: SubmenuLayout(
          // The submenu's first item lines up with its trigger.
          anchor: info.anchorRect.translate(0, -_panelPadding - _panelBorder),
          direction: Directionality.of(context),
        ),
        child: MenuPanel<T>(
          session: widget.session,
          path: [...widget.path, value],
          semanticLabel: widget.submenu.label,
          tapRegionGroupId: info.tapRegionGroupId,
        ),
      ),
      child: widget.child,
    );
  }
}

/// Applies [placeSubmenu]: inline-end, flipping to inline-start, overlapping
/// the parent on a narrow screen, shifted inside the overlay. A submenu sits
/// beside its trigger; a Context Menu beside the point it was opened at.
class SubmenuLayout extends SingleChildLayoutDelegate {
  /// Places the menu beside [anchor], in the overlay's coordinates.
  const SubmenuLayout({required this.anchor, required this.direction});

  /// The rectangle the menu opens beside.
  final Rect anchor;

  /// The reading direction, which decides the inline-end.
  final TextDirection direction;

  static const double _edge = 8;

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    final viewport = constraints.biggest;
    return BoxConstraints(
      maxWidth: math.max(0, viewport.width - _edge * 2),
      maxHeight: math.max(0, viewport.height - _edge * 2),
    );
  }

  @override
  Offset getPositionForChild(Size size, Size childSize) => placeSubmenu(
    anchor: anchor,
    menu: childSize,
    viewport: size,
    direction: direction,
    padding: _edge,
  ).offset;

  @override
  bool shouldRelayout(SubmenuLayout old) =>
      old.anchor != anchor || old.direction != direction;
}

/// One stop of a level: an item or a submenu trigger.
class _MenuItemTile<T> extends StatefulWidget {
  const _MenuItemTile({
    required this.session,
    required this.stop,
    required this.checkSlot,
  });

  final MenuSession<T> session;
  final MenuStop<T> stop;
  final bool checkSlot;

  @override
  State<_MenuItemTile<T>> createState() => _MenuItemTileState<T>();
}

class _MenuItemTileState<T> extends State<_MenuItemTile<T>> {
  bool _focusVisible = false;
  bool _focused = false;
  bool _hovered = false;
  PointerDeviceKind _pressKind = PointerDeviceKind.mouse;

  void _press() {
    final stop = widget.stop;
    if (stop is MenuSubmenu<T>) {
      widget.session.pressSubmenu(stop.value, _pressKind);
    } else {
      widget.session.select(stop.value);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final session = widget.session;
    final stop = widget.stop;
    final disabled = isStopDisabled(stop);
    final item = stop is MenuItem<T> ? stop : null;
    final submenu = stop is MenuSubmenu<T>;
    final expanded = submenu && session.openPath.contains(stop.value);
    final checkable = item != null && item.kind != MenuItemKind.action;
    final foreground = disabled ? theme.colors.textDisabled : theme.colors.text;
    final fontSize = theme.textStyle.fontSize!;
    final highlighted = !disabled && (_hovered || _focused || expanded);

    final row = IconTheme(
      data: IconThemeData(
        color: foreground,
        size: _checkSize,
        applyTextScaling: true,
      ),
      child: Row(
        children: [
          if (widget.checkSlot) ...[
            SizedBox.square(
              dimension: MediaQuery.textScalerOf(context).scale(_checkSize),
              child: checkable && item.checked
                  ? const Glyph(GlyphShape.check)
                  : null,
            ),
            const SizedBox(width: _itemGap),
          ],
          Expanded(
            child: Text(
              stop.label,
              style: theme.textStyle.copyWith(color: foreground),
            ),
          ),
          if (submenu) ...[
            const SizedBox(width: _itemGap),
            IconTheme.merge(
              data: IconThemeData(size: fontSize * 1.1),
              child: const Glyph(GlyphShape.chevronEnd),
            ),
          ],
        ],
      ),
    );

    final radius = BorderRadius.circular(theme.controlRadius);
    final ring = theme.focusRing;
    // A mouse resting on the item already marks it.
    final ringVisible = _focusVisible && !_hovered;
    final surface = DecoratedBox(
      decoration: BoxDecoration(
        color: highlighted ? theme.colors.stateHover : null,
        borderRadius: radius,
        // The menu clips its items, so the focus ring goes inside.
        border: ringVisible
            ? Border.all(color: ring.color, width: ring.width)
            : null,
      ),
      // The ring paints over the padding, so the label never moves.
      child: Padding(padding: _itemPadding, child: row),
    );

    final target = theme.minTargetSize;
    return Semantics(
      container: true,
      role: switch (item?.kind) {
        MenuItemKind.checkbox => SemanticsRole.menuItemCheckbox,
        MenuItemKind.radio => SemanticsRole.menuItemRadio,
        _ => SemanticsRole.menuItem,
      },
      label: stop.label,
      hint: submenu ? theme.messages.submenuHint : null,
      expanded: submenu ? expanded : null,
      checked: checkable ? item.checked : null,
      inMutuallyExclusiveGroup: item?.kind == MenuItemKind.radio ? true : null,
      enabled: !disabled,
      focusable: !disabled,
      focused: _focused,
      onTap: disabled ? null : _press,
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: !disabled,
          focusNode: session.focusNodeFor(stop.value),
          shortcuts: menuShortcuts,
          actions: session.actions,
          mouseCursor: disabled
              ? SystemMouseCursors.forbidden
              : SystemMouseCursors.click,
          onFocusChange: (focused) => setState(() => _focused = focused),
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: MouseRegion(
            onEnter: (event) {
              setState(() => _hovered = true);
              session.pointerEnter(stop.value, event);
            },
            onExit: (event) {
              setState(() => _hovered = false);
              session.pointerExit(stop.value, event);
            },
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTapDown: (details) =>
                  _pressKind = details.kind ?? PointerDeviceKind.mouse,
              onTap: disabled ? null : _press,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: target.width,
                  minHeight: target.height,
                ),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  heightFactor: 1,
                  child: surface,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
