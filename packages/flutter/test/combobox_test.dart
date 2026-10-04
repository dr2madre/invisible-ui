import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';

import 'harness.dart';

const List<ChoiceItem<String>> _projects = [
  ChoiceItem(value: 'atlas', label: 'Atlas'),
  ChoiceItem(value: 'beacon', label: 'Beacon'),
  ChoiceItem(value: 'cargo', label: 'Cargo', disabled: true),
  ChoiceItem(value: 'delta', label: 'Delta app'),
  ChoiceItem(value: 'atrium', label: 'Atrium'),
];

final Finder _editable = find.byType(EditableText);

final Finder _list = find.byWidgetPredicate(
  (widget) => widget is Semantics && widget.properties.role?.name == 'list',
);

bool _open(WidgetTester tester) => _list.evaluate().isNotEmpty;

String _text(WidgetTester tester) =>
    tester.widget<EditableText>(_editable).controller.text;

/// The labels of the options shown.
List<String> _shown(WidgetTester tester) => [
  for (final item in _projects)
    if (find
        .descendant(of: _list, matching: find.text(item.label))
        .evaluate()
        .isNotEmpty)
      item.label,
];

String? _active(WidgetTester tester) {
  for (final item in _projects) {
    final finder = find.descendant(of: _list, matching: find.text(item.label));
    if (finder.evaluate().isEmpty) continue;
    final ringed = tester
        .widgetList<DecoratedBox>(
          find.ancestor(of: finder, matching: find.byType(DecoratedBox)),
        )
        .any((box) {
          final d = box.decoration;
          return d is BoxDecoration &&
              d.border is Border &&
              (d.border! as Border).top.width == 2 &&
              d.boxShadow == null;
        });
    if (ringed) return item.value;
  }
  return null;
}

Finder _button(String label) => find.byWidgetPredicate(
  (widget) =>
      widget is Semantics &&
      widget.properties.button == true &&
      widget.properties.label == label,
);

class _Recorder {
  final List<String?> values = [];
  final List<String> texts = [];
}

Widget _combobox(
  _Recorder log, {
  String? initialValue,
  List<ChoiceItem<String>> items = _projects,
  bool searchable = true,
  bool loading = false,
  ChoiceFilter<String>? filter,
  FocusNode? focusNode,
}) => Combobox<String>.uncontrolled(
  label: 'Project',
  items: items,
  initialValue: initialValue,
  searchable: searchable,
  loading: loading,
  filter: filter,
  focusNode: focusNode,
  onChanged: log.values.add,
  onInputChanged: log.texts.add,
);

Future<void> _focus(WidgetTester tester) =>
    focusEditable(tester, find.byType(Combobox<String>));

void main() {
  group('typing', () {
    testWidgets('typing opens, filters by contains, ignoring case, and '
        'highlights the first enabled match', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log)));
      await _focus(tester);
      await tester.enterText(_editable, 'AT');
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_shown(tester), ['Atlas', 'Atrium']);
      expect(_active(tester), 'atlas');
      expect(log.texts, ['AT']);
      await tester.enterText(_editable, ' app ');
      await tester.pump();
      expect(_shown(tester), ['Delta app']);
    });

    testWidgets('Enter chooses the highlighted option, closes, fills the '
        'text, then reports', (tester) async {
      final log = _Recorder();
      final seen = <String>[];
      await tester.pumpWidget(
        harness(
          Combobox<String>.uncontrolled(
            label: 'Project',
            items: _projects,
            onChanged: (value) {
              log.values.add(value);
              seen.add(_text(tester));
            },
          ),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'bea');
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(log.values, ['beacon']);
      expect(seen, ['Beacon'], reason: 'the text moved before the report');
      expect(_text(tester), 'Beacon');
    });

    testWidgets('no match says so; loading says so instead', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log)));
      await _focus(tester);
      await tester.enterText(_editable, 'zzz');
      await tester.pump();
      expect(find.text('No results'), findsOneWidget);
      await tester.pumpWidget(harness(_combobox(log, loading: true)));
      expect(find.text('No results'), findsNothing);
      expect(find.text('Loading…'), findsOneWidget);
    });

    testWidgets('options loaded as the user types replace the list', (
      tester,
    ) async {
      final log = _Recorder();
      List<ChoiceItem<String>> keepAll(List<ChoiceItem<String>> items, _) =>
          items;
      await tester.pumpWidget(
        harness(
          _combobox(log, items: const [], filter: keepAll, loading: true),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'at');
      await tester.pump();
      expect(log.texts, ['at']);
      await tester.pumpWidget(
        harness(
          _combobox(log, items: _projects.sublist(0, 2), filter: keepAll),
        ),
      );
      expect(_shown(tester), ['Atlas', 'Beacon']);
    });
  });

  group('keyboard', () {
    testWidgets('Down opens on the chosen option, moves past a disabled one '
        'and wraps; Up moves back', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log, initialValue: 'beacon')));
      await _focus(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_shown(tester), ['Beacon'], reason: 'the text filters the list');
      expect(_active(tester), 'beacon');
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();

      await tester.pumpWidget(
        harness(KeyedSubtree(key: UniqueKey(), child: _combobox(log))),
      );
      await _focus(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'atlas');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'delta', reason: 'Cargo is disabled');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'atlas', reason: 'wraps');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await tester.pump();
      expect(_active(tester), 'atrium');
    });

    testWidgets('Escape closes and puts the chosen text back; with nothing to '
        'undo it is left to the dialog', (tester) async {
      final log = _Recorder();
      final escapes = <String>[];
      await tester.pumpWidget(
        harness(
          Shortcuts(
            shortcuts: const {
              SingleActivator(LogicalKeyboardKey.escape): DismissIntent(),
            },
            child: Actions(
              actions: {
                DismissIntent: CallbackAction<DismissIntent>(
                  onInvoke: (_) => escapes.add('outer'),
                ),
              },
              child: _combobox(log, initialValue: 'atlas'),
            ),
          ),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'Del');
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_text(tester), 'Atlas');
      expect(escapes, isEmpty);
      expect(log.values, isEmpty);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(escapes, ['outer']);
    });

    testWidgets('leaving puts the text back; Tab closes the list', (
      tester,
    ) async {
      final log = _Recorder();
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(_combobox(log, initialValue: 'atlas', focusNode: focus)),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'xyz');
      await tester.pump();
      expect(_open(tester), isTrue);
      focus.unfocus();
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_text(tester), 'Atlas');
      expect(log.texts, ['xyz', 'Atlas']);
    });

    testWidgets('the highlighted option is announced', (tester) async {
      final announcements = recordAnnouncements(tester);
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log)));
      await _focus(tester);
      await tester.enterText(_editable, 'a');
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(announcements.map((a) => a.message), ['Atlas', 'Beacon']);
    });
  });

  group('pointer', () {
    testWidgets('a tap on the text opens; an option tap chooses', (
      tester,
    ) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log)));
      await tester.tap(_editable);
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_active(tester), isNull);
      await tester.tap(find.text('Delta app'));
      await tester.pump();
      expect(log.values, ['delta']);
      expect(_text(tester), 'Delta app');
      expect(_open(tester), isFalse);
    });

    testWidgets('the chevron opens the full list and closes it, keeping '
        'focus in the field', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log, initialValue: 'beacon')));
      await tester.tap(_button('Show options'));
      await tester.pump();
      expect(_shown(tester), [
        'Atlas',
        'Beacon',
        'Cargo',
        'Delta app',
        'Atrium',
      ]);
      expect(_active(tester), 'beacon');
      expect(tester.widget<EditableText>(_editable).focusNode.hasFocus, isTrue);
      await tester.tap(_button('Close options'));
      await tester.pump();
      expect(_open(tester), isFalse);
    });

    testWidgets('a press outside closes and puts the text back', (
      tester,
    ) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log, initialValue: 'atlas')));
      await _focus(tester);
      await tester.enterText(_editable, 'b');
      await tester.pump();
      await tester.tapAt(const Offset(5, 5));
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_text(tester), 'Atlas');
    });
  });

  group('clear', () {
    testWidgets('the clear button shows only with something to clear, '
        'empties text and choice, and reports null', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log)));
      expect(_button('Clear'), findsNothing);
      await tester.pumpWidget(
        harness(
          KeyedSubtree(
            key: UniqueKey(),
            child: _combobox(log, initialValue: 'atlas'),
          ),
        ),
      );
      expect(_button('Clear'), findsOneWidget);
      await tester.tap(_button('Clear'));
      await tester.pump();
      expect(_text(tester), '');
      expect(log.values, [null]);
      expect(log.texts, ['']);
      expect(_button('Clear'), findsNothing);
    });

    testWidgets('from the keyboard the clear button is a tab stop and focus '
        'returns to the field', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) =>
              harness(_combobox(log, initialValue: 'atlas')),
        ),
      );
      await _focus(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      await tester.pump();
      expect(log.values, [null]);
      expect(tester.widget<EditableText>(_editable).focusNode.hasFocus, isTrue);
    });
  });

  group('select-only and states', () {
    testWidgets('not searchable: read-only text, every option, the chosen '
        'icon leads', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(
        harness(
          _combobox(
            log,
            searchable: false,
            initialValue: 'beacon',
            items: const [
              ChoiceItem(value: 'atlas', label: 'Atlas'),
              ChoiceItem(
                value: 'beacon',
                label: 'Beacon',
                icon: SizedBox.square(key: Key('beacon icon'), dimension: 16),
              ),
            ],
          ),
        ),
      );
      expect(tester.widget<EditableText>(_editable).readOnly, isTrue);
      expect(find.byKey(const Key('beacon icon')), findsOneWidget);
      await tester.tap(_editable);
      await tester.pump();
      expect(
        find.descendant(of: _list, matching: find.text('Atlas')),
        findsOneWidget,
      );
    });

    testWidgets('disabled: no list, no clear, reported disabled', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const Combobox<String>(
            label: 'Project',
            items: _projects,
            value: 'atlas',
            enabled: false,
          ),
        ),
      );
      await tester.tap(_editable);
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_button('Clear'), findsNothing);
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Project',
          hasEnabledState: true,
          isEnabled: false,
        ),
      );
      semantics.dispose();
    });

    testWidgets('semantics: a text field named by the label, expanded while '
        'open, with its hints; options selected', (tester) async {
      final semantics = tester.ensureSemantics();
      final log = _Recorder();
      await tester.pumpWidget(harness(_combobox(log, initialValue: 'atlas')));
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Project',
          isTextField: true,
          hasExpandedState: true,
          isExpanded: false,
        ),
      );
      await tester.tap(_button('Show options'));
      await tester.pump();
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Project',
          hasExpandedState: true,
          isExpanded: true,
        ),
      );
      expect(
        tester.getSemantics(
          find.descendant(of: _list, matching: find.text('Atlas')),
        ),
        semanticsWith(label: 'Atlas', hasSelectedState: true, isSelected: true),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('text scale 2.0 right to left in a narrow column does not '
        'overflow; buttons keep 44 by 44 under touch', (tester) async {
      final log = _Recorder();
      await tester.pumpWidget(
        harness(
          SizedBox(width: 220, child: _combobox(log, initialValue: 'delta')),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.tap(_button('Show options'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      expect(tester.getSize(_button('Clear')).width, greaterThanOrEqualTo(44));
      expect(
        tester.getCenter(_button('Clear')).dx,
        lessThan(tester.getCenter(_editable).dx),
        reason: 'the buttons sit at the inline-end',
      );
    });
  });

  group('form', () {
    testWidgets('a reset restores the default value and its text without a '
        'report', (tester) async {
      final form = GlobalKey<FormState>();
      final log = _Recorder();
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: _combobox(log, initialValue: 'atlas'),
          ),
        ),
      );
      await _focus(tester);
      await tester.enterText(_editable, 'bea');
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(log.values, ['beacon']);
      form.currentState!.reset();
      await tester.pump();
      expect(_text(tester), 'Atlas');
      expect(log.values, ['beacon']);
      expect(log.texts, ['bea', 'Beacon']);
    });

    testWidgets('a controlled value is shown with its label, never reported, '
        'and becomes the reset default', (tester) async {
      final form = GlobalKey<FormState>();
      final values = <String?>[];
      Widget build(String? value) => harness(
        Form(
          key: form,
          child: Combobox<String>(
            label: 'Project',
            items: _projects,
            value: value,
            onChanged: values.add,
            validator: (value) => value == null ? 'Pick a project.' : null,
          ),
        ),
      );
      await tester.pumpWidget(build(null));
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Pick a project.'), findsOneWidget);
      await tester.pumpWidget(build('delta'));
      expect(_text(tester), 'Delta app');
      await tester.tap(_button('Clear'));
      await tester.pump();
      expect(values, [null]);
      form.currentState!.reset();
      await tester.pump();
      expect(_text(tester), 'Delta app');
      expect(find.text('Pick a project.'), findsNothing);
      expect(values, [null]);
    });
  });
}
