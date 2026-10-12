import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder get _field => find.descendant(
  of: find.byType(LoadingGenerationArea),
  matching: find.byWidgetPredicate(
    (widget) =>
        widget is CustomPaint &&
        widget.painter.runtimeType.toString() == '_DotFieldPainter',
  ),
);

void main() {
  testWidgets('a polite live region named from the catalog; the dot field '
      'drifts', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 320, height: 200, child: LoadingGenerationArea()),
      ),
    );
    expect(
      tester.getSemantics(find.byType(LoadingGenerationArea)),
      semanticsWith(label: 'Loading…', isLiveRegion: true),
    );
    expect(_field, findsOneWidget);
    expect(tester.hasRunningAnimations, isTrue);
    expect(
      tester.getSize(find.byType(LoadingGenerationArea)),
      const Size(320, 200),
    );
    semantics.dispose();
  });

  testWidgets('a status names the region and is announced on each change; '
      'the percentage and the detail show, unread', (tester) async {
    final semantics = tester.ensureSemantics();
    Widget build(String status, double value) => harness(
      SizedBox(
        width: 320,
        height: 200,
        child: LoadingGenerationArea(
          status: status,
          value: value,
          detail: '3 of 8 files',
          labelPosition: LoadingAreaLabelPosition.bottom,
        ),
      ),
    );
    await tester.pumpWidget(build('Rendering', 40.4));
    expect(find.text('40%'), findsOneWidget);
    expect(find.text('3 of 8 files'), findsOneWidget);
    final node = tester.getSemantics(find.byType(LoadingGenerationArea));
    expect(node, semanticsWith(label: 'Rendering', isLiveRegion: true));
    expect(node.label.contains('40%'), isFalse);
    await tester.pumpWidget(build('Uploading', 120));
    expect(find.text('100%'), findsOneWidget, reason: 'clamped');
    expect(
      tester.getSemantics(find.byType(LoadingGenerationArea)),
      semanticsWith(label: 'Uploading'),
    );
    // The zone sits at the bottom.
    expect(
      tester.getBottomLeft(find.text('3 of 8 files')).dy,
      greaterThan(tester.getCenter(find.byType(LoadingGenerationArea)).dy),
    );
    semantics.dispose();
  });

  testWidgets('without the field an indicator takes its place; decorative '
      'hides it from assistive technology', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 320,
          height: 200,
          child: LoadingGenerationArea(
            field: false,
            decorative: true,
            indicator: Loading(
              variant: LoadingVariant.spinner,
              decorative: true,
            ),
          ),
        ),
      ),
    );
    expect(_field, findsNothing);
    expect(find.byType(Loading), findsOneWidget);
    expect(find.bySemanticsLabel('Loading…'), findsNothing);
    semantics.dispose();
  });

  testWidgets('start and end follow the reading direction', (tester) async {
    Future<double> zoneX(TextDirection direction) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 320,
            height: 200,
            child: LoadingGenerationArea(
              status: 'Rendering',
              labelPosition: LoadingAreaLabelPosition.start,
            ),
          ),
          direction: direction,
        ),
      );
      return tester.getCenter(find.text('Rendering')).dx;
    }

    final center =
        tester.view.physicalSize.width / tester.view.devicePixelRatio / 2;
    expect(await zoneX(TextDirection.ltr), lessThan(center));
    expect(await zoneX(TextDirection.rtl), greaterThan(center));
  });

  testWidgets('under reduced motion the glows hold still', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 320, height: 200, child: LoadingGenerationArea()),
        disableAnimations: true,
      ),
    );
    expect(_field, findsOneWidget);
    expect(tester.hasRunningAnimations, isFalse);
  });

  testWidgets('when loading ends the result fades in, at once under reduced '
      'motion', (tester) async {
    Widget build(bool loading, {bool still = false}) => harness(
      SizedBox(
        width: 320,
        height: 200,
        child: LoadingGenerationArea(
          loading: loading,
          child: const Text('Generated image'),
        ),
      ),
      disableAnimations: still,
    );
    await tester.pumpWidget(build(true));
    await tester.pumpWidget(build(false));
    expect(find.text('Generated image'), findsOneWidget);
    expect(_field, findsNothing);
    await tester.pump(const Duration(milliseconds: 100));
    final fading = tester.widget<FadeTransition>(find.byType(FadeTransition));
    expect(fading.opacity.value, inExclusiveRange(0, 1));
    await tester.pumpAndSettle();

    await tester.pumpWidget(build(true, still: true));
    await tester.pumpWidget(build(false, still: true));
    expect(
      tester.widget<FadeTransition>(find.byType(FadeTransition)).opacity.value,
      1,
    );
  });

  testWidgets('an open height takes the minimum, scaled with the text; text '
      'scale 2.0 right to left does not overflow', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: SingleChildScrollView(
            child: LoadingGenerationArea(
              status: 'Rendering a long status message that wraps',
              value: 30,
              detail: '48 MB of 128 MB',
            ),
          ),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getSize(find.byType(LoadingGenerationArea)).height,
      greaterThanOrEqualTo(192),
    );
  });

  testWidgets('the zone text meets the contrast guideline', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 320,
          height: 200,
          child: LoadingGenerationArea(
            field: false,
            status: 'Rendering',
            detail: '3 of 8 files',
          ),
        ),
      ),
    );
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });
}
