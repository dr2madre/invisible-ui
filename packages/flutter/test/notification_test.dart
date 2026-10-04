import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Widget _region(
  NotificationController controller, {
  ModalObserver? modals,
  NotificationPlacement placement = NotificationPlacement.topEnd,
  int maxVisible = 0,
  TextDirection direction = TextDirection.ltr,
  InvisibleThemeData? theme,
  double textScale = 1,
  bool disableAnimations = false,
  Widget app = const SizedBox.expand(),
}) => harness(
  NotificationRegion(
    controller: controller,
    modals: modals,
    placement: placement,
    maxVisible: maxVisible,
    child: app,
  ),
  direction: direction,
  theme: theme,
  textScale: textScale,
  disableAnimations: disableAnimations,
);

void main() {
  late NotificationController controller;
  setUp(() => controller = NotificationController());
  tearDown(() => controller.dispose());

  group('controller', () {
    test('show adds in order; a live id replaces in place', () {
      final reasons = <NotificationDismissReason>[];
      final a = controller.show(title: 'Saving', onDismiss: reasons.add);
      final b = controller.success('Uploaded');
      expect(controller.notices.map((n) => n.id), [a, b]);
      expect(controller.show(id: a, title: 'Saved'), a);
      expect(controller.notices.map((n) => n.title), ['Saved', 'Uploaded']);
      expect(reasons, isEmpty, reason: 'a replacement is not a dismissal');
    });

    test('dismiss removes first, then reports the reason once', () {
      late List<Notice> seen;
      final id = controller.show(
        title: 'Deleted',
        onDismiss: (_) => seen = controller.notices,
      );
      final reasons = <NotificationDismissReason>[];
      controller.show(id: id, title: 'Deleted', onDismiss: reasons.add);
      controller.dismiss(id, NotificationDismissReason.user);
      controller.dismiss(id, NotificationDismissReason.user);
      expect(reasons, [NotificationDismissReason.user]);
      expect(controller.notices, isEmpty);
      expect(() => seen, throwsA(isA<Error>()), reason: 'replaced handler');
    });

    test('clear empties the list, then tells each one', () {
      final seen = <int>[];
      controller
        ..show(
          title: 'A',
          onDismiss: (_) => seen.add(controller.notices.length),
        )
        ..show(
          title: 'B',
          onDismiss: (_) => seen.add(controller.notices.length),
        )
        ..clear();
      expect(seen, [0, 0]);
    });

    test('update changes one notification in place', () {
      final id = controller.info('Syncing');
      controller.update(id, status: NotificationStatus.warning, text: 'Slow');
      final notice = controller.notices.single;
      expect(notice.status, NotificationStatus.warning);
      expect(notice.title, 'Syncing');
      expect(notice.text, 'Slow');
    });

    test('promise turns a loading notice into success or danger', () async {
      final ok = controller.promise(
        Future.value(3),
        loading: 'Uploading',
        success: (n) => '$n files uploaded',
        error: (_) => 'Upload failed',
      );
      expect(controller.notices.single.title, 'Uploading');
      expect(controller.notices.single.closable, isFalse);
      await ok;
      expect(controller.notices.single.title, '3 files uploaded');
      expect(controller.notices.single.status, NotificationStatus.success);

      controller.clear();
      final failed = controller.promise<int>(
        Future.error(StateError('offline')),
        loading: 'Uploading',
        success: (n) => '$n files uploaded',
        error: (_) => 'Upload failed',
      );
      await expectLater(failed, throwsStateError);
      final notice = controller.notices.single;
      expect(notice.status, NotificationStatus.danger);
      expect(notice.assertive, isTrue);
    });
  });

  group('region', () {
    testWidgets('newest on top, each announced once with its level', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(_region(controller));
      controller.info('First');
      await tester.pumpAndSettle();
      controller.show(
        status: NotificationStatus.danger,
        title: 'Second',
        text: 'Retry later',
        assertive: true,
      );
      await tester.pumpAndSettle();
      expect(
        tester.getRect(find.text('Second')).top,
        lessThan(tester.getRect(find.text('First')).top),
      );
      expect(log, [
        (message: 'First', assertive: false),
        (message: 'Second. Retry later', assertive: true),
      ]);
      controller.update(controller.notices.first.id, title: 'First, changed');
      await tester.pumpAndSettle();
      expect(log.last, (message: 'First, changed', assertive: false));
    });

    testWidgets('the region is named and each toast keeps its glyph', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_region(controller));
      controller.success('Saved');
      await tester.pumpAndSettle();
      expect(find.bySemanticsLabel('Notifications'), findsOneWidget);
      expect(find.text('Saved'), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('auto-dismiss is opt-in and pauses while hovered', (
      tester,
    ) async {
      final reasons = <NotificationDismissReason>[];
      await tester.pumpWidget(_region(controller));
      controller
        ..info('Stays')
        ..show(
          title: 'Goes',
          duration: const Duration(seconds: 4),
          onDismiss: reasons.add,
        );
      await tester.pump();
      await tester.pump(const Duration(seconds: 3));
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(find.text('Goes')));
      await tester.pump();
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('Goes'), findsOneWidget, reason: 'paused');
      await mouse.moveTo(Offset.zero);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 999));
      expect(reasons, isEmpty);
      await tester.pump(const Duration(milliseconds: 1));
      expect(reasons, [NotificationDismissReason.timeout]);
      await tester.pumpAndSettle();
      expect(find.text('Goes'), findsNothing);
      expect(find.text('Stays'), findsOneWidget);
    });

    testWidgets('focus inside the stack pauses the countdown', (tester) async {
      await tester.pumpWidget(_region(controller));
      controller.show(
        title: 'Goes',
        duration: const Duration(seconds: 4),
        actions: [const NotificationAction(label: 'Undo')],
      );
      await tester.pump();
      Focus.of(tester.element(find.text('Undo'))).requestFocus();
      await pumpFocus(tester);
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('Goes'), findsOneWidget);
    });

    testWidgets('close, action and keepOpen report their reasons', (
      tester,
    ) async {
      final reasons = <NotificationDismissReason>[];
      var undone = 0;
      await tester.pumpWidget(_region(controller));
      controller.show(
        title: 'Deleted',
        onDismiss: reasons.add,
        actions: [
          NotificationAction(label: 'Undo', onPressed: () => undone++),
          const NotificationAction(label: 'Details', keepOpen: true),
        ],
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Details'));
      await tester.pumpAndSettle();
      expect(find.text('Deleted'), findsOneWidget);
      await tester.tap(find.text('Undo'));
      await tester.pumpAndSettle();
      expect(undone, 1);
      expect(reasons, [NotificationDismissReason.action]);

      controller.show(title: 'Saved', onDismiss: reasons.add);
      await tester.pumpAndSettle();
      await tester.tap(find.bySemanticsLabel('Close'));
      await tester.pumpAndSettle();
      expect(reasons.last, NotificationDismissReason.user);
      expect(find.text('Saved'), findsNothing);
    });

    testWidgets('a swipe dismisses a toast', (tester) async {
      final reasons = <NotificationDismissReason>[];
      await tester.pumpWidget(_region(controller));
      controller.show(title: 'Saved', onDismiss: reasons.add);
      await tester.pumpAndSettle();
      await tester.fling(find.text('Saved'), const Offset(300, 0), 1000);
      await tester.pumpAndSettle();
      expect(reasons, [NotificationDismissReason.user]);
      expect(find.text('Saved'), findsNothing);
    });

    testWidgets('the app beside the toasts keeps the pointer', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        _region(
          controller,
          app: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => taps++,
            child: const SizedBox.expand(),
          ),
        ),
      );
      controller.info('Saved');
      await tester.pumpAndSettle();
      await tester.tapAt(const Offset(20, 300));
      await tester.tapAt(const Offset(780, 580));
      expect(taps, 2);
      await tester.tap(find.text('Saved'));
      expect(taps, 2, reason: 'a press on a toast stays on it');
    });

    testWidgets('maxVisible keeps the newest', (tester) async {
      await tester.pumpWidget(_region(controller, maxVisible: 2));
      controller
        ..info('One')
        ..info('Two')
        ..info('Three');
      await tester.pumpAndSettle();
      expect(find.text('One'), findsNothing);
      expect(find.text('Two'), findsOneWidget);
      expect(find.text('Three'), findsOneWidget);
    });
  });

  group('modals (ADR 0016)', () {
    testWidgets('new notifications wait while a modal is open, then show '
        'and are announced in order', (tester) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      await tester.pumpWidget(_region(controller, modals: modals));
      controller.show(title: 'Before', duration: const Duration(seconds: 2));
      await tester.pumpAndSettle();

      final release = modals.hold();
      await tester.pump();
      controller
        ..info('During one')
        ..info('During two')
        ..update(controller.notices.first.id, title: 'Before, changed');
      await tester.pumpAndSettle();
      expect(find.text('During one'), findsNothing);
      expect(
        find.text('Before'),
        findsNothing,
        reason: 'hidden while the modal is open',
      );
      // The countdown of the toast shown before is held.
      await tester.pump(const Duration(seconds: 5));
      expect(controller.notices, hasLength(3));
      expect(log.map((a) => a.message), ['Before']);

      release();
      await tester.pumpAndSettle();
      expect(find.text('During one'), findsOneWidget);
      expect(find.text('During two'), findsOneWidget);
      expect(find.text('Before, changed'), findsOneWidget);
      expect(log.map((a) => a.message), [
        'Before',
        'Before, changed',
        'During one',
        'During two',
      ]);
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();
      expect(controller.notices.map((n) => n.title), [
        'During one',
        'During two',
      ]);
    });

    testWidgets('a dialog route counts as a modal', (tester) async {
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      final navigator = GlobalKey<NavigatorState>();
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          navigatorKey: navigator,
          navigatorObservers: [modals],
          builder: (context, child) => InvisibleTheme(
            data: InvisibleThemeData.light(),
            child: NotificationRegion(
              controller: controller,
              modals: modals,
              child: child!,
            ),
          ),
          pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
            settings: settings,
            pageBuilder: (context, _, _) => builder(context),
          ),
          home: const SizedBox.expand(),
        ),
      );
      unawaited(
        navigator.currentState!.push(
          RawDialogRoute<void>(
            pageBuilder: (context, _, _) => const Center(child: Text('Dialog')),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(modals.hasModal, isTrue);
      controller.info('Later');
      await tester.pumpAndSettle();
      expect(find.text('Later'), findsNothing);
      navigator.currentState!.pop();
      await tester.pumpAndSettle();
      expect(modals.hasModal, isFalse);
      expect(find.text('Later'), findsOneWidget);
    });
  });

  group('layout', () {
    testWidgets('placement follows the reading direction', (tester) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(
          _region(
            controller,
            direction: direction,
            placement: NotificationPlacement.bottomStart,
          ),
        );
        controller
          ..clear()
          ..info('Saved');
        await tester.pumpAndSettle();
        final toast = tester.getRect(find.byType(InlineNotification));
        expect(toast.bottom, moreOrLessEquals(600 - 16 - 8, epsilon: 1));
        expect(
          direction == TextDirection.ltr ? toast.left : 800 - toast.right,
          moreOrLessEquals(16, epsilon: 1),
          reason: direction.name,
        );
        expect(toast.width, 384);
      }
    });

    testWidgets('a narrow screen gets one full-width column at text scale '
        '2.0', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_region(controller, textScale: 2));
      controller.show(
        status: NotificationStatus.warning,
        title: 'Your session ends soon',
        text: 'Save your work to keep it.',
        actions: [const NotificationAction(label: 'Stay')],
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      final toast = tester.getRect(find.byType(InlineNotification));
      expect(toast.left, moreOrLessEquals(16, epsilon: 1));
      expect(toast.right, moreOrLessEquals(304, epsilon: 1));
    });

    testWidgets('more toasts than the height allows are clipped, not '
        'overflowing', (tester) async {
      await tester.pumpWidget(_region(controller));
      for (var i = 0; i < 12; i++) {
        controller.info('Notice $i', text: 'Details of notice $i');
      }
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(
        tester.getRect(find.text('Notice 11')).top,
        lessThan(100),
        reason: 'the newest stays whole at the top',
      );
    });

    testWidgets('no motion under reduced motion', (tester) async {
      await tester.pumpWidget(_region(controller, disableAnimations: true));
      controller.info('Saved');
      await tester.pump();
      await tester.pump();
      final opacity = tester.widget<Opacity>(
        find.ancestor(of: find.text('Saved'), matching: find.byType(Opacity)),
      );
      expect(opacity.opacity, 1);
    });

    testWidgets('targets meet 44 by 44 under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _region(
          controller,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      controller.show(
        title: 'Deleted',
        actions: [const NotificationAction(label: 'Undo')],
      );
      await tester.pumpAndSettle();
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
  });
}
