import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

SemanticsNode _node(WidgetTester tester) =>
    tester.getSemantics(find.byType(Loading));

/// The dots of a dots or typing indicator.
Finder get _dots => find.descendant(
  of: find.byType(Loading),
  matching: find.byWidgetPredicate(
    (widget) =>
        widget is Container &&
        widget.decoration is BoxDecoration &&
        (widget.decoration as BoxDecoration).shape == BoxShape.circle,
  ),
);

void main() {
  testWidgets('a polite live region named by the catalog label, three dots', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(const Loading()));
    expect(_node(tester), semanticsWith(label: 'Loading…', isLiveRegion: true));
    expect(_dots, findsNWidgets(3));
    semantics.dispose();
  });

  testWidgets('a custom label; the spinner and morph shapes', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Loading(variant: LoadingVariant.spinner, label: 'Saving changes'),
      ),
    );
    expect(_node(tester), semanticsWith(label: 'Saving changes'));
    expect(find.byType(RotationTransition), findsOneWidget);
    expect(_dots, findsNothing);

    await tester.pumpWidget(
      harness(const Loading(variant: LoadingVariant.morph)),
    );
    expect(_dots, findsNothing);
    expect(
      find.descendant(
        of: find.byType(Loading),
        matching: find.byType(Transform),
      ),
      findsOneWidget,
    );
    semantics.dispose();
  });

  testWidgets('a status message names the region and changes with it', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Loading(status: 'Connecting…', showLabel: true)),
    );
    expect(
      _node(tester),
      semanticsWith(label: 'Connecting…', isLiveRegion: true),
    );
    expect(find.text('Connecting…'), findsOneWidget);
    await tester.pumpWidget(
      harness(const Loading(status: 'Fetching records…')),
    );
    expect(_node(tester), semanticsWith(label: 'Fetching records…'));
    semantics.dispose();
  });

  testWidgets('a determinate bar reports its value and is not live', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 300,
          child: Loading(
            variant: LoadingVariant.bar,
            value: 60,
            label: 'Downloading',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      _node(tester),
      semanticsWith(label: 'Downloading', value: '60%', isLiveRegion: false),
    );
    final fill = tester.widget<AnimatedFractionallySizedBox>(
      find.byType(AnimatedFractionallySizedBox),
    );
    expect(fill.widthFactor, 0.6);

    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 300,
          child: Loading(
            variant: LoadingVariant.bar,
            value: 50,
            label: 'Downloading',
            detail: '2.3 MB of 4.6 MB',
            status: 'Fetching',
          ),
        ),
      ),
    );
    expect(_node(tester), semanticsWith(value: '2.3 MB of 4.6 MB'));
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 300,
          child: Loading(
            variant: LoadingVariant.bar,
            value: 140,
            label: 'Import',
            status: 'Fetching records…',
          ),
        ),
      ),
    );
    expect(_node(tester), semanticsWith(value: 'Fetching records…'));
    expect(find.text('Fetching records…'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('visible label, percentage and detail stay out of semantics', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 300,
          child: Loading(
            variant: LoadingVariant.bar,
            value: 38,
            label: 'Downloading',
            showLabel: true,
            showValue: true,
            detail: '3 of 8 files',
          ),
        ),
      ),
    );
    expect(find.text('Downloading'), findsOneWidget);
    expect(find.text('38%'), findsOneWidget);
    expect(find.text('3 of 8 files'), findsOneWidget);
    expect(find.bySemanticsLabel('38%'), findsNothing);
    expect(find.bySemanticsLabel('3 of 8 files'), findsNothing);
    semantics.dispose();
  });

  testWidgets('decorative hides it from assistive technology', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        Semantics(
          container: true,
          label: 'Busy button',
          child: const Loading(decorative: true),
        ),
      ),
    );
    expect(find.bySemanticsLabel('Loading…'), findsNothing);
    semantics.dispose();
  });

  testWidgets('the no-flash delay shows nothing until it passes, and goes '
      'with the widget', (tester) async {
    await tester.pumpWidget(
      harness(const Loading(delay: Duration(milliseconds: 200))),
    );
    expect(_dots, findsNothing);
    await tester.pump(const Duration(milliseconds: 200));
    expect(_dots, findsNWidgets(3));

    await tester.pumpWidget(
      harness(const Loading(key: ValueKey(2), delay: Duration(seconds: 1))),
    );
    await tester.pumpWidget(harness(const SizedBox()));
    // A timer left running fails the test at its end.
  });

  testWidgets('still under reduced motion, visible', (tester) async {
    for (final variant in LoadingVariant.values) {
      await tester.pumpWidget(
        harness(
          SizedBox(width: 200, child: Loading(variant: variant)),
          disableAnimations: true,
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));
      expect(tester.hasRunningAnimations, isFalse, reason: variant.name);
    }
    for (final dot in tester.widgetList<Opacity>(
      find.ancestor(of: _dots, matching: find.byType(Opacity)),
    )) {
      expect(dot.opacity, 1);
    }
  });

  testWidgets('the dots pulse in turn while motion is allowed', (tester) async {
    await tester.pumpWidget(harness(const Loading()));
    await tester.pump(const Duration(milliseconds: 300));
    expect(tester.hasRunningAnimations, isTrue);
    final opacities = tester
        .widgetList<Opacity>(
          find.ancestor(of: _dots, matching: find.byType(Opacity)),
        )
        .map((o) => o.opacity)
        .toSet();
    expect(opacities.length, greaterThan(1));
  });

  testWidgets('the indeterminate segment starts at the inline-start, right '
      'to left too', (tester) async {
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 300,
            child: Loading(variant: LoadingVariant.bar),
          ),
          direction: direction,
          disableAnimations: true,
        ),
      );
      final track = tester.getRect(find.byType(ClipRRect));
      final segment = tester.getRect(
        find.descendant(
          of: find.byType(ClipRRect),
          matching: find.byType(DecoratedBox),
        ),
      );
      // At rest the segment sits one width before the start.
      if (direction == TextDirection.ltr) {
        expect(segment.right, moreOrLessEquals(track.left));
      } else {
        expect(segment.left, moreOrLessEquals(track.right));
      }
    }
  });

  testWidgets('grows with the text at text scale 2.0 in a narrow space', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 120,
          child: Loading(
            variant: LoadingVariant.spinner,
            showLabel: true,
            label: 'Loading the weekly report',
          ),
        ),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(RotationTransition)).width, 32);
  });

  testWidgets('an overlay with a veil blocks the content below; without one '
      'it lets it through', (tester) async {
    var taps = 0;
    Widget layer({required bool veil}) => harness(
      SizedBox(
        width: 200,
        height: 100,
        child: Stack(
          children: [
            Positioned.fill(child: GestureDetector(onTap: () => taps++)),
            Positioned.fill(child: Loading(overlay: true, veil: veil)),
          ],
        ),
      ),
    );
    await tester.pumpWidget(layer(veil: true));
    await tester.tapAt(
      tester.getCenter(find.byType(Stack)) + const Offset(60, 0),
    );
    expect(taps, 0);
    await tester.pumpWidget(layer(veil: false));
    await tester.tapAt(
      tester.getCenter(find.byType(Stack)) + const Offset(60, 0),
    );
    expect(taps, 1);
  });
}
