import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const _media = SizedBox(key: ValueKey('media'), width: 120, height: 80);

Widget _card({
  CardOrientation orientation = CardOrientation.vertical,
  double width = 600,
  int headingLevel = 3,
  bool secondary = false,
  Widget? media = _media,
}) => SizedBox(
  width: width,
  child: Card(
    title: 'Timelog',
    headingLevel: headingLevel,
    description: 'Hours by project, week by week.',
    media: media,
    orientation: orientation,
    secondary: secondary,
    tags: const [Text('Desktop')],
    actions: [Button(onPressed: () {}, child: const Text('Open'))],
  ),
);

void main() {
  testWidgets('one semantics group whose heading is the title', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(_card()));
    final heading = tester.getSemantics(find.text('Timelog'));
    expect(heading, semanticsWith(isHeader: true));
    expect(heading.getSemanticsData().headingLevel, 3);
    await tester.pumpWidget(harness(_card(headingLevel: 4)));
    expect(
      tester.getSemantics(find.text('Timelog')).getSemanticsData().headingLevel,
      4,
    );
    expect(find.text('Hours by project, week by week.'), findsOneWidget);
    expect(find.text('Open'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('vertical: media, tags above the title, then the description '
      'and the actions', (tester) async {
    await tester.pumpWidget(harness(_card()));
    final media = tester.getRect(find.byKey(const ValueKey('media')));
    final tag = tester.getRect(find.text('Desktop'));
    final title = tester.getRect(find.text('Timelog'));
    final actions = tester.getRect(find.text('Open'));
    expect(media.bottom, lessThanOrEqualTo(tag.top));
    expect(tag.bottom, lessThanOrEqualTo(title.top));
    expect(title.bottom, lessThan(actions.top));
  });

  testWidgets('horizontal: media at the inline-start, mirrored right to '
      'left', (tester) async {
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(
        harness(
          _card(orientation: CardOrientation.horizontal),
          direction: direction,
        ),
      );
      final media = tester.getRect(find.byKey(const ValueKey('media')));
      final title = tester.getRect(find.text('Timelog'));
      final actions = tester.getRect(find.text('Open'));
      if (direction == TextDirection.ltr) {
        expect(media.right, lessThanOrEqualTo(title.left));
        expect(title.right, lessThan(actions.left));
      } else {
        expect(media.left, greaterThanOrEqualTo(title.right));
        expect(title.left, greaterThan(actions.right));
      }
    }
  });

  testWidgets('a horizontal card stacks on a narrow width and at text '
      'scale 2.0, without overflow', (tester) async {
    await tester.pumpWidget(
      harness(_card(orientation: CardOrientation.horizontal, width: 320)),
    );
    expect(
      tester.getRect(find.byKey(const ValueKey('media'))).bottom,
      lessThanOrEqualTo(tester.getRect(find.text('Timelog')).top),
    );
    await tester.pumpWidget(
      harness(
        _card(orientation: CardOrientation.horizontal, width: 600),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getRect(find.byKey(const ValueKey('media'))).bottom,
      lessThanOrEqualTo(tester.getRect(find.text('Timelog')).top),
    );
  });

  testWidgets('an icon takes the media area and stays decorative', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 300,
          child: Card(
            title: 'Reports',
            icon: Semantics(
              label: 'chart glyph',
              child: SizedBox.square(dimension: 24),
            ),
          ),
        ),
      ),
    );
    expect(find.bySemanticsLabel('chart glyph'), findsNothing);
    semantics.dispose();
  });

  testWidgets('dashboard: the value with its change, coloured by trend, '
      'wrapping under the title on a narrow card', (tester) async {
    Widget tile(CardTrend trend, double width) => harness(
      SizedBox(
        width: width,
        child: Card.dashboard(
          title: 'Hours this week',
          value: '38.5',
          change: '+12 %',
          trend: trend,
        ),
      ),
    );
    final colors = InvisibleColors.light;
    for (final (trend, color) in [
      (CardTrend.up, colors.successText),
      (CardTrend.down, colors.dangerText),
      (CardTrend.neutral, colors.textSecondary),
    ]) {
      await tester.pumpWidget(tile(trend, 640));
      expect(tester.widget<Text>(find.text('+12 %')).style!.color, color);
    }
    final title = tester.getRect(find.text('Hours this week'));
    final value = tester.getRect(find.text('38.5'));
    expect(value.left, greaterThan(title.right), reason: 'side by side');

    await tester.pumpWidget(tile(CardTrend.up, 200));
    expect(tester.takeException(), isNull);
    expect(
      tester.getRect(find.text('38.5')).top,
      greaterThan(tester.getRect(find.text('Hours this week')).bottom),
    );
  });

  testWidgets('the secondary surface', (tester) async {
    await tester.pumpWidget(harness(_card(secondary: true)));
    final box = tester.widget<DecoratedBox>(
      find
          .descendant(
            of: find.byType(Card),
            matching: find.byType(DecoratedBox),
          )
          .first,
    );
    expect(
      (box.decoration as BoxDecoration).color,
      InvisibleColors.light.neutralSurface,
    );
  });

  for (final dark in [false, true]) {
    testWidgets('contrast and labelled targets, ${dark ? 'dark' : 'light'}', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _card(media: null),
              const SizedBox(height: 8),
              const SizedBox(
                width: 400,
                child: Card.dashboard(
                  title: 'Hours',
                  value: '38.5',
                  change: '-3 %',
                  trend: CardTrend.down,
                ),
              ),
            ],
          ),
          theme: dark ? InvisibleThemeData.dark() : InvisibleThemeData.light(),
        ),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      semantics.dispose();
    });
  }
}
