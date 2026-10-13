// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

const List<CarouselSlide> _slides = [
  CarouselSlide(title: 'Lake shore', description: 'Morning light'),
  CarouselSlide(title: 'Hill path', description: 'A short walk'),
  CarouselSlide(title: 'Old harbour'),
  CarouselSlide(title: 'Market square'),
  CarouselSlide(title: 'Night train'),
];

/// The three layouts: one slide at a time, a gallery row and the coverflow.
@Preview(
  group: 'Carousel',
  name: 'Light',
  brightness: Brightness.light,
  size: Size(640, 1100),
)
@Preview(
  group: 'Carousel',
  name: 'Dark',
  brightness: Brightness.dark,
  size: Size(640, 1100),
)
Widget carouselStates() => const PreviewSheet(child: _Carousels());

/// Right to left at text scale 2.0 in a narrow column: the slides grow
/// taller for the text, the arrows and the order mirror.
@Preview(
  group: 'Carousel',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1600),
)
Widget carouselRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Carousels()),
);

/// Touch density: the arrows and the dots keep a 44 by 44 target.
@Preview(group: 'Carousel', name: 'Touch density', size: Size(640, 1200))
Widget carouselTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Carousels());

class _Carousels extends StatelessWidget {
  const _Carousels();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 32,
        children: [
          Carousel.uncontrolled(label: 'Places', items: _slides, loop: true),
          Carousel.uncontrolled(
            label: 'Albums',
            items: _slides,
            variant: CarouselVariant.gallery,
          ),
          Carousel.uncontrolled(
            label: 'Covers',
            items: _slides,
            variant: CarouselVariant.coverflow,
            initialIndex: 2,
          ),
        ],
      ),
    );
  }
}
