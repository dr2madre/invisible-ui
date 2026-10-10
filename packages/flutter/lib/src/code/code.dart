import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../theme/theme.dart';

// Sizes the web Code sets in its own stylesheet, in em of the surrounding
// text.
const double _sizeEm = 0.875;
const double _paddingXEm = 0.35;
const double _paddingYEm = 0.1;

/// Inline code: a short run of monospaced text inside a sentence, such as a
/// function name, a flag or a value. For a sample of several lines use
/// [CodeBlock].
///
/// It takes its size from the surrounding text, as the web's `0.875em`
/// does, and wraps in a narrow parent. Set it in a paragraph through a
/// [WidgetSpan]. [text] is always shown as text.
///
/// Presentational only: its text is the meaning.
class Code extends StatelessWidget {
  /// Shows [text] as code.
  const Code(this.text, {super.key});

  /// The code.
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final surrounding = surroundingFontSize(context);
    final size = surrounding * _sizeEm;
    final scale = MediaQuery.textScalerOf(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: scale.scale(size * _paddingXEm),
        vertical: scale.scale(size * _paddingYEm),
      ),
      decoration: BoxDecoration(
        color: colors.neutralSurface,
        border: Border.all(color: colors.neutralBorder),
        borderRadius: BorderRadius.circular(theme.controlRadius),
      ),
      child: Text(
        text,
        style: theme.monoTextStyle.copyWith(
          fontSize: size,
          height: 1.2,
          color: colors.text,
        ),
      ),
    );
  }
}
