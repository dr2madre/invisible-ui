import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<CarouselSlide> _slides = [
  CarouselSlide(title: 'Lake', description: 'Morning light'),
  CarouselSlide(title: 'Hills'),
  CarouselSlide(title: 'Coast'),
];

final Finder _previous = find.bySemanticsLabel('Previous slide');
final Finder _next = find.bySemanticsLabel('Next slide');

// The glyph inside a button: its focus node is the button's.
Finder _inside(Finder button) =>
    find.descendant(of: button, matching: find.byType(CustomPaint)).first;

Widget _carousel({
  CarouselVariant variant = CarouselVariant.slide,
  bool loop = false,
  Axis orientation = Axis.horizontal,
  ValueChanged<int>? onChanged,
  int initialIndex = 0,
}) => SizedBox(
  width: 480,
  child: Carousel.uncontrolled(
    label: 'Places',
    items: _slides,
    variant: variant,
    loop: loop,
    orientation: orientation,
    initialIndex: initialIndex,
    onChanged: onChanged,
  ),
);

void main() {
  testWidgets('semantics: a named carousel of slides named "1 of 3"; the '
      'slides out of view are hidden', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(_carousel()));
    expect(
      tester.getSemantics(find.bySemanticsLabel('Places')),
      semanticsWith(label: 'Places', hint: 'carousel'),
    );
    expect(
      tester.getSemantics(find.bySemanticsLabel('1 of 3')),
      semanticsWith(hint: 'slide'),
    );
    expect(find.bySemanticsLabel('2 of 3'), findsNothing);
    expect(find.bySemanticsLabel('Lake'), findsOneWidget);
    expect(find.bySemanticsLabel('Hills'), findsNothing);
    expect(find.bySemanticsLabel('Choose slide'), findsOneWidget);
    expect(
      tester.getSemantics(find.bySemanticsLabel('Go to slide 1')),
      semanticsWith(isButton: true, hasSelectedState: true, isSelected: true),
    );
    expect(
      tester.getSemantics(find.bySemanticsLabel('Go to slide 2')),
      semanticsWith(hasSelectedState: true, isSelected: false),
    );
    expect(
      tester.getSemantics(_previous),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    semantics.dispose();
  });

  testWidgets('next, previous and the dots move once per press, report and '
      'announce the slide', (tester) async {
    final semantics = tester.ensureSemantics();
    final log = recordAnnouncements(tester);
    final reports = <int>[];
    await tester.pumpWidget(harness(_carousel(onChanged: reports.add)));
    await tester.tap(_next);
    await tester.pumpAndSettle();
    expect(reports, [1]);
    expect(find.bySemanticsLabel('2 of 3'), findsOneWidget);
    expect(log.single.message, '2 of 3, Hills');
    expect(log.single.assertive, isFalse);
    await tester.tap(find.bySemanticsLabel('Go to slide 3'));
    await tester.pumpAndSettle();
    await tester.tap(_previous);
    await tester.pumpAndSettle();
    expect(reports, [1, 2, 1]);
    semantics.dispose();
  });

  testWidgets('a button that a key press disables hands focus to the other', (
    tester,
  ) async {
    await tester.pumpWidget(harness(_carousel(initialIndex: 1)));
    await focusOn(tester, _inside(_next));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pumpAndSettle();
    expect(focusedOn(tester, _inside(_previous)), isTrue);
  });

  testWidgets('the arrows move between slides, mirrored right to left; '
      'up and down when vertical; loop wraps', (tester) async {
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        _carousel(onChanged: reports.add, loop: true),
        direction: TextDirection.rtl,
      ),
    );
    await focusOn(tester, _inside(_next));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pumpAndSettle();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pumpAndSettle();
    expect(reports, [1, 0, 2]);

    reports.clear();
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(
      harness(
        _carousel(
          onChanged: reports.add,
          variant: CarouselVariant.coverflow,
          orientation: Axis.vertical,
        ),
      ),
    );
    await focusOn(tester, _inside(_next));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pumpAndSettle();
    expect(reports, [1]);
  });

  testWidgets('a controlled index shows without a report; a shorter list '
      'clamps it', (tester) async {
    final reports = <int>[];
    Widget build(int index, List<CarouselSlide> items) => harness(
      SizedBox(
        width: 480,
        child: Carousel(
          label: 'Places',
          items: items,
          index: index,
          onChanged: reports.add,
        ),
      ),
    );
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(build(0, _slides));
    await tester.pumpWidget(build(2, _slides));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('3 of 3'), findsOneWidget);
    await tester.pumpWidget(build(2, _slides.sublist(0, 2)));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('2 of 2'), findsOneWidget);
    expect(reports, isEmpty);
    semantics.dispose();
  });

  testWidgets('reduced motion: the slide moves at once', (tester) async {
    await tester.pumpWidget(harness(_carousel(), disableAnimations: true));
    await tester.tap(_next);
    await tester.pump();
    expect(tester.hasRunningAnimations, isFalse);
    // Animated, the move takes a few frames.
    await tester.pumpWidget(harness(_carousel(initialIndex: 0)));
    await tester.tap(_next);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(tester.hasRunningAnimations, isTrue);
    await tester.pumpAndSettle();
  });

  testWidgets('gallery: every item is reachable, the viewport takes focus '
      'and scrolls to the current item', (tester) async {
    final semantics = tester.ensureSemantics();
    final many = [for (var i = 0; i < 6; i++) CarouselSlide(title: 'Album $i')];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 320,
          child: Carousel.uncontrolled(
            label: 'Albums',
            items: many,
            variant: CarouselVariant.gallery,
          ),
        ),
        disableAnimations: true,
      ),
    );
    expect(find.bySemanticsLabel('2 of 6'), findsOneWidget);
    final scroll = tester.state<ScrollableState>(find.byType(Scrollable));
    expect(scroll.position.pixels, 0);
    await tester.tap(find.bySemanticsLabel('Go to slide 5'));
    await tester.pumpAndSettle();
    expect(scroll.position.pixels, greaterThan(0));
    semantics.dispose();
  });

  testWidgets('coverflow: neighbours stay opaque, only near ones are drawn', (
    tester,
  ) async {
    final many = [for (var i = 0; i < 7; i++) CarouselSlide(title: 'Card $i')];
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 480,
          child: Carousel.uncontrolled(
            label: 'Cards',
            items: many,
            variant: CarouselVariant.coverflow,
            initialIndex: 3,
          ),
        ),
      ),
    );
    expect(
      tester.widgetList<Opacity>(find.byType(Opacity)).map((o) => o.opacity),
      everyElement(1),
    );
    expect(find.text('Card 3'), findsOneWidget);
    expect(find.text('Card 1'), findsOneWidget);
    expect(find.text('Card 0'), findsNothing);
  });

  testWidgets('narrow at text scale 2.0: nothing overflows; targets 24 by '
      '24, 44 by 44 under touch; text contrast', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(_carousel()));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    for (final variant in CarouselVariant.values) {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 320,
            child: Carousel.uncontrolled(
              label: 'Places',
              items: _slides,
              variant: variant,
            ),
          ),
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      await expectLater(tester, meetsGuideline(targetGuideline44));
    }
    semantics.dispose();
  });
}
