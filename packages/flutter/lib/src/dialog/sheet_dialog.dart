import 'dart:math' as math;
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../theme/theme.dart';
import 'dialog.dart';
import 'dialog_panel.dart';

/// The screen edge a [SheetDialog] is anchored to.
enum SheetDialogSide {
  /// The top edge.
  top,

  /// The bottom edge.
  bottom,

  /// The inline-start edge: left in a left-to-right layout, right in a
  /// right-to-left one.
  start,

  /// The inline-end edge: right in a left-to-right layout, left in a
  /// right-to-left one.
  end,
}

// Sizes the web Sheet Dialog sets in its own stylesheet.
const double _lateralSize = 320;
const double _verticalSize = 256;
const Duration _duration = Duration(milliseconds: 250);
const double _handleLength = 40;
const double _handleThickness = 6;
const double _handleInset = 6;
// A release past this share of the panel's extent, or faster than this
// outward speed, dismisses; anything less snaps home.
const double _dismissShare = 0.25;
const double _dismissSpeed = 500;

/// A dialog anchored to an edge of the screen, for a task the user finishes
/// or cancels in context: filters, an edit form, a navigation drawer. Show
/// it with [showInvisibleDialog].
///
/// It is a [Dialog] in every way: modal, named by [title] and described by
/// [description], with focus moving into it when it opens ([initialFocus],
/// or the panel), Tab kept inside, and Escape, the barrier and the close
/// button ([closeButton], on by default, named by the theme's
/// `sheetDialogClose`) closing it and returning focus. The header holds
/// [icon], [headerLead] and [headerActions] as a dialog's does; the body
/// ([child]) scrolls and takes the space left, and [actions] sit in a footer
/// at the far end, set apart by a border. The status area between them
/// holds messages about the task (ADR 0016).
///
/// [side] picks the edge; [SheetDialogSide.start] and [SheetDialogSide.end]
/// follow the reading direction. The panel is as tall or as wide as the
/// screen, and [size] across, 320 for a side panel and 256 for a top or
/// bottom one, scaled with the text and never larger than the screen. It
/// slides in from its edge, except under reduced motion.
///
/// [draggable] adds a grab handle on the bottom and side panels: dragging it
/// toward the edge past a quarter of the panel, or flicking it, closes the
/// dialog; anything less snaps back. The handle is for pointers only:
/// keyboard and assistive technology users close the dialog with Escape or
/// the close button, so no task depends on the gesture.
///
/// ```dart
/// iu.showInvisibleDialog<void>(
///   context: context,
///   builder: (context) => iu.SheetDialog(
///     title: 'Filters',
///     description: 'Refine the results.',
///     actions: [
///       iu.Button(
///         onPressed: () => Navigator.of(context).pop(),
///         variant: iu.ButtonVariant.primary,
///         child: const Text('Apply'),
///       ),
///     ],
///     child: const FilterForm(),
///   ),
/// );
/// ```
class SheetDialog extends StatefulWidget {
  /// Creates a sheet dialog.
  const SheetDialog({
    super.key,
    required this.title,
    this.description,
    this.child,
    this.actions = const [],
    this.side = SheetDialogSide.end,
    this.draggable = false,
    this.size,
    this.closeButton = true,
    this.closeLabel,
    this.hideTitle = false,
    this.icon,
    this.headerLead,
    this.headerActions,
    this.initialFocus,
    this.controller,
  }) : assert(size == null || size > 0);

  /// The title; it names the dialog.
  final String title;

  /// A line under the title, which also describes the dialog.
  final String? description;

  /// The body.
  final Widget? child;

  /// The footer's actions, at the inline-end.
  final List<Widget> actions;

  /// The edge the panel is anchored to.
  final SheetDialogSide side;

  /// Whether a grab handle closes the dialog when dragged toward the edge.
  /// Ignored on [SheetDialogSide.top].
  final bool draggable;

  /// The panel's extent away from its edge at text scale 1.
  final double? size;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// The close button's name. Defaults to the theme's `sheetDialogClose`.
  final String? closeLabel;

  /// Whether the title is hidden from view. It still names the dialog.
  final bool hideTitle;

  /// A leading status icon in the header.
  final Widget? icon;

  /// A leading button in the header, such as Back.
  final Widget? headerLead;

  /// Actions in the header, before the close button.
  final Widget? headerActions;

  /// What takes focus when the dialog opens. Null focuses the dialog.
  final FocusNode? initialFocus;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  @override
  State<SheetDialog> createState() => _SheetDialogState();
}

/// The physical edges a [SheetDialogSide] stands for.
enum _Edge { top, bottom, left, right }

class _SheetDialogState extends State<SheetDialog>
    with TickerProviderStateMixin {
  late final AnimationController _enter = AnimationController(
    vsync: this,
    duration: _duration,
  );
  late final AnimationController _snap = AnimationController(
    vsync: this,
    duration: _duration,
  );
  double _drag = 0;
  bool _dragging = false;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (reducedMotion(context)) {
      _enter.value = 1;
    } else {
      _enter.forward();
    }
  }

  @override
  void dispose() {
    _enter.dispose();
    _snap.dispose();
    super.dispose();
  }

  _Edge get _edge {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return switch (widget.side) {
      SheetDialogSide.top => _Edge.top,
      SheetDialogSide.bottom => _Edge.bottom,
      SheetDialogSide.start => rtl ? _Edge.right : _Edge.left,
      SheetDialogSide.end => rtl ? _Edge.left : _Edge.right,
    };
  }

  bool get _vertical => _edge == _Edge.top || _edge == _Edge.bottom;

  bool get _hasHandle => widget.draggable && widget.side != SheetDialogSide.top;

  /// The offset of a movement toward the edge, positive outward.
  Offset _outward(double distance) => switch (_edge) {
    _Edge.top => Offset(0, -distance),
    _Edge.bottom => Offset(0, distance),
    _Edge.left => Offset(-distance, 0),
    _Edge.right => Offset(distance, 0),
  };

  /// The part of [delta] that points toward the edge.
  double _towardEdge(Offset delta) => switch (_edge) {
    _Edge.top => -delta.dy,
    _Edge.bottom => delta.dy,
    _Edge.left => -delta.dx,
    _Edge.right => delta.dx,
  };

  void _dragStart(DragStartDetails details) {
    _snap.stop();
    setState(() => _dragging = true);
  }

  void _dragUpdate(DragUpdateDetails details) {
    setState(() => _drag = math.max(0, _drag + _towardEdge(details.delta)));
  }

  void _dragEnd(DragEndDetails details, double extent) {
    final speed = _towardEdge(details.velocity.pixelsPerSecond);
    setState(() => _dragging = false);
    if (_drag > extent * _dismissShare || speed > _dismissSpeed) {
      final navigator = Navigator.maybeOf(context);
      if (navigator != null && navigator.canPop()) navigator.maybePop();
      return;
    }
    _snapHome();
  }

  void _snapHome() {
    final from = _drag;
    if (from == 0) return;
    if (reducedMotion(context)) {
      setState(() => _drag = 0);
      return;
    }
    final animation = CurvedAnimation(parent: _snap, curve: Curves.ease);
    void tick() => setState(() => _drag = from * (1 - animation.value));
    _snap
      ..reset()
      ..addListener(tick)
      ..forward().whenCompleteOrCancel(() {
        _snap.removeListener(tick);
        animation.dispose();
      });
  }

  Widget _handle(double extent) {
    final colors = InvisibleTheme.of(context).colors;
    final target = InvisibleTheme.of(context).minTargetSize;
    final bar = DecoratedBox(
      decoration: BoxDecoration(
        color: colors.border,
        borderRadius: BorderRadius.circular(_handleThickness),
      ),
      child: SizedBox(
        width: _vertical ? _handleLength : _handleThickness,
        height: _vertical ? _handleThickness : _handleLength,
      ),
    );
    void end(DragEndDetails details) => _dragEnd(details, extent);
    // A pointer affordance only: nothing in it reaches assistive technology
    // or the focus order.
    return ExcludeSemantics(
      child: MouseRegion(
        cursor: _dragging
            ? SystemMouseCursors.grabbing
            : SystemMouseCursors.grab,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          dragStartBehavior: DragStartBehavior.down,
          onVerticalDragStart: _vertical ? _dragStart : null,
          onVerticalDragUpdate: _vertical ? _dragUpdate : null,
          onVerticalDragEnd: _vertical ? end : null,
          onHorizontalDragStart: _vertical ? null : _dragStart,
          onHorizontalDragUpdate: _vertical ? null : _dragUpdate,
          onHorizontalDragEnd: _vertical ? null : end,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minWidth: target.width,
              minHeight: target.height,
            ),
            child: Center(widthFactor: 1, heightFactor: 1, child: bar),
          ),
        ),
      ),
    );
  }

  Widget _place(BuildContext context, Widget panel) {
    final media = MediaQuery.of(context);
    final scaler = MediaQuery.textScalerOf(context);
    final screen = media.size;
    final edge = _edge;
    final vertical = _vertical;
    final across = scaler.scale(
      widget.size ?? (vertical ? _verticalSize : _lateralSize),
    );
    final width = vertical ? screen.width : math.min(across, screen.width);
    final height = vertical
        ? math.min(
            across,
            math.max(0.0, screen.height - media.viewInsets.bottom),
          )
        : screen.height;
    final extent = vertical ? height : width;

    Widget sheet = SizedBox(width: width, height: height, child: panel);
    if (_hasHandle) {
      final handle = _handle(extent);
      sheet = Stack(
        children: [
          sheet,
          switch (edge) {
            _Edge.bottom => Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Center(child: handle),
            ),
            // Along the inner edge, centred on it.
            _Edge.right => Positioned(
              left: _handleInset - _hitInset(context),
              top: 0,
              bottom: 0,
              child: Center(child: handle),
            ),
            _Edge.left => Positioned(
              right: _handleInset - _hitInset(context),
              top: 0,
              bottom: 0,
              child: Center(child: handle),
            ),
            _Edge.top => const SizedBox.shrink(),
          },
        ],
      );
    }

    return Padding(
      // A bottom sheet stays above the keyboard.
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: Align(
        alignment: switch (edge) {
          _Edge.top => Alignment.topCenter,
          _Edge.bottom => Alignment.bottomCenter,
          _Edge.left => Alignment.centerLeft,
          _Edge.right => Alignment.centerRight,
        },
        child: AnimatedBuilder(
          animation: _enter,
          builder: (context, child) {
            final hidden = 1 - Curves.ease.transform(_enter.value);
            return Transform.translate(
              offset: _outward(hidden * extent + _drag),
              child: child,
            );
          },
          child: sheet,
        ),
      ),
    );
  }

  // The handle's hit area is wider than the bar; this keeps the bar at the
  // web's distance from the panel's inner edge.
  double _hitInset(BuildContext context) =>
      (InvisibleTheme.of(context).minTargetSize.width - _handleThickness) / 2;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final side = BorderSide(color: colors.border);
    final edge = _edge;
    return DialogPanel(
      title: widget.title,
      role: SemanticsRole.dialog,
      spacing: DialogSpacing.sheet,
      hideTitle: widget.hideTitle,
      subtitle: widget.description,
      body: widget.child,
      footer: widget.actions.isEmpty
          ? null
          : DialogFooter(actions: widget.actions),
      closeButton: widget.closeButton,
      closeLabel:
          widget.closeLabel ??
          InvisibleTheme.of(context).messages.sheetDialogClose,
      icon: widget.icon,
      headerLead: widget.headerLead,
      headerActions: widget.headerActions,
      initialFocus: widget.initialFocus,
      controller: widget.controller,
      radius: BorderRadius.zero,
      // No border along the edge it is anchored to.
      border: Border(
        top: edge == _Edge.top ? BorderSide.none : side,
        bottom: edge == _Edge.bottom ? BorderSide.none : side,
        left: edge == _Edge.left ? BorderSide.none : side,
        right: edge == _Edge.right ? BorderSide.none : side,
      ),
      place: _place,
    );
  }
}
