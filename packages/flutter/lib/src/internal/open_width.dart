import 'package:flutter/widgets.dart';

/// Gives [child] the width its parent allows, or [width] when the parent
/// leaves the width open, as the web components' default `inline-size`.
class OpenWidth extends StatelessWidget {
  /// Sizes [child].
  const OpenWidth({super.key, required this.width, required this.child});

  /// The width when the parent sets none.
  final double width;

  /// The content.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SizedBox(
        width: constraints.hasBoundedWidth ? constraints.maxWidth : width,
        child: child,
      ),
    );
  }
}
