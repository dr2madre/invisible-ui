// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. The previewer arrived in Flutter 3.35, after the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// Every variant, enabled, loading and disabled, in the theme that matches
/// the preview's brightness.
@Preview(group: 'Button', name: 'Variants, light', brightness: Brightness.light)
@Preview(group: 'Button', name: 'Variants, dark', brightness: Brightness.dark)
Widget buttonVariants() => const _Sheet(child: _AllVariants());

/// The same set right to left at text scale 2.0, in a narrow column.
@Preview(
  group: 'Button',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget buttonRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: _Sheet(child: _AllVariants()),
);

/// Touch density: every hit area is at least 44 by 44.
@Preview(group: 'Button', name: 'Touch density')
Widget buttonTouch() => _Sheet(
  density: InvisibleDensity.touch,
  child: Wrap(
    spacing: 8,
    children: [
      Button.icon(onPressed: () {}, icon: const _Glyph(), semanticLabel: 'Add'),
      Button(onPressed: () {}, child: const Text('Save')),
    ],
  ),
);

/// Paints the page and picks the theme from the preview's brightness.
class _Sheet extends StatelessWidget {
  const _Sheet({required this.child, this.density = InvisibleDensity.regular});

  final Widget child;
  final InvisibleDensity density;

  @override
  Widget build(BuildContext context) {
    final theme = MediaQuery.platformBrightnessOf(context) == Brightness.dark
        ? InvisibleThemeData.dark(density: density)
        : InvisibleThemeData.light(density: density);
    return InvisibleTheme(
      data: theme,
      child: ColoredBox(
        color: theme.colors.background,
        // Scrolls when large text makes the sheet taller than the preview.
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: DefaultTextStyle(
            style: theme.textStyle.copyWith(color: theme.colors.text),
            child: child,
          ),
        ),
      ),
    );
  }
}

class _AllVariants extends StatelessWidget {
  const _AllVariants();

  @override
  Widget build(BuildContext context) {
    // Each row wraps on a narrow width instead of overflowing it.
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final variant in ButtonVariant.values)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Button(
                  onPressed: () {},
                  variant: variant,
                  icon: variant == ButtonVariant.danger ? null : const _Glyph(),
                  child: Text(variant.name),
                ),
                Button(
                  onPressed: () {},
                  variant: variant,
                  loading: true,
                  child: const Text('Saving'),
                ),
                Button(
                  onPressed: null,
                  variant: variant,
                  child: const Text('Disabled'),
                ),
                Button.icon(
                  onPressed: () {},
                  variant: variant,
                  icon: const _Glyph(),
                  semanticLabel: 'Add',
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// A plus sign drawn from the icon theme, since the package bundles no icon
/// font.
class _Glyph extends StatelessWidget {
  const _Glyph();

  @override
  Widget build(BuildContext context) {
    final icons = IconTheme.of(context);
    final side = MediaQuery.textScalerOf(context).scale(icons.size ?? 18);
    final bar = side / 8;
    return SizedBox.square(
      dimension: side,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(width: side * 0.6, height: bar, color: icons.color),
          Container(width: bar, height: side * 0.6, color: icons.color),
        ],
      ),
    );
  }
}
