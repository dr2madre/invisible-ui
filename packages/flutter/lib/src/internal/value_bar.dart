import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'open_width.dart';

// Sizes the web Progress and Meter set in their own stylesheets.
const double _defaultWidth = 256;
const double _height = 8;

/// How long a bar's fill takes to follow a new value, as the web's 200ms
/// transition; nothing under reduced motion.
Duration valueTransition(BuildContext context) =>
    MediaQuery.maybeDisableAnimationsOf(context) ?? false
    ? Duration.zero
    : const Duration(milliseconds: 200);

/// The track and fill of [Progress] and [Meter]: [percentage] of the track,
/// 0 to 100, filled from the inline-start in [fill]. It takes the width its
/// parent gives, or 256 when the width is open.
class ValueBar extends StatelessWidget {
  /// Creates the bar.
  const ValueBar({super.key, required this.percentage, required this.fill});

  /// The filled share, 0 to 100.
  final double percentage;

  /// The fill colour.
  final Color fill;

  @override
  Widget build(BuildContext context) {
    final colors = InvisibleTheme.of(context).colors;
    final radius = BorderRadius.circular(InvisibleRadiusTokens.pill);
    return OpenWidth(
      width: _defaultWidth,
      child: SizedBox(
        height: _height,
        child: ClipRRect(
          borderRadius: radius,
          child: ColoredBox(
            color: colors.border,
            child: AnimatedFractionallySizedBox(
              duration: valueTransition(context),
              curve: Curves.ease,
              alignment: AlignmentDirectional.centerStart,
              widthFactor: percentage / 100,
              heightFactor: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: fill, borderRadius: radius),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
