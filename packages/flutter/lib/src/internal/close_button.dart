import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../theme/theme.dart';
import 'glyphs.dart';

/// A ghost icon button with a cross in [color], so it reads on the surface
/// it sits on. Notifications and dialogs close with it.
class CloseButton extends StatelessWidget {
  /// Creates the button named [label].
  const CloseButton({
    super.key,
    required this.onPressed,
    required this.label,
    required this.color,
    this.glyphSize = 16,
    this.minArea = 0,
  });

  /// Called when the button is pressed.
  final VoidCallback onPressed;

  /// The accessible name.
  final String label;

  /// The colour of the cross.
  final Color color;

  /// The side of the cross at text scale 1.
  final double glyphSize;

  /// The smallest hit area, raised to the theme's minimum target size.
  final double minArea;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return InvisibleTheme(
      data: theme.copyWith(
        colors: theme.colors.copyWith(text: color),
        minTargetSize: Size(
          math.max(minArea, theme.minTargetSize.width),
          math.max(minArea, theme.minTargetSize.height),
        ),
      ),
      child: Button.icon(
        onPressed: onPressed,
        variant: ButtonVariant.ghost,
        icon: SizedBox.square(
          dimension: MediaQuery.textScalerOf(context).scale(glyphSize),
          child: const Glyph(GlyphShape.close),
        ),
        semanticLabel: label,
      ),
    );
  }
}
