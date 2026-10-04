import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/anchored_layout.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/roving.dart';
import '../menu/menu_entry.dart';
import '../menu/menu_layer.dart';
import '../theme/theme.dart';

// Sizes the web Dropdown Menu sets in its own stylesheet.
const EdgeInsetsDirectional _triggerPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12,
  vertical: 8,
);
const double _gap = 8;
const double _borderWidth = 1;
const double _chevronEm = 1.1;

/// A button that opens a menu of actions, following the WAI-ARIA menu button
/// and menu patterns.
///
/// [items] holds items, checkbox and radio items, groups, separators and
/// submenus ([MenuEntry]). Activating an item closes every level, returns
/// focus to the trigger and then calls [onSelected] with its value, once.
/// Space on a checkbox or radio item calls [onSelected] and keeps the menu
/// open, so several options can be set in a row; the app owns the new
/// `checked` state.
///
/// Keys: on the trigger, Down, Enter and Space open the menu on its first
/// item, Up on its last. In the menu, Up and Down move within a level,
/// wrapping, Home and End jump to its ends, and typed characters find an
/// item of that level. Enter, Space and the arrow toward the inline-end open
/// a submenu on its first item; the arrow toward the inline-start and Escape
/// close one level; Tab closes every level and moves on from the trigger.
/// The arrows follow the reading direction.
///
/// The pointer resting on a submenu trigger for 100 ms opens it, and the
/// path to it is forgiven: crossing other items on the way does not close
/// it. A tap opens a submenu; a second tap with a finger or a pen closes it.
/// A press outside every level closes them all.
class DropdownMenu<T> extends StatefulWidget {
  /// Creates a menu button labelled [label].
  const DropdownMenu({
    super.key,
    required this.label,
    required this.items,
    this.onSelected,
    this.enabled = true,
  });

  /// The trigger's text and the menu's accessible name.
  final String label;

  /// What the menu holds, in order. Values are unique across the tree.
  final List<MenuEntry<T>> items;

  /// Called with the chosen item's value.
  final ValueChanged<T>? onSelected;

  /// Whether the menu opens. A disabled trigger stays focusable and says it
  /// is disabled, as the web trigger does.
  final bool enabled;

  @override
  State<DropdownMenu<T>> createState() => _DropdownMenuState<T>();
}

class _DropdownMenuState<T> extends State<DropdownMenu<T>> {
  final FocusNode _triggerFocus = FocusNode(debugLabel: 'Dropdown Menu');
  late final MenuSession<T> _session = MenuSession<T>(
    triggerFocus: _triggerFocus,
    onSelected: () => widget.onSelected,
    direction: () => Directionality.of(context),
    keepsUnusedArrows: true,
  )..entries = widget.items;

  @override
  void didUpdateWidget(DropdownMenu<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    _session.entries = widget.items;
    if (!widget.enabled && _session.isOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _session.close());
    }
  }

  @override
  void dispose() {
    _session.dispose();
    _triggerFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RawMenuAnchor(
      controller: _session.root,
      childFocusNode: _triggerFocus,
      onClose: _session.rootClosed,
      overlayBuilder: (context, info) => CustomSingleChildLayout(
        delegate: AnchoredLayout(
          anchor: info.anchorRect,
          side: AnchorSide.bottom,
          direction: Directionality.of(context),
          matchAnchorWidth: true,
        ),
        child: MenuPanel<T>(
          session: _session,
          path: const [],
          semanticLabel: widget.label,
          tapRegionGroupId: info.tapRegionGroupId,
        ),
      ),
      child: ListenableBuilder(
        listenable: _session,
        builder: (context, _) => _MenuTrigger(
          label: widget.label,
          enabled: widget.enabled,
          open: _session.isOpen,
          focusNode: _triggerFocus,
          onOpen: _session.open,
          onClose: _session.close,
        ),
      ),
    );
  }
}

class _MenuTrigger extends StatefulWidget {
  const _MenuTrigger({
    required this.label,
    required this.enabled,
    required this.open,
    required this.focusNode,
    required this.onOpen,
    required this.onClose,
  });

  final String label;
  final bool enabled;
  final bool open;
  final FocusNode focusNode;
  final void Function({bool last}) onOpen;
  final VoidCallback onClose;

  @override
  State<_MenuTrigger> createState() => _MenuTriggerState();
}

class _MenuTriggerState extends State<_MenuTrigger> {
  bool _focusVisible = false;

  // Down, Up, Enter and Space open the menu; the action declines the side
  // arrows, Home and End.
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
    if (!widget.enabled) return;
    widget.open ? widget.onClose() : widget.onOpen();
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final enabled = widget.enabled;
    final foreground = enabled ? c.text : c.textDisabled;
    final fontSize = theme.textStyle.fontSize!;
    final target = theme.minTargetSize;
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    final surface = FocusRingPainter(
      visible: _focusVisible,
      ring: theme.focusRing,
      radius: theme.controlRadius,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: enabled ? c.background : c.disabled,
          border: Border.all(color: c.controlBorder, width: _borderWidth),
          borderRadius: BorderRadius.circular(theme.controlRadius),
        ),
        child: Padding(
          padding: _triggerPadding,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Flexible(
                child: Text(
                  widget.label,
                  style: theme.textStyle.copyWith(
                    color: foreground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: _gap),
              IconTheme(
                data: IconThemeData(
                  color: enabled ? c.textSecondary : c.textDisabled,
                  size: fontSize * _chevronEm,
                  applyTextScaling: true,
                ),
                child: AnimatedRotation(
                  turns: widget.open ? 0.5 : 0,
                  duration: reduceMotion
                      ? Duration.zero
                      : const Duration(milliseconds: 150),
                  child: const Glyph(GlyphShape.chevronDown),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    return Semantics(
      container: true,
      button: true,
      enabled: enabled,
      expanded: widget.open,
      onTap: enabled ? _press : null,
      child: FocusableActionDetector(
        focusNode: widget.focusNode,
        shortcuts: _shortcuts,
        actions: _actions,
        mouseCursor: enabled
            ? SystemMouseCursors.click
            : SystemMouseCursors.forbidden,
        onShowFocusHighlight: (value) => setState(() => _focusVisible = value),
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
    );
  }
}
