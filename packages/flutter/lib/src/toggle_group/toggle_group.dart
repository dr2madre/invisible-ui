import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../toggle_button/toggle_button.dart';

// Sizes the web ToggleGroup sets in its own stylesheet.
const double _gap = 6;
const double _borderWidth = 1;

/// How a [ToggleGroup] draws its toggles.
enum ToggleGroupVariant {
  /// Each toggle keeps its own border and corners, with a gap between them.
  separate,

  /// The toggles join into one bar: one border around them and a line
  /// between each two.
  segmented,
}

/// Lays out related [ToggleButton]s and gives them one look, such as the
/// Bold, Italic and Underline toggles of an editor, or a row of filter
/// chips. It holds no state: each toggle keeps its own value, name and
/// callback, and stays its own tab stop, as on the web.
///
/// [semanticLabel] names the group for assistive technology ("Formatting");
/// leave it out when the toggles are unrelated. With [wrap], a horizontal
/// [ToggleGroupVariant.separate] group wraps onto more rows instead of
/// overflowing; a segmented bar is one control and does not wrap. Inside a
/// [Toolbar], the toolbar's arrow keys move between the toggles.
class ToggleGroup extends StatelessWidget {
  /// Groups [children].
  const ToggleGroup({
    super.key,
    required this.children,
    this.variant = ToggleGroupVariant.separate,
    this.orientation = Axis.horizontal,
    this.wrap = false,
    this.semanticLabel,
  });

  /// The toggles, usually [ToggleButton]s.
  final List<Widget> children;

  /// Separate toggles, or one joined bar.
  final ToggleGroupVariant variant;

  /// The layout axis.
  final Axis orientation;

  /// Lets a horizontal separate group wrap onto more rows.
  final bool wrap;

  /// The group's accessible name.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final horizontal = orientation == Axis.horizontal;
    final Widget body = switch (variant) {
      ToggleGroupVariant.separate =>
        wrap && horizontal
            ? Wrap(spacing: _gap, runSpacing: _gap, children: children)
            : Flex(
                direction: orientation,
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: _gap,
                children: children,
              ),
      ToggleGroupVariant.segmented => _Joined(
        orientation: orientation,
        children: children,
      ),
    };
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: semanticLabel,
      child: body,
    );
  }
}

/// The joined bar: one border, a line between each two toggles, and the
/// toggles without their own border and corners.
class _Joined extends StatelessWidget {
  const _Joined({required this.orientation, required this.children});

  final Axis orientation;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final border = theme.colors.controlBorder;
    final horizontal = orientation == Axis.horizontal;
    final divider = horizontal
        ? SizedBox(
            width: _borderWidth,
            child: ColoredBox(color: border),
          )
        : SizedBox(
            height: _borderWidth,
            child: ColoredBox(color: border),
          );
    final row = Flex(
      direction: orientation,
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (index, child) in children.indexed) ...[
          if (index > 0) divider,
          child,
        ],
      ],
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: border, width: _borderWidth),
        borderRadius: BorderRadius.circular(theme.controlRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(_borderWidth),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(
            theme.controlRadius - _borderWidth,
          ),
          child: ToggleJoin(
            child: horizontal
                ? IntrinsicHeight(child: row)
                : IntrinsicWidth(child: row),
          ),
        ),
      ),
    );
  }
}
