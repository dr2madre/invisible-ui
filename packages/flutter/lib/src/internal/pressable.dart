import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../theme/theme.dart';

/// The keys that press a [Pressable].
enum PressKeys {
  /// Enter and Space, as a button takes them.
  button,

  /// Enter only, as a link takes it: Space scrolls the page on the web.
  link,
}

/// What a [Pressable] paints from: whether keyboard focus shows and whether
/// the pointer is over it.
typedef PressableStates = ({bool focusVisible, bool hovered});

/// A focusable area that runs [onPressed] on a tap, a click or the [keys],
/// for the components whose trigger is not a [Button]: the disclosure
/// headers, the tabs, the page buttons and the links. A null [onPressed]
/// disables it: it leaves the focus order and takes no press.
///
/// The hit area is never smaller than [InvisibleThemeData.minTargetSize],
/// with the painted content centred in it. The caller gives the semantics
/// node its role and states; this widget adds focus and the keys.
class Pressable extends StatefulWidget {
  /// Creates the area.
  const Pressable({
    super.key,
    required this.onPressed,
    required this.builder,
    this.keys = PressKeys.button,
    this.focusNode,
    this.onFocusChange,
    this.alignment = Alignment.center,
  });

  /// Called on a press. Null disables the area.
  final VoidCallback? onPressed;

  /// Builds the painted content from the hover and focus states.
  final Widget Function(BuildContext context, PressableStates states) builder;

  /// The keys that press it.
  final PressKeys keys;

  /// The focus node, for roving focus.
  final FocusNode? focusNode;

  /// Called when focus enters or leaves.
  final ValueChanged<bool>? onFocusChange;

  /// Where the content sits in a hit area larger than itself.
  final AlignmentGeometry alignment;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _focusVisible = false;
  bool _hovered = false;

  static const Map<ShortcutActivator, Intent> _linkKeys = {
    SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.numpadEnter): ActivateIntent(),
  };

  static const Map<ShortcutActivator, Intent> _buttonKeys = {
    ..._linkKeys,
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => _press()),
  };

  // Read from the widget at the press, so a replaced callback is the one run.
  void _press() => widget.onPressed?.call();

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final target = InvisibleTheme.of(context).minTargetSize;
    return FocusableActionDetector(
      enabled: enabled,
      focusNode: widget.focusNode,
      shortcuts: widget.keys == PressKeys.link ? _linkKeys : _buttonKeys,
      actions: _actions,
      mouseCursor: enabled
          ? SystemMouseCursors.click
          : SystemMouseCursors.forbidden,
      onFocusChange: widget.onFocusChange,
      onShowFocusHighlight: (value) => setState(() => _focusVisible = value),
      // Hover follows the mouse alone, as CSS :hover does.
      child: MouseRegion(
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTap: enabled ? _press : null,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minWidth: target.width,
              minHeight: target.height,
            ),
            child: Align(
              alignment: widget.alignment,
              widthFactor: 1,
              heightFactor: 1,
              child: widget.builder(context, (
                focusVisible: _focusVisible && enabled,
                hovered: _hovered && enabled,
              )),
            ),
          ),
        ),
      ),
    );
  }
}
