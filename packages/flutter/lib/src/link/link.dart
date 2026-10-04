import 'package:flutter/widgets.dart';

import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../theme/theme.dart';

// Sizes the web Link sets in its own stylesheet, in em of the text size.
const double _externalEm = 0.85;
const double _externalGapEm = 0.15;
const double _radiusEm = 0.15;

/// How strongly a [Link] stands out from the text around it.
enum LinkVariant {
  /// The selection colour, underlined.
  primary,

  /// The colour of the surrounding text, with a quiet underline.
  subtle,
}

/// A text link, following the WAI-ARIA link pattern.
///
/// A link navigates: [onPressed] opens the destination, the app's route or
/// a URL the app opens with the platform, so the package needs no URL
/// plugin. A tap or Enter runs it; Space does not, as on the web. It is
/// announced as a link, with [uri] as its address when given. For an action
/// that stays on the page, use [Button].
///
/// It is underlined in both variants, so it never relies on colour alone;
/// the pointer over it deepens the colour. [external] marks a destination
/// outside the app with a trailing arrow. It takes the surrounding text
/// style, so it can sit in a paragraph through a `WidgetSpan`. Its hit area
/// is never smaller than [InvisibleThemeData.minTargetSize].
class Link extends StatelessWidget {
  /// Creates a link showing [child], usually a [Text].
  const Link({
    super.key,
    required this.onPressed,
    required this.child,
    this.uri,
    this.external = false,
    this.variant = LinkVariant.primary,
    this.semanticLabel,
    this.focusNode,
  });

  /// Opens the destination.
  final VoidCallback onPressed;

  /// The link text.
  final Widget child;

  /// The destination, announced as the link's address.
  final Uri? uri;

  /// Whether the destination is outside the app, such as a website opened
  /// in the browser. It adds a trailing arrow.
  final bool external;

  /// How strongly the link stands out.
  final LinkVariant variant;

  /// The accessible name, in place of what [child] says.
  final String? semanticLabel;

  /// The focus node, for moving focus to the link from code.
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    // The surrounding text style over the theme's, so a link in a paragraph
    // takes the paragraph's size and colour.
    final base = theme.textStyle.merge(DefaultTextStyle.of(context).style);
    final fontSize = base.fontSize!;
    final subtle = variant == LinkVariant.subtle;
    return Semantics(
      container: true,
      link: true,
      linkUrl: uri,
      label: semanticLabel,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        keys: PressKeys.link,
        focusNode: focusNode,
        builder: (context, states) {
          final color = states.hovered
              ? colors.secondaryHover
              : subtle
              ? base.color ?? colors.text
              : colors.secondaryBodyText;
          final underline = subtle && !states.hovered ? colors.border : color;
          return FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: fontSize * _radiusEm,
            child: ExcludeSemantics(
              excluding: semanticLabel != null,
              child: DefaultTextStyle(
                style: base.copyWith(
                  color: color,
                  decoration: TextDecoration.underline,
                  decorationColor: underline,
                ),
                child: IconTheme(
                  data: IconThemeData(
                    color: color,
                    size: fontSize * _externalEm,
                    applyTextScaling: true,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: fontSize * _externalGapEm,
                    children: [
                      Flexible(child: child),
                      if (external) const Glyph(GlyphShape.external),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
