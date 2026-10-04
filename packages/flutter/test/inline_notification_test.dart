import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

Finder get _close => find.bySemanticsLabel('Close');

void main() {
  group('content', () {
    testWidgets('every status has its own glyph beside the text', (
      tester,
    ) async {
      final shapes = <GlyphShape>{};
      for (final status in NotificationStatus.values) {
        await tester.pumpWidget(
          harness(
            InlineNotification(
              status: status,
              title: 'Title',
              description: 'Body',
            ),
          ),
        );
        expect(find.text('Title'), findsOneWidget);
        expect(find.text('Body'), findsOneWidget);
        shapes.add(tester.widget<Glyph>(find.byType(Glyph)).shape);
      }
      expect(shapes, hasLength(NotificationStatus.values.length));
    });

    testWidgets('rich content replaces the description', (tester) async {
      await tester.pumpWidget(
        harness(
          const InlineNotification(
            title: 'Upload failed',
            description: 'Plain',
            child: Text('Rich'),
          ),
        ),
      );
      expect(find.text('Rich'), findsOneWidget);
      expect(find.text('Plain'), findsNothing);
    });

    testWidgets('actions are buttons that run their callback', (tester) async {
      var retried = 0;
      await tester.pumpWidget(
        harness(
          InlineNotification(
            status: NotificationStatus.danger,
            title: 'Upload failed',
            actions: [
              NotificationAction(label: 'Retry', onPressed: () => retried++),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Retry'));
      expect(retried, 1);
    });
  });

  group('close button', () {
    testWidgets('only with onClose; named by the theme message', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const InlineNotification(title: 'Saved')),
      );
      expect(_close, findsNothing);

      var closed = 0;
      await tester.pumpWidget(
        harness(InlineNotification(title: 'Saved', onClose: () => closed++)),
      );
      expect(
        tester.getSemantics(_close),
        semanticsWith(isButton: true, label: 'Close'),
      );
      await tester.tap(_close);
      expect(closed, 1);

      await tester.pumpWidget(
        harness(
          InlineNotification(title: 'Saved', onClose: () {}),
          theme: InvisibleThemeData.light(
            messages: const InvisibleMessages(closeLabel: 'Chiudi'),
          ),
        ),
      );
      expect(find.bySemanticsLabel('Chiudi'), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('the close button is a 40 by 40 target at the inline-end', (
      tester,
    ) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(
          harness(
            SizedBox(
              width: 360,
              child: InlineNotification(title: 'Saved', onClose: () {}),
            ),
            direction: direction,
          ),
        );
        final button = tester.getRect(find.byType(Button));
        final banner = tester.getRect(find.byType(InlineNotification));
        expect(button.width, greaterThanOrEqualTo(40));
        expect(button.height, greaterThanOrEqualTo(40));
        expect(
          direction == TextDirection.ltr
              ? button.center.dx > banner.center.dx
              : button.center.dx < banner.center.dx,
          isTrue,
          reason: direction.name,
        );
      }
    });

    testWidgets('on an inverted banner the close glyph takes its text colour', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          InlineNotification(title: 'Saved', inverted: true, onClose: () {}),
        ),
      );
      final glyph = find.descendant(
        of: find.byType(Button),
        matching: find.byType(Glyph),
      );
      expect(
        IconTheme.of(tester.element(glyph)).color,
        InvisibleColors.light.onEmphasis,
      );
    });
  });

  group('announcements', () {
    testWidgets('status is a polite live region', (tester) async {
      final semantics = tester.ensureSemantics();
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(
        harness(const InlineNotification(title: 'Saved', description: 'Done')),
      );
      expect(
        tester.getSemantics(find.byType(InlineNotification)),
        semanticsWith(label: 'Saved\nDone', isLiveRegion: true),
      );
      expect(log, isEmpty, reason: 'the live region speaks for itself');
      semantics.dispose();
    });

    testWidgets('alert interrupts when it appears and when it changes', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      Widget build(String title) => harness(
        InlineNotification(
          status: NotificationStatus.danger,
          title: title,
          description: 'Check the connection',
          role: InlineNotificationRole.alert,
        ),
      );
      await tester.pumpWidget(build('Upload failed'));
      expect(log, [
        (message: 'Upload failed. Check the connection', assertive: true),
      ]);
      await tester.pumpWidget(build('Upload failed again'));
      expect(log, hasLength(2));
      expect(log.last.message, 'Upload failed again. Check the connection');
    });

    testWidgets('group carries its title and announces nothing', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(
        harness(
          const InlineNotification(
            title: 'Saved',
            role: InlineNotificationRole.group,
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(InlineNotification)),
        semanticsWith(label: 'Saved', isLiveRegion: false),
      );
      expect(log, isEmpty);
      semantics.dispose();
    });
  });

  group('accessibility and layout', () {
    testWidgets('text contrast holds for every status, light and dark', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      for (final theme in [
        InvisibleThemeData.light(),
        InvisibleThemeData.dark(),
      ]) {
        await tester.pumpWidget(
          harness(
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final status in NotificationStatus.values)
                  InlineNotification(status: status, title: status.name),
                const InlineNotification(title: 'inverted', inverted: true),
              ],
            ),
            theme: theme,
          ),
        );
        await expectLater(tester, meetsGuideline(textContrastGuideline));
      }
      semantics.dispose();
    });

    testWidgets('targets meet the guidelines under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          InlineNotification(
            title: 'Upload failed',
            actions: [NotificationAction(label: 'Retry', onPressed: () {})],
            onClose: () {},
          ),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(
        tester,
        meetsGuideline(
          const MinimumTapTargetGuideline(
            size: Size(44, 44),
            link:
                'https://developer.apple.com/design/human-interface-guidelines/accessibility',
          ),
        ),
      );
      semantics.dispose();
    });

    testWidgets('long text wraps in a narrow space at text scale 2.0', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          // A page scrolls when the text is this large.
          SingleChildScrollView(
            child: SizedBox(
              width: 320,
              child: InlineNotification(
                status: NotificationStatus.warning,
                title: 'Your session ends in five minutes',
                description: 'Save your work to keep every change you made.',
                actions: [
                  NotificationAction(label: 'Stay signed in', onPressed: () {}),
                ],
                onClose: () {},
              ),
            ),
          ),
          textScale: 2,
          direction: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(
        tester.getSize(find.byType(InlineNotification)).width,
        lessThanOrEqualTo(320),
      );
    });
  });
}
