import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../theme/theme.dart';

const double _thickness = 1;

/// A thin line between content or groups of controls, in the theme's border
/// colour.
///
/// A horizontal separator takes the width its parent gives; a vertical one
/// is at least as tall as a line of the surrounding text and stretches with
/// a row that stretches its children. Flutter's semantics have no separator
/// role, so it adds nothing to the semantics tree, as the web's decorative
/// separator does; the content on either side carries the structure.
class Separator extends StatelessWidget {
  /// Creates a separator.
  const Separator({super.key, this.orientation = Axis.horizontal});

  /// A horizontal line, or a vertical one.
  final Axis orientation;

  @override
  Widget build(BuildContext context) {
    final color = InvisibleTheme.of(context).colors.border;
    if (orientation == Axis.horizontal) {
      // A childless Container fills a bounded width and shrinks in an open
      // one.
      return Container(height: _thickness, color: color);
    }
    final em = MediaQuery.textScalerOf(
      context,
    ).scale(surroundingFontSize(context));
    return ConstrainedBox(
      constraints: BoxConstraints(minHeight: em),
      child: SizedBox(
        width: _thickness,
        child: ColoredBox(color: color),
      ),
    );
  }
}
