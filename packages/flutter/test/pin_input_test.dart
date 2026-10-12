import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder _cell(int index) => find.byType(EditableText).at(index);

bool _focused(WidgetTester tester, int index) =>
    tester.widget<EditableText>(_cell(index)).focusNode.hasFocus;

String _text(WidgetTester tester, int index) =>
    tester.widget<EditableText>(_cell(index)).controller.text;

Future<void> _focus(WidgetTester tester, int index) async {
  await tester.tap(_cell(index));
  await pumpFocus(tester);
}

void main() {
  testWidgets('typing fills a cell and moves on; refused characters stay '
      'out; completion is reported', (tester) async {
    final changes = <String>[];
    final completed = <String>[];
    await tester.pumpWidget(
      harness(
        PinInput.uncontrolled(
          label: 'Code',
          length: 4,
          onChanged: changes.add,
          onCompleted: completed.add,
        ),
      ),
    );
    await _focus(tester, 0);
    await tester.enterText(_cell(0), '1');
    await pumpFocus(tester);
    expect(_focused(tester, 1), isTrue);
    await tester.enterText(_cell(1), 'a');
    await tester.pump();
    expect(_text(tester, 1), isEmpty);
    expect(_focused(tester, 1), isTrue);
    await tester.enterText(_cell(1), '2');
    await tester.enterText(_cell(2), '3');
    await tester.enterText(_cell(3), '4');
    await tester.pump();
    expect(changes, ['1', '12', '123', '1234']);
    expect(completed, ['1234']);
  });

  testWidgets('a typed character replaces the one in the cell', (tester) async {
    final changes = <String>[];
    await tester.pumpWidget(
      harness(
        PinInput.uncontrolled(
          label: 'Code',
          length: 4,
          initialValue: '12',
          onChanged: changes.add,
        ),
      ),
    );
    await _focus(tester, 0);
    await tester.enterText(_cell(0), '19');
    await tester.pump();
    expect(changes, ['92']);
  });

  testWidgets('Backspace clears the cell, then the previous one, moving '
      'back; arrows, Home and End move; mirrored right to left', (
    tester,
  ) async {
    final changes = <String>[];
    await tester.pumpWidget(
      harness(
        PinInput.uncontrolled(
          label: 'Code',
          length: 4,
          initialValue: '123',
          onChanged: changes.add,
        ),
        direction: TextDirection.rtl,
      ),
    );
    expect(
      tester.getCenter(_cell(1)).dx,
      lessThan(tester.getCenter(_cell(0)).dx),
    );
    await _focus(tester, 3);
    await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
    await pumpFocus(tester);
    expect(changes, ['12']);
    expect(_focused(tester, 2), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
    await pumpFocus(tester);
    expect(changes, ['12', '1'], reason: 'an empty cell clears the previous');
    expect(_focused(tester, 1), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await pumpFocus(tester);
    expect(_focused(tester, 2), isTrue, reason: 'left moves forward in RTL');
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await pumpFocus(tester);
    expect(_focused(tester, 0), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await pumpFocus(tester);
    expect(_focused(tester, 3), isTrue);
  });

  testWidgets('a pasted or autofilled code spreads over the cells from the '
      'focused one', (tester) async {
    final changes = <String>[];
    await tester.pumpWidget(
      harness(
        PinInput.uncontrolled(label: 'Code', length: 4, onChanged: changes.add),
      ),
    );
    await _focus(tester, 0);
    await tester.enterText(_cell(0), '9-8 7');
    await pumpFocus(tester);
    expect(changes, ['987']);
    expect(_focused(tester, 3), isTrue);

    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async => call.method == 'Clipboard.getData'
          ? <String, dynamic>{'text': '4321'}
          : null,
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );
    await _focus(tester, 1);
    Actions.invoke(
      tester.element(_cell(1)),
      const PasteTextIntent(SelectionChangedCause.keyboard),
    );
    await pumpFocus(tester);
    expect(changes.last, '9432');
    expect(_focused(tester, 3), isTrue);
  });

  testWidgets('semantics: a named group of named text cells; the first '
      'carries the one-time code hint; obscured hides the characters', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const PinInput.uncontrolled(
          label: 'Verification code',
          length: 4,
          initialValue: '12',
          obscureText: true,
          invalid: true,
        ),
      ),
    );
    expect(find.bySemanticsLabel('Verification code'), findsOneWidget);
    expect(
      tester.getSemantics(_cell(0)),
      semanticsWith(
        label: 'Character 1 of 4',
        isTextField: true,
        isObscured: true,
        validationResult: SemanticsValidationResult.invalid,
      ),
    );
    expect(tester.widget<EditableText>(_cell(0)).autofillHints, [
      AutofillHints.oneTimeCode,
    ]);
    expect(tester.widget<EditableText>(_cell(1)).autofillHints, isNull);
    expect(tester.widget<EditableText>(_cell(0)).obscureText, isTrue);
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });

  testWidgets('controlled: a changed value is shown, never reported', (
    tester,
  ) async {
    final changes = <String>[];
    Widget build(String value) => harness(
      PinInput(label: 'Code', length: 4, value: value, onChanged: changes.add),
    );
    await tester.pumpWidget(build(''));
    await tester.pumpWidget(build('56'));
    expect(_text(tester, 0), '5');
    expect(_text(tester, 1), '6');
    expect(changes, isEmpty);
  });

  testWidgets('disabled: no focus and no input', (tester) async {
    await tester.pumpWidget(
      harness(const PinInput.uncontrolled(label: 'Code', enabled: false)),
    );
    await tester.tap(_cell(0));
    await pumpFocus(tester);
    expect(_focused(tester, 0), isFalse);
    expect(tester.widget<EditableText>(_cell(0)).readOnly, isTrue);
  });

  testWidgets('a narrow column at text scale 2.0 wraps the cells', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(width: 240, child: PinInput.uncontrolled(label: 'Code')),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(_cell(5)).dy,
      greaterThan(tester.getTopLeft(_cell(0)).dy),
    );
  });

  testWidgets('a form reset restores the default without a report', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final changes = <String>[];
    String? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: PinInput.uncontrolled(
            label: 'Code',
            length: 4,
            initialValue: '11',
            onChanged: changes.add,
            onSaved: (v) => saved = v,
          ),
        ),
      ),
    );
    await _focus(tester, 2);
    await tester.enterText(_cell(2), '3');
    await tester.pump();
    form.currentState!.save();
    expect(saved, '113');
    form.currentState!.reset();
    await tester.pump();
    expect(_text(tester, 2), isEmpty);
    expect(_text(tester, 0), '1');
    expect(changes, ['113']);
  });
}
