import 'package:flutter/gestures.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

final Finder _editable = find.byType(EditableText);

String _shown(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).controller.text;

/// A parent that holds the text, as a controlled consumer does.
class _Controlled extends StatefulWidget {
  const _Controlled({super.key, required this.reports, this.initial = ''});

  final List<String> reports;
  final String initial;

  @override
  State<_Controlled> createState() => _ControlledState();
}

class _ControlledState extends State<_Controlled> {
  late String text = widget.initial;

  void replace(String next) => setState(() => text = next);

  @override
  Widget build(BuildContext context) => TextField(
    label: 'Name',
    value: text,
    onChanged: (next) {
      widget.reports.add(next);
      setState(() => text = next);
    },
  );
}

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  group('value', () {
    testWidgets('typing reports each edit once, after the text moved', (
      tester,
    ) async {
      final reports = <String>[];
      final seen = <String>[];
      await tester.pumpWidget(
        harness(
          TextField.uncontrolled(
            label: 'Name',
            onChanged: (next) {
              reports.add(next);
              seen.add(_shown(tester));
            },
          ),
        ),
      );
      await tester.enterText(_editable, 'Ada');
      await tester.pump();
      expect(reports, ['Ada']);
      expect(seen, ['Ada'], reason: 'the text moved before the report');
      expect(_shown(tester), 'Ada');
    });

    testWidgets('uncontrolled starts from initialValue', (tester) async {
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(label: 'Name', initialValue: 'Bo'),
        ),
      );
      expect(_shown(tester), 'Bo');
    });

    testWidgets('a changed value is shown and never reported', (tester) async {
      final reports = <String>[];
      final key = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(_Controlled(key: key, reports: reports, initial: 'a')),
      );
      key.currentState!.replace('from the parent');
      await tester.pump();
      expect(_shown(tester), 'from the parent');
      expect(reports, isEmpty);
    });

    testWidgets('a controlled parent that gives the text back does not churn', (
      tester,
    ) async {
      final reports = <String>[];
      await tester.pumpWidget(harness(_Controlled(reports: reports)));
      await tester.enterText(_editable, 'x');
      await tester.pump();
      await tester.enterText(_editable, 'xy');
      await tester.pump();
      expect(reports, ['x', 'xy']);
      expect(_shown(tester), 'xy');
    });

    testWidgets('the callback is read at the edit', (tester) async {
      final calls = <String>[];
      Widget build(String name) => harness(
        TextField.uncontrolled(
          label: 'Name',
          onChanged: (_) => calls.add(name),
        ),
      );
      await tester.pumpWidget(build('first'));
      await tester.pumpWidget(build('second'));
      await tester.enterText(_editable, 'a');
      expect(calls, ['second']);
    });

    testWidgets(
      'maxLength stops typing; a longer value from the parent stays',
      (tester) async {
        await tester.pumpWidget(
          harness(
            TextField.uncontrolled(
              label: 'Code',
              maxLength: 3,
              onChanged: (_) {},
            ),
          ),
        );
        await tester.enterText(_editable, 'abcdef');
        await tester.pump();
        expect(_shown(tester), 'abc');

        await tester.pumpWidget(
          harness(
            TextField(
              label: 'Code',
              maxLength: 3,
              value: 'abcdef',
              onChanged: (_) {},
            ),
          ),
        );
        expect(_shown(tester), 'abcdef', reason: 'consumer data is never cut');
      },
    );

    testWidgets('Enter keeps focus and calls onSubmitted', (tester) async {
      final submitted = <String>[];
      await tester.pumpWidget(
        harness(
          TextField.uncontrolled(
            label: 'Name',
            initialValue: 'Ada',
            onSubmitted: submitted.add,
          ),
        ),
      );
      await focusEditable(tester, find.byType(TextField));
      await tester.testTextInput.receiveAction(TextInputAction.done);
      await tester.pump();
      expect(submitted, ['Ada']);
      expect(tester.widget<EditableText>(_editable).focusNode.hasFocus, isTrue);
    });
  });

  group('states', () {
    testWidgets('disabled: no focus, no edits, reported disabled, dim label', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(
            label: 'Name',
            initialValue: 'Ada',
            enabled: false,
          ),
        ),
      );
      final node = tester.widget<EditableText>(_editable).focusNode;
      node.requestFocus();
      await tester.pump();
      expect(node.hasFocus, isFalse);
      await tester.tap(_editable, warnIfMissed: false);
      await tester.pump();
      expect(node.hasFocus, isFalse);
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(label: 'Name', hasEnabledState: true, isEnabled: false),
      );
      final label = tester.widget<Text>(find.text('Name'));
      expect(label.style?.color, InvisibleColors.light.textDisabled);
      semantics.dispose();
    });

    testWidgets('read-only: focus and no edits, reported read-only', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final reports = <String>[];
      await tester.pumpWidget(
        harness(
          TextField.uncontrolled(
            label: 'Name',
            initialValue: 'Ada',
            readOnly: true,
            onChanged: reports.add,
          ),
        ),
      );
      await focusEditable(tester, find.byType(TextField));
      expect(tester.widget<EditableText>(_editable).focusNode.hasFocus, isTrue);
      expect(tester.widget<EditableText>(_editable).readOnly, isTrue);
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(label: 'Name', isTextField: true, isReadOnly: true),
      );
      expect(reports, isEmpty);
      semantics.dispose();
    });

    testWidgets('a tap on the label focuses the field', (tester) async {
      await tester.pumpWidget(
        harness(const TextField.uncontrolled(label: 'Name')),
      );
      await tester.tap(find.text('Name'));
      await tester.pump();
      expect(tester.widget<EditableText>(_editable).focusNode.hasFocus, isTrue);
    });

    testWidgets('a placeholder shows while empty', (tester) async {
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(
            label: 'Name',
            placeholder: 'Ada Lovelace',
          ),
        ),
      );
      expect(find.text('Ada Lovelace'), findsOneWidget);
      await tester.enterText(_editable, 'x');
      await tester.pump();
      expect(find.text('Ada Lovelace'), findsNothing);
    });
  });

  group('semantics', () {
    testWidgets('label, description and error are on the text field node', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(
            label: 'Email',
            description: 'We never share it.',
            error: 'Enter a valid address.',
            required: true,
            maxLength: 40,
            initialValue: 'ada@',
          ),
        ),
      );
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(
          label: 'Email',
          value: 'ada@',
          hint: 'We never share it.\nEnter a valid address.',
          isTextField: true,
          isRequired: true,
          validationResult: SemanticsValidationResult.invalid,
          maxValueLength: 40,
          currentValueLength: 4,
        ),
      );
      semantics.dispose();
    });

    testWidgets('the error is a live region with a glyph, not colour alone', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(label: 'Email', error: 'Required.'),
        ),
      );
      expect(
        tester.getSemantics(find.text('Required.')),
        semanticsWith(label: 'Required.', isLiveRegion: true),
      );
      expect(find.byType(HazardGlyph), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('a valid field reports no validation result', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const TextField.uncontrolled(label: 'Email')),
      );
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(label: 'Email', isTextField: true),
      );
      expect(find.byType(HazardGlyph), findsNothing);
      semantics.dispose();
    });

    testWidgets('a hidden label still names the field', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(const TextField.uncontrolled(label: 'Search', hideLabel: true)),
      );
      expect(find.text('Search'), findsNothing);
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(label: 'Search', isTextField: true),
      );
      semantics.dispose();
    });

    testWidgets('an obscured field reports it', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(
            label: 'Password',
            obscureText: true,
            initialValue: 'secret',
          ),
        ),
      );
      expect(
        editableSemantics(tester, find.byType(TextField)),
        semanticsWith(label: 'Password', isObscured: true),
      );
      semantics.dispose();
    });

    testWidgets('meets the labeled tap target and text contrast guidelines', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(
            label: 'Name',
            description: 'As on your badge.',
            initialValue: 'Ada',
          ),
        ),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });

  group('focus ring', () {
    testWidgets('shows whenever the field has focus, in any mode', (
      tester,
    ) async {
      FocusManager.instance.highlightStrategy =
          FocusHighlightStrategy.alwaysTouch;
      await tester.pumpWidget(
        harness(const TextField.uncontrolled(label: 'Name')),
      );
      FocusRingPainter ring() =>
          tester.widget<FocusRingPainter>(find.byType(FocusRingPainter));
      expect(ring().visible, isFalse);
      await focusEditable(tester, find.byType(TextField));
      expect(ring().visible, isTrue);
      expect(ring().ring.color, InvisibleColors.light.focusRing);
    });

    testWidgets('an invalid field shows a danger ring at rest', (tester) async {
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(label: 'Name', error: 'Required.'),
        ),
      );
      final ring = tester.widget<FocusRingPainter>(
        find.byType(FocusRingPainter),
      );
      expect(ring.visible, isTrue);
      expect(ring.ring.color, InvisibleColors.light.danger);
    });

    testWidgets('dark uses style.focus.onDark', (tester) async {
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(label: 'Name'),
          theme: InvisibleThemeData.dark(),
        ),
      );
      await focusEditable(tester, find.byType(TextField));
      expect(
        tester
            .widget<FocusRingPainter>(find.byType(FocusRingPainter))
            .ring
            .color,
        InvisibleStyleColors.focusOnDark,
      );
    });
  });

  group('keyboard', () {
    testWidgets('Tab moves into the field and skips a disabled one', (
      tester,
    ) async {
      final before = FocusNode();
      final after = FocusNode();
      addTearDown(before.dispose);
      addTearDown(after.dispose);
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) => harness(
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Button(
                  onPressed: () {},
                  focusNode: before,
                  child: const Text('Before'),
                ),
                const TextField.uncontrolled(label: 'Off', enabled: false),
                TextField.uncontrolled(label: 'On', focusNode: after),
              ],
            ),
          ),
        ),
      );
      before.requestFocus();
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(after.hasFocus, isTrue);
    });
  });

  group('form', () {
    testWidgets('a reset restores the current default without a report', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <String>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: TextField.uncontrolled(
              label: 'Name',
              initialValue: 'Ada',
              onChanged: reports.add,
            ),
          ),
        ),
      );
      await tester.enterText(_editable, 'Grace');
      await tester.pump();
      expect(reports, ['Grace']);
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), 'Ada');
      expect(reports, ['Grace'], reason: 'a reset reports nothing');
    });

    testWidgets('a controlled reset restores the last value the parent set, '
        'not a given-back edit', (tester) async {
      final form = GlobalKey<FormState>();
      final reports = <String>[];
      final parent = GlobalKey<_ControlledState>();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _Controlled(key: parent, reports: reports, initial: 'one'),
          ),
        ),
      );
      parent.currentState!.replace('two');
      await tester.pump();
      await tester.enterText(_editable, 'typed');
      await tester.pump();
      expect(reports, ['typed']);
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), 'two');
      expect(reports, ['typed']);
    });

    testWidgets('the validator shows its message and saves the text', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      String? saved;
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: TextField.uncontrolled(
              label: 'Name',
              validator: (text) => text!.isEmpty ? 'Enter a name.' : null,
              onSaved: (text) => saved = text,
            ),
          ),
        ),
      );
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Enter a name.'), findsOneWidget);
      await tester.enterText(_editable, 'Ada');
      await tester.pump();
      expect(form.currentState!.validate(), isTrue);
      await tester.pump();
      expect(find.text('Enter a name.'), findsNothing);
      form.currentState!.save();
      expect(saved, 'Ada');
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), '');
    });
  });

  group('layout', () {
    testWidgets('right to left aligns the label and text to the right', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 300,
            child: TextField.uncontrolled(label: 'الاسم', initialValue: 'نص'),
          ),
          direction: TextDirection.rtl,
        ),
      );
      final field = tester.getRect(find.byType(TextField));
      final label = tester.getRect(find.text('الاسم'));
      expect(label.right, moreOrLessEquals(field.right, epsilon: 1));
      expect(tester.takeException(), isNull);
    });

    testWidgets('text scale 2.0 at a narrow width does not overflow', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 320,
            child: TextField.uncontrolled(
              label: 'A long label that has to wrap at this width',
              description: 'A description that wraps as well, line after line.',
              error: 'An error message that wraps too.',
              initialValue: 'Ada',
            ),
          ),
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(tester.getSize(find.byType(TextField)).width, 320);
    });

    testWidgets('an open width falls back to the web default', (tester) async {
      await tester.pumpWidget(
        harness(
          const Row(
            mainAxisSize: MainAxisSize.min,
            children: [TextField.uncontrolled(label: 'Name')],
          ),
        ),
      );
      expect(tester.getSize(find.byType(TextField)).width, 288);
    });

    testWidgets('the box keeps the minimum target height under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const TextField.uncontrolled(label: 'Name'),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
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

    testWidgets('a mouse over the field shows the text cursor', (tester) async {
      await tester.pumpWidget(
        harness(const TextField.uncontrolled(label: 'Name')),
      );
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(_editable));
      await tester.pump();
      expect(
        RendererBinding.instance.mouseTracker.debugDeviceActiveCursor(1),
        SystemMouseCursors.text,
      );
    });
  });

  group('Textarea', () {
    testWidgets('multi-line: grows from minLines to maxLines', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 300,
            child: Textarea.uncontrolled(label: 'Notes', maxLines: 6),
          ),
        ),
      );
      final editable = tester.widget<EditableText>(_editable);
      expect(editable.minLines, 3);
      expect(editable.maxLines, 6);
      expect(editable.keyboardType, TextInputType.multiline);
      final empty = tester.getSize(_editable).height;
      await tester.enterText(_editable, List.filled(12, 'line').join('\n'));
      await tester.pump();
      final full = tester.getSize(_editable).height;
      expect(full, moreOrLessEquals(empty * 2, epsilon: 1));
      expect(
        editableSemantics(tester, find.byType(Textarea)),
        semanticsWith(label: 'Notes', isTextField: true, isMultiline: true),
      );
      semantics.dispose();
    });

    testWidgets('controlled, reset and reports like a text field', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final reports = <String>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: Textarea(
              label: 'Notes',
              value: 'first',
              onChanged: reports.add,
            ),
          ),
        ),
      );
      await tester.enterText(_editable, 'first\nsecond');
      await tester.pump();
      expect(reports, ['first\nsecond']);
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), 'first');
      expect(reports, hasLength(1));
    });

    test('maxLines below minLines is refused', () {
      expect(
        () => Textarea(label: 'Notes', value: '', minLines: 3, maxLines: 2),
        throwsAssertionError,
      );
    });
  });
}
