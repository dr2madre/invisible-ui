import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/focus_ring.dart';
import '../menu/menu_entry.dart';
import '../menu/menu_layer.dart';
import '../theme/theme.dart';

// The web Context Menu's timing and offset: a long press of 500 ms that a
// move of more than 10 px cancels, and a menu 2 px away from the pointer.
const Duration _longPress = Duration(milliseconds: 500);
const double _moveTolerance = 10;
const double _pointerGap = 2;

/// A menu of actions opened on a region, at the pointer, following the
/// WAI-ARIA menu pattern.
///
/// A secondary click on [child] opens the menu where it was pressed; on a
/// touch screen, a long press of 500 ms does. The keyboard opens it with
/// Shift+F10 or the context menu key while the region has focus, at the
/// region's inline-start top corner. Opening it again moves it to the new
/// point. The menu opens toward the inline-end of the point, flips toward
/// the inline-start when there is no room, and shifts to stay inside the
/// screen.
///
/// [items] holds items, checkbox and radio items, groups, separators and
/// submenus ([MenuEntry]), with the keys, hover and touch rules of
/// [DropdownMenu]. Activating an item closes every level, returns focus to
/// the control that had it before the menu opened, and then calls
/// [onSelected] with its value, once. Escape in the menu returns focus there
/// too; Tab moves on from the region.
class ContextMenu<T> extends StatefulWidget {
  /// Creates a context menu over [child].
  const ContextMenu({
    super.key,
    required this.items,
    required this.child,
    this.onSelected,
    this.enabled = true,
    this.label,
  });

  /// What the menu holds, in order. Values are unique across the tree.
  final List<MenuEntry<T>> items;

  /// The region the menu opens on. It takes focus, so the keyboard can open
  /// the menu.
  final Widget child;

  /// Called with the chosen item's value.
  final ValueChanged<T>? onSelected;

  /// Whether the menu opens.
  final bool enabled;

  /// The menu's accessible name, since no trigger names it. Defaults to
  /// [InvisibleMessages.contextMenuLabel].
  final String? label;

  @override
  State<ContextMenu<T>> createState() => _ContextMenuState<T>();
}

class _OpenContextMenuIntent extends Intent {
  const _OpenContextMenuIntent();
}

class _ContextMenuState<T> extends State<ContextMenu<T>> {
  final FocusNode _region = FocusNode(debugLabel: 'Context Menu region');
  late final MenuSession<T> _session = MenuSession<T>(
    triggerFocus: _region,
    onSelected: () => widget.onSelected,
    direction: () => Directionality.of(context),
    keepsUnusedArrows: true,
    returnFocus: () => _returnTo,
  )..entries = widget.items;

  // Where the menu opens, in the region's coordinates.
  Offset _point = Offset.zero;
  // The control that had focus before the menu opened.
  FocusNode? _returnTo;
  bool _focusVisible = false;

  Timer? _pressTimer;
  Offset? _pressStart;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.f10, shift: true):
        _OpenContextMenuIntent(),
    SingleActivator(LogicalKeyboardKey.contextMenu): _OpenContextMenuIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    _OpenContextMenuIntent: CallbackAction<_OpenContextMenuIntent>(
      onInvoke: (_) => _openAtStart(),
    ),
  };

  @override
  void didUpdateWidget(ContextMenu<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _session.entries = widget.items;
    if (!widget.enabled && _session.isOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _session.close());
    }
  }

  @override
  void dispose() {
    _pressTimer?.cancel();
    _session.dispose();
    _region.dispose();
    super.dispose();
  }

  /// Opens the menu at [point], in the region's coordinates, or moves it
  /// there when it is open.
  void _openAt(Offset point) {
    if (!widget.enabled || !mounted) return;
    if (_session.isOpen) {
      _session.close(returnFocus: false);
    } else {
      // A focus scope holding focus itself means nothing had it: focus then
      // returns to the region.
      final focused = FocusManager.instance.primaryFocus;
      _returnTo = focused is FocusScopeNode ? null : focused;
    }
    setState(() => _point = point);
    _session.open();
  }

  /// Opens the menu from the keyboard, at the region's inline-start top
  /// corner.
  void _openAtStart() {
    final box = context.findRenderObject() as RenderBox?;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    _openAt(Offset(rtl && box != null ? box.size.width : 0, 0));
  }

  void _pointerDown(PointerDownEvent event) {
    if (event.kind != PointerDeviceKind.touch) return;
    _pressTimer?.cancel();
    final at = event.localPosition;
    _pressStart = at;
    _pressTimer = Timer(_longPress, () => _openAt(at));
  }

  void _pointerMove(PointerMoveEvent event) {
    final start = _pressStart;
    if (start == null) return;
    final moved = event.localPosition - start;
    if (moved.dx.abs() > _moveTolerance || moved.dy.abs() > _moveTolerance) {
      _cancelPress();
    }
  }

  void _cancelPress([PointerEvent? _]) {
    _pressTimer?.cancel();
    _pressStart = null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return RawMenuAnchor(
      controller: _session.root,
      onClose: _session.rootClosed,
      overlayBuilder: (context, info) {
        final point = info.anchorRect.topLeft + _point;
        return CustomSingleChildLayout(
          delegate: SubmenuLayout(
            // A thin rectangle at the point, so the menu keeps its gap on
            // either side.
            anchor: Rect.fromLTRB(
              point.dx - _pointerGap,
              point.dy,
              point.dx + _pointerGap,
              point.dy,
            ),
            direction: Directionality.of(context),
          ),
          child: MenuPanel<T>(
            session: _session,
            path: const [],
            semanticLabel: widget.label ?? theme.messages.contextMenuLabel,
            tapRegionGroupId: info.tapRegionGroupId,
          ),
        );
      },
      child: Semantics(
        container: true,
        // A long press is how assistive technology opens it on touch.
        onLongPress: widget.enabled ? _openAtStart : null,
        child: FocusableActionDetector(
          focusNode: _region,
          shortcuts: _shortcuts,
          actions: _actions,
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: Listener(
            onPointerDown: _pointerDown,
            onPointerMove: _pointerMove,
            onPointerUp: _cancelPress,
            onPointerCancel: _cancelPress,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onSecondaryTapUp: (details) => _openAt(details.localPosition),
              child: FocusRingPainter(
                visible: _focusVisible,
                ring: theme.focusRing,
                radius: theme.controlRadius,
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
