import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../feedback_icon/feedback_icon.dart';
import '../internal/announce.dart';
import '../internal/close_button.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The kind of feedback a notification gives. Each status has its own glyph
/// and surface, so the meaning never relies on colour alone.
enum NotificationStatus {
  /// Neutral information.
  info,

  /// Something finished well.
  success,

  /// Something needs attention.
  warning,

  /// Something failed or is destructive.
  danger,

  /// A tip or a suggestion.
  neutral,
}

/// How an [InlineNotification] reaches assistive technology.
enum InlineNotificationRole {
  /// A polite live region: read when it appears or changes, without
  /// interrupting.
  status,

  /// An urgent message: announced at once, interrupting.
  alert,

  /// A named group that announces nothing itself, for a notice another part
  /// of the page announces.
  group,
}

/// A button inside a notification.
@immutable
class NotificationAction {
  /// Creates an action labelled [label].
  const NotificationAction({
    required this.label,
    this.onPressed,
    this.variant = ButtonVariant.ghost,
    this.keepOpen = false,
  });

  /// The button's text.
  final String label;

  /// Called when the action is pressed.
  final VoidCallback? onPressed;

  /// The button's variant. Ghost by default, so the action never outweighs
  /// the message.
  final ButtonVariant variant;

  /// Whether a toast stays after the action runs. Ignored by
  /// [InlineNotification], which the app removes itself.
  final bool keepOpen;
}

// Sizes the web Inline Notification sets in its own stylesheet.
const EdgeInsetsDirectional _padding = EdgeInsetsDirectional.symmetric(
  horizontal: 16,
  vertical: 14,
);
const double _gap = 12;
const double _closeArea = 40;
const double _closeInset = 8;
const double _borderWidth = 1;

/// A banner that gives feedback in the page: a status glyph, a [title], a
/// [description] and optional [actions].
///
/// By default it is a polite live region ([InlineNotificationRole.status]).
/// It is not dismissible unless [onClose] is given, which adds a close button
/// named by the theme's `closeLabel`; the app removes the banner in
/// [onClose].
class InlineNotification extends StatefulWidget {
  /// Creates a banner.
  const InlineNotification({
    super.key,
    this.status = NotificationStatus.info,
    required this.title,
    this.description,
    this.child,
    this.actions = const [],
    this.onClose,
    this.role = InlineNotificationRole.status,
    this.inverted = false,
    this.plain = false,
    this.icon,
  });

  /// The kind of feedback.
  final NotificationStatus status;

  /// The heading; it names the banner.
  final String title;

  /// The body text.
  final String? description;

  /// Rich body content, shown in place of [description].
  final Widget? child;

  /// Buttons under the body.
  final List<NotificationAction> actions;

  /// Called by the close button. Null leaves the banner without one.
  final VoidCallback? onClose;

  /// How the banner reaches assistive technology.
  final InlineNotificationRole role;

  /// A high-contrast surface, the opposite of the page.
  final bool inverted;

  /// No surface or border: the message sits on the page and the glyph's
  /// chip carries the status.
  final bool plain;

  /// A glyph shown in place of the status glyph. It takes its size and
  /// colour from the surrounding [IconTheme].
  final Widget? icon;

  @override
  State<InlineNotification> createState() => _InlineNotificationState();
}

class _InlineNotificationState extends State<InlineNotification> {
  bool _announced = false;

  String get _message => noticeMessage(widget.title, widget.description);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // An alert interrupts once, when it appears.
    if (widget.role == InlineNotificationRole.alert && !_announced) {
      _announced = true;
      announce(context, _message, assertive: true);
    }
  }

  @override
  void didUpdateWidget(InlineNotification oldWidget) {
    super.didUpdateWidget(oldWidget);
    final changed =
        oldWidget.title != widget.title ||
        oldWidget.description != widget.description;
    if (widget.role == InlineNotificationRole.alert && changed) {
      announce(context, _message, assertive: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final (surface, border) = switch (widget.status) {
      _ when widget.plain => (null, null),
      _ when widget.inverted => (c.emphasisSurface, c.emphasisBorder),
      NotificationStatus.info => (c.infoSurface, c.infoBorder),
      NotificationStatus.success => (c.successSurface, c.successBorder),
      NotificationStatus.warning => (c.warningSurface, c.warningBorder),
      NotificationStatus.danger => (c.dangerSurface, c.dangerBorder),
      NotificationStatus.neutral => (c.neutralSurface, c.neutralBorder),
    };
    final foreground = widget.inverted ? c.onEmphasis : c.text;
    final text = theme.textStyle.copyWith(color: foreground);
    final close = widget.onClose;

    final body =
        widget.child ??
        (widget.description == null || widget.description!.isEmpty
            ? null
            : Text(widget.description!, style: text));

    final content = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 4,
      children: [
        if (widget.title.isNotEmpty)
          Text(
            widget.title,
            style: text.copyWith(
              fontWeight: FontWeight.w600,
              height: InvisibleTypographyTokens.lineHeightTight,
            ),
          ),
        ?body,
        if (widget.actions.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final action in widget.actions)
                  Button(
                    onPressed: action.onPressed,
                    variant: action.variant,
                    child: Text(action.label),
                  ),
              ],
            ),
          ),
      ],
    );

    final banner = DecoratedBox(
      decoration: BoxDecoration(
        color: surface,
        border: border == null
            ? null
            : Border.all(color: border, width: _borderWidth),
        borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
      ),
      child: Stack(
        children: [
          Padding(
            // Room for the close button, so text never runs under it.
            padding: close == null
                ? _padding
                : _padding.copyWith(end: _closeArea + _closeInset),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: _gap,
              children: [
                FeedbackIcon(
                  status: widget.status,
                  // A tinted surface has its own colour; the chip shows on
                  // plain and inverted banners only.
                  box: widget.plain || widget.inverted
                      ? FeedbackIconBox.tint
                      : FeedbackIconBox.transparent,
                  icon: widget.icon,
                ),
                Expanded(child: content),
              ],
            ),
          ),
          if (close != null)
            PositionedDirectional(
              top: _closeInset,
              end: _closeInset,
              child: CloseButton(
                onPressed: close,
                label: theme.messages.closeLabel,
                color: foreground,
                minArea: _closeArea,
              ),
            ),
        ],
      ),
    );

    // One node holds the title and the body, so the live region reads them
    // together; the buttons stay nodes of their own.
    return Semantics(
      container: true,
      liveRegion: widget.role == InlineNotificationRole.status ? true : null,
      child: banner,
    );
  }
}
