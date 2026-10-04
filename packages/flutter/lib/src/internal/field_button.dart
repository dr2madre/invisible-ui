import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import 'focus_ring.dart';

// Sizes the web field buttons set in their own stylesheets.
const double _buttonSide = 24;

/// A small button inside a field: a clear button, a tab stop while it has
/// something to clear, or a chevron, which only a pointer uses. A hidden
/// button keeps its place, so the text never jumps.
class FieldButton extends StatefulWidget {
  /// Creates the button.
  const FieldButton({
    super.key,
    required this.label,
    required this.visible,
    required this.focusable,
    required this.onPressed,
    required this.child,
    this.enabled = true,
  });

  /// The accessible name.
  final String label;

  /// Whether the button shows; a hidden one keeps its space.
  final bool visible;

  /// Whether the button is a tab stop.
  final bool focusable;

  /// Whether the button responds.
  final bool enabled;

  /// Called on a press; [keyboard] says a key pressed it.
  final void Function({required bool keyboard}) onPressed;

  /// The glyph.
  final Widget child;

  @override
  State<FieldButton> createState() => _FieldButtonState();
}

class _FieldButtonState extends State<FieldButton> {
  bool _focusVisible = false;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.numpadEnter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(
      onInvoke: (_) => widget.onPressed(keyboard: true),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final active = widget.visible && widget.enabled;
    final side = MediaQuery.textScalerOf(context).scale(_buttonSide);
    final target = theme.minTargetSize;
    final body = ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: target.width,
        minHeight: target.height,
      ),
      child: Center(
        widthFactor: 1,
        heightFactor: 1,
        child: FocusRingPainter(
          visible: _focusVisible && active,
          ring: theme.focusRing,
          radius: theme.controlRadius,
          child: SizedBox.square(
            dimension: side,
            child: Center(child: widget.child),
          ),
        ),
      ),
    );
    if (!active) {
      return ExcludeSemantics(
        child: Visibility(
          visible: widget.visible,
          maintainSize: true,
          maintainAnimation: true,
          maintainState: true,
          child: body,
        ),
      );
    }
    return Semantics(
      container: true,
      button: true,
      label: widget.label,
      onTap: () => widget.onPressed(keyboard: false),
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: widget.focusable,
          shortcuts: _shortcuts,
          actions: _actions,
          mouseCursor: SystemMouseCursors.click,
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => widget.onPressed(keyboard: false),
            child: body,
          ),
        ),
      ),
    );
  }
}
