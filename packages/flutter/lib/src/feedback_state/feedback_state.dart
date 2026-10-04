import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../internal/announce.dart';
import '../internal/feedback_icon.dart';
import '../notification/inline_notification.dart' show NotificationStatus;
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The density of an [EmptyState] or an [ErrorState].
enum FeedbackStateSize {
  /// For full pages and sections.
  medium,

  /// For cards, panels and table areas.
  small,
}

/// A centred message for a space with nothing to show yet, where nothing
/// failed: a first run, an empty list, no search results.
///
/// It shows an [illustration] (the theme's status icon by default), a
/// [title] as a heading, an optional [description] and [child], and the
/// actions. The action is an invitation ("Add a project"), never a recovery;
/// for a failure use [ErrorState].
///
/// It announces nothing by default. Set [live] when the empty state appears
/// after the screen has loaded, such as a search that found nothing: it is
/// then a polite live region.
class EmptyState extends StatelessWidget {
  /// Creates an empty state.
  const EmptyState({
    super.key,
    required this.title,
    this.description,
    this.status = NotificationStatus.neutral,
    this.headingLevel = 2,
    this.illustration,
    this.child,
    this.actionLabel,
    this.onAction,
    this.actions = const [],
    this.size = FeedbackStateSize.medium,
    this.live = false,
  }) : assert(headingLevel >= 1 && headingLevel <= 6);

  /// What this space is for, in plain language.
  final String title;

  /// Detail or the suggested next step.
  final String? description;

  /// The status of the default icon.
  final NotificationStatus status;

  /// The heading level of the title, 1 to 6, to fit the screen's outline.
  final int headingLevel;

  /// Artwork in place of the status icon.
  final Widget? illustration;

  /// Extra content between the description and the actions.
  final Widget? child;

  /// The label of a single action button. Ignored when [actions] is set.
  final String? actionLabel;

  /// Called when the [actionLabel] button is pressed.
  final VoidCallback? onAction;

  /// The action buttons, usually [Button]s. They take the place of
  /// [actionLabel].
  final List<Widget> actions;

  /// The density.
  final FeedbackStateSize size;

  /// Whether the state is a polite live region.
  final bool live;

  @override
  Widget build(BuildContext context) => _FeedbackState(
    title: title,
    description: description,
    status: status,
    headingLevel: headingLevel,
    icon: illustration,
    actionLabel: actionLabel,
    onAction: onAction,
    actions: actions,
    size: size,
    live: live,
    assertive: false,
    child: child,
  );
}

/// A centred message for a space whose content failed to load: a failed
/// request, a server error, a lost connection.
///
/// It shows an [icon] (the theme's danger icon by default), a [title] as a
/// heading, an optional [description] and [child], and a recovery action
/// ("Try again"). It replaces the content it covers, so it has no close
/// button; for a space that is merely empty use [EmptyState].
///
/// It announces nothing by default. Set [live] when the failure appears after
/// the screen has loaded: it then interrupts once, as an alert, when it
/// appears.
class ErrorState extends StatelessWidget {
  /// Creates an error state.
  const ErrorState({
    super.key,
    required this.title,
    this.description,
    this.status = NotificationStatus.danger,
    this.headingLevel = 2,
    this.icon,
    this.child,
    this.actionLabel,
    this.onAction,
    this.actions = const [],
    this.size = FeedbackStateSize.medium,
    this.live = false,
  }) : assert(headingLevel >= 1 && headingLevel <= 6);

  /// What went wrong, in plain language.
  final String title;

  /// Detail or the next step.
  final String? description;

  /// The status of the default icon.
  final NotificationStatus status;

  /// The heading level of the title, 1 to 6, to fit the screen's outline.
  final int headingLevel;

  /// A glyph or artwork in place of the status icon.
  final Widget? icon;

  /// Extra content between the description and the actions.
  final Widget? child;

  /// The label of a single recovery button. Ignored when [actions] is set.
  final String? actionLabel;

  /// Called when the [actionLabel] button is pressed.
  final VoidCallback? onAction;

  /// The action buttons, usually [Button]s. They take the place of
  /// [actionLabel].
  final List<Widget> actions;

  /// The density.
  final FeedbackStateSize size;

  /// Whether the state interrupts assistive technology when it appears.
  final bool live;

  @override
  Widget build(BuildContext context) => _FeedbackState(
    title: title,
    description: description,
    status: status,
    headingLevel: headingLevel,
    icon: icon,
    actionLabel: actionLabel,
    onAction: onAction,
    actions: actions,
    size: size,
    live: live,
    assertive: true,
    child: child,
  );
}

// Sizes the web Empty State and Error State set in their stylesheets.
const double _maxWidth = 384;

/// The layout and semantics [EmptyState] and [ErrorState] share.
class _FeedbackState extends StatefulWidget {
  const _FeedbackState({
    required this.title,
    required this.description,
    required this.status,
    required this.headingLevel,
    required this.icon,
    required this.actionLabel,
    required this.onAction,
    required this.actions,
    required this.size,
    required this.live,
    required this.assertive,
    required this.child,
  });

  final String title;
  final String? description;
  final NotificationStatus status;
  final int headingLevel;
  final Widget? icon;
  final String? actionLabel;
  final VoidCallback? onAction;
  final List<Widget> actions;
  final FeedbackStateSize size;
  final bool live;
  final bool assertive;
  final Widget? child;

  @override
  State<_FeedbackState> createState() => _FeedbackStateState();
}

class _FeedbackStateState extends State<_FeedbackState> {
  bool _announced = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _announceAlert();
  }

  @override
  void didUpdateWidget(_FeedbackState oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!oldWidget.live) _announced = false;
    _announceAlert();
  }

  // An alert interrupts once, when it appears; a polite state is a live
  // region instead.
  void _announceAlert() {
    if (!widget.live || !widget.assertive || _announced) return;
    _announced = true;
    announce(
      context,
      noticeMessage(widget.title, widget.description),
      assertive: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final small = widget.size == FeedbackStateSize.small;
    final text = theme.textStyle.copyWith(color: theme.colors.text);
    final actions = widget.actions.isNotEmpty
        ? widget.actions
        : [
            if (widget.actionLabel != null)
              Button(
                onPressed: widget.onAction,
                child: Text(widget.actionLabel!),
              ),
          ];

    final content = Column(
      mainAxisSize: MainAxisSize.min,
      spacing: small ? 8 : 12,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child:
              widget.icon ??
              FeedbackIcon(
                status: widget.status,
                round: true,
                size: small ? 40 : 56,
              ),
        ),
        Semantics(
          header: true,
          headingLevel: widget.headingLevel,
          child: Text(
            widget.title,
            textAlign: TextAlign.center,
            style: text.copyWith(
              fontSize: small ? 16 : 20,
              fontWeight: FontWeight.w700,
              height: InvisibleTypographyTokens.lineHeightTight,
            ),
          ),
        ),
        if (widget.description != null && widget.description!.isNotEmpty)
          Text(
            widget.description!,
            textAlign: TextAlign.center,
            style: text.copyWith(color: theme.colors.textSecondary),
          ),
        ?widget.child,
        if (actions.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: actions,
            ),
          ),
      ],
    );

    return Semantics(
      container: true,
      liveRegion: widget.live && !widget.assertive ? true : null,
      child: Center(
        heightFactor: 1,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: _maxWidth),
          child: Padding(
            padding: small
                ? const EdgeInsets.symmetric(horizontal: 16, vertical: 24)
                : const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
            child: DefaultTextStyle(style: text, child: content),
          ),
        ),
      ),
    );
  }
}
