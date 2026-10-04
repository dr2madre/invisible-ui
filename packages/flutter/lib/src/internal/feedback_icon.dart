import 'package:flutter/widgets.dart';

import '../notification/inline_notification.dart' show NotificationStatus;
import '../theme/theme.dart';
import 'glyphs.dart';

// The web FeedbackIcon's padding around its glyph.
const double _padding = 6;

/// The status glyph in its box, as the web adapters' FeedbackIcon draws it:
/// the glyph in the status colour on a chip of the same colour at 15 %.
///
/// It is decorative: the text beside it carries the meaning. The box grows
/// with the text scale.
class FeedbackIcon extends StatelessWidget {
  /// Creates the icon for [status].
  const FeedbackIcon({
    super.key,
    required this.status,
    this.chip = true,
    this.round = false,
    this.size = 32,
    this.icon,
  });

  /// The status that picks the glyph and the colour.
  final NotificationStatus status;

  /// Whether the tinted chip shows behind the glyph.
  final bool chip;

  /// A full circle instead of the control radius.
  final bool round;

  /// The side of the box at text scale 1, in logical pixels.
  final double size;

  /// A glyph in place of the status glyph. It takes its size and colour
  /// from the surrounding [IconTheme].
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final (color, shape) = switch (status) {
      NotificationStatus.info => (c.info, GlyphShape.info),
      NotificationStatus.success => (c.success, GlyphShape.success),
      NotificationStatus.warning => (c.warning, GlyphShape.warning),
      NotificationStatus.danger => (c.danger, GlyphShape.danger),
      NotificationStatus.neutral => (c.neutral, GlyphShape.neutral),
    };
    final scale = MediaQuery.textScalerOf(context);
    final side = scale.scale(size);
    return ExcludeSemantics(
      child: Container(
        width: side,
        height: side,
        padding: EdgeInsets.all(scale.scale(_padding)),
        decoration: BoxDecoration(
          color: chip ? color.withValues(alpha: 0.15) : null,
          borderRadius: BorderRadius.circular(
            round ? side / 2 : theme.controlRadius,
          ),
        ),
        child: IconTheme(
          data: IconThemeData(
            color: color,
            size: size - _padding * 2,
            applyTextScaling: true,
          ),
          child: FittedBox(child: icon ?? Glyph(shape)),
        ),
      ),
    );
  }
}
