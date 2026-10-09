import 'package:flutter/gestures.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

const List<ChoiceItem<String>> _status = [
  ChoiceItem(value: 'draft', label: 'Draft'),
  ChoiceItem(value: 'review', label: 'In review'),
  ChoiceItem(value: 'locked', label: 'Locked', disabled: true),
  ChoiceItem(value: 'done', label: 'Done'),
  ChoiceItem(value: 'dropped', label: 'Dropped'),
];

final Finder _list = find.byWidgetPredicate(
  (widget) => widget is Semantics && widget.properties.role?.name == 'list',
);

bool _open(WidgetTester tester) => _list.evaluate().isNotEmpty;

/// The highlighted option: the one with the ring border.
String? _active(WidgetTester tester) {
  for (final item in _status) {
    final finder = find.text(item.label);
    if (finder.evaluate().isEmpty) continue;
    final boxes = tester.widgetList<DecoratedBox>(
      find.ancestor(of: finder.last, matching: find.byType(DecoratedBox)),
    );
    final ringed = boxes.any((box) {
      final decoration = box.decoration;
      return decoration is BoxDecoration &&
          decoration.border != null &&
          decoration.borderRadius != null &&
          (decoration.border! as Border).top.width == 2;
    });
    if (ringed) return item.value;
  }
  return null;
}

Widget _select({
  List<String>? reports,
  String? initialValue,
  FocusNode? focusNode,
  bool enabled = true,
}) => Select<String>.uncontrolled(
  label: 'Status',
  items: _status,
  initialValue: initialValue,
  focusNode: focusNode,
  enabled: enabled,
  onChanged: reports?.add,
);

Future<FocusNode> _focusTrigger(WidgetTester tester) async {
  final node = Focus.of(
    tester.element(
      find
          .descendant(
            of: find.byType(FocusableActionDetector),
            matching: find.byType(GestureDetector),
          )
          .first,
    ),
  );
  node.requestFocus();
  await tester.pump();
  return node;
}

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  group('pointer', () {
    testWidgets('the placeholder shows; a tap opens; an option tap chooses, '
        'closes, then reports once', (tester) async {
      final reports = <String>[];
      await tester.pumpWidget(
        harness(
          Select<String>.uncontrolled(
            label: 'Status',
            items: _status,
            onChanged: reports.add,
          ),
        ),
      );
      expect(find.text('Select…'), findsOneWidget);
      await tester.tap(find.text('Select…'));
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_active(tester), isNull, reason: 'a pointer opens with none');
      await tester.tap(find.text('Done'));
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(reports, ['done']);
      expect(find.text('Done'), findsOneWidget);
    });

    testWidgets('choosing the chosen option reports nothing; a disabled '
        'option does nothing', (tester) async {
      final reports = <String>[];
      await tester.pumpWidget(
        harness(_select(reports: reports, initialValue: 'done')),
      );
      await tester.tap(find.text('Done'));
      await tester.pump();
      await tester.tap(find.text('Done').last);
      await tester.pump();
      expect(reports, isEmpty);
      await tester.tap(find.text('Done'));
      await tester.pump();
      await tester.tap(find.text('Locked'));
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(reports, isEmpty);
    });

    testWidgets('a press outside closes; a second tap on the trigger too', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_select()));
      await tester.tap(find.text('Select…'));
      await tester.pump();
      await tester.tapAt(const Offset(5, 5));
      await tester.pump();
      expect(_open(tester), isFalse);
      await tester.tap(find.text('Select…'));
      await tester.pump();
      await tester.tap(find.text('Select…'));
      await tester.pump();
      expect(_open(tester), isFalse);
    });

    testWidgets('the mouse highlights the option under it', (tester) async {
      await tester.pumpWidget(harness(_select()));
      await tester.tap(find.text('Select…'));
      await tester.pump();
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: tester.getCenter(find.text('Draft')));
      await mouse.moveTo(tester.getCenter(find.text('In review')));
      await tester.pump();
      expect(_active(tester), 'review');
    });
  });

  group('keyboard', () {
    testWidgets('Down opens on the chosen option, or the first enabled one', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_select(initialValue: 'done')));
      await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_active(tester), 'done');
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_open(tester), isFalse);

      await tester.pumpWidget(
        harness(KeyedSubtree(key: UniqueKey(), child: _select())),
      );
      await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(_active(tester), 'draft');
    });

    testWidgets('Up and Down move, skipping a disabled option and wrapping; '
        'Home and End jump; Enter chooses and focus stays', (tester) async {
      final reports = <String>[];
      await tester.pumpWidget(harness(_select(reports: reports)));
      final trigger = await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'review');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'done', reason: 'Locked is disabled');
      await tester.sendKeyEvent(LogicalKeyboardKey.end);
      await tester.pump();
      expect(_active(tester), 'dropped');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(_active(tester), 'draft', reason: 'wraps');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await tester.pump();
      expect(_active(tester), 'dropped');
      await tester.sendKeyEvent(LogicalKeyboardKey.home);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(reports, ['draft']);
      expect(_open(tester), isFalse);
      expect(trigger.hasPrimaryFocus, isTrue);
    });

    testWidgets('typed characters open on a match and find the next one', (
      tester,
    ) async {
      final reports = <String>[];
      await tester.pumpWidget(harness(_select(reports: reports)));
      await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.keyD);
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(_active(tester), 'draft');
      await tester.pump(const Duration(milliseconds: 600));
      await tester.sendKeyEvent(LogicalKeyboardKey.keyD);
      await tester.pump();
      expect(_active(tester), 'done');
      await tester.sendKeyEvent(LogicalKeyboardKey.keyR);
      await tester.pump();
      expect(_active(tester), 'dropped', reason: 'the query is "dr"');
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(reports, ['dropped']);
    });

    testWidgets('Tab closes and moves on; Escape stays with the select', (
      tester,
    ) async {
      final escapes = <String>[];
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) => harness(
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
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _select(),
                    Button(onPressed: () {}, child: const Text('Next')),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
      await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(escapes, isEmpty, reason: 'Escape closed the list');
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(escapes, ['outer'], reason: 'a closed select leaves it');
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(
        Focus.of(tester.element(find.text('Next'))).hasPrimaryFocus,
        isTrue,
      );
    });

    testWidgets('the highlighted option is announced', (tester) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(harness(_select()));
      await _focusTrigger(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(log.map((a) => a.message), ['Draft', 'In review']);
      expect(log.every((a) => !a.assertive), isTrue);
    });
  });

  group('states and semantics', () {
    testWidgets('disabled: no focus, no opening', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(_select(enabled: false, focusNode: focus)),
      );
      focus.requestFocus();
      await tester.pump();
      expect(focus.hasFocus, isFalse);
      await tester.tap(find.text('Select…'));
      await tester.pump();
      expect(_open(tester), isFalse);
    });

    testWidgets('the trigger: name, value, expanded, hints and error', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          const Select<String>(
            label: 'Status',
            items: _status,
            value: null,
            description: 'Where the entry stands.',
            error: 'Pick a status.',
            required: true,
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Status',
          hint: 'Where the entry stands.\nPick a status.\nSelect…',
          isButton: true,
          hasExpandedState: true,
          isExpanded: false,
          hasTapAction: true,
          isRequired: true,
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      final ring = tester.widget<FocusRingPainter>(
        find.byType(FocusRingPainter),
      );
      expect(
        ring.visible,
        isTrue,
        reason: 'an invalid box shows a danger ring',
      );
      semantics.dispose();
    });

    testWidgets('the list: named, options selected and enabled or not', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_select(initialValue: 'review')));
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(label: 'Status', value: 'In review', isButton: true),
      );
      await tester.tap(find.text('In review'));
      await tester.pump();
      expect(
        tester.getSemantics(find.byType(FieldSemantics)),
        semanticsWith(
          label: 'Status',
          hasExpandedState: true,
          isExpanded: true,
        ),
      );
      expect(tester.getSemantics(_list), semanticsWith(label: 'Status'));
      expect(
        tester.getSemantics(find.text('In review').last),
        semanticsWith(
          label: 'In review',
          hasSelectedState: true,
          isSelected: true,
          hasTapAction: true,
        ),
      );
      expect(
        tester.getSemantics(find.text('Locked')),
        semanticsWith(label: 'Locked', hasEnabledState: true, isEnabled: false),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });
  });

  group('layout and form', () {
    testWidgets('the list is as wide as the trigger, flips above it near the '
        'bottom, and scrolls a long list', (tester) async {
      await tester.pumpWidget(
        harness(
          Align(
            alignment: Alignment.bottomCenter,
            child: SizedBox(
              width: 240,
              child: Select<int>.uncontrolled(
                label: 'Hour',
                items: [
                  for (var i = 0; i < 40; i++)
                    ChoiceItem(value: i, label: 'Hour $i'),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Select…'));
      await tester.pump();
      final box = tester.getRect(find.text('Select…'));
      final list = tester.getRect(find.byType(SingleChildScrollView));
      expect(list.bottom, lessThan(box.top));
      expect(list.width, greaterThanOrEqualTo(240 - 2));
      expect(list.height, lessThanOrEqualTo(256));
    });

    testWidgets('right to left at text scale 2.0 in a narrow column, with 44 '
        'by 44 options under touch', (tester) async {
      await tester.pumpWidget(
        harness(
          SizedBox(width: 200, child: _select(initialValue: 'review')),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await tester.tap(find.text('In review'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      final chevron = tester.getRect(find.byType(AnimatedRotation));
      final label = tester.getRect(find.text('In review').first);
      expect(chevron.right, lessThan(label.left), reason: 'mirrored');
      final option = find.ancestor(
        of: find.text('Draft'),
        matching: find.byType(ConstrainedBox),
      );
      expect(tester.getSize(option.first).height, greaterThanOrEqualTo(44));
    });

    testWidgets('keyboard focus shows the ring', (tester) async {
      useKeyboardHighlight();
      await tester.pumpWidget(harness(_select()));
      await _focusTrigger(tester);
      await tester.pump();
      expect(
        tester.widget<FocusRingPainter>(find.byType(FocusRingPainter)).visible,
        isTrue,
      );
    });

    testWidgets('a form reset restores the default without a report; the '
        'validator shows its message', (tester) async {
      final form = GlobalKey<FormState>();
      final reports = <String>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: Select<String>.uncontrolled(
              label: 'Status',
              items: _status,
              initialValue: 'draft',
              onChanged: reports.add,
              validator: (value) => value == 'done' ? 'Not yet.' : null,
            ),
          ),
        ),
      );
      await tester.tap(find.text('Draft'));
      await tester.pump();
      await tester.tap(find.text('Done'));
      await tester.pump();
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Not yet.'), findsOneWidget);
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('Draft'), findsOneWidget);
      expect(find.text('Not yet.'), findsNothing);
      expect(reports, ['done']);
    });

    testWidgets('a controlled value is shown without a report and becomes '
        'the reset default', (tester) async {
      final form = GlobalKey<FormState>();
      final reports = <String>[];
      Widget build(String? value) => harness(
        Form(
          key: form,
          child: Select<String>(
            label: 'Status',
            items: _status,
            value: value,
            onChanged: reports.add,
          ),
        ),
      );
      await tester.pumpWidget(build('draft'));
      await tester.pumpWidget(build('review'));
      expect(find.text('In review'), findsOneWidget);
      await tester.tap(find.text('In review'));
      await tester.pump();
      await tester.tap(find.text('Done'));
      await tester.pump();
      form.currentState!.reset();
      await tester.pump();
      expect(find.text('In review'), findsOneWidget);
      expect(reports, ['done']);
    });
  });
}
