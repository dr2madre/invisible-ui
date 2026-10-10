import 'package:flutter/widgets.dart';

import '../notification/inline_notification.dart' show NotificationStatus;
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web Count sets in its own stylesheet, at text scale 1.
const double _side = 20;
const double _dotSide = 8.8;
const double _paddingX = 4.8;
const double _fontSize = 11;

/// The small number on a bell, an avatar or a tab that signals unread or
/// pending items.
///
/// Past [max] it shows "N+"; at 0 it shows nothing unless [showZero]; [dot]
/// shows a dot with no number.
///
/// The digits are terse, so [semanticLabel] gives the fuller name ("3 unread
/// messages") and the digits stay out of the semantics tree. The count is a
/// live region, so a change is announced. A dot has no text: with a
/// [semanticLabel] it is a live region with that name, without one it is
/// decorative. The status colour adds to the number and the name and never
/// replaces them.
class Count extends StatelessWidget {
  /// Creates the count.
  const Count({
    super.key,
    this.count = 0,
    this.max = 99,
    this.dot = false,
    this.showZero = false,
    this.status = NotificationStatus.danger,
    this.semanticLabel,
  });

  /// The number.
  final int count;

  /// The ceiling before "N+".
  final int max;

  /// Whether a dot shows in place of the number.
  final bool dot;

  /// Whether the count shows at 0.
  final bool showZero;

  /// The colour. Danger, the usual unread colour, by default.
  final NotificationStatus status;

  /// The fuller accessible name, such as "3 unread messages".
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    if (!dot && !showZero && count <= 0) return const SizedBox.shrink();
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final (background, foreground) = switch (status) {
      NotificationStatus.danger => (c.danger, c.onStatus),
      NotificationStatus.neutral => (c.neutral, c.onStatus),
      NotificationStatus.info => (c.info, c.onStatus),
      NotificationStatus.success => (c.success, c.onStatus),
      NotificationStatus.warning => (c.warning, c.onWarning),
    };
    final scale = MediaQuery.textScalerOf(context);
    final decoration = BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(InvisibleRadiusTokens.pill),
    );
    final label = semanticLabel;

    if (dot) {
      final drawn = SizedBox.square(
        dimension: scale.scale(_dotSide),
        child: DecoratedBox(decoration: decoration),
      );
      if (label == null || label.isEmpty) return ExcludeSemantics(child: drawn);
      return Semantics(
        container: true,
        liveRegion: true,
        label: label,
        child: drawn,
      );
    }

    final display = count > max ? '$max+' : '$count';
    return Semantics(
      container: true,
      liveRegion: true,
      label: label == null || label.isEmpty ? display : label,
      child: ExcludeSemantics(
        child: Container(
          constraints: BoxConstraints(
            minWidth: scale.scale(_side),
            minHeight: scale.scale(_side),
          ),
          padding: EdgeInsets.symmetric(horizontal: scale.scale(_paddingX)),
          decoration: decoration,
          child: Center(
            widthFactor: 1,
            heightFactor: 1,
            child: Text(
              display,
              maxLines: 1,
              softWrap: false,
              style: theme.textStyle.copyWith(
                fontSize: _fontSize,
                fontWeight: FontWeight.w600,
                height: 1,
                color: foreground,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
