import 'dart:ui' show SemanticsRole;

import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/announce.dart';
import '../internal/close_button.dart';
import '../internal/elevation.dart';
import '../internal/focus_ring.dart';
import '../notification/inline_notification.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// A message about a dialog's own task, in its status area (ADR 0016).
@immutable
class DialogNotice {
  /// Creates a notice.
  const DialogNotice({
    required this.id,
    required this.title,
    this.status = NotificationStatus.info,
    this.description,
    this.action,
    this.dismissible = true,
  });

  /// The identity [DialogController.notify] returned.
  final String id;

  /// The heading; it names the notice.
  final String title;

  /// The kind of feedback.
  final NotificationStatus status;

  /// The body text.
  final String? description;

  /// A button, such as Retry. Running it closes the notice.
  final NotificationAction? action;

  /// Whether the notice has a close button.
  final bool dismissible;
}

/// The status area of a dialog: the messages about the dialog's own task,
/// shown between its body and its footer (ADR 0016, case 1).
///
/// Give one to a [Dialog], an [AlertDialog] or a [ConfirmDialog] to reach the
/// status area from outside the dialog, for example from the code that
/// uploads a file; content inside the dialog reaches it with [Dialog.of].
/// A controller serves one open dialog at a time and can be reused for the
/// next opening.
///
/// Notices belong to one opening: [notify] shows nothing while no dialog is
/// open, and closing the dialog clears them. A message that is still true
/// when the dialog opens again is shown again by the app.
class DialogController extends ChangeNotifier {
  // Ids count per controller, so two controllers never share a sequence.
  int _counter = 0;
  final List<DialogNotice> _notices = [];
  Object? _dialog;

  /// Whether a dialog shows this controller's notices now.
  bool get isOpen => _dialog != null;

  /// The notices, oldest first.
  List<DialogNotice> get notices => List.unmodifiable(_notices);

  /// Shows a notice in the status area and returns its id.
  ///
  /// The notice is announced once, politely, and never takes focus. While no
  /// dialog is open it shows nothing and returns an empty string.
  String notify({
    required String title,
    NotificationStatus status = NotificationStatus.info,
    String? description,
    NotificationAction? action,
    bool dismissible = true,
  }) {
    if (_dialog == null) return '';
    final id = 'dialog-notice-${++_counter}';
    _notices.add(
      DialogNotice(
        id: id,
        title: title,
        status: status,
        description: description,
        action: action,
        dismissible: dismissible,
      ),
    );
    notifyListeners();
    return id;
  }

  /// Removes the notice [id]. When it held focus, the dialog takes focus.
  void dismissNotice(String id) {
    final before = _notices.length;
    _notices.removeWhere((notice) => notice.id == id);
    if (_notices.length != before) notifyListeners();
  }

  /// Removes every notice.
  void clearNotices() {
    if (_notices.isEmpty) return;
    _notices.clear();
    notifyListeners();
  }

  void _attach(Object dialog) => _dialog = dialog;

  void _detach(Object dialog) {
    if (_dialog != dialog) return;
    _dialog = null;
    clearNotices();
  }
}

/// The controller of the dialog around [context], or null outside one.
DialogController? maybeDialogControllerOf(BuildContext context) =>
    context.dependOnInheritedWidgetOfExactType<_DialogScope>()?.controller;

class _DialogScope extends InheritedWidget {
  const _DialogScope({required this.controller, required super.child});

  final DialogController controller;

  @override
  bool updateShouldNotify(_DialogScope oldWidget) =>
      controller != oldWidget.controller;
}

/// The overlay colour of the web dialogs (`--ds-dialog-overlay`), which no
/// token defines yet.
const Color dialogBarrierColor = Color(0x801C1915);

/// The spacing between the parts of a panel.
@immutable
class DialogSpacing {
  /// Creates the spacing.
  const DialogSpacing({
    required this.afterHeader,
    required this.beforeStatus,
    required this.beforeFooter,
    required this.maxWidth,
  });

  /// Between the header and the body.
  final double afterHeader;

  /// Between the body and the status area.
  final double beforeStatus;

  /// Before the footer.
  final double beforeFooter;

  /// The widest the panel grows.
  final double maxWidth;

  /// The web Dialog: header and footer padded away from the body.
  static const DialogSpacing dialog = DialogSpacing(
    afterHeader: 32,
    beforeStatus: 16,
    beforeFooter: 32,
    maxWidth: 480,
  );

  /// The web Alert and Confirm dialogs: a short message under the title.
  static const DialogSpacing preset = DialogSpacing(
    afterHeader: 8,
    beforeStatus: 16,
    beforeFooter: 24,
    maxWidth: 448,
  );
}

// Sizes the web dialogs set in their own stylesheets.
const EdgeInsets _panelPadding = EdgeInsets.symmetric(
  horizontal: 24,
  vertical: 20,
);
const double _inset = 16;
const double _headerGap = 12;
const double _closeGlyph = 20;
// Under this height, scaled with the text, the whole panel scrolls, header
// and footer included, so nothing is cut off on a short window or at a large
// text scale.
const double _tightHeight = 320;

/// The panel every dialog of the family shares: semantics, focus, Escape,
/// the header, the scrolling body, the status area and the footer.
///
/// Not exported: [Dialog], [AlertDialog] and [ConfirmDialog] build it.
class DialogPanel extends StatefulWidget {
  /// Creates the panel.
  const DialogPanel({
    super.key,
    required this.title,
    required this.role,
    required this.spacing,
    this.hideTitle = false,
    this.subtitle,
    this.message,
    this.body,
    this.footer,
    this.closeButton = false,
    this.icon,
    this.headerLead,
    this.headerMeta,
    this.headerActions,
    this.initialFocus,
    this.controller,
    this.onClosed,
  });

  /// The title; it names the dialog.
  final String title;

  /// [SemanticsRole.dialog] or [SemanticsRole.alertDialog].
  final SemanticsRole role;

  /// The spacing and width.
  final DialogSpacing spacing;

  /// Whether the title is hidden from view; it still names the dialog.
  final bool hideTitle;

  /// A line under the title, which also describes the dialog.
  final String? subtitle;

  /// The message of an alert or a confirmation, which describes the dialog.
  final String? message;

  /// The body.
  final Widget? body;

  /// The footer.
  final Widget? footer;

  /// Whether the header has a close button.
  final bool closeButton;

  /// A leading status icon in the header.
  final Widget? icon;

  /// A leading button in the header, such as Back.
  final Widget? headerLead;

  /// Context above the title, such as "Step 1 of 2".
  final Widget? headerMeta;

  /// Actions before the close button.
  final Widget? headerActions;

  /// What takes focus when the dialog opens. Null focuses the panel.
  final FocusNode? initialFocus;

  /// The status area's controller. Null uses one of the panel's own.
  final DialogController? controller;

  /// Called once after the dialog's route is popped, however it closed.
  final VoidCallback? onClosed;

  @override
  State<DialogPanel> createState() => _DialogPanelState();
}

class _DialogPanelState extends State<DialogPanel> {
  final FocusNode _panelFocus = FocusNode(
    debugLabel: 'Dialog',
    skipTraversal: true,
  );
  DialogController? _own;
  final Map<String, FocusNode> _noticeFocus = {};
  List<DialogNotice> _shown = const [];
  ModalRoute<Object?>? _route;
  bool _closed = false;
  bool _focusVisible = false;

  DialogController get _controller =>
      widget.controller ?? (_own ??= DialogController());

  @override
  void initState() {
    super.initState();
    _connect(_controller);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route == _route) return;
    _route = route;
    if (route == null) return;
    route.popped.then((_) => _close());
    // Only a dialog route moves focus; a panel shown in a page leaves it.
    if (route is PopupRoute) {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _closed) return;
        final target = widget.initialFocus;
        (target != null && target.context != null ? target : _panelFocus)
            .requestFocus();
      });
    }
  }

  @override
  void didUpdateWidget(DialogPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    final old = oldWidget.controller ?? _own;
    if (!_closed && old != _controller && old != null) {
      _disconnect(old);
      _connect(_controller);
    }
  }

  @override
  void dispose() {
    _disconnect(_controller);
    _own?.dispose();
    _panelFocus.dispose();
    for (final node in _noticeFocus.values) {
      node.dispose();
    }
    super.dispose();
  }

  void _connect(DialogController controller) {
    controller
      .._attach(this)
      ..addListener(_syncNotices);
    _shown = controller.notices;
  }

  void _disconnect(DialogController controller) {
    controller
      ..removeListener(_syncNotices)
      .._detach(this);
  }

  // Closing clears the notices, and reports after the route has gone.
  void _close() {
    if (_closed) return;
    _closed = true;
    _disconnect(_controller);
    widget.onClosed?.call();
  }

  void _dismiss() => Navigator.maybeOf(context)?.maybePop();

  void _syncNotices() {
    final now = _controller.notices;
    final ids = {for (final notice in now) notice.id};
    final before = {for (final notice in _shown) notice.id};
    var refocus = false;
    for (final id in before.difference(ids)) {
      final node = _noticeFocus.remove(id);
      if (node == null) continue;
      if (node.hasFocus) refocus = true;
      SchedulerBinding.instance.addPostFrameCallback((_) => node.dispose());
    }
    final added = [
      for (final notice in now)
        if (!before.contains(notice.id)) notice,
    ];
    setState(() => _shown = now);
    if (!refocus && added.isEmpty) return;
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      // A closed notice that held focus hands it to the panel, as on open.
      if (refocus) _panelFocus.requestFocus();
      // Each notice is read once, unless it went before its turn.
      for (final notice in added) {
        if (!_controller.notices.contains(notice)) continue;
        announce(context, noticeMessage(notice.title, notice.description));
      }
    });
  }

  Widget _status() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 8,
      children: [
        for (final notice in _shown)
          Focus(
            key: ValueKey(notice.id),
            focusNode: _noticeFocus.putIfAbsent(
              notice.id,
              () => FocusNode(canRequestFocus: false, skipTraversal: true),
            ),
            includeSemantics: false,
            child: InlineNotification(
              status: notice.status,
              title: notice.title,
              description: notice.description,
              // A group named by its title: the panel announces it.
              role: InlineNotificationRole.group,
              onClose: notice.dismissible
                  ? () => _controller.dismissNotice(notice.id)
                  : null,
              actions: [
                if (notice.action case final action?)
                  NotificationAction(
                    label: action.label,
                    variant: action.variant,
                    onPressed: () {
                      action.onPressed?.call();
                      _controller.dismissNotice(notice.id);
                    },
                  ),
              ],
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final text = theme.textStyle.copyWith(color: c.text);
    final spacing = widget.spacing;

    final header = _DialogHeader(
      title: widget.title,
      hideTitle: widget.hideTitle,
      subtitle: widget.subtitle,
      closeButton: widget.closeButton,
      onClose: _dismiss,
      icon: widget.icon,
      lead: widget.headerLead,
      meta: widget.headerMeta,
      actions: widget.headerActions,
    );
    final body =
        widget.body ??
        (widget.message == null
            ? null
            // The panel's own description carries it to assistive
            // technology.
            : ExcludeSemantics(
                child: Text(
                  widget.message!,
                  style: text.copyWith(color: c.textSecondary),
                ),
              ));

    List<Widget> parts({required bool flexible}) {
      final list = <Widget>[];
      void add(Widget part, double gap) {
        if (list.isNotEmpty) list.add(SizedBox(height: gap));
        list.add(part);
      }

      if (!header.isEmpty) add(header, 0);
      if (body != null) {
        add(
          flexible ? Flexible(child: SingleChildScrollView(child: body)) : body,
          spacing.afterHeader,
        );
      }
      if (_shown.isNotEmpty) add(_status(), spacing.beforeStatus);
      if (widget.footer != null) add(widget.footer!, spacing.beforeFooter);
      return list;
    }

    final content = LayoutBuilder(
      builder: (context, constraints) {
        // Unbounded, as in a scrolling page: everything at its own height.
        final bounded = constraints.hasBoundedHeight;
        final tight =
            bounded &&
            constraints.maxHeight <
                MediaQuery.textScalerOf(context).scale(_tightHeight);
        final column = Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: parts(flexible: bounded && !tight),
        );
        return Padding(
          padding: _panelPadding,
          child: tight ? SingleChildScrollView(child: column) : column,
        );
      },
    );

    final panel = DecoratedBox(
      decoration: BoxDecoration(
        color: c.background,
        border: Border.all(color: c.border),
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
        boxShadow: overlayShadow(theme.brightness),
      ),
      child: DefaultTextStyle(style: text, child: content),
    );

    final media = MediaQuery.of(context);
    return _DialogScope(
      controller: _controller,
      child: Padding(
        // Clear of the screen edges, the system areas and the keyboard.
        padding:
            const EdgeInsets.all(_inset) + media.padding + media.viewInsets,
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: spacing.maxWidth),
            child: Semantics(
              container: true,
              explicitChildNodes: true,
              namesRoute: true,
              role: widget.role,
              label: widget.title,
              hint: widget.subtitle ?? widget.message,
              // The panel's focus belongs to this node: the dialog itself is
              // what takes focus when it opens.
              focusable: true,
              focused: _panelFocus.hasPrimaryFocus,
              child: FocusableActionDetector(
                focusNode: _panelFocus,
                includeFocusSemantics: false,
                onFocusChange: (_) => setState(() {}),
                shortcuts: const {
                  SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
                },
                actions: {
                  DismissIntent: CallbackAction<DismissIntent>(
                    onInvoke: (_) {
                      _dismiss();
                      return null;
                    },
                  ),
                },
                onShowFocusHighlight: (visible) =>
                    setState(() => _focusVisible = visible),
                child: FocusRingPainter(
                  visible: _focusVisible,
                  ring: theme.focusRing,
                  radius: InvisibleRadiusTokens.surface,
                  child: panel,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The header every dialog of the family shares: an optional status icon,
/// an optional leading button, the title block (context, title, subtitle),
/// optional actions and the optional close button, each centred against
/// the title block.
class _DialogHeader extends StatelessWidget {
  const _DialogHeader({
    required this.title,
    required this.hideTitle,
    required this.subtitle,
    required this.closeButton,
    required this.onClose,
    required this.icon,
    required this.lead,
    required this.meta,
    required this.actions,
  });

  final String title;
  final bool hideTitle;
  final String? subtitle;
  final bool closeButton;
  final VoidCallback onClose;
  final Widget? icon;
  final Widget? lead;
  final Widget? meta;
  final Widget? actions;

  /// Whether nothing in it shows: a hidden title and nothing else. The
  /// panel's semantics still carry the title.
  bool get isEmpty =>
      hideTitle &&
      !closeButton &&
      subtitle == null &&
      icon == null &&
      lead == null &&
      meta == null &&
      actions == null;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final small = theme.textStyle.copyWith(
      fontSize: 14,
      height: InvisibleTypographyTokens.lineHeightTight,
      color: c.textSecondary,
    );
    final block = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (meta != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: DefaultTextStyle(style: small, child: meta!),
          ),
        if (!hideTitle)
          Semantics(
            header: true,
            headingLevel: 2,
            child: Text(
              title,
              style: theme.textStyle.copyWith(
                color: c.text,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                height: InvisibleTypographyTokens.lineHeightTight,
              ),
            ),
          ),
        if (subtitle != null)
          // The panel's own description carries it to assistive technology.
          ExcludeSemantics(child: Text(subtitle!, style: small)),
      ],
    );
    return Row(
      spacing: _headerGap,
      children: [
        ?icon,
        ?lead,
        Expanded(child: block),
        ?actions,
        if (closeButton)
          CloseButton(
            onPressed: onClose,
            label: theme.messages.dialogCloseLabel,
            color: c.textSecondary,
            glyphSize: _closeGlyph,
          ),
      ],
    );
  }
}
