import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import 'ambient.dart';
import 'focus_ring.dart';
import 'glyphs.dart';
import 'pressable.dart';

// Sizes the web Collapsible and Accordion set in their own stylesheets.
const double _gap = 8;
const double _chevronEm = 1.1;
const Duration _turn = Duration(milliseconds: 150);
const double _disabledOpacity = 0.5;

/// The header of a disclosure, [Collapsible] or an [Accordion] item: a
/// button that reports itself expanded or collapsed, with [label] at the
/// inline-start and a chevron at the inline-end that turns while
/// [expanded]. A null [onToggle] disables it.
class DisclosureTrigger extends StatelessWidget {
  /// Creates the header.
  const DisclosureTrigger({
    super.key,
    required this.expanded,
    required this.onToggle,
    required this.label,
    required this.chevron,
    required this.openTurns,
    required this.padding,
    this.headingLevel,
    this.decoration,
    this.radius = 0,
    this.ringInside = false,
    this.focusNode,
  });

  /// Whether the content shows.
  final bool expanded;

  /// Toggles the content. Null disables the header.
  final VoidCallback? onToggle;

  /// The visible label.
  final Widget label;

  /// The chevron at rest.
  final GlyphShape chevron;

  /// How far the chevron turns while expanded, in turns.
  final double openTurns;

  /// The padding around the label and the chevron.
  final EdgeInsetsGeometry padding;

  /// The heading level of the header, or null when it is no heading.
  final int? headingLevel;

  /// The border and fill of the header.
  final BoxDecoration? decoration;

  /// The corner radius the focus ring follows.
  final double radius;

  /// Draws the focus ring inside the header, for a container that clips.
  final bool ringInside;

  /// The focus node, for arrow keys between headers.
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = onToggle != null;
    final still = reducedMotion(context);
    return Semantics(
      container: true,
      button: true,
      header: headingLevel != null,
      headingLevel: headingLevel,
      enabled: enabled,
      expanded: expanded,
      onTap: onToggle,
      child: Pressable(
        onPressed: onToggle,
        focusNode: focusNode,
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) {
          final row = DecoratedBox(
            decoration: decoration ?? const BoxDecoration(),
            child: Padding(
              padding: padding,
              child: Row(
                spacing: _gap,
                children: [
                  Expanded(
                    child: DefaultTextStyle(
                      style: theme.textStyle.copyWith(color: colors.text),
                      textAlign: TextAlign.start,
                      child: label,
                    ),
                  ),
                  IconTheme(
                    data: IconThemeData(
                      color: colors.textSecondary,
                      size: theme.textStyle.fontSize! * _chevronEm,
                      applyTextScaling: true,
                    ),
                    child: AnimatedRotation(
                      turns: expanded ? openTurns : 0,
                      duration: still ? Duration.zero : _turn,
                      curve: Curves.ease,
                      child: Glyph(chevron),
                    ),
                  ),
                ],
              ),
            ),
          );
          return Opacity(
            opacity: enabled ? 1 : _disabledOpacity,
            child: FocusRingPainter(
              visible: states.focusVisible,
              ring: theme.focusRing,
              radius: radius,
              inside: ringInside,
              child: row,
            ),
          );
        },
      ),
    );
  }
}

/// The content of a disclosure. While hidden it keeps its state, as the
/// web's `hidden` content does, and leaves the semantics tree and the focus
/// order.
class DisclosurePanel extends StatelessWidget {
  /// Shows [child] while [visible].
  const DisclosurePanel({
    super.key,
    required this.visible,
    required this.child,
  });

  /// Whether the content shows.
  final bool visible;

  /// The content.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Visibility(
      visible: visible,
      maintainState: true,
      child: ExcludeFocus(excluding: !visible, child: child),
    );
  }
}
