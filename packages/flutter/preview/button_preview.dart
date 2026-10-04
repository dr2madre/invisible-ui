// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. The previewer arrived in Flutter 3.35, after the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// Every variant, enabled, loading and disabled, in the theme that matches
/// the preview's brightness.
@Preview(group: 'Button', name: 'Variants, light', brightness: Brightness.light)
@Preview(group: 'Button', name: 'Variants, dark', brightness: Brightness.dark)
Widget buttonVariants() => const PreviewSheet(
  // Scrolls when large text makes the sheet taller than the preview.
  child: SingleChildScrollView(child: _AllVariants()),
);

/// The same set right to left at text scale 2.0, in a narrow column.
@Preview(
  group: 'Button',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget buttonRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: SingleChildScrollView(child: _AllVariants())),
);

/// Touch density: every hit area is at least 44 by 44.
@Preview(group: 'Button', name: 'Touch density')
Widget buttonTouch() => PreviewSheet(
  density: InvisibleDensity.touch,
  child: Wrap(
    spacing: 8,
    children: [
      Button.icon(
        onPressed: () {},
        icon: const PreviewGlyph(),
        semanticLabel: 'Add',
      ),
      Button(onPressed: () {}, child: const Text('Save')),
    ],
  ),
);

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
                  icon: variant == ButtonVariant.danger
                      ? null
                      : const PreviewGlyph(),
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
                  icon: const PreviewGlyph(),
                  semanticLabel: 'Add',
                ),
              ],
            ),
          ),
      ],
    );
  }
}
