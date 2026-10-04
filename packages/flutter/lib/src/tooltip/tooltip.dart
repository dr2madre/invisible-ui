import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/anchored_layout.dart';
import '../internal/elevation.dart';
import '../theme/theme.dart';

/// The side of its trigger a tooltip prefers. It moves to the opposite side
/// when the preferred one has no room.
enum TooltipPlacement {
  /// Above the trigger.
  top,

  /// Below the trigger.
  bottom,

  /// Beside the trigger at the inline-start: left in left-to-right text.
  start,

  /// Beside the trigger at the inline-end: right in left-to-right text.
  end,
}

// Sizes the web Tooltip sets in its own stylesheet.
const double _gap = 6;
const double _maxWidth = 288;
const double _fontSize = 13;
const EdgeInsets _padding = EdgeInsets.symmetric(horizontal: 8, vertical: 4.8);

/// A short supplementary text shown beside a trigger, following the WAI-ARIA
/// tooltip pattern.
///
/// The pointer resting on [child] for [waitDuration] shows it; keyboard focus
/// inside [child] shows it at once; a tap with a finger or a pen toggles it.
/// It stays while the pointer is over the tooltip itself, hides
/// [exitDuration] after the pointer leaves, and Escape hides it at once
/// (WCAG 1.4.13). Focus never moves into it.
///
/// [message] is supplementary: assistive technology reads it as the
/// trigger's tooltip, after the trigger's own name. It never names the
/// trigger, so an icon-only button keeps its `semanticLabel`.
class Tooltip extends StatefulWidget {
  /// Shows [message] for [child].
  const Tooltip({
    super.key,
    required this.message,
    required this.child,
    this.placement = TooltipPlacement.top,
    this.waitDuration = const Duration(milliseconds: 300),
    this.exitDuration = const Duration(milliseconds: 100),
  });

  /// The text shown.
  final String message;

  /// The trigger, usually a focusable control.
  final Widget child;

  /// The preferred side.
  final TooltipPlacement placement;

  /// How long the pointer rests on the trigger before the tooltip shows.
  final Duration waitDuration;

  /// How long the tooltip stays after the pointer leaves.
  final Duration exitDuration;

  @override
  State<Tooltip> createState() => _TooltipState();
}

class _TooltipState extends State<Tooltip> {
  final OverlayPortalController _portal = OverlayPortalController();
  final GlobalKey _triggerKey = GlobalKey();
  Timer? _timer;

  bool get _open => _portal.isShowing;

  void _schedule(Duration delay, bool open) {
    _timer?.cancel();
    if (delay <= Duration.zero) return _set(open);
    _timer = Timer(delay, () => _set(open));
  }

  void _set(bool open) {
    _timer?.cancel();
    if (!mounted || open == _open) return;
    open ? _portal.show() : _portal.hide();
    if (open) {
      HardwareKeyboard.instance.addHandler(_onKey);
    } else {
      HardwareKeyboard.instance.removeHandler(_onKey);
    }
  }

  // Escape hides the tooltip wherever focus is, and stays available to the
  // rest of the app, as the web adapters' document listener does.
  bool _onKey(KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.escape) {
      _set(false);
    }
    return false;
  }

  @override
  void dispose() {
    _timer?.cancel();
    HardwareKeyboard.instance.removeHandler(_onKey);
    super.dispose();
  }

  Widget _buildTooltip(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final direction = Directionality.of(context);
    final anchor = anchorRectIn(context, _triggerKey.currentContext!);
    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchor,
        side: switch (widget.placement) {
          TooltipPlacement.top => AnchorSide.top,
          TooltipPlacement.bottom => AnchorSide.bottom,
          TooltipPlacement.start => AnchorSide.start,
          TooltipPlacement.end => AnchorSide.end,
        },
        direction: direction,
        gap: _gap,
        centered: true,
      ),
      // The trigger carries the message as its tooltip; reading this copy too
      // would say it twice.
      child: ExcludeSemantics(
        child: MouseRegion(
          // Hoverable: the tooltip stays while the pointer is over it.
          onEnter: (_) => _timer?.cancel(),
          onExit: (_) => _schedule(widget.exitDuration, false),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: _maxWidth),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: theme.colors.emphasisSurface,
                borderRadius: BorderRadius.circular(theme.controlRadius),
                boxShadow: overlayShadow(theme.brightness),
              ),
              child: Padding(
                padding: _padding,
                child: Text(
                  widget.message,
                  style: theme.textStyle.copyWith(
                    fontSize: _fontSize,
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
    return OverlayPortal(
      controller: _portal,
      overlayChildBuilder: _buildTooltip,
      child: MergeSemantics(
        child: Semantics(
          tooltip: widget.message,
          child: Focus(
            canRequestFocus: false,
            skipTraversal: true,
            // Keyboard focus shows the tooltip at once.
            onFocusChange: _set,
            child: MouseRegion(
              key: _triggerKey,
              onEnter: (event) {
                // Touch has no hover; the tap below handles it.
                if (event.kind == PointerDeviceKind.mouse) {
                  _schedule(widget.waitDuration, true);
                }
              },
              onExit: (_) => _schedule(widget.exitDuration, false),
              child: Listener(
                onPointerUp: (event) {
                  if (event.kind != PointerDeviceKind.mouse) _set(!_open);
                },
                child: widget.child,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
