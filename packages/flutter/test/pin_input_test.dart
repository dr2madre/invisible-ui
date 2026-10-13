import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

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
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(_focused(tester, 1), isTrue, reason: 'right moves back in RTL');
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

  void mockClipboard(WidgetTester tester, String text) {
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async => call.method == 'Clipboard.getData'
          ? <String, dynamic>{'text': text}
          : null,
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );
  }

  group('Arabic-Indic and Persian digits', () {
    for (final direction in TextDirection.values) {
      testWidgets('typed, they land in the cells as ASCII and report ASCII, '
          '${direction.name}', (tester) async {
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
            direction: direction,
          ),
        );
        await _focus(tester, 0);
        await tester.enterText(_cell(0), '١');
        await pumpFocus(tester);
        expect(_text(tester, 0), '1');
        expect(_focused(tester, 1), isTrue);
        await tester.enterText(_cell(1), '۲');
        await tester.enterText(_cell(2), '٣');
        await tester.enterText(_cell(3), '۴');
        await tester.pump();
        expect(changes, ['1', '12', '123', '1234']);
        expect(completed, ['1234']);
        expect(
          [for (var i = 0; i < 4; i++) _text(tester, i)],
          ['1', '2', '3', '4'],
        );
      });
    }

    testWidgets('a typed digit replaces the one in the cell', (tester) async {
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
      await tester.enterText(_cell(0), '1٩');
      await tester.pump();
      expect(changes, ['92']);
    });

    testWidgets('pasted with the paste shortcut or filled in by the '
        'platform, they spread as ASCII', (tester) async {
      final changes = <String>[];
      await tester.pumpWidget(
        harness(
          PinInput.uncontrolled(
            label: 'Code',
            length: 4,
            onChanged: changes.add,
          ),
          direction: TextDirection.rtl,
        ),
      );
      await _focus(tester, 0);
      await tester.enterText(_cell(0), '۹۸');
      await pumpFocus(tester);
      expect(changes, ['98']);
      expect(_focused(tester, 2), isTrue);

      mockClipboard(tester, '٤-٣');
      Actions.invoke(
        tester.element(_cell(2)),
        const PasteTextIntent(SelectionChangedCause.keyboard),
      );
      await pumpFocus(tester);
      expect(changes.last, '9843');
      expect(_text(tester, 3), '3');
    });

    testWidgets('alphanumeric cells take them as ASCII too', (tester) async {
      final changes = <String>[];
      await tester.pumpWidget(
        harness(
          PinInput.uncontrolled(
            label: 'Code',
            length: 3,
            type: PinInputType.alphanumeric,
            onChanged: changes.add,
          ),
        ),
      );
      await _focus(tester, 0);
      await tester.enterText(_cell(0), 'a٧B');
      await tester.pump();
      expect(changes, ['a7B']);
    });
  });

  group('error', () {
    testWidgets('a validator message shows with the hazard glyph, marks the '
        'group and every cell invalid and is announced; a form reset clears '
        'it and restores the default without a report', (tester) async {
      final semantics = tester.ensureSemantics();
      final form = GlobalKey<FormState>();
      final changes = <String>[];
      const message = 'Enter the whole code';
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: PinInput.uncontrolled(
              label: 'Code',
              length: 4,
              initialValue: '12',
              onChanged: changes.add,
              validator: (v) => v!.length < 4 ? message : null,
            ),
          ),
        ),
      );
      await _focus(tester, 2);
      await tester.enterText(_cell(2), '3');
      await tester.pump();
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.byType(HazardGlyph), findsOneWidget);
      expect(
        tester.getSemantics(find.bySemanticsLabel('Code')),
        semanticsWith(
          label: 'Code',
          hint: message,
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      for (var i = 0; i < 4; i++) {
        expect(
          tester.getSemantics(_cell(i)),
          semanticsWith(
            label: 'Character ${i + 1} of 4',
            validationResult: SemanticsValidationResult.invalid,
          ),
        );
      }
      expect(
        tester.getSemantics(find.bySemanticsLabel(message)),
        semanticsWith(label: message, isLiveRegion: true),
      );

      form.currentState!.reset();
      await tester.pump();
      expect(find.byType(HazardGlyph), findsNothing);
      expect(
        tester.getSemantics(_cell(0)),
        semanticsWith(label: 'Character 1 of 4'),
      );
      expect(_text(tester, 2), isEmpty);
      expect(changes, ['123'], reason: 'the reset reports nothing');
      semantics.dispose();
    });

    for (final direction in TextDirection.values) {
      testWidgets('an error at text scale 2.0 in a narrow column, '
          '${direction.name}: the cells wrap and keep 44 targets', (
        tester,
      ) async {
        final semantics = tester.ensureSemantics();
        await tester.pumpWidget(
          harness(
            const SizedBox(
              width: 300,
              child: PinInput.uncontrolled(
                label: 'Code',
                error: 'This code has expired. Ask for a new one.',
              ),
            ),
            direction: direction,
            textScale: 2,
          ),
        );
        expect(tester.takeException(), isNull);
        expect(find.byType(HazardGlyph), findsOneWidget);
        expect(
          tester.getTopLeft(find.byType(HazardGlyph)).dy,
          greaterThan(tester.getBottomLeft(_cell(5)).dy),
        );
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(targetGuideline44));
        semantics.dispose();
      });
    }
  });
}
