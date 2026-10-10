import 'package:flutter/widgets.dart';

/// The corners a control takes inside a joined group, such as an attached
/// [ButtonGroup]: the group's outer corners at its ends, square ones between.
/// The control draws its focus ring inside its bounds, since the next
/// control overlaps its edge.
class GroupedCorners extends InheritedWidget {
  /// Gives [child] [corners].
  const GroupedCorners({
    super.key,
    required this.corners,
    required super.child,
  });

  /// The corners.
  final BorderRadiusDirectional corners;

  /// The corners [context] takes, or null outside a joined group.
  static BorderRadiusDirectional? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<GroupedCorners>()?.corners;

  @override
  bool updateShouldNotify(GroupedCorners oldWidget) =>
      corners != oldWidget.corners;
}
