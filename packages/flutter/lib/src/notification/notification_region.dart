import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../internal/announce.dart';
import '../internal/elevation.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'inline_notification.dart';
import 'modal_observer.dart';
import 'notification_controller.dart';

/// Where a [NotificationRegion] stacks its notifications.
enum NotificationPlacement {
  /// The top corner at the inline-start.
  topStart,

  /// The top edge, centred.
  topCenter,

  /// The top corner at the inline-end.
  topEnd,

  /// The bottom corner at the inline-start.
  bottomStart,

  /// The bottom edge, centred.
  bottomCenter,

  /// The bottom corner at the inline-end.
  bottomEnd,
}

// Sizes the web Notification Region sets in its own stylesheet.
const double _width = 384;
const double _narrow = 480;
const double _gap = 8;
const double _travel = 16;

/// Shows a [NotificationController]'s notifications as toasts stacked in a
/// corner over [child], newest on top.
///
/// Each notification is announced when it appears, politely or, for an
/// assertive one, interrupting. Auto-dismiss countdowns pause while the
/// pointer is over the stack or focus is inside it (WCAG 2.2.1), and a swipe
/// sideways dismisses a toast.
///
/// While [modals] reports a modal open, new notifications wait unshown and
/// unannounced; they appear in order, countdowns starting, when the last
/// modal closes (ADR 0016). The toasts already shown when it opened are
/// hidden and inert while it is open, their countdowns held, and come back
/// afterwards: the region paints over the navigator, so a toast left visible
/// would sit above the modal and compete with it. A change to one of them
/// waits for the modal to close too.
///
/// Place it around the app's navigator, for example in `WidgetsApp.builder`.
class NotificationRegion extends StatefulWidget {
  /// Shows [controller]'s notifications over [child].
  const NotificationRegion({
    super.key,
    required this.controller,
    required this.child,
    this.placement = NotificationPlacement.topEnd,
    this.modals,
    this.semanticLabel,
    this.maxVisible = 0,
    this.inset = 16,
    this.swipeable = true,
    this.duration = const Duration(milliseconds: 200),
  });

  /// The notifications.
  final NotificationController controller;

  /// The app under the region.
  final Widget child;

  /// Where the toasts stack.
  final NotificationPlacement placement;

  /// What tells the region a modal is open. Without it, nothing waits.
  final ModalObserver? modals;

  /// The region's accessible name. Defaults to the theme's
  /// `notificationRegionLabel`.
  final String? semanticLabel;

  /// The most toasts shown at once, oldest leaving first. Zero shows every
  /// one the height allows.
  final int maxVisible;

  /// The distance from the edges of the screen.
  final double inset;

  /// Whether a swipe sideways dismisses a toast.
  final bool swipeable;

  /// How long a toast takes to enter. It leaves in 1.75 times as long. No
  /// motion under reduced motion.
  final Duration duration;

  @override
  State<NotificationRegion> createState() => _NotificationRegionState();
}

class _Slot {
  _Slot(this.notice);

  Notice notice;
  bool leaving = false;
}

class _NotificationRegionState extends State<NotificationRegion> {
  final List<_Slot> _slots = [];
  bool _modalOpen = false;
  Map<String, Notice> _held = const {};
  bool _pointerInside = false;
  bool _focusInside = false;

  bool get _paused => _pointerInside || _focusInside || _modalOpen;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_sync);
    widget.modals?.addListener(_syncModal);
    _modalOpen = widget.modals?.hasModal ?? false;
    _sync();
  }

  @override
  void didUpdateWidget(NotificationRegion oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_sync);
      widget.controller.addListener(_sync);
    }
    if (oldWidget.modals != widget.modals) {
      oldWidget.modals?.removeListener(_syncModal);
      widget.modals?.addListener(_syncModal);
      _syncModal();
    }
    if (oldWidget.controller != widget.controller ||
        oldWidget.maxVisible != widget.maxVisible) {
      _sync();
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_sync);
    widget.modals?.removeListener(_syncModal);
    super.dispose();
  }

  /// The notifications eligible to show: all of them, or, while a modal is
  /// open, the ones shown when it opened, as they were then.
  List<Notice> _eligible() {
    final notices = widget.controller.notices;
    final eligible = _modalOpen
        ? [for (final n in notices) ?_held[n.id]]
        : notices;
    final max = widget.maxVisible;
    return max > 0 && eligible.length > max
        ? eligible.sublist(eligible.length - max)
        : eligible;
  }

  void _syncModal() {
    final open = widget.modals?.hasModal ?? false;
    if (open == _modalOpen) return;
    _held = open
        ? {
            for (final slot in _slots)
              if (!slot.leaving) slot.notice.id: slot.notice,
          }
        : const {};
    _modalOpen = open;
    _sync();
  }

  void _sync() {
    final eligible = _eligible();
    final byId = {for (final n in eligible) n.id: n};
    final shown = <String, _Slot>{};
    for (final slot in _slots) {
      final notice = byId[slot.notice.id];
      if (notice == null) {
        slot.leaving = true;
        continue;
      }
      if (_changed(slot.notice, notice) || slot.leaving) {
        _announcements.add(notice);
      }
      slot
        ..notice = notice
        ..leaving = false;
      shown[notice.id] = slot;
    }
    for (final notice in eligible) {
      if (shown.containsKey(notice.id)) continue;
      _slots.add(_Slot(notice));
      _announcements.add(notice);
    }
    if (_announcements.isNotEmpty) {
      SchedulerBinding.instance
        ..addPostFrameCallback((_) => _announce())
        ..ensureVisualUpdate();
    }
    if (mounted) setState(() {});
  }

  /// Notifications to announce after the next frame, oldest first.
  final List<Notice> _announcements = [];

  static bool _changed(Notice a, Notice b) =>
      a.title != b.title || a.text != b.text;

  void _announce() {
    if (!mounted) {
      _announcements.clear();
      return;
    }
    // In list order, so notifications held back by a modal are read in the
    // order they came.
    for (final n in _slots.map((slot) => slot.notice).toList()) {
      if (!_announcements.contains(n)) continue;
      announce(context, noticeMessage(n.title, n.text), assertive: n.assertive);
    }
    _announcements.clear();
  }

  void _gone(_Slot slot) {
    if (!mounted || !slot.leaving) return;
    setState(() => _slots.remove(slot));
  }

  // A swiped toast leaves the tree at once, as Dismissible requires.
  void _swiped(_Slot slot) {
    setState(() => _slots.remove(slot));
    widget.controller.dismiss(slot.notice.id, NotificationDismissReason.user);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final top = switch (widget.placement) {
      NotificationPlacement.topStart ||
      NotificationPlacement.topCenter ||
      NotificationPlacement.topEnd => true,
      _ => false,
    };
    final alignment = switch (widget.placement) {
      NotificationPlacement.topStart => AlignmentDirectional.topStart,
      NotificationPlacement.topCenter => AlignmentDirectional.topCenter,
      NotificationPlacement.topEnd => AlignmentDirectional.topEnd,
      NotificationPlacement.bottomStart => AlignmentDirectional.bottomStart,
      NotificationPlacement.bottomCenter => AlignmentDirectional.bottomCenter,
      NotificationPlacement.bottomEnd => AlignmentDirectional.bottomEnd,
    };
    final enter = reduceMotion ? Duration.zero : widget.duration;
    final exit = reduceMotion ? Duration.zero : widget.duration * 1.75;
    final shown = _slots.any((slot) => !slot.leaving);

    final stack = LayoutBuilder(
      builder: (context, constraints) {
        final inset = widget.inset;
        final available = math.max(0.0, constraints.maxWidth - inset * 2);
        // A narrow screen gets one full-width column, whatever the placement.
        final narrow = constraints.maxWidth <= _narrow;
        final width = narrow ? available : math.min(available, _width);
        return Padding(
          padding: EdgeInsets.all(inset),
          child: Align(
            alignment: narrow
                ? (top ? Alignment.topCenter : Alignment.bottomCenter)
                : alignment,
            // The whole stack pauses together while the pointer is over it.
            // Only the toasts take the pointer; the app beside them keeps
            // it.
            child: MouseRegion(
              hitTestBehavior: HitTestBehavior.deferToChild,
              onEnter: (_) => setState(() => _pointerInside = true),
              onExit: (_) => setState(() => _pointerInside = false),
              child: SizedBox(
                width: width,
                // Newest on top and always whole; past the far edge the oldest
                // are clipped.
                child: SingleChildScrollView(
                  physics: const NeverScrollableScrollPhysics(),
                  clipBehavior: Clip.none,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final slot in _slots.reversed)
                        _ToastSlot(
                          key: ObjectKey(slot),
                          notice: slot.notice,
                          leaving: slot.leaving,
                          paused: _paused,
                          enter: enter,
                          exit: exit,
                          travel: top ? -_travel : _travel,
                          swipeable: widget.swipeable,
                          controller: widget.controller,
                          onGone: () => _gone(slot),
                          onSwiped: () => _swiped(slot),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );

    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          // Hidden and inert while a modal is open (ADR 0016).
          child: Offstage(
            offstage: _modalOpen,
            child: ExcludeFocus(
              excluding: _modalOpen,
              child: Semantics(
                container: shown,
                explicitChildNodes: true,
                label: shown
                    ? widget.semanticLabel ??
                          theme.messages.notificationRegionLabel
                    : null,
                // The whole stack pauses together while focus is inside it.
                child: Focus(
                  canRequestFocus: false,
                  skipTraversal: true,
                  onFocusChange: (inside) =>
                      setState(() => _focusInside = inside),
                  child: stack,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// One toast: its motion in and out and its countdown.
class _ToastSlot extends StatefulWidget {
  const _ToastSlot({
    super.key,
    required this.notice,
    required this.leaving,
    required this.paused,
    required this.enter,
    required this.exit,
    required this.travel,
    required this.swipeable,
    required this.controller,
    required this.onGone,
    required this.onSwiped,
  });

  final Notice notice;
  final bool leaving;
  final bool paused;
  final Duration enter;
  final Duration exit;
  final double travel;
  final bool swipeable;
  final NotificationController controller;
  final VoidCallback onGone;
  final VoidCallback onSwiped;

  @override
  State<_ToastSlot> createState() => _ToastSlotState();
}

class _ToastSlotState extends State<_ToastSlot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _motion = AnimationController(
    vsync: this,
    duration: widget.enter,
    reverseDuration: widget.exit,
  );

  // The auto-dismiss countdown counts down in steps while it runs, so a
  // pause keeps what is left. It is timing, not motion: reduced motion keeps
  // it whole.
  static const Duration _step = Duration(milliseconds: 100);
  Timer? _ticker;
  late Duration _remaining = widget.notice.duration;

  bool get _timed => widget.notice.duration > Duration.zero;

  @override
  void initState() {
    super.initState();
    // A notification replaced before its first frame leaves without showing.
    if (widget.leaving) {
      scheduleMicrotask(widget.onGone);
    } else {
      _motion.forward();
    }
    _runCountdown();
  }

  @override
  void didUpdateWidget(_ToastSlot oldWidget) {
    super.didUpdateWidget(oldWidget);
    _motion
      ..duration = widget.enter
      ..reverseDuration = widget.exit;
    if (widget.leaving != oldWidget.leaving) {
      if (widget.leaving) {
        // Without motion the reverse completes inside this build; the slot
        // leaves the list after it.
        _motion.reverse().whenCompleteOrCancel(
          () => scheduleMicrotask(widget.onGone),
        );
      } else {
        _motion.forward();
      }
    }
    final before = oldWidget.notice;
    final now = widget.notice;
    if (now.duration != before.duration) _remaining = now.duration;
    _runCountdown();
  }

  @override
  void dispose() {
    _motion.dispose();
    _ticker?.cancel();
    super.dispose();
  }

  void _runCountdown() {
    if (!_timed || widget.paused || widget.leaving) {
      _ticker?.cancel();
      _ticker = null;
      return;
    }
    _ticker ??= Timer.periodic(_step, (_) {
      _remaining -= _step;
      if (_remaining > Duration.zero) return;
      _ticker?.cancel();
      _ticker = null;
      _close(NotificationDismissReason.timeout);
    });
  }

  void _close(NotificationDismissReason reason) =>
      widget.controller.dismiss(widget.notice.id, reason);

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final notice = widget.notice;
    Widget toast = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
        boxShadow: overlayShadow(theme.brightness),
      ),
      child: InlineNotification(
        status: notice.status,
        title: notice.title,
        description: notice.text,
        role: InlineNotificationRole.group,
        inverted: notice.inverted,
        onClose: notice.closable
            ? () => _close(NotificationDismissReason.user)
            : null,
        actions: [
          for (final action in notice.actions)
            NotificationAction(
              label: action.label,
              variant: action.variant,
              onPressed: () {
                action.onPressed?.call();
                if (!action.keepOpen) _close(NotificationDismissReason.action);
              },
            ),
        ],
      ),
    );
    if (widget.swipeable && !widget.leaving) {
      final instant = widget.enter == Duration.zero;
      toast = Dismissible(
        key: ValueKey(notice.id),
        movementDuration: instant
            ? Duration.zero
            : const Duration(milliseconds: 200),
        resizeDuration: null,
        onDismissed: (_) => widget.onSwiped(),
        child: toast,
      );
    }
    return IgnorePointer(
      ignoring: widget.leaving,
      child: ExcludeSemantics(
        excluding: widget.leaving,
        // The toast grows into place, fades and slides in; the stack below
        // it moves with the growth.
        child: AnimatedBuilder(
          animation: _motion,
          builder: (context, child) => ClipRect(
            child: Align(
              alignment: Alignment.topCenter,
              heightFactor: _motion.value,
              child: Opacity(
                opacity: _motion.value,
                child: Transform.translate(
                  offset: Offset(0, widget.travel * (1 - _motion.value)),
                  child: child,
                ),
              ),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.only(bottom: _gap),
            child: toast,
          ),
        ),
      ),
    );
  }
}
