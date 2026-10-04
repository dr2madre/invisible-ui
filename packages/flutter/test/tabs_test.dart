// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const List<TabItem<String>> _items = [
  TabItem(value: 'account', label: 'Account', child: Text('Account panel')),
  TabItem(value: 'password', label: 'Password', child: Text('Password panel')),
  TabItem(
    value: 'billing',
    label: 'Billing',
    disabled: true,
    child: Text('Billing panel'),
  ),
  TabItem(value: 'team', label: 'Team', count: 4, child: Text('Team panel')),
];

Widget _tabs({
  String? initialValue,
  TabActivationMode activationMode = TabActivationMode.automatic,
  Axis orientation = Axis.horizontal,
  ValueChanged<String>? onChanged,
  List<TabItem<String>> items = _items,
}) => Tabs<String>.uncontrolled(
  label: 'Settings',
  items: items,
  initialValue: initialValue,
  activationMode: activationMode,
  orientation: orientation,
  onChanged: onChanged,
);

FontWeight? _weight(WidgetTester tester, String label) =>
    tester.widget<Text>(find.text(label)).style?.fontWeight;

void main() {
  testWidgets('the first enabled tab is selected by default; a tap selects '
      'and reports once; the selection is bold', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(harness(_tabs(onChanged: reports.add)));
    expect(find.text('Account panel'), findsOneWidget);
    expect(find.text('Password panel'), findsNothing);
    expect(_weight(tester, 'Account'), FontWeight.w700);
    await tester.tap(find.text('Password'));
    await tester.pump();
    await tester.tap(find.text('Password'));
    await tester.pump();
    expect(reports, ['password']);
    expect(find.text('Password panel'), findsOneWidget);
    expect(_weight(tester, 'Password'), FontWeight.w700);
    expect(_weight(tester, 'Account'), FontWeight.w400);
  });

  testWidgets('automatic: arrows move and select, skipping a disabled tab and '
      'wrapping; Home and End jump', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(harness(_tabs(onChanged: reports.add)));
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(reports, ['password', 'team']);
    expect(focusedOn(tester, find.text('Team')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(reports.last, 'account');
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await pumpFocus(tester);
    expect(reports, ['password', 'team', 'account', 'team', 'account']);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    expect(reports.length, 5, reason: 'down does nothing in a row');
  });

  testWidgets('right to left: left moves forward and the row is mirrored', (
    tester,
  ) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(_tabs(onChanged: reports.add), direction: TextDirection.rtl),
    );
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await pumpFocus(tester);
    expect(reports, ['password']);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(reports, ['password', 'account']);
    expect(
      tester.getCenter(find.text('Password')).dx,
      lessThan(tester.getCenter(find.text('Account')).dx),
    );
  });

  testWidgets('manual: arrows move focus only; Enter or Space selects', (
    tester,
  ) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        _tabs(activationMode: TabActivationMode.manual, onChanged: reports.add),
      ),
    );
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Password')), isTrue);
    expect(reports, isEmpty);
    expect(find.text('Account panel'), findsOneWidget);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(reports, ['password']);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['password', 'team']);
  });

  testWidgets('vertical: up and down move, left and right do nothing; the '
      'list sits beside the panels', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(_tabs(orientation: Axis.vertical, onChanged: reports.add)),
    );
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await pumpFocus(tester);
    expect(reports, ['password']);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await pumpFocus(tester);
    expect(reports, ['password', 'account', 'team']);
    expect(
      tester.getTopLeft(find.text('Password')).dy,
      greaterThan(tester.getTopLeft(find.text('Account')).dy),
    );
    expect(
      tester.getTopLeft(find.text('Team panel')).dx,
      greaterThan(tester.getTopRight(find.text('Account')).dx),
    );
  });

  testWidgets('one tab stop on the selected tab, then the panel', (
    tester,
  ) async {
    final before = FocusNode();
    addTearDown(before.dispose);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Button(
                onPressed: () {},
                focusNode: before,
                child: const Text('Before'),
              ),
              _tabs(initialValue: 'team'),
            ],
          ),
        ),
      ),
    );
    before.requestFocus();
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Team')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('Team panel')), isTrue);
  });

  testWidgets('semantics: a tab bar named by the label, tabs with selected '
      'state, the count in the name, a panel named by its tab', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(_tabs(initialValue: 'team')));
    expect(tester.takeException(), isNull, reason: 'the role checks pass');
    expect(
      tester.getSemantics(find.text('Team')),
      semanticsWith(
        label: 'Team (4)',
        hasSelectedState: true,
        isSelected: true,
        hasTapAction: true,
        isFocusable: true,
      ),
    );
    expect(
      tester.getSemantics(find.text('Account')),
      semanticsWith(
        label: 'Account',
        hasSelectedState: true,
        isSelected: false,
      ),
    );
    expect(
      tester.getSemantics(find.text('Billing')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    final panel = tester.getSemantics(find.text('Team panel'));
    expect(panel, semanticsWith(isFocusable: true));
    expect(panel.parent!.label, 'Team');
    expect(panel.parent!.getSemanticsData().role, SemanticsRole.tabPanel);
    expect(
      tester.getSemantics(find.text('Team')).parent!.getSemanticsData().role,
      SemanticsRole.tabBar,
    );
    expect(find.bySemanticsLabel('Settings'), findsOneWidget);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('hidden panels keep their state and leave the focus order', (
    tester,
  ) async {
    final inside = FocusNode();
    addTearDown(inside.dispose);
    await tester.pumpWidget(
      harness(
        _tabs(
          items: [
            TabItem(
              value: 'a',
              label: 'First',
              child: Focus(focusNode: inside, child: const Text('Inside')),
            ),
            const TabItem(value: 'b', label: 'Second', child: Text('Other')),
          ],
        ),
      ),
    );
    final focus = find.byWidgetPredicate(
      (widget) => widget is Focus && widget.focusNode == inside,
      skipOffstage: false,
    );
    final state = tester.state(focus);
    await tester.tap(find.text('Second'));
    await tester.pump();
    inside.requestFocus();
    await tester.pump();
    expect(inside.hasFocus, isFalse);
    await tester.tap(find.text('First'));
    await tester.pump();
    expect(tester.state(focus), same(state));
  });

  testWidgets('a changed value is shown without a report', (tester) async {
    final reports = <String>[];
    Widget build(String value) => harness(
      Tabs<String>(
        label: 'Settings',
        items: _items,
        value: value,
        onChanged: reports.add,
      ),
    );
    await tester.pumpWidget(build('account'));
    await tester.pumpWidget(build('team'));
    expect(find.text('Team panel'), findsOneWidget);
    expect(reports, isEmpty);
  });

  testWidgets('a narrow row scrolls sideways at text scale 2.0 and a focused '
      'tab comes into view', (tester) async {
    await tester.pumpWidget(
      harness(SizedBox(width: 220, child: _tabs()), textScale: 2),
    );
    expect(tester.takeException(), isNull);
    expect(find.byType(SingleChildScrollView), findsOneWidget);
    await focusOn(tester, find.text('Account'));
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.pumpAndSettle();
    final team = tester.getRect(find.text('Team'));
    expect(team.right, lessThanOrEqualTo(400 + 110 + 1));
  });

  testWidgets('tabs keep 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        _tabs(),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
