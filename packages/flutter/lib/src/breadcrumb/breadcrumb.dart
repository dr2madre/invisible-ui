// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../internal/glyphs.dart';
import '../link/link.dart';
import '../theme/theme.dart';

// Sizes the web Breadcrumb sets in its own stylesheet.
const double _gap = 8;
const double _iconGap = 4;
const double _fontSize = 14;

/// One step of a [Breadcrumb] trail.
@immutable
class BreadcrumbItem {
  /// Creates a step named [label]. Give ancestors an [onPressed] that opens
  /// them; the current page, last in the trail, needs none.
  const BreadcrumbItem({
    required this.label,
    this.onPressed,
    this.uri,
    this.home = false,
  });

  /// The visible label and accessible name.
  final String label;

  /// Opens the step's page. Null shows the step as plain text.
  final VoidCallback? onPressed;

  /// The step's address, announced with its link.
  final Uri? uri;

  /// Shows a house glyph for the label, typically on the first step; the
  /// label still names it.
  final bool home;
}

/// A navigation trail from the root to the current page, named [label].
///
/// It is a list of steps. The ancestors are underlined [Link]s; the last
/// step is the current page, bold and not a link, and read as the current
/// page. The separators are decorative. A trail wider than its parent
/// wraps onto more rows.
class Breadcrumb extends StatelessWidget {
  /// Creates the trail from [items], the root first.
  const Breadcrumb({
    super.key,
    required this.items,
    this.label,
    this.separator = '/',
  });

  /// The steps, from the root to the current page.
  final List<BreadcrumbItem> items;

  /// The accessible name of the trail. Defaults to
  /// [InvisibleMessages.breadcrumbLabel].
  final String? label;

  /// The text between two steps.
  final String separator;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final base = theme.textStyle.copyWith(fontSize: _fontSize);
    final home = IconThemeData(
      color: colors.textSecondary,
      size: _fontSize,
      applyTextScaling: true,
    );

    Widget step(int index, BreadcrumbItem item) {
      final last = index == items.length - 1;
      final onPressed = item.onPressed;
      if (!last && onPressed != null) {
        return Link(
          onPressed: onPressed,
          uri: item.uri,
          semanticLabel: item.home ? item.label : null,
          child: item.home
              ? IconTheme(
                  data: home.copyWith(color: colors.secondaryBodyText),
                  child: const Glyph(GlyphShape.home),
                )
              : Text(item.label),
        );
      }
      return Semantics(
        container: true,
        label: item.label,
        value: last ? theme.messages.breadcrumbCurrent : null,
        child: ExcludeSemantics(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            spacing: _iconGap,
            children: [
              if (item.home)
                IconTheme(data: home, child: const Glyph(GlyphShape.home)),
              Flexible(
                child: Text(
                  item.label,
                  style: base.copyWith(
                    color: colors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: label ?? theme.messages.breadcrumbLabel,
      child: DefaultTextStyle(
        style: base.copyWith(color: colors.text),
        child: Wrap(
          spacing: _gap,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            for (final (index, item) in items.indexed)
              Semantics(
                container: true,
                explicitChildNodes: true,
                role: SemanticsRole.listItem,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  spacing: _gap,
                  children: [
                    if (index > 0)
                      ExcludeSemantics(
                        child: Text(
                          separator,
                          style: base.copyWith(color: colors.textSecondary),
                        ),
                      ),
                    Flexible(child: step(index, item)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
