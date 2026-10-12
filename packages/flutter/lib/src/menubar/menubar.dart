// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/anchored_layout.dart';
import '../internal/focus_ring.dart';
import '../internal/roving.dart';
import '../menu/menu_entry.dart';
import '../menu/menu_layer.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'menubar_nav.dart';

// Sizes the web Menubar sets in its own stylesheet.
const double _barGap = 2;
const double _barPadding = 4;
const double _borderWidth = 1;
const EdgeInsets _triggerPadding = EdgeInsets.symmetric(
  horizontal: 10,
  vertical: 6,
);

/// One top menu of a [Menubar]: its trigger's label and what it holds.
@immutable
class MenubarMenu<T> {
  /// Creates a top menu.
  const MenubarMenu({
    required this.value,
    required this.label,
    required this.items,
    this.disabled = false,
  });

  /// The identity of the menu, reported with the chosen item. Unique among
  /// the bar's menus.
  final T value;

  /// The trigger's text and the menu's accessible name.
  final String label;

  /// Items, groups, separators and submenus, in order. Values are unique
  /// within the menu's tree.
  final List<MenuEntry<T>> items;

  /// Whether the menu never opens. Its trigger still takes focus.
  final bool disabled;
}

/// A horizontal bar of menus, such as File, Edit and View, following the
/// WAI-ARIA menubar pattern.
///
/// The bar is one tab stop. On a trigger, the left and right arrows move
/// between triggers, wrapping, and Home and End jump to the ends; Down,
/// Enter and Space open the menu on its first item and Up on its last. In an
/// open menu the keys of a [DropdownMenu] apply, and an arrow the menu does
/// not use goes to the bar: the arrow toward the inline-end on an item that
/// opens no submenu opens the next top menu, and the arrow toward the
/// inline-start in a top menu opens the previous one. The arrows follow the
/// reading direction.
///
/// While a menu is open, the pointer resting on another trigger opens that
/// one instead. Activating an item closes every level, returns focus to the
/// menu's trigger and then calls [onSelected] with the menu's and the item's
/// values, once.
class Menubar<T> extends StatefulWidget {
  /// Creates a bar of [menus] named [label].
  const Menubar({
    super.key,
    required this.label,
    required this.menus,
    this.onSelected,
  });

  /// The accessible name of the bar.
  final String label;

  /// The top menus, in order.
  final List<MenubarMenu<T>> menus;

  /// Called with the menu's value and the chosen item's value.
  final void Function(T menu, T item)? onSelected;

  @override
  State<Menubar<T>> createState() => _MenubarState<T>();
}

/// A top menu's trigger focus and menu session, kept across rebuilds by the
/// menu's value.
class _Top<T> {
  _Top(this.value, _MenubarState<T> bar)
    : trigger = FocusNode(debugLabel: 'Menubar trigger $value') {
    session = MenuSession<T>(
      triggerFocus: trigger,
      // Read at the activation, so a replaced callback is the one called.
      onSelected: () {
        final report = bar.widget.onSelected;
        return report == null ? null : (item) => report(value, item);
      },
      direction: () => Directionality.of(bar.context),
    );
  }

  final T value;
  final FocusNode trigger;
  late final MenuSession<T> session;

  void dispose() {
    session.dispose();
    trigger.dispose();
  }
}

class _MenubarState<T> extends State<Menubar<T>> {
  final Map<T, _Top<T>> _tops = {};
  // The menus shown, each with its session; a repeated value shows once.
  List<(MenubarMenu<T>, _Top<T>)> _order = const [];
  int _focusedIndex = 0;

  @override
  void initState() {
    super.initState();
    _sync();
  }

  @override
  void didUpdateWidget(Menubar<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  /// Matches the sessions to the menus: new menus get one, menus that are
  /// gone give theirs up after this frame, when nothing builds with it.
  void _sync() {
    final values = <T>{};
    _order = [
      for (final menu in widget.menus)
        if (values.add(menu.value))
          (
            menu,
            (_tops[menu.value] ??= _Top(menu.value, this))
              ..session.entries = menu.items,
          ),
    ];
    assert(
      values.length == widget.menus.length,
      'Menubar menu values must be unique.',
    );
    for (final value in _tops.keys.toList()) {
      if (values.contains(value)) continue;
      final gone = _tops.remove(value)!;
      WidgetsBinding.instance.addPostFrameCallback((_) => gone.dispose());
    }
  }

  @override
  void dispose() {
    for (final top in _tops.values) {
      top.dispose();
    }
    super.dispose();
  }

  int get _openIndex => _order.indexWhere((entry) => entry.$2.session.isOpen);

  MenubarNav get _nav => MenubarNav(
    disabled: [for (final (menu, _) in _order) menu.disabled],
    focusedIndex: _focusedIndex,
    openIndex: _openIndex,
  );

  /// Carries out what the bar asked for: close the menu open before, then
  /// open the new one, on its last item when [last], or focus a trigger.
  void _apply(MenubarStep step, {bool last = false}) {
    final open = _openIndex;
    if (step.focusedIndex != _focusedIndex) {
      setState(() => _focusedIndex = step.focusedIndex);
    }
    if (open != -1 && open != step.openIndex) {
      _order[open].$2.session.close(returnFocus: false);
    }
    if (step.openIndex != -1 && step.openIndex != open) {
      _order[step.openIndex].$2.session.open(last: last);
    }
    if (step.focus case final index?) _order[index].$2.trigger.requestFocus();
  }

  void _openAt(int index, {bool last = false}) =>
      _apply(_nav.openAt(index), last: last);

  void _press(int index) {
    final session = _order[index].$2.session;
    if (session.isOpen) {
      session.close();
    } else {
      _openAt(index);
    }
  }

  // The keys the open menu or a trigger left unused reach the bar here.
  KeyEventResult _onKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) {
      return KeyEventResult.ignored;
    }
    final key = switch (event.logicalKey) {
      LogicalKeyboardKey.arrowLeft => MenubarKey.arrowLeft,
      LogicalKeyboardKey.arrowRight => MenubarKey.arrowRight,
      LogicalKeyboardKey.home => MenubarKey.home,
      LogicalKeyboardKey.end => MenubarKey.end,
      _ => null,
    };
    if (key == null) return KeyEventResult.ignored;
    final step = _nav.key(key, Directionality.of(context));
    if (!step.handled) return KeyEventResult.ignored;
    _apply(step);
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final focused = _nav.focusedIndex;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.menuBar,
      label: widget.label,
      child: Focus(
        canRequestFocus: false,
        skipTraversal: true,
        onKeyEvent: _onKey,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.colors.background,
            border: Border.all(color: theme.colors.border, width: _borderWidth),
            borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
          ),
          child: Padding(
            padding: const EdgeInsets.all(_barPadding),
            // A bar wider than its parent wraps onto more rows.
            child: Wrap(
              spacing: _barGap,
              runSpacing: _barGap,
              children: [
                for (final (index, (menu, top)) in _order.indexed)
                  _menu(index, menu, top, tabStop: index == focused),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _menu(
    int index,
    MenubarMenu<T> menu,
    _Top<T> top, {
    required bool tabStop,
  }) {
    final session = top.session;
    return RawMenuAnchor(
      key: ValueKey(menu.value),
      controller: session.root,
      childFocusNode: top.trigger,
      onClose: session.rootClosed,
      overlayBuilder: (context, info) => CustomSingleChildLayout(
        delegate: AnchoredLayout(
          anchor: info.anchorRect,
          side: AnchorSide.bottom,
          direction: Directionality.of(context),
        ),
        child: MenuPanel<T>(
          session: session,
          path: const [],
          semanticLabel: menu.label,
          tapRegionGroupId: info.tapRegionGroupId,
        ),
      ),
      // One tab stop: the other triggers take focus from the arrows only.
      child: Focus(
        canRequestFocus: false,
        skipTraversal: true,
        descendantsAreTraversable: tabStop,
        child: ListenableBuilder(
          listenable: session,
          builder: (context, _) => _MenubarTrigger(
            label: menu.label,
            enabled: !menu.disabled,
            open: session.isOpen,
            focusNode: top.trigger,
            onPressed: () => _press(index),
            onOpen: ({bool last = false}) => _openAt(index, last: last),
            onFocused: () {
              if (_focusedIndex != index) setState(() => _focusedIndex = index);
            },
            onPointerEnter: () => _apply(_nav.pointerEnter(index)),
          ),
        ),
      ),
    );
  }
}

class _MenubarTrigger extends StatefulWidget {
  const _MenubarTrigger({
    required this.label,
    required this.enabled,
    required this.open,
    required this.focusNode,
    required this.onPressed,
    required this.onOpen,
    required this.onFocused,
    required this.onPointerEnter,
  });

  final String label;
  final bool enabled;
  final bool open;
  final FocusNode focusNode;
  final VoidCallback onPressed;
  final void Function({bool last}) onOpen;
  final VoidCallback onFocused;
  final VoidCallback onPointerEnter;

  @override
  State<_MenubarTrigger> createState() => _MenubarTriggerState();
}

class _MenubarTriggerState extends State<_MenubarTrigger> {
  bool _focusVisible = false;
  bool _focused = false;
  bool _hovered = false;

  // Down, Up, Enter and Space open the menu; the side arrows, Home and End
  // go on to the bar.
  static const Map<ShortcutActivator, Intent> _shortcuts = {
    ...rovingShortcuts,
    ...activationShortcuts,
  };

  late final Map<Type, Action<Intent>> _actions = {
    RovingKeyIntent: RovingKeyAction(
      handles: (intent) =>
          widget.enabled &&
          (intent.key == LogicalKeyboardKey.arrowDown ||
              intent.key == LogicalKeyboardKey.arrowUp ||
              activationShortcuts.containsValue(intent)),
      onKey: (intent) =>
          widget.onOpen(last: intent.key == LogicalKeyboardKey.arrowUp),
    ),
  };

  void _press() {
    if (widget.enabled) widget.onPressed();
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = widget.enabled;
    final target = theme.minTargetSize;
    final tinted = enabled && (_hovered || widget.open);

    final surface = FocusRingPainter(
      visible: _focusVisible,
      ring: theme.focusRing,
      radius: theme.controlRadius,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: tinted ? colors.stateHover : null,
          borderRadius: BorderRadius.circular(theme.controlRadius),
        ),
        child: Padding(
          padding: _triggerPadding,
          child: Text(
            widget.label,
            style: theme.textStyle.copyWith(
              color: enabled ? colors.text : colors.textDisabled,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );

    return Semantics(
      container: true,
      role: SemanticsRole.menuItem,
      label: widget.label,
      enabled: enabled,
      expanded: widget.open,
      focusable: true,
      focused: _focused,
      onTap: enabled ? _press : null,
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          focusNode: widget.focusNode,
          shortcuts: _shortcuts,
          actions: _actions,
          mouseCursor: enabled
              ? SystemMouseCursors.click
              : SystemMouseCursors.forbidden,
          onFocusChange: (focused) {
            setState(() => _focused = focused);
            if (focused) widget.onFocused();
          },
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: MouseRegion(
            onEnter: (event) {
              setState(() => _hovered = true);
              // Touch has no hover: a tap opens the menu by itself.
              if (event.kind == PointerDeviceKind.mouse) {
                widget.onPointerEnter();
              }
            },
            onExit: (_) => setState(() => _hovered = false),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              excludeFromSemantics: true,
              onTap: _press,
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: target.width,
                  minHeight: target.height,
                ),
                child: Center(widthFactor: 1, heightFactor: 1, child: surface),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
