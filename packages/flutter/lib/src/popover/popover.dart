import 'dart:async';
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../internal/anchored_layout.dart';
import '../internal/elevation.dart';
import '../internal/tap_group.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The side of its trigger a popover prefers. It moves to the opposite side
/// when the preferred one has no room.
enum PopoverPlacement {
  /// Above the trigger.
  top,

  /// Below the trigger.
  bottom,

  /// Beside the trigger at the inline-start: left in left-to-right text.
  start,

  /// Beside the trigger at the inline-end: right in left-to-right text.
  end,
}

/// Opens and closes a [Popover] from code. Opening or closing from code
/// does not call [Popover.onOpenChanged].
class PopoverController {
  _PopoverState? _state;

  /// Whether the popover shows.
  bool get isOpen => _state?._open ?? false;

  /// Shows the popover.
  void open() => _state?._setOpen(true, report: false);

  /// Hides the popover. Focus inside it returns to the trigger.
  void close() => _state?._setOpen(false, report: false);
}

// Sizes the web Popover sets in its own stylesheet.
const double _defaultMaxWidth = 320;
const EdgeInsets _padding = EdgeInsets.symmetric(horizontal: 16, vertical: 14);
const double _clickGap = 6;
const double _hoverGap = 8;

/// A floating panel anchored to a trigger, non-modal.
///
/// The default constructor is the intentional popover: a [Button] showing
/// [trigger] opens and closes it. When it opens, focus moves to the first
/// focusable widget in the panel, or to the panel itself. Escape closes it
/// and returns focus to the trigger; a press outside the trigger and the
/// panel closes it and leaves focus where the press put it; focus moving
/// out of both closes it too. The panel is a dialog named [label], so it can
/// hold a search field and a list, such as a region picker. Inside a modal
/// dialog, Escape closes the popover first and the dialog stays open.
///
/// [Popover.hover] is the preview: it opens while the pointer rests on, or
/// keyboard focus is inside, the [trigger] the app passes (typically a
/// link), after [openDelay], and closes [closeDelay] after both leave. It
/// stays while the pointer is over the panel, Escape closes it, and a tap
/// with a finger or a pen toggles it. Focus never moves into it, so its
/// content must be supplementary and hold nothing focusable.
///
/// [builder] builds the panel's content; it receives the [PopoverController],
/// whose [PopoverController.close] closes the panel, for instance after a
/// choice. [onOpenChanged] reports each opening and closing the user
/// causes; a [controller] opens and closes it from code without a report.
class Popover extends StatefulWidget {
  /// A popover opened by a button.
  const Popover({
    super.key,
    required String this.label,
    required this.builder,
    this.trigger,
    this.triggerVariant = ButtonVariant.standard,
    this.triggerIcon,
    this.placement = PopoverPlacement.bottom,
    this.controller,
    this.onOpenChanged,
  }) : openDelay = Duration.zero,
       closeDelay = Duration.zero,
       _hover = false,
       _field = null,
       _triggerFocusNode = null,
       _initialFocus = null,
       _maxWidth = _defaultMaxWidth;

  const Popover._field({
    super.key,
    required String this.label,
    required this.builder,
    required PopoverFieldBuilder field,
    required double maxWidth,
    this.controller,
    this.onOpenChanged,
    FocusNode? triggerFocusNode,
    FocusNode? Function()? initialFocus,
  }) : trigger = null,
       triggerVariant = ButtonVariant.standard,
       triggerIcon = null,
       placement = PopoverPlacement.bottom,
       openDelay = Duration.zero,
       closeDelay = Duration.zero,
       _hover = false,
       _field = field,
       _triggerFocusNode = triggerFocusNode,
       _initialFocus = initialFocus,
       _maxWidth = maxWidth;

  /// A preview shown while [trigger] is hovered or focused.
  const Popover.hover({
    super.key,
    required Widget this.trigger,
    required this.builder,
    this.placement = PopoverPlacement.bottom,
    this.openDelay = const Duration(milliseconds: 300),
    this.closeDelay = const Duration(milliseconds: 200),
    this.controller,
    this.onOpenChanged,
  }) : label = null,
       triggerVariant = ButtonVariant.standard,
       triggerIcon = null,
       _hover = true,
       _field = null,
       _triggerFocusNode = null,
       _initialFocus = null,
       _maxWidth = _defaultMaxWidth;

  /// The panel's accessible name. Null for a hover preview, which is not a
  /// dialog.
  final String? label;

  /// Builds the panel's content.
  final Widget Function(BuildContext context, PopoverController controller)
  builder;

  /// The button's label, defaulting to [InvisibleMessages.popoverTriggerLabel];
  /// in [Popover.hover], the focusable widget that shows the preview.
  final Widget? trigger;

  /// The meaning of the trigger button.
  final ButtonVariant triggerVariant;

  /// The trigger button's leading icon.
  final Widget? triggerIcon;

  /// The preferred side.
  final PopoverPlacement placement;

  /// How long the pointer or focus rests on a hover trigger before the
  /// preview shows.
  final Duration openDelay;

  /// How long the preview stays after the pointer and focus leave.
  final Duration closeDelay;

  /// Opens and closes the popover from code.
  final PopoverController? controller;

  /// Called with the new open state after the user opens or closes the
  /// popover.
  final ValueChanged<bool>? onOpenChanged;

  final bool _hover;

  final PopoverFieldBuilder? _field;

  final FocusNode? _triggerFocusNode;

  final FocusNode? Function()? _initialFocus;

  final double _maxWidth;

  @override
  State<Popover> createState() => _PopoverState();
}

/// Builds the field that opens a [fieldPopover]: [focusNode] goes on the
/// field's focusable widget, [open] says whether the panel shows, and
/// [toggle] opens or closes it as the user asks, with a report.
typedef PopoverFieldBuilder =
    Widget Function(
      BuildContext context,
      FocusNode focusNode,
      bool open,
      VoidCallback toggle,
    );

/// A popover opened by a field rather than a button, as the date pickers
/// open their calendar. Package-internal: the library exports [Popover]
/// only.
///
/// It behaves as the intentional [Popover] does: focus moves in when it
/// opens, to [initialFocus] when that gives a node, Escape closes it and
/// returns focus to [triggerFocusNode], a press outside closes it. The panel
/// is a dialog named [label], at most [maxWidth] wide.
Widget fieldPopover({
  Key? key,
  required String label,
  required PopoverFieldBuilder field,
  required Widget Function(BuildContext context, PopoverController controller)
  builder,
  double maxWidth = _defaultMaxWidth,
  PopoverController? controller,
  ValueChanged<bool>? onOpenChanged,
  FocusNode? triggerFocusNode,
  FocusNode? Function()? initialFocus,
}) => Popover._field(
  key: key,
  label: label,
  field: field,
  builder: builder,
  maxWidth: maxWidth,
  controller: controller,
  onOpenChanged: onOpenChanged,
  triggerFocusNode: triggerFocusNode,
  initialFocus: initialFocus,
);

class _PopoverState extends State<Popover> {
  final OverlayPortalController _portal = OverlayPortalController();
  final GlobalKey _triggerKey = GlobalKey();
  final FocusNode _ownTriggerFocus = FocusNode(debugLabel: 'Popover trigger');
  // The panel takes focus itself only when it holds nothing focusable, and
  // Tab passes it by, so Tab from its last control leaves it and closes it.
  final FocusNode _panelFocus = FocusNode(
    debugLabel: 'Popover panel',
    skipTraversal: true,
  );
  late PopoverController _controller;
  Timer? _timer;

  bool get _open => _portal.isShowing;

  FocusNode get _triggerFocus => widget._triggerFocusNode ?? _ownTriggerFocus;

  @override
  void initState() {
    super.initState();
    _attach(widget.controller ?? PopoverController());
  }

  @override
  void didUpdateWidget(Popover oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.controller != oldWidget.controller) {
      _controller._state = null;
      _attach(widget.controller ?? PopoverController());
    }
  }

  void _attach(PopoverController controller) {
    _controller = controller.._state = this;
  }

  @override
  void dispose() {
    _timer?.cancel();
    if (_controller._state == this) _controller._state = null;
    HardwareKeyboard.instance.removeHandler(_onHoverKey);
    _ownTriggerFocus.dispose();
    _panelFocus.dispose();
    super.dispose();
  }

  /// Opens or closes the panel. Closing returns focus to the trigger when it
  /// was inside the panel, unless [restoreFocus] is false. A user action
  /// reports the change once.
  void _setOpen(bool open, {required bool report, bool restoreFocus = true}) {
    _timer?.cancel();
    if (!mounted || open == _open) return;
    final focusInside = _panelFocus.hasFocus;
    setState(() => open ? _portal.show() : _portal.hide());
    if (widget._hover) {
      open
          ? HardwareKeyboard.instance.addHandler(_onHoverKey)
          : HardwareKeyboard.instance.removeHandler(_onHoverKey);
    } else if (open) {
      // The panel builds in this frame; focus moves in once it is there.
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted || !_open) return;
        (widget._initialFocus?.call() ?? _firstInReadingOrder() ?? _panelFocus)
            .requestFocus();
      });
    } else if (focusInside && restoreFocus) {
      _triggerFocus.requestFocus();
    }
    if (report) widget.onOpenChanged?.call(open);
  }

  /// The panel's control that reads first: the topmost, then the one at the
  /// inline-start.
  FocusNode? _firstInReadingOrder() {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    FocusNode? first;
    for (final node in _panelFocus.traversalDescendants) {
      final rect = node.rect;
      final best = first?.rect;
      if (best == null ||
          rect.top < best.top - 1 ||
          (rect.top <= best.top + 1 &&
              (rtl ? rect.right > best.right : rect.left < best.left))) {
        first = node;
      }
    }
    return first;
  }

  void _schedule(Duration delay, bool open) {
    _timer?.cancel();
    if (delay <= Duration.zero) return _setOpen(open, report: true);
    _timer = Timer(delay, () => _setOpen(open, report: true));
  }

  // Escape closes a hover preview wherever focus is, and stays available to
  // the rest of the app.
  bool _onHoverKey(KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.escape) {
      _setOpen(false, report: true);
    }
    return false;
  }

  KeyEventResult _onPanelKey(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.escape &&
        _open) {
      _setOpen(false, report: true);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  void _panelFocusChanged(bool focused) {
    if (focused || widget._hover) return;
    // Wait for the focus change to land: focus may be on its way to the
    // trigger, which keeps the panel open.
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_open) return;
      if (_panelFocus.hasFocus || _triggerFocus.hasFocus) return;
      _setOpen(false, report: true, restoreFocus: false);
    });
  }

  Widget _buildPanel(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final anchor = anchorRectIn(context, _triggerKey.currentContext!);
    final hover = widget._hover;

    Widget panel = ConstrainedBox(
      constraints: BoxConstraints(maxWidth: widget._maxWidth),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: colors.background,
          border: Border.all(color: colors.border),
          borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
          boxShadow: overlayShadow(theme.brightness),
        ),
        // A panel taller than the room it has scrolls.
        child: SingleChildScrollView(
          padding: _padding,
          child: DefaultTextStyle(
            style: theme.textStyle.copyWith(color: colors.text),
            // A popup opened from the content counts as inside the panel.
            child: OverlayTapGroup.nest(
              context: context,
              groupId: this,
              child: Builder(
                builder: (context) => widget.builder(context, _controller),
              ),
            ),
          ),
        ),
      ),
    );

    if (hover) {
      panel = MouseRegion(
        // Hoverable: the preview stays while the pointer is over it.
        onEnter: (_) => _timer?.cancel(),
        onExit: (_) => _schedule(widget.closeDelay, false),
        child: panel,
      );
    } else {
      panel = TapRegion(
        groupId: this,
        onTapOutside: (_) => _setOpen(false, report: true, restoreFocus: false),
        child: Semantics(
          container: true,
          explicitChildNodes: true,
          role: SemanticsRole.dialog,
          label: widget.label,
          child: Focus(
            focusNode: _panelFocus,
            onKeyEvent: _onPanelKey,
            onFocusChange: _panelFocusChanged,
            child: FocusTraversalGroup(
              child: _FocusOutline(focusNode: _panelFocus, child: panel),
            ),
          ),
        ),
      );
    }

    // A popover opened from another one counts as inside it.
    panel = OverlayTapGroup.wrap(context, panel);

    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchor,
        side: switch (widget.placement) {
          PopoverPlacement.top => AnchorSide.top,
          PopoverPlacement.bottom => AnchorSide.bottom,
          PopoverPlacement.start => AnchorSide.start,
          PopoverPlacement.end => AnchorSide.end,
        },
        direction: Directionality.of(context),
        gap: hover ? _hoverGap : _clickGap,
      ),
      child: panel,
    );
  }

  Widget _buildTrigger(BuildContext context) {
    if (widget._hover) {
      return Focus(
        canRequestFocus: false,
        skipTraversal: true,
        // Keyboard focus shows the preview after the delay, as hover does.
        onFocusChange: (focused) =>
            _schedule(focused ? widget.openDelay : widget.closeDelay, focused),
        child: MouseRegion(
          key: _triggerKey,
          onEnter: (event) {
            // Touch has no hover; the tap below handles it.
            if (event.kind == PointerDeviceKind.mouse) {
              _schedule(widget.openDelay, true);
            }
          },
          onExit: (_) => _schedule(widget.closeDelay, false),
          child: Listener(
            onPointerUp: (event) {
              if (event.kind != PointerDeviceKind.mouse) {
                _setOpen(!_open, report: true);
              }
            },
            child: widget.trigger,
          ),
        ),
      );
    }
    if (widget._field case final field?) {
      return TapRegion(
        groupId: this,
        child: Focus(
          canRequestFocus: false,
          skipTraversal: true,
          onKeyEvent: _onPanelKey,
          child: KeyedSubtree(
            key: _triggerKey,
            child: field(
              context,
              _triggerFocus,
              _open,
              () => _setOpen(!_open, report: true),
            ),
          ),
        ),
      );
    }
    final messages = InvisibleTheme.of(context).messages;
    return TapRegion(
      groupId: this,
      child: Focus(
        canRequestFocus: false,
        skipTraversal: true,
        onKeyEvent: _onPanelKey,
        child: MergeSemantics(
          child: Semantics(
            expanded: _open,
            child: KeyedSubtree(
              key: _triggerKey,
              child: Button(
                onPressed: () => _setOpen(!_open, report: true),
                variant: widget.triggerVariant,
                icon: widget.triggerIcon,
                focusNode: _triggerFocus,
                child: widget.trigger ?? Text(messages.popoverTriggerLabel),
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
      overlayChildBuilder: _buildPanel,
      child: _buildTrigger(context),
    );
  }
}

/// Tints the panel's border and lays a thin ring inside it while the panel
/// itself has keyboard focus, as the web panel's quieter focus style does.
class _FocusOutline extends StatefulWidget {
  const _FocusOutline({required this.focusNode, required this.child});

  final FocusNode focusNode;
  final Widget child;

  @override
  State<_FocusOutline> createState() => _FocusOutlineState();
}

class _FocusOutlineState extends State<_FocusOutline> {
  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_changed);
    FocusManager.instance.addHighlightModeListener(_modeChanged);
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_changed);
    FocusManager.instance.removeHighlightModeListener(_modeChanged);
    super.dispose();
  }

  void _changed() => setState(() {});

  void _modeChanged(FocusHighlightMode mode) => setState(() {});

  @override
  Widget build(BuildContext context) {
    final visible =
        widget.focusNode.hasPrimaryFocus &&
        FocusManager.instance.highlightMode == FocusHighlightMode.traditional;
    if (!visible) return widget.child;
    final colors = InvisibleTheme.of(context).colors;
    return DecoratedBox(
      position: DecorationPosition.foreground,
      decoration: BoxDecoration(
        border: Border.all(color: colors.focusRing, width: 2),
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
      ),
      child: widget.child,
    );
  }
}
