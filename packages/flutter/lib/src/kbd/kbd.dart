import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../theme/theme.dart';

// Sizes the web Kbd sets in its own stylesheet.
const double _minWidth = 24;
const double _gap = 4;
const double _sizeEm = 0.8125;

/// A keyboard shortcut hint: one key, or a chord of keys joined by a
/// separator, each drawn as a raised keycap.
///
/// `Kbd('Esc')` shows one key; `Kbd.chord(['⌘', 'K'])` shows a chord. The
/// separator is visual: assistive technology reads the keys alone, one
/// after the other. Kbd takes its size from the surrounding text, as the
/// web's `0.8125em` does.
///
/// Presentational only.
class Kbd extends StatelessWidget {
  /// A single key, named [label].
  const Kbd(String this.label, {super.key}) : keys = null, separator = '+';

  /// A chord: each key gets its own keycap, joined by [separator].
  const Kbd.chord(List<String> this.keys, {super.key, this.separator = '+'})
    : label = null;

  /// The key of a single-key hint.
  final String? label;

  /// The keys of a chord, in the order they are pressed.
  final List<String>? keys;

  /// The text between the keys of a chord.
  final String separator;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final surrounding = surroundingFontSize(context);
    final style = theme.monoTextStyle.copyWith(
      fontSize: surrounding * _sizeEm,
      height: 1,
      color: colors.text,
    );
    final scale = MediaQuery.textScalerOf(context);
    final shown = keys ?? [label!];

    Widget cap(String key) => Container(
      constraints: BoxConstraints(minWidth: scale.scale(_minWidth)),
      padding: EdgeInsets.symmetric(
        horizontal: scale.scale(6.4),
        vertical: scale.scale(1.6),
      ),
      decoration: BoxDecoration(
        color: colors.background,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(theme.controlRadius),
        boxShadow: [
          BoxShadow(
            color: colors.border,
            offset: const Offset(0, 1),
            spreadRadius: 1,
          ),
        ],
      ),
      child: Text(key, textAlign: TextAlign.center, style: style),
    );

    return Semantics(
      container: true,
      label: shown.join(' '),
      child: ExcludeSemantics(
        child: Wrap(
          spacing: _gap,
          runSpacing: _gap,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            for (final (index, key) in shown.indexed) ...[
              if (index > 0)
                Text(
                  separator,
                  style: style.copyWith(color: colors.textSecondary),
                ),
              cap(key),
            ],
          ],
        ),
      ),
    );
  }
}
