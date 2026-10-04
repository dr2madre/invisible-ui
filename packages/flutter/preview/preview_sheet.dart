// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// The page under a preview: the theme that matches the preview's
/// brightness, its background, and an overlay for the popups (tooltips,
/// menus, notifications).
class PreviewSheet extends StatefulWidget {
  /// Shows [child] on the page.
  const PreviewSheet({
    super.key,
    required this.child,
    this.density = InvisibleDensity.regular,
  });

  /// The content.
  final Widget child;

  /// The theme density.
  final InvisibleDensity density;

  @override
  State<PreviewSheet> createState() => _PreviewSheetState();
}

class _PreviewSheetState extends State<PreviewSheet> {
  late final OverlayEntry _page = OverlayEntry(builder: _buildPage);

  @override
  void didUpdateWidget(PreviewSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    _page.markNeedsBuild();
  }

  Widget _buildPage(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return ColoredBox(
      color: theme.colors.background,
      child: TapRegionSurface(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: DefaultTextStyle(
            style: theme.textStyle.copyWith(color: theme.colors.text),
            child: widget.child,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    return InvisibleTheme(
      data: dark
          ? InvisibleThemeData.dark(density: widget.density)
          : InvisibleThemeData.light(density: widget.density),
      child: Overlay(initialEntries: [_page]),
    );
  }
}

/// A plus sign drawn from the icon theme, since the package bundles no icon
/// font.
class PreviewGlyph extends StatelessWidget {
  /// Creates the glyph.
  const PreviewGlyph({super.key});

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
