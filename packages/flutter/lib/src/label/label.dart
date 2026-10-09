import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// A form label: the visible name of a control, with an optional required
/// marker.
///
/// A tap on the label moves focus to the control's [focusNode], as a click
/// on a web label does. Flutter semantics cannot point one node at another,
/// so the control carries its own name: give it the same text, or use
/// [Field], which names its control from its label.
///
/// The required asterisk is decorative and stays out of the semantics tree;
/// the control reports itself required.
class Label extends StatelessWidget {
  /// Creates the label [text].
  const Label(
    this.text, {
    super.key,
    this.required = false,
    this.focusNode,
    this.enabled = true,
  });

  /// The label text.
  final String text;

  /// Whether the required asterisk shows after the text.
  final bool required;

  /// The control's focus node, which a tap on the label focuses.
  final FocusNode? focusNode;

  /// Whether the control is enabled. A disabled label dims and a tap on it
  /// focuses nothing.
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final focusNode = this.focusNode;
    final label = Text.rich(
      TextSpan(
        text: text,
        children: [
          if (required)
            TextSpan(
              text: ' *',
              style: TextStyle(color: colors.dangerBodyText),
            ),
        ],
      ),
      // The text alone: the asterisk is decorative.
      semanticsLabel: text,
      style: theme.textStyle.copyWith(
        fontWeight: FontWeight.w500,
        height: InvisibleTypographyTokens.lineHeightTight,
        color: enabled ? colors.text : colors.textDisabled,
      ),
    );
    if (focusNode == null || !enabled) return label;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      excludeFromSemantics: true,
      onTap: focusNode.requestFocus,
      child: label,
    );
  }
}
