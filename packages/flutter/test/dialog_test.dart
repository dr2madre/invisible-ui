// flutter/semantics.dart exports SemanticsRole only after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
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

/// What the last [_page] trigger's dialog closed with.
Future<Object?>? _result;

/// A page whose "Open" button shows what [dialog] builds.
Widget _page(
  WidgetBuilder dialog, {
  bool barrierDismissible = true,
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
  List<NavigatorObserver> observers = const [],
  TransitionBuilder? wrap,
  Widget? beside,
}) => appHarness(
  (context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Button(
        onPressed: () => _result = showInvisibleDialog<Object?>(
          context: context,
          builder: dialog,
          barrierDismissible: barrierDismissible,
        ),
        child: const Text('Open'),
      ),
      ?beside,
    ],
  ),
  theme: theme,
  direction: direction,
  textScale: textScale,
  observers: observers,
  wrap: wrap,
);

/// Focuses the trigger with Tab and opens the dialog with Enter.
Future<void> _openWithKeyboard(WidgetTester tester) async {
  await tester.sendKeyEvent(LogicalKeyboardKey.tab);
  await tester.pump();
  expect(_focusedText(), 'Open');
  await tester.sendKeyEvent(LogicalKeyboardKey.enter);
  await tester.pumpAndSettle();
}

/// The name of the focused button (its semantic label or its first text),
/// or the focused node's debug label.
String? _focusedText() {
  final node = FocusManager.instance.primaryFocus;
  final context = node?.context;
  if (context == null) return null;
  final button = context.findAncestorWidgetOfExactType<Button>();
  if (button?.semanticLabel != null) return button!.semanticLabel;
  String? text;
  void visit(Element element) {
    if (text != null) return;
    final widget = element.widget;
    if (widget is Text) {
      text = widget.data;
    } else {
      element.visitChildren(visit);
    }
  }

  (context as Element).visitChildren(visit);
  return text ?? node!.debugLabel;
}

/// The semantics node that names the open dialog.
SemanticsNode _dialogNode(WidgetTester tester) => tester.getSemantics(
  find
      .byWidgetPredicate(
        (widget) => widget is Semantics && widget.properties.namesRoute == true,
      )
      .last,
);

/// The icon-only close buttons, apart from the barrier, which is named
/// Close too.
final Finder _closeButtons = find.byWidgetPredicate(
  (widget) => widget is Button && widget.semanticLabel == 'Close',
);

/// The painted panel.
final Finder _panel = find.byWidgetPredicate(
  (widget) =>
      widget is DecoratedBox &&
      widget.decoration is BoxDecoration &&
      (widget.decoration as BoxDecoration).boxShadow != null,
);

bool get _panelFocused =>
    FocusManager.instance.primaryFocus?.debugLabel == 'Dialog';

Widget _rename(BuildContext context) => Dialog(
  title: 'Rename project',
  description: 'The new name shows in every report.',
  footerClose: true,
  actions: [
    Button(
      onPressed: () => Navigator.of(context).pop('saved'),
      variant: ButtonVariant.primary,
      child: const Text('Save'),
    ),
  ],
  child: const Text('Body text'),
);

void main() {
  tearDown(() => _result = null);

  group('Dialog', () {
    testWidgets('opens as a modal, named and described, with focus on the '
        'dialog, never on the close button', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(_rename));
      await _openWithKeyboard(tester);

      expect(find.text('Rename project'), findsOneWidget);
      expect(_panelFocused, isTrue);
      final node = _dialogNode(tester);
      expect(
        node,
        semanticsWith(
          label: 'Rename project',
          hint: 'The new name shows in every report.',
          namesRoute: true,
          isFocused: true,
        ),
      );
      expect(node.getSemanticsData().role, SemanticsRole.dialog);
      final title = tester.getSemantics(find.text('Rename project'));
      expect(title, semanticsWith(isHeader: true));
      expect(title.getSemanticsData().headingLevel, 2);
      expect(_closeButtons, findsOneWidget);
      expect(find.text('Close'), findsOneWidget, reason: 'the footer Close');
      semantics.dispose();
    });

    testWidgets('Escape closes it and focus returns to the trigger', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_rename));
      await _openWithKeyboard(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsNothing);
      expect(_focusedText(), 'Open');
      expect(await _result, isNull);
    });

    testWidgets('Tab stays inside the dialog, wrapping at both ends', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          _rename,
          beside: Button(onPressed: () {}, child: const Text('Behind')),
        ),
      );
      await _openWithKeyboard(tester);
      final seen = <String?>[];
      for (var i = 0; i < 6; i++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        seen.add(_focusedText());
      }
      expect(seen, [
        'Close',
        'Close',
        'Save',
        'Close',
        'Close',
        'Save',
      ], reason: 'header close, footer Close, Save, then round again');
      expect(seen, isNot(contains('Behind')));
      expect(seen, isNot(contains('Open')));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
      await tester.pump();
      expect(_focusedText(), 'Save', reason: 'Shift+Tab wraps backwards');
    });

    testWidgets('the close buttons, an action result and the barrier close '
        'it', (tester) async {
      await tester.pumpWidget(_page(_rename));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();
      expect(await _result, 'saved');

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tap(_closeButtons);
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsNothing);

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsNothing);

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tapAt(const Offset(4, 4));
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsNothing);
    });

    testWidgets('a barrier that does not dismiss still lets Escape close', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_rename, barrierDismissible: false));
      await _openWithKeyboard(tester);
      await tester.tapAt(const Offset(4, 4));
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsOneWidget);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Rename project'), findsNothing);
    });

    testWidgets('initialFocus takes focus when it opens', (tester) async {
      final name = FocusNode();
      addTearDown(name.dispose);
      await tester.pumpWidget(
        _page(
          (context) => Dialog(
            title: 'Rename project',
            initialFocus: name,
            child: Button(
              onPressed: () {},
              focusNode: name,
              child: const Text('Name'),
            ),
          ),
        ),
      );
      await _openWithKeyboard(tester);
      expect(name.hasPrimaryFocus, isTrue);
    });

    testWidgets('a hidden title still names it; no header shows', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _page(
          (context) => const Dialog(
            title: 'Preview',
            hideTitle: true,
            closeButton: false,
            child: Text('Picture'),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(find.text('Preview'), findsNothing);
      expect(_dialogNode(tester), semanticsWith(label: 'Preview'));
      semantics.dispose();
    });

    testWidgets('header context, leading actions and the footer order', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          (context) => Dialog(
            title: 'Import',
            headerMeta: const Text('Step 1 of 2'),
            footerLead: [Button(onPressed: () {}, child: const Text('Back'))],
            footerClose: true,
            actions: [Button(onPressed: () {}, child: const Text('Next'))],
            child: const Text('Choose a file'),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      final meta = tester.getRect(find.text('Step 1 of 2'));
      expect(
        meta.bottom,
        lessThanOrEqualTo(tester.getRect(find.text('Import')).top),
      );
      final back = tester.getRect(find.text('Back'));
      final close = tester.getRect(find.text('Close'));
      final next = tester.getRect(find.text('Next'));
      expect(back.left, lessThan(close.left));
      expect(close.left, lessThan(next.left));
    });

    testWidgets('the body scrolls; header and footer stay', (tester) async {
      await tester.pumpWidget(
        _page(
          (context) => Dialog(
            title: 'Terms',
            actions: [Button(onPressed: () {}, child: const Text('Accept'))],
            child: Column(
              children: [for (var i = 0; i < 60; i++) Text('Clause $i')],
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Terms').hitTestable(), findsOneWidget);
      expect(find.text('Accept').hitTestable(), findsOneWidget);
      expect(find.text('Clause 59').hitTestable(), findsNothing);
      await tester.drag(find.text('Clause 5'), const Offset(0, -2000));
      await tester.pumpAndSettle();
      expect(find.text('Clause 59').hitTestable(), findsOneWidget);
      expect(find.text('Terms').hitTestable(), findsOneWidget);
    });
  });

  group('AlertDialog', () {
    testWidgets('an alert dialog, focus on its one button, every way of '
        'closing acknowledges', (tester) async {
      final semantics = tester.ensureSemantics();
      var dismissed = 0;
      Widget alert(BuildContext context) => AlertDialog(
        title: 'Export finished',
        description: 'The file is in your Downloads folder.',
        onDismiss: () => dismissed++,
      );
      await tester.pumpWidget(_page(alert));
      await _openWithKeyboard(tester);
      expect(_focusedText(), 'OK');
      final node = _dialogNode(tester);
      expect(node.getSemanticsData().role, SemanticsRole.alertDialog);
      expect(
        node,
        semanticsWith(
          label: 'Export finished',
          hint: 'The file is in your Downloads folder.',
        ),
      );

      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(dismissed, 1);
      expect(_focusedText(), 'Open');

      await _openWithKeyboard(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(dismissed, 2);

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tapAt(const Offset(4, 4));
      await tester.pumpAndSettle();
      expect(dismissed, 3);
      semantics.dispose();
    });

    testWidgets('names the outcome and offers an optional close button', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          (context) => const AlertDialog(
            title: 'Session ended',
            description: 'Sign in again to go on.',
            dismissLabel: 'I understand',
            closeButton: true,
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(find.text('I understand'), findsOneWidget);
      expect(_closeButtons, findsOneWidget);
    });
  });

  group('ConfirmDialog', () {
    Widget deleteHours(BuildContext context) => ConfirmDialog(
      title: 'Delete 6 hours?',
      description: 'The hours logged on Monday are removed from the report.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep hours',
      confirmVariant: ButtonVariant.danger,
      onConfirm: () => _confirmed++,
    );

    setUp(() => _confirmed = 0);

    testWidgets('focus starts on the safe choice; outcome-named buttons '
        'report the choice', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(deleteHours));
      await _openWithKeyboard(tester);
      expect(_focusedText(), 'Keep hours');
      expect(_dialogNode(tester).getSemanticsData().role, SemanticsRole.dialog);
      expect(
        find.descendant(
          of: find.widgetWithText(Button, 'Delete'),
          matching: find.byType(CustomPaint),
        ),
        findsWidgets,
        reason: 'the danger button shows its hazard glyph',
      );

      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(await _result, isFalse);
      expect(_confirmed, 0);

      await _openWithKeyboard(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(_focusedText(), 'Delete');
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(await _result, isTrue);
      expect(_confirmed, 1);
      expect(_focusedText(), 'Open');

      await _openWithKeyboard(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(await _result, isNull);
      expect(_confirmed, 1);
      semantics.dispose();
    });

    testWidgets('urgent makes it an alert dialog', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _page(
          (context) =>
              const ConfirmDialog(title: 'Discard changes?', urgent: true),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(
        _dialogNode(tester).getSemanticsData().role,
        SemanticsRole.alertDialog,
      );
      expect(find.text('Cancel'), findsOneWidget);
      expect(find.text('Confirm'), findsOneWidget);
      semantics.dispose();
    });
  });

  group('status area (ADR 0016, case 1)', () {
    // Not disposed: the test's tree, open dialog included, is torn down
    // after the test.
    late DialogController controller;
    setUp(() => controller = DialogController());

    Widget upload(BuildContext context) => Dialog(
      title: 'Upload',
      controller: controller,
      actions: [Button(onPressed: () {}, child: const Text('Done'))],
      child: const Text('Body text'),
    );

    testWidgets('a notice sits between the body and the footer, announced '
        'once, and focus stays', (tester) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(_page(upload));
      await _openWithKeyboard(tester);
      expect(controller.isOpen, isTrue);
      final id = controller.notify(
        status: NotificationStatus.danger,
        title: 'Upload failed',
        description: 'The connection dropped.',
      );
      expect(id, isNotEmpty);
      await tester.pumpAndSettle();
      final notice = tester.getRect(find.text('Upload failed'));
      expect(
        notice.top,
        greaterThan(tester.getRect(find.text('Body text')).bottom),
      );
      expect(notice.bottom, lessThan(tester.getRect(find.text('Done')).top));
      expect(log, [
        (message: 'Upload failed. The connection dropped.', assertive: false),
      ]);
      expect(_panelFocused, isTrue, reason: 'a notice never takes focus');
      await tester.pumpAndSettle();
      expect(log, hasLength(1));
    });

    testWidgets('the action follows the body in tab order, runs and closes '
        'the notice', (tester) async {
      var retried = 0;
      await tester.pumpWidget(_page(upload));
      await _openWithKeyboard(tester);
      controller.notify(
        title: 'Upload failed',
        action: NotificationAction(label: 'Retry', onPressed: () => retried++),
      );
      await tester.pumpAndSettle();
      final order = <String?>[];
      for (var i = 0; i < 4; i++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        order.add(_focusedText());
      }
      // The header's close button, the notice's buttons, then the footer.
      expect(order.first, 'Close');
      expect(order.last, 'Done');
      expect(order.sublist(1, 3), containsAll(['Retry', 'Close']));
      while (_focusedText() != 'Retry') {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
      }
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(retried, 1);
      expect(controller.notices, isEmpty);
      expect(find.text('Upload failed'), findsNothing);
      expect(
        _panelFocused,
        isTrue,
        reason: 'the notice that held focus hands it to the dialog',
      );
      expect(find.text('Upload'), findsOneWidget, reason: 'still open');
    });

    testWidgets('dismissible and not; by id and all at once', (tester) async {
      await tester.pumpWidget(_page(upload));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      final a = controller.notify(title: 'First');
      controller.notify(title: 'Second', dismissible: false);
      await tester.pumpAndSettle();
      // One for the dialog, one for the first notice.
      expect(_closeButtons, findsNWidgets(2));
      controller.dismissNotice(a);
      await tester.pumpAndSettle();
      expect(find.text('First'), findsNothing);
      expect(find.text('Second'), findsOneWidget);
      controller.clearNotices();
      await tester.pumpAndSettle();
      expect(find.text('Second'), findsNothing);
    });

    testWidgets('the close button of a notice closes it, not the dialog', (
      tester,
    ) async {
      await tester.pumpWidget(_page(upload));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      controller.notify(title: 'Saved a draft');
      await tester.pumpAndSettle();
      await tester.tap(_closeButtons.last);
      await tester.pumpAndSettle();
      expect(find.text('Saved a draft'), findsNothing);
      expect(find.text('Upload'), findsOneWidget);
    });

    testWidgets('shows nothing while closed; closing clears the notices', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(_page(upload));
      expect(controller.notify(title: 'Too early'), '');
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      controller.notify(title: 'Half done');
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(controller.notices, isEmpty);
      expect(controller.isOpen, isFalse);
      expect(controller.notify(title: 'Too late'), '');
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(find.text('Half done'), findsNothing);
      expect(log.map((a) => a.message), ['Half done']);
    });

    testWidgets('a notice removed before its turn is not announced', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(_page(upload));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      final id = controller.notify(title: 'Gone at once');
      controller.dismissNotice(id);
      await tester.pumpAndSettle();
      expect(log, isEmpty);
    });

    testWidgets('Dialog.of reaches the status area from the content', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          (context) => Dialog(
            title: 'Share',
            child: Builder(
              builder: (context) => Button(
                onPressed: () =>
                    Dialog.of(context).notify(title: 'Link copied'),
                child: const Text('Copy link'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Copy link'));
      await tester.pumpAndSettle();
      expect(find.text('Link copied'), findsOneWidget);
    });

    testWidgets('the presets have a status area before their actions', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          (context) => ConfirmDialog(
            title: 'Delete 6 hours?',
            controller: controller,
            confirmLabel: 'Delete',
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      controller.notify(title: 'The server is busy');
      await tester.pumpAndSettle();
      expect(
        tester.getRect(find.text('The server is busy')).bottom,
        lessThan(tester.getRect(find.text('Delete')).top),
      );
    });
  });

  group('dialogs on top (ADR 0016, case 3)', () {
    Widget outer(BuildContext context) => Dialog(
      title: 'Edit week',
      child: Builder(
        builder: (context) => Button(
          onPressed: () => showInvisibleDialog<bool>(
            context: context,
            builder: (context) => const ConfirmDialog(
              title: 'Discard the week?',
              confirmLabel: 'Discard',
              cancelLabel: 'Keep editing',
            ),
          ),
          child: const Text('Discard week'),
        ),
      ),
    );

    testWidgets('the dialog on top takes focus, Escape closes it alone and '
        'focus returns inside the dialog below', (tester) async {
      await tester.pumpWidget(_page(outer));
      await _openWithKeyboard(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(_focusedText(), 'Discard week');
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pumpAndSettle();
      expect(_focusedText(), 'Keep editing');

      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Discard the week?'), findsNothing);
      expect(find.text('Edit week'), findsOneWidget);
      expect(_focusedText(), 'Discard week');

      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Edit week'), findsNothing);
      expect(_focusedText(), 'Open');
    });

    testWidgets('focus falls back when the element that had it is gone', (
      tester,
    ) async {
      final shown = ValueNotifier(true);
      addTearDown(shown.dispose);
      await tester.pumpWidget(
        appHarness(
          (context) => ValueListenableBuilder<bool>(
            valueListenable: shown,
            builder: (context, visible, _) => visible
                ? Button(
                    onPressed: () => showInvisibleDialog<void>(
                      context: context,
                      builder: (_) => const Dialog(title: 'Gone'),
                    ),
                    child: const Text('Open'),
                  )
                : const SizedBox(),
          ),
        ),
      );
      await _openWithKeyboard(tester);
      shown.value = false;
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Gone'), findsNothing);
    });
  });

  testWidgets('the notification region holds toasts while a dialog is open '
      '(ADR 0016, case 2)', (tester) async {
    final notices = NotificationController();
    final modals = ModalObserver();
    addTearDown(notices.dispose);
    addTearDown(modals.dispose);
    await tester.pumpWidget(
      _page(
        _rename,
        observers: [modals],
        wrap: (context, child) => NotificationRegion(
          controller: notices,
          modals: modals,
          child: child!,
        ),
      ),
    );
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    expect(modals.hasModal, isTrue);
    notices.info('Sync finished');
    await tester.pumpAndSettle();
    expect(find.text('Sync finished'), findsNothing);
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(modals.hasModal, isFalse);
    expect(find.text('Sync finished'), findsOneWidget);
  });

  group('layout', () {
    testWidgets('full width less the inset on a narrow screen, at most 30rem '
        'on a wide one', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_page(_rename));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      final panel = tester.getRect(_panel);
      expect(panel.left, moreOrLessEquals(16));
      expect(panel.right, moreOrLessEquals(304));

      tester.view.physicalSize = const Size(1200, 800);
      await tester.pumpAndSettle();
      final wide = tester.getRect(_panel);
      expect(wide.width, moreOrLessEquals(480));
    });

    testWidgets('text scale 2.0 on a narrow screen, right to left: no '
        'overflow, the close button at the inline-end', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        _page(
          (context) => ConfirmDialog(
            title: 'Delete 6 hours from the weekly report?',
            description:
                'The hours logged on Monday are removed from the report.',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep hours',
            confirmVariant: ButtonVariant.danger,
            closeButton: true,
          ),
          direction: TextDirection.rtl,
          textScale: 2,
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      final close = tester.getRect(_closeButtons);
      final title = tester.getRect(
        find.text('Delete 6 hours from the weekly report?'),
      );
      expect(close.right, lessThanOrEqualTo(title.left));
    });

    testWidgets('a short window scrolls the whole panel', (tester) async {
      tester.view.physicalSize = const Size(640, 260);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(_page(_rename, textScale: 2));
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Save'), findsOneWidget);
    });
  });

  group('accessibility guidelines', () {
    Widget everything(BuildContext context) => Dialog(
      title: 'Rename project',
      description: 'The new name shows in every report.',
      footerClose: true,
      actions: [Button(onPressed: () {}, child: const Text('Save'))],
      child: const Text('Body text'),
    );

    for (final dark in [false, true]) {
      testWidgets('labelled targets and text contrast, '
          '${dark ? 'dark' : 'light'}', (tester) async {
        final semantics = tester.ensureSemantics();
        await tester.pumpWidget(
          _page(
            everything,
            theme: dark
                ? InvisibleThemeData.dark()
                : InvisibleThemeData.light(),
          ),
        );
        await tester.tap(find.text('Open'));
        await tester.pumpAndSettle();
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await expectLater(tester, meetsGuideline(_guideline24));
        semantics.dispose();
      });
    }

    testWidgets('targets meet 44 by 44 under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _page(
          everything,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();
      await expectLater(tester, meetsGuideline(_guideline44));
      semantics.dispose();
    });
  });
}

int _confirmed = 0;
