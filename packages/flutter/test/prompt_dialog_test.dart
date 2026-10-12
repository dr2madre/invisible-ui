import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Future<String?>? _result;

final GlobalKey<NavigatorState> _navigator = GlobalKey<NavigatorState>();

Widget _page(
  WidgetBuilder dialog, {
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
}) => WidgetsApp(
  navigatorKey: _navigator,
  color: const Color(0xFF000000),
  pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (context, _, _) => builder(context),
  ),
  builder: (context, child) => MediaQuery(
    data: MediaQuery.of(
      context,
    ).copyWith(textScaler: TextScaler.linear(textScale)),
    child: Directionality(
      textDirection: direction,
      child: InvisibleTheme(
        data: theme ?? InvisibleThemeData.light(),
        child: child!,
      ),
    ),
  ),
  home: Builder(
    builder: (context) => Center(
      child: Button(
        onPressed: () => _result = showInvisibleDialog<String>(
          context: context,
          builder: dialog,
        ),
        child: const Text('Open'),
      ),
    ),
  ),
);

Future<void> _open(WidgetTester tester) async {
  await tester.tap(find.text('Open'));
  await tester.pumpAndSettle();
}

final Finder _editable = find.byType(EditableText);

bool _fieldFocused(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).focusNode.hasPrimaryFocus;

SemanticsNode _dialogNode(WidgetTester tester) => tester.getSemantics(
  find
      .byWidgetPredicate(
        (widget) => widget is Semantics && widget.properties.namesRoute == true,
      )
      .last,
);

Button _button(WidgetTester tester, String text) => tester.widget<Button>(
  find.ancestor(of: find.text(text), matching: find.byType(Button)),
);

PromptDialog _delete({ValueChanged<String>? onConfirm}) => PromptDialog(
  title: 'Delete file',
  description: 'The file report-q3.pdf will be permanently deleted.',
  label: 'Type the file name to confirm',
  placeholder: 'report-q3.pdf',
  confirmValue: 'report-q3.pdf',
  confirmLabel: 'Delete file',
  cancelLabel: 'Keep file',
  confirmVariant: ButtonVariant.danger,
  urgent: true,
  onConfirm: onConfirm,
);

void main() {
  tearDown(() => _result = null);

  testWidgets('opens with focus in the field, named and described; urgent '
      'makes it an alert dialog', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(_page((_) => _delete()));
    await _open(tester);
    expect(_fieldFocused(tester), isTrue);
    final node = _dialogNode(tester);
    expect(
      node,
      semanticsWith(
        label: 'Delete file',
        hint: 'The file report-q3.pdf will be permanently deleted.',
        namesRoute: true,
      ),
    );
    expect(node.getSemanticsData().role, SemanticsRole.alertDialog);
    expect(
      editableSemantics(tester, find.byType(PromptDialog)),
      semanticsWith(
        label: 'Type the file name to confirm',
        hint: 'report-q3.pdf',
        isTextField: true,
      ),
    );
    // Disabled controls are exempt from the contrast minimum, so the gate is
    // opened first.
    await tester.enterText(_editable, 'report-q3.pdf');
    await tester.pump();
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('without urgent it is a dialog; the value is optional and the '
      'buttons come from the catalog', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _page((_) => const PromptDialog(title: 'Rename', label: 'Name')),
    );
    await _open(tester);
    expect(_dialogNode(tester).getSemanticsData().role, SemanticsRole.dialog);
    expect(_button(tester, 'Confirm').onPressed, isNotNull);
    expect(find.text('Cancel'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('required keeps confirm disabled while blank or spaces', (
    tester,
  ) async {
    await tester.pumpWidget(
      _page(
        (_) =>
            const PromptDialog(title: 'Rename', label: 'Name', required: true),
      ),
    );
    await _open(tester);
    expect(_button(tester, 'Confirm').onPressed, isNull);
    await tester.enterText(_editable, '   ');
    await tester.pump();
    expect(_button(tester, 'Confirm').onPressed, isNull);
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    expect(find.byType(PromptDialog), findsOneWidget, reason: 'Enter waits');
    await tester.enterText(_editable, 'Atlas');
    await tester.pump();
    expect(_button(tester, 'Confirm').onPressed, isNotNull);
  });

  testWidgets('the type-to-confirm gate opens on an exact match only', (
    tester,
  ) async {
    await tester.pumpWidget(_page((_) => _delete()));
    await _open(tester);
    for (final text in ['report', 'REPORT-Q3.PDF', 'report-q3.pdf ']) {
      await tester.enterText(_editable, text);
      await tester.pump();
      expect(_button(tester, 'Delete file').onPressed, isNull, reason: text);
    }
    await tester.enterText(_editable, 'report-q3.pdf');
    await tester.pump();
    expect(_button(tester, 'Delete file').onPressed, isNotNull);
  });

  testWidgets('Enter confirms: the dialog closes first, then reports the '
      'text, and focus returns to the trigger', (tester) async {
    final seen = <(String, bool)>[];
    await tester.pumpWidget(
      _page(
        (_) => _delete(
          onConfirm: (value) =>
              seen.add((value, _navigator.currentState!.canPop())),
        ),
      ),
    );
    // From the keyboard, so the trigger holds focus when the dialog opens.
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pumpAndSettle();
    await tester.enterText(_editable, 'report-q3.pdf');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(seen, [('report-q3.pdf', false)]);
    expect(await _result, 'report-q3.pdf');
    expect(find.byType(PromptDialog), findsNothing);
    expect(Focus.of(tester.element(find.text('Open'))).hasPrimaryFocus, isTrue);
  });

  testWidgets('Enter that ends an input method composition does not '
      'confirm', (tester) async {
    final seen = <String>[];
    await tester.pumpWidget(
      _page(
        (_) =>
            PromptDialog(title: 'Rename', label: 'Name', onConfirm: seen.add),
      ),
    );
    await _open(tester);
    tester.testTextInput.updateEditingValue(
      const TextEditingValue(
        text: 'とうきょう',
        selection: TextSelection.collapsed(offset: 5),
        composing: TextRange(start: 0, end: 5),
      ),
    );
    await tester.pump();
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(seen, isEmpty);
    expect(find.byType(PromptDialog), findsOneWidget);
    tester.testTextInput.updateEditingValue(
      const TextEditingValue(
        text: '東京',
        selection: TextSelection.collapsed(offset: 2),
      ),
    );
    await tester.pump();
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
    expect(seen, ['東京']);
  });

  testWidgets('Cancel and Escape close without confirming', (tester) async {
    final seen = <String>[];
    await tester.pumpWidget(
      _page(
        (_) =>
            PromptDialog(title: 'Rename', label: 'Name', onConfirm: seen.add),
      ),
    );
    await _open(tester);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(await _result, isNull);
    await _open(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    expect(find.byType(PromptDialog), findsNothing);
    expect(await _result, isNull);
    expect(seen, isEmpty);
  });

  testWidgets('the field starts from initialValue on every opening', (
    tester,
  ) async {
    await tester.pumpWidget(
      _page(
        (_) => const PromptDialog(
          title: 'Rename',
          label: 'Name',
          initialValue: 'Atlas',
        ),
      ),
    );
    await _open(tester);
    expect(tester.widget<EditableText>(_editable).controller.text, 'Atlas');
    await tester.enterText(_editable, 'Beacon');
    await tester.sendKeyEvent(LogicalKeyboardKey.escape);
    await tester.pumpAndSettle();
    await _open(tester);
    expect(tester.widget<EditableText>(_editable).controller.text, 'Atlas');
  });

  testWidgets('a notice shows in the status area before the actions', (
    tester,
  ) async {
    final controller = DialogController();
    await tester.pumpWidget(
      _page(
        (_) => PromptDialog(
          title: 'Rename',
          label: 'Name',
          controller: controller,
        ),
      ),
    );
    await _open(tester);
    controller.notify(
      title: 'The name is taken',
      status: NotificationStatus.danger,
    );
    await tester.pump();
    expect(
      tester.getTopLeft(find.text('The name is taken')).dy,
      lessThan(tester.getTopLeft(find.text('Confirm')).dy),
    );
    expect(_fieldFocused(tester), isTrue, reason: 'a notice takes no focus');
  });

  testWidgets('right to left at text scale 2.0 on a narrow screen: no '
      'overflow; labelled 44 by 44 targets under touch', (tester) async {
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _page(
        (_) => _delete(),
        direction: TextDirection.rtl,
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await _open(tester);
    expect(tester.takeException(), isNull);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
