import 'package:flutter/widgets.dart';

import '../internal/glyphs.dart';
import '../notification/inline_notification.dart' show NotificationStatus;
import '../theme/theme.dart';

// The web FeedbackIcon's padding around its glyph.
const double _padding = 6;

/// What a [FeedbackIcon] draws behind its glyph.
enum FeedbackIconBox {
  /// A chip of the status colour at 15 %, the glyph in the status colour.
  tint,

  /// No chip: the glyph alone, for a surface already tinted, such as a
  /// coloured notification. The glyph keeps its size.
  transparent,

  /// A chip in the full status colour, the glyph in the colour that reads on
  /// it.
  solid,
}

/// The outline of a [FeedbackIcon]'s box.
enum FeedbackIconShape {
  /// The control radius.
  rounded,

  /// A full circle.
  round,
}

/// A status glyph in a small box: the kind of feedback (info, success,
/// warning, danger or neutral) at a glance, beside the text that says it.
///
/// Each status has its own drawing as well as its own colour, so the kind
/// never rests on colour alone. The box is decorative by default: the text
/// beside it carries the meaning. With [semanticLabel] it is an image with
/// that name, for an icon that stands alone.
///
/// The box grows with the text scale.
class FeedbackIcon extends StatelessWidget {
  /// Creates the icon for [status].
  const FeedbackIcon({
    super.key,
    this.status = NotificationStatus.info,
    this.box = FeedbackIconBox.tint,
    this.shape = FeedbackIconShape.rounded,
    this.size = 32,
    this.icon,
    this.semanticLabel,
  });

  /// The status that picks the glyph and the colour.
  final NotificationStatus status;

  /// What shows behind the glyph.
  final FeedbackIconBox box;

  /// The outline of the box.
  final FeedbackIconShape shape;

  /// The side of the box at text scale 1, in logical pixels.
  final double size;

  /// A glyph in place of the status glyph. It takes its size and colour
  /// from the surrounding [IconTheme].
  final Widget? icon;

  /// The accessible name. Null keeps the icon out of the semantics tree.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final (color, glyph) = switch (status) {
      NotificationStatus.info => (c.info, GlyphShape.info),
      NotificationStatus.success => (c.success, GlyphShape.success),
      NotificationStatus.warning => (c.warning, GlyphShape.warning),
      NotificationStatus.danger => (c.danger, GlyphShape.danger),
      NotificationStatus.neutral => (c.neutral, GlyphShape.neutral),
    };
    final scale = MediaQuery.textScalerOf(context);
    final side = scale.scale(size);
    final drawn = Container(
      width: side,
      height: side,
      padding: EdgeInsets.all(scale.scale(_padding)),
      decoration: BoxDecoration(
        color: switch (box) {
          FeedbackIconBox.tint => color.withValues(alpha: 0.15),
          FeedbackIconBox.transparent => null,
          FeedbackIconBox.solid => color,
        },
        borderRadius: BorderRadius.circular(
          shape == FeedbackIconShape.round ? side / 2 : theme.controlRadius,
        ),
      ),
      child: IconTheme(
        data: IconThemeData(
          color: box == FeedbackIconBox.solid ? c.onStatus : color,
          size: size - _padding * 2,
          applyTextScaling: true,
        ),
        child: FittedBox(child: icon ?? Glyph(glyph)),
      ),
    );
    final label = semanticLabel;
    if (label == null || label.isEmpty) return ExcludeSemantics(child: drawn);
    return Semantics(
      container: true,
      image: true,
      label: label,
      child: ExcludeSemantics(child: drawn),
    );
  }
}
