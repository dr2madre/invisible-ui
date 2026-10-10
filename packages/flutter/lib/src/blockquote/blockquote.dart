import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web Blockquote sets in its own stylesheet.
const double _padding = 16;
const double _barWidth = 3;
const double _citeGap = 8;
const double _citeSize = 14;

/// A block quotation with an optional attribution line.
///
/// The quote shows in italics after an accent bar at the inline-start; the
/// attribution, [cite], follows it after an em dash. The em dash is
/// decorative, so the attribution is read as written, after the quote and
/// apart from it.
class Blockquote extends StatelessWidget {
  /// Quotes [child], attributed to [cite].
  const Blockquote({super.key, required this.child, this.cite});

  /// The quoted text, usually a [Text].
  final Widget child;

  /// The attribution, such as an author, usually a [Text].
  final Widget? cite;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final cite = this.cite;
    return DecoratedBox(
      decoration: const BoxDecoration(
        // The bar is decoration with no meaning, so it reads the neutral
        // primitive, as the web does.
        border: BorderDirectional(
          start: BorderSide(color: InvisiblePalette.grey400, width: _barWidth),
        ),
      ),
      child: Padding(
        padding: const EdgeInsetsDirectional.only(start: _padding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: _citeGap,
          children: [
            DefaultTextStyle(
              style: theme.textStyle.copyWith(
                fontStyle: FontStyle.italic,
                color: colors.textSecondary,
              ),
              child: child,
            ),
            if (cite != null)
              DefaultTextStyle(
                style: theme.textStyle.copyWith(
                  fontSize: _citeSize,
                  color: colors.textSecondary,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const ExcludeSemantics(child: Text('— ')),
                    Flexible(child: cite),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
