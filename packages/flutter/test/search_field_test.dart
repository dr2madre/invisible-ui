import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

final Finder _editable = find.byType(EditableText);

String _shown(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).controller.text;

Finder _button(String label) => find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.button == true &&
      widget.properties.label == label,
);

/// The focus node of the button named [label].
FocusNode _buttonFocus(WidgetTester tester, String label) => Focus.of(
  tester.element(
    find
        .descendant(of: _button(label), matching: find.byType(GestureDetector))
        .first,
  ),
);

bool _fieldFocused(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).focusNode.hasPrimaryFocus;

class _Log {
  final List<String> changes = [];
  final List<String> submits = [];
}

Widget _field(
  _Log log, {
  String initialValue = '',
  bool submitButton = true,
  bool enabled = true,
  bool readOnly = false,
}) => SizedBox(
  width: 320,
  child: SearchField.uncontrolled(
    label: 'Search projects',
    initialValue: initialValue,
    placeholder: 'Name or client',
    submitButton: submitButton,
    enabled: enabled,
    readOnly: readOnly,
    onChanged: log.changes.add,
    onSubmitted: log.submits.add,
  ),
);

void main() {
  group('semantics and order', () {
    testWidgets('the field is named by its label; the buttons have names; '
        'the clear button shows only with text', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_field(_Log())));
      expect(
        editableSemantics(tester, find.byType(SearchField)),
        semanticsWith(
          label: 'Search projects',
          hint: 'Name or client',
          isTextField: true,
        ),
      );
      expect(_button('Search'), findsOneWidget);
      expect(_button('Clear search'), findsNothing);
      await tester.enterText(_editable, 'atlas');
      await tester.pump();
      expect(_button('Clear search'), findsOneWidget);
      semantics.dispose();
    });

    testWidgets('Tab goes from the field to the clear button, then to submit', (
      tester,
    ) async {
      // The app's Tab shortcut moves focus.
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) =>
              harness(_field(_Log(), initialValue: 'atlas')),
        ),
      );
      await focusEditable(tester, find.byType(SearchField));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      expect(_buttonFocus(tester, 'Clear search').hasPrimaryFocus, isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      expect(_buttonFocus(tester, 'Search').hasPrimaryFocus, isTrue);
    });

    testWidgets('the labels come from the catalog and can be replaced', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          const SearchField.uncontrolled(
            label: 'Cerca',
            initialValue: 'x',
            clearLabel: 'Cancella',
            submitLabel: 'Cerca ora',
          ),
        ),
      );
      expect(_button('Cancella'), findsOneWidget);
      expect(_button('Cerca ora'), findsOneWidget);
    });
  });

  group('clear', () {
    testWidgets('a press empties the field, reports once and puts focus back '
        'in the field', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_field(log, initialValue: 'atlas')));
      await focusEditable(tester, find.byType(SearchField));
      // A pointer press elsewhere first, as a tap on a touch screen can
      // take focus out of the text.
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();
      await tester.tap(_button('Clear search'));
      await pumpFocus(tester);
      expect(_shown(tester), '');
      expect(log.changes, ['']);
      expect(_fieldFocused(tester), isTrue);
      expect(_button('Clear search'), findsNothing);
    });

    testWidgets('Enter on the focused clear button clears and focuses the '
        'field', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_field(log, initialValue: 'atlas')));
      _buttonFocus(tester, 'Clear search').requestFocus();
      await pumpFocus(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await pumpFocus(tester);
      expect(log.changes, ['']);
      expect(log.submits, isEmpty);
      expect(_fieldFocused(tester), isTrue);
    });

    testWidgets('disabled and read-only fields have no clear button', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(_field(_Log(), initialValue: 'atlas', readOnly: true)),
      );
      expect(_button('Clear search'), findsNothing);
      await tester.pumpWidget(
        harness(_field(_Log(), initialValue: 'atlas', enabled: false)),
      );
      expect(_button('Clear search'), findsNothing);
      expect(_button('Search'), findsNothing, reason: 'disabled with it');
    });
  });

  group('submit', () {
    testWidgets('Enter and the submit button report the text', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_field(log)));
      await focusEditable(tester, find.byType(SearchField));
      await tester.enterText(_editable, 'atlas');
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pump();
      expect(log.submits, ['atlas']);
      expect(_fieldFocused(tester), isTrue, reason: 'Enter keeps focus');
      await tester.tap(_button('Search'));
      await tester.pump();
      expect(log.submits, ['atlas', 'atlas']);
    });

    testWidgets('Enter that ends an input method composition does not '
        'submit', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_field(log)));
      await focusEditable(tester, find.byType(SearchField));
      tester.testTextInput.updateEditingValue(
        const TextEditingValue(
          text: 'にほん',
          selection: TextSelection.collapsed(offset: 3),
          composing: TextRange(start: 0, end: 3),
        ),
      );
      await tester.pump();
      await tester.testTextInput.receiveAction(TextInputAction.search);
      await tester.pump();
      expect(log.submits, isEmpty);
    });

    testWidgets('without a submit button: a leading glyph, the clear button '
        'stays', (tester) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_field(log, initialValue: 'atlas', submitButton: false)),
      );
      expect(_button('Search'), findsNothing);
      expect(_button('Clear search'), findsOneWidget);
      final glyph = tester.getRect(
        find
            .descendant(
              of: find.byType(SearchField),
              matching: find.byType(CustomPaint),
            )
            .first,
      );
      expect(glyph.left, lessThan(tester.getRect(_editable).left));
    });
  });

  group('state', () {
    testWidgets('a changed value is shown and never reported; a given-back '
        'value does not churn', (tester) async {
      final reports = <String>[];
      Widget build(String value) => harness(
        SearchField(label: 'Search', value: value, onChanged: reports.add),
      );
      await tester.pumpWidget(build('one'));
      await tester.pumpWidget(build('two'));
      expect(_shown(tester), 'two');
      await tester.enterText(_editable, 'typed');
      await tester.pump();
      await tester.pumpWidget(build('typed'));
      expect(_shown(tester), 'typed');
      expect(reports, ['typed']);
    });

    testWidgets('a form reset restores the default without a report', (
      tester,
    ) async {
      final form = GlobalKey<FormState>();
      final log = _Log();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _field(log, initialValue: 'atlas'),
          ),
        ),
      );
      await tester.enterText(_editable, 'beacon');
      await tester.pump();
      form.currentState!.reset();
      await tester.pump();
      expect(_shown(tester), 'atlas');
      expect(log.changes, ['beacon']);
    });
  });

  group('layout', () {
    testWidgets('right to left at text scale 2.0 in 320: no overflow, the '
        'buttons at the inline-end', (tester) async {
      tester.view.physicalSize = const Size(320, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        harness(
          _field(_Log(), initialValue: 'نص'),
          direction: TextDirection.rtl,
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(
        tester.getRect(_button('Search')).left,
        lessThan(tester.getRect(_editable).left),
      );
    });

    testWidgets('labelled targets and contrast; 44 by 44 under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_field(_Log(), initialValue: 'atlas')));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline24));
      await tester.pumpWidget(
        harness(
          _field(_Log(), initialValue: 'atlas'),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(targetGuideline44));
      semantics.dispose();
    });
  });
}
