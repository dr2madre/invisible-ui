import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<ChoiceItem<String>> _people = [
  ChoiceItem(value: 'ada', label: 'Ada'),
  ChoiceItem(value: 'grace', label: 'Grace'),
  ChoiceItem(value: 'alan', label: 'Alan', disabled: true),
  ChoiceItem(value: 'edsger', label: 'Edsger'),
];

final Finder _editable = find.byType(EditableText);

final Finder _list = find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.role?.name == 'list' &&
      widget.properties.label == 'Reviewers',
);

final Finder _tags = find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.role?.name == 'list' &&
      widget.properties.label == 'Selected values',
);

bool _open() => _list.evaluate().isNotEmpty;

String _text(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).controller.text;

Finder _remove(String name) => find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.button == true &&
      widget.properties.label == 'Remove $name',
);

bool _removeFocused(WidgetTester tester, String name) =>
    FocusManager.instance.primaryFocus?.debugLabel == 'Remove $name';

bool _fieldFocused(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).focusNode.hasPrimaryFocus;

class _Log {
  final List<List<String>> values = [];
  final List<String> texts = [];
}

Widget _select(
  _Log log, {
  List<String> initialValues = const [],
  List<ChoiceItem<String>> items = _people,
  int? max,
  bool removeOnBackspace = false,
  bool enabled = true,
  bool readOnly = false,
}) => SizedBox(
  width: 320,
  child: MultiSelect<String>.uncontrolled(
    label: 'Reviewers',
    items: items,
    initialValues: initialValues,
    max: max,
    removeOnBackspace: removeOnBackspace,
    enabled: enabled,
    readOnly: readOnly,
    onChanged: log.values.add,
    onInputChanged: log.texts.add,
  ),
);

Future<void> _focus(WidgetTester tester) =>
    focusEditable(tester, find.byType(MultiSelect<String>));

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await tester.pump();
}

void main() {
  group('choosing', () {
    testWidgets('typing opens and filters; Enter adds, empties the text, '
        'keeps the list open and announces the addition', (tester) async {
      final log = _Log();
      final said = recordAnnouncements(tester);
      await tester.pumpWidget(harness(_select(log)));
      await _focus(tester);
      await tester.enterText(_editable, 'gr');
      await tester.pump();
      expect(_open(), isTrue);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(log.values, [
        ['grace'],
      ]);
      expect(log.texts, ['gr', '']);
      expect(_text(tester), '');
      expect(_open(), isTrue);
      expect(said.map((a) => a.message), contains('Grace added'));
      expect(said.last.assertive, isFalse);
      expect(
        find.descendant(of: _tags, matching: find.text('Grace')),
        findsOne,
      );
    });

    testWidgets('Down opens on the first enabled option; arrows skip a '
        'disabled one and wrap', (tester) async {
      final log = _Log();
      final said = recordAnnouncements(tester);
      await tester.pumpWidget(harness(_select(log)));
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_open(), isTrue);
      expect(said.last.message, 'Ada');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(said.last.message, 'Edsger', reason: 'Alan is disabled');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(said.last.message, 'Ada');
    });

    testWidgets('a chosen option stays listed, ticked; choosing it again '
        'changes nothing', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_select(log, initialValues: ['ada'])));
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(log.values, isEmpty);
      final option = tester.getSemantics(
        find.descendant(of: _list, matching: find.text('Ada')),
      );
      expect(option, semanticsWith(label: 'Ada', isSelected: true));
    });

    testWidgets('a pointer press on an option adds it; the list stays', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(harness(_select(log)));
      await _focus(tester);
      await tester.tap(_editable);
      await tester.pump();
      expect(_open(), isTrue);
      await tester.tap(
        find.descendant(of: _list, matching: find.text('Edsger')),
      );
      await tester.pump();
      expect(log.values, [
        ['edsger'],
      ]);
      expect(_open(), isTrue);
    });

    testWidgets('max blocks additions and keeps the chosen values', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada', 'grace'], max: 2)),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'eds');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.enter);
      expect(log.values, isEmpty);
      expect(find.descendant(of: _tags, matching: find.text('Ada')), findsOne);
    });

    testWidgets('Escape closes the list and keeps the text; with the list '
        'closed it is left to the dialog', (tester) async {
      final log = _Log();
      var dismissed = 0;
      await tester.pumpWidget(
        harness(
          Shortcuts(
            shortcuts: const {
              SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
            },
            child: Actions(
              actions: {
                DismissIntent: CallbackAction<DismissIntent>(
                  onInvoke: (_) => dismissed++,
                ),
              },
              child: _select(log),
            ),
          ),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'ad');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.escape);
      expect(_open(), isFalse);
      expect(_text(tester), 'ad');
      expect(dismissed, 0);
      await _key(tester, LogicalKeyboardKey.escape);
      expect(dismissed, 1);
    });
  });

  group('removing', () {
    testWidgets('a remove button removes, announces, and focus moves to the '
        'next remove button, then the previous, then the field', (
      tester,
    ) async {
      final log = _Log();
      final said = recordAnnouncements(tester);
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada', 'grace', 'edsger'])),
      );
      await tester.tap(_remove('Grace'));
      await pumpFocus(tester);
      expect(log.values.last, ['ada', 'edsger']);
      expect(said.last.message, 'Grace removed');
      expect(_removeFocused(tester, 'Edsger'), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await pumpFocus(tester);
      expect(log.values.last, ['ada']);
      expect(_removeFocused(tester, 'Ada'), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await pumpFocus(tester);
      expect(log.values.last, isEmpty);
      expect(_fieldFocused(tester), isTrue);
      expect(_tags, findsNothing);
    });

    testWidgets('focus skips a value that cannot be removed', (tester) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada', 'grace', 'alan'])),
      );
      expect(_remove('Alan'), findsNothing, reason: 'its option is disabled');
      await tester.tap(_remove('Grace'));
      await pumpFocus(tester);
      expect(_removeFocused(tester, 'Ada'), isTrue);
    });

    testWidgets('Backspace in the empty field removes the last removable '
        'value only with the opt-in', (tester) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada', 'grace', 'alan'])),
      );
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.backspace);
      expect(log.values, isEmpty);
      await tester.pumpWidget(
        harness(
          _select(
            log,
            initialValues: ['ada', 'grace', 'alan'],
            removeOnBackspace: true,
          ),
        ),
      );
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.backspace);
      expect(log.values, [
        ['ada', 'alan'],
      ]);
      expect(_fieldFocused(tester), isTrue);
    });

    testWidgets('read-only and disabled: no remove buttons, no list', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada'], readOnly: true)),
      );
      expect(_remove('Ada'), findsNothing);
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_open(), isFalse);
      await tester.pumpWidget(
        harness(_select(log, initialValues: ['ada'], enabled: false)),
      );
      expect(_remove('Ada'), findsNothing);
    });
  });

  group('state', () {
    testWidgets('a value with no option stays chosen and shows its raw value', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(_select(_Log(), initialValues: ['ada', 'ghost'])),
      );
      expect(
        find.descendant(of: _tags, matching: find.text('ghost')),
        findsOne,
      );
    });

    testWidgets('controlled: a changed list is shown, never reported; the '
        'same values in another order change nothing', (tester) async {
      final reports = <List<String>>[];
      Widget build(List<String> values) => harness(
        SizedBox(
          width: 320,
          child: MultiSelect<String>(
            label: 'Reviewers',
            items: _people,
            values: values,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.pumpWidget(build(['ada']));
      await tester.pumpWidget(build(['ada', 'grace']));
      expect(
        find.descendant(of: _tags, matching: find.text('Grace')),
        findsOne,
      );
      await tester.pumpWidget(build(['grace', 'ada']));
      final order = [
        for (final name in ['Ada', 'Grace'])
          tester
              .getTopLeft(find.descendant(of: _tags, matching: find.text(name)))
              .dx,
      ];
      expect(order.first, lessThan(order.last), reason: 'order kept');
      expect(reports, isEmpty);
    });

    testWidgets('a form reset restores the default and empties the text, '
        'silently', (tester) async {
      final form = GlobalKey<FormState>();
      final log = _Log();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _select(log, initialValues: ['ada']),
          ),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'gr');
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.enter);
      await tester.enterText(_editable, 'ed');
      await tester.pump();
      final reported = log.values.length;
      form.currentState!.reset();
      await tester.pump();
      expect(_text(tester), '');
      expect(
        find.descendant(of: _tags, matching: find.text('Grace')),
        findsNothing,
      );
      expect(log.values.length, reported);
    });
  });

  group('semantics and layout', () {
    testWidgets('the field says whether the list is expanded; the tags form a '
        'named list', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_select(_Log(), initialValues: ['ada'])));
      expect(_tags, findsOne);
      final field = find.descendant(
        of: find.byType(MultiSelect<String>),
        matching: find.byWidgetPredicate(
          (widget) => widget is Semantics && widget.properties.expanded != null,
        ),
      );
      expect(
        tester.getSemantics(field),
        semanticsWith(label: 'Reviewers', isExpanded: false),
      );
      await _focus(tester);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(
        tester.getSemantics(field),
        semanticsWith(label: 'Reviewers', isExpanded: true),
      );
      semantics.dispose();
    });

    testWidgets('right to left at text scale 2.0 in 320 with long labels: '
        'no overflow; labelled 44 by 44 targets under touch', (tester) async {
      tester.view.physicalSize = const Size(320, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final semantics = tester.ensureSemantics();
      const items = [
        ChoiceItem(value: 'a', label: 'مراجع بعنوان طويل جدا يلتف على سطرين'),
        ChoiceItem(value: 'b', label: 'مراجع ثان'),
      ];
      await tester.pumpWidget(
        harness(
          _select(_Log(), items: items, initialValues: ['a', 'b']),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      expect(tester.takeException(), isNull);
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline44));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });
}
