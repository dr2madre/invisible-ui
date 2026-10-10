import 'package:flutter/widgets.dart';

import '../internal/grouped_corners.dart';
import '../theme/theme.dart';

// Sizes the web ButtonGroup sets in its own stylesheet.
const double _gap = 8;
const double _overlap = 1;

/// A named group of related action [Button]s, such as Undo and Redo. It
/// holds no selection: each button stays its own action and its own tab
/// stop, as on the web.
///
/// [attached] joins the buttons into one bar: the inner corners are square,
/// the group's ends keep the control radius, and neighbouring borders
/// overlap into one line. Otherwise the buttons sit 8 apart.
/// [crossAxisAlignment] lines the buttons up across the group, centred by
/// default so a taller neighbour never stretches them.
///
/// [semanticLabel] names the group for assistive technology.
class ButtonGroup extends StatelessWidget {
  /// Groups [children], named [semanticLabel].
  const ButtonGroup({
    super.key,
    required this.semanticLabel,
    required this.children,
    this.orientation = Axis.horizontal,
    this.attached = true,
    this.crossAxisAlignment = CrossAxisAlignment.center,
  });

  /// The group's accessible name.
  final String semanticLabel;

  /// The buttons, usually [Button]s.
  final List<Widget> children;

  /// A row or a column of buttons.
  final Axis orientation;

  /// Joins the buttons into one bar.
  final bool attached;

  /// How the buttons line up across the group.
  final CrossAxisAlignment crossAxisAlignment;

  @override
  Widget build(BuildContext context) {
    final horizontal = orientation == Axis.horizontal;
    final last = children.length - 1;
    final stretch = crossAxisAlignment == CrossAxisAlignment.stretch;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: semanticLabel,
      child: LayoutBuilder(
        builder: (context, constraints) {
          // In a bounded row the buttons shrink and wrap their labels, as
          // flex items do on the web, instead of overflowing.
          final shrink = horizontal && constraints.hasBoundedWidth;
          Widget item(int index, Widget child) {
            final Widget joined = attached
                ? _Joined(
                    index: index,
                    first: index == 0,
                    last: index == last,
                    horizontal: horizontal,
                    child: child,
                  )
                : child;
            return shrink ? Flexible(child: joined) : joined;
          }

          final Widget flex = Flex(
            direction: orientation,
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: crossAxisAlignment,
            spacing: attached ? 0 : _gap,
            children: [
              for (final (index, child) in children.indexed) item(index, child),
            ],
          );
          if (!stretch) return flex;
          return horizontal
              ? IntrinsicHeight(child: flex)
              : IntrinsicWidth(child: flex);
        },
      ),
    );
  }
}

/// One button of an attached group: its corners, and a shift toward the
/// group's start so its border overlaps the previous one.
class _Joined extends StatelessWidget {
  const _Joined({
    required this.index,
    required this.first,
    required this.last,
    required this.horizontal,
    required this.child,
  });

  final int index;
  final bool first;
  final bool last;
  final bool horizontal;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final round = Radius.circular(InvisibleTheme.of(context).controlRadius);
    const square = Radius.zero;
    final corners = horizontal
        ? BorderRadiusDirectional.only(
            topStart: first ? round : square,
            bottomStart: first ? round : square,
            topEnd: last ? round : square,
            bottomEnd: last ? round : square,
          )
        : BorderRadiusDirectional.only(
            topStart: first ? round : square,
            topEnd: first ? round : square,
            bottomStart: last ? round : square,
            bottomEnd: last ? round : square,
          );
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final shift = index * _overlap;
    return Transform.translate(
      offset: horizontal ? Offset(rtl ? shift : -shift, 0) : Offset(0, -shift),
      child: GroupedCorners(corners: corners, child: child),
    );
  }
}
