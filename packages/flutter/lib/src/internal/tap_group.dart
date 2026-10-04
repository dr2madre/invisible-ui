import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// The tap region groups of the floating panels around [child], such as a
/// [Popover]'s, so a popup opened from inside them (a [Select]'s list)
/// counts as inside each panel and a press on it closes none of them.
class OverlayTapGroup extends InheritedWidget {
  const OverlayTapGroup._({required this.groups, required super.child});

  /// Adds [groupId], the tap region group of the panel holding [child], to
  /// the groups of the panels around it.
  static Widget nest({
    required BuildContext context,
    required Object groupId,
    required Widget child,
  }) {
    final outer =
        context.dependOnInheritedWidgetOfExactType<OverlayTapGroup>()?.groups ??
        const [];
    return OverlayTapGroup._(groups: [...outer, groupId], child: child);
  }

  /// The groups, from the outermost panel inward.
  final List<Object> groups;

  /// Wraps [child], a popup, in the tap region of every enclosing panel.
  static Widget wrap(BuildContext context, Widget child) {
    final groups =
        context.dependOnInheritedWidgetOfExactType<OverlayTapGroup>()?.groups ??
        const [];
    for (final group in groups) {
      child = TapRegion(groupId: group, child: child);
    }
    return child;
  }

  @override
  bool updateShouldNotify(OverlayTapGroup oldWidget) =>
      !listEquals(groups, oldWidget.groups);
}
