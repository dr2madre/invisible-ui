import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const _guideline24 = MinimumTapTargetGuideline(
  size: Size(24, 24),
  link: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
);
const _guideline44 = MinimumTapTargetGuideline(
  size: Size(44, 44),
  link:
      'https://developer.apple.com/design/human-interface-guidelines/accessibility',
);

SemanticsNode _region(WidgetTester tester, Type type) =>
    tester.getSemantics(find.byType(type));

void main() {
  group('EmptyState', () {
    testWidgets('a heading, a description and an action that runs', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      var added = 0;
      await tester.pumpWidget(
        harness(
          EmptyState(
            title: 'No projects yet',
            description: 'Create your first project to get started.',
            actionLabel: 'Add a project',
            onAction: () => added++,
          ),
        ),
      );
      final heading = tester.getSemantics(find.text('No projects yet'));
      expect(heading, semanticsWith(isHeader: true));
      expect(heading.getSemanticsData().headingLevel, 2);
      expect(
        find.text('Create your first project to get started.'),
        findsOneWidget,
      );
      await tester.tap(find.text('Add a project'));
      expect(added, 1);
      semantics.dispose();
    });

    testWidgets('not live unless live is set, then a polite live region', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(harness(const EmptyState(title: 'No results')));
      expect(_region(tester, EmptyState), semanticsWith(isLiveRegion: false));
      await tester.pumpWidget(
        harness(const EmptyState(title: 'No results', live: true)),
      );
      expect(_region(tester, EmptyState), semanticsWith(isLiveRegion: true));
      expect(log, isEmpty, reason: 'the live region speaks for itself');
      semantics.dispose();
    });

    testWidgets('an action group replaces the single action; an illustration '
        'replaces the icon; the heading level follows the outline', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          EmptyState(
            title: 'No rules yet',
            headingLevel: 3,
            actionLabel: 'Ignored',
            illustration: const SizedBox.square(
              key: ValueKey('art'),
              dimension: 80,
            ),
            actions: [
              Button(onPressed: () {}, child: const Text('Add a rule')),
              Button(
                onPressed: () {},
                variant: ButtonVariant.ghost,
                child: const Text('Import'),
              ),
            ],
          ),
        ),
      );
      expect(find.text('Ignored'), findsNothing);
      expect(find.byType(Button), findsNWidgets(2));
      expect(find.byKey(const ValueKey('art')), findsOneWidget);
      expect(
        tester
            .getSemantics(find.text('No rules yet'))
            .getSemanticsData()
            .headingLevel,
        3,
      );
      semantics.dispose();
    });

    testWidgets('the small size is quieter', (tester) async {
      await tester.pumpWidget(
        harness(
          const EmptyState(title: 'Empty', size: FeedbackStateSize.small),
        ),
      );
      final small = tester.widget<Text>(find.text('Empty')).style!.fontSize;
      await tester.pumpWidget(harness(const EmptyState(title: 'Empty')));
      final medium = tester.widget<Text>(find.text('Empty')).style!.fontSize;
      expect(small, 16);
      expect(medium, 20);
    });
  });

  group('ErrorState', () {
    testWidgets('a heading and a recovery action; silent unless live', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final log = recordAnnouncements(tester);
      var retried = 0;
      await tester.pumpWidget(
        harness(
          ErrorState(
            title: 'Connection failed',
            description: 'Check the server and try again.',
            actionLabel: 'Try again',
            onAction: () => retried++,
          ),
        ),
      );
      expect(
        tester.getSemantics(find.text('Connection failed')),
        semanticsWith(isHeader: true),
      );
      expect(_region(tester, ErrorState), semanticsWith(isLiveRegion: false));
      await tester.tap(find.text('Try again'));
      expect(retried, 1);
      expect(log, isEmpty);
      semantics.dispose();
    });

    testWidgets('live interrupts once, when it appears', (tester) async {
      final log = recordAnnouncements(tester);
      Widget error(String text) => harness(
        ErrorState(title: 'Connection failed', description: text, live: true),
      );
      await tester.pumpWidget(error('Check the server.'));
      await tester.pumpWidget(error('Still down.'));
      expect(log, [
        (message: 'Connection failed. Check the server.', assertive: true),
      ]);
    });
  });

  group('layout and guidelines', () {
    testWidgets('centred and wrapped at text scale 2.0 in a narrow space, '
        'right to left', (tester) async {
      // Tall enough for the whole state: scrolling is the screen's job.
      tester.view.physicalSize = const Size(320, 1200);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 320,
            child: ErrorState(
              title: 'We could not load the weekly report',
              description: 'The server took too long to answer.',
              actions: [
                Button(onPressed: () {}, child: const Text('Try again')),
                Button(
                  onPressed: () {},
                  variant: ButtonVariant.ghost,
                  child: const Text('Go back'),
                ),
              ],
            ),
          ),
          textScale: 2,
          direction: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      final title = tester.getRect(
        find.text('We could not load the weekly report'),
      );
      expect(title.center.dx, moreOrLessEquals(160, epsilon: 1));
    });

    testWidgets('at most 24rem wide', (tester) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 800,
            child: EmptyState(
              title: 'No projects yet',
              description:
                  'Create your first project to get started, then invite '
                  'the people who log hours on it.',
            ),
          ),
        ),
      );
      expect(
        tester
            .getSize(
              find.text(
                'Create your first project to get started, then invite '
                'the people who log hours on it.',
              ),
            )
            .width,
        lessThanOrEqualTo(384 - 48),
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
                EmptyState(
                  title: 'No projects yet',
                  description: 'Create your first project.',
                  size: FeedbackStateSize.small,
                  actionLabel: 'Add a project',
                  onAction: () {},
                ),
                ErrorState(
                  title: 'Connection failed',
                  description: 'Check the server.',
                  size: FeedbackStateSize.small,
                  actionLabel: 'Try again',
                  onAction: () {},
                ),
              ],
            ),
            theme: dark
                ? InvisibleThemeData.dark()
                : InvisibleThemeData.light(),
          ),
        );
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(_guideline24));
        semantics.dispose();
      });
    }

    testWidgets('targets meet 44 by 44 under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          EmptyState(
            title: 'No projects yet',
            actionLabel: 'Add',
            onAction: () {},
          ),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(_guideline44));
      semantics.dispose();
    });
  });
}
