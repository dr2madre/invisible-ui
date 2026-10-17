import 'dart:ui' show SemanticsRole;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart' hide RadioGroup;

import 'harness.dart';

/// Three plans the app lays out itself, holding the group value.
class _Plans extends StatefulWidget {
  const _Plans({
    this.initial,
    this.disabled = const {},
    this.reports,
    this.axis = Axis.vertical,
  });

  final String? initial;
  final Set<String> disabled;
  final List<String>? reports;
  final Axis axis;

  @override
  State<_Plans> createState() => _PlansState();
}

class _PlansState extends State<_Plans> {
  late String? _plan = widget.initial;

  @override
  Widget build(BuildContext context) {
    return Flex(
      direction: widget.axis,
      mainAxisSize: MainAxisSize.min,
      children: [
        for (final plan in ['Free', 'Pro', 'Team'])
          Radio<String>(
            name: 'plan',
            value: plan,
            groupValue: _plan,
            label: plan,
            onChanged: widget.disabled.contains(plan)
                ? null
                : (next) {
                    widget.reports?.add(next);
                    setState(() => _plan = next);
                  },
          ),
      ],
    );
  }
}

/// The same plans inside the widgets library's [RadioGroup], in an app.
class _GroupPlans extends StatefulWidget {
  const _GroupPlans({
    super.key,
    this.initial,
    this.disabled = const {},
    this.reports,
    this.axis = Axis.vertical,
  });

  final String? initial;
  final Set<String> disabled;
  final List<String>? reports;
  final Axis axis;

  @override
  State<_GroupPlans> createState() => _GroupPlansState();
}

class _GroupPlansState extends State<_GroupPlans> {
  late String? _plan = widget.initial;

  @override
  Widget build(BuildContext context) {
    return RadioGroup<String>(
      groupValue: _plan,
      onChanged: (next) {
        widget.reports?.add(next!);
        setState(() => _plan = next);
      },
      child: Flex(
        direction: widget.axis,
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final plan in ['Free', 'Pro', 'Team'])
            Radio<String>(
              value: plan,
              label: plan,
              enabled: !widget.disabled.contains(plan),
            ),
        ],
      ),
    );
  }
}

/// [child] in a [WidgetsApp], whose actions run the native group's keys,
/// between two buttons.
Widget _app(
  Widget child, {
  TextDirection direction = TextDirection.ltr,
  FocusNode? before,
}) => WidgetsApp(
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
        child,
        Button(onPressed: () {}, child: const Text('After')),
      ],
    ),
    direction: direction,
  ),
);

bool _stop(WidgetTester tester, String label) =>
    !Focus.of(tester.element(find.text(label))).skipTraversal;

void main() {
  testWidgets('a tap and Space check a radio and report its value once', (
    tester,
  ) async {
    final reports = <String>[];
    await tester.pumpWidget(harness(_Plans(reports: reports)));
    await tester.tap(find.text('Pro'));
    await tester.pump();
    await tester.tap(find.text('Pro'));
    await tester.pump();
    await focusOn(tester, find.text('Team'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['Pro', 'Team']);
  });

  testWidgets('one tab stop: the checked radio, or the first enabled one', (
    tester,
  ) async {
    await tester.pumpWidget(harness(const _Plans(initial: 'Pro')));
    expect(
      [
        for (final p in ['Free', 'Pro', 'Team']) _stop(tester, p),
      ],
      [false, true, false],
    );
    await tester.pumpWidget(harness(const _Plans(disabled: {'Free'})));
    expect(
      [
        for (final p in ['Free', 'Pro', 'Team']) _stop(tester, p),
      ],
      [false, true, false],
    );
  });

  testWidgets('arrows move and check, wrapping and skipping disabled radios; '
      'mirrored right to left', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        _Plans(
          initial: 'Free',
          disabled: const {'Pro'},
          reports: reports,
          axis: Axis.horizontal,
        ),
        direction: TextDirection.rtl,
      ),
    );
    await focusOn(tester, find.text('Free'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(reports, ['Team']);
    expect(focusedOn(tester, find.text('Team')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, ['Team', 'Free', 'Team']);
  });

  testWidgets('radios with another name form another group', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _Plans(initial: 'Pro', reports: reports),
            Radio<String>(
              name: 'billing',
              value: 'Monthly',
              groupValue: null,
              label: 'Monthly',
              onChanged: reports.add,
            ),
          ],
        ),
      ),
    );
    expect(_stop(tester, 'Monthly'), isTrue);
    await focusOn(tester, find.text('Team'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(reports, ['Free'], reason: 'wraps inside its own group');
  });

  testWidgets('semantics: checked in a mutually exclusive group, named by '
      'its label; 24 and 44 targets', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const _Plans(initial: 'Pro', disabled: {'Team'})),
    );
    expect(
      tester.getSemantics(find.text('Pro')),
      semanticsWith(
        label: 'Pro',
        hasCheckedState: true,
        isChecked: true,
        isInMutuallyExclusiveGroup: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester.getSemantics(find.text('Team')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    await tester.pumpWidget(
      harness(
        const _Plans(initial: 'Pro'),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });

  testWidgets('inside a RadioGroup: a tap, Space and the arrows choose '
      'through the group, skipping disabled radios; right to left mirrors '
      'the horizontal arrows', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      _app(_GroupPlans(disabled: const {'Pro'}, reports: reports)),
    );
    await tester.tap(find.text('Free'));
    await tester.pump();
    await tester.tap(find.text('Free'));
    await tester.tap(find.text('Pro'));
    await tester.pump();
    expect(reports, ['Free'], reason: 'checked again and disabled: nothing');
    await focusOn(tester, find.text('Free'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(reports, ['Free', 'Team']);
    expect(focusedOn(tester, find.text('Team')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, ['Free', 'Team', 'Free'], reason: 'wraps');

    reports.clear();
    await tester.pumpWidget(
      _app(
        _GroupPlans(
          key: const ValueKey('rtl'),
          initial: 'Free',
          reports: reports,
          axis: Axis.horizontal,
        ),
        direction: TextDirection.rtl,
      ),
    );
    await focusOn(tester, find.text('Free'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(reports, ['Pro']);
    expect(
      tester.getCenter(find.text('Pro')).dx,
      lessThan(tester.getCenter(find.text('Free')).dx),
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.pump();
    expect(reports, ['Pro', 'Free', 'Team']);
    await focusOn(tester, find.text('Pro'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['Pro', 'Free', 'Team', 'Pro']);
  });

  testWidgets('inside a RadioGroup: one tab stop on the checked radio, or the '
      'first enabled one, also when the checked one is disabled', (
    tester,
  ) async {
    final before = FocusNode();
    addTearDown(before.dispose);
    Future<void> tabFromBefore() async {
      before.requestFocus();
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
    }

    await tester.pumpWidget(
      _app(const _GroupPlans(initial: 'Team'), before: before),
    );
    await tabFromBefore();
    expect(focusedOn(tester, find.text('Team')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(focusedOn(tester, find.text('After')), isTrue);

    await tester.pumpWidget(
      _app(
        const _GroupPlans(
          key: ValueKey('free disabled'),
          initial: 'Free',
          disabled: {'Free'},
        ),
        before: before,
      ),
    );
    await tabFromBefore();
    expect(focusedOn(tester, find.text('Pro')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pump();
    expect(focusedOn(tester, find.text('After')), isTrue);
  });

  testWidgets('inside a RadioGroup: Enter checks the focused radio in an '
      'app, as the native radio does', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(_app(_GroupPlans(reports: reports)));
    await focusOn(tester, find.text('Pro'));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(reports, ['Pro']);
  });

  testWidgets('inside a RadioGroup: the group has the radio group role and '
      'each radio its checked state and name', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _app(const _GroupPlans(initial: 'Pro', disabled: {'Team'})),
    );
    expect(
      tester
          .getSemantics(find.byType(RadioGroup<String>))
          .getSemanticsData()
          .role,
      SemanticsRole.radioGroup,
    );
    expect(
      tester.getSemantics(find.text('Pro')),
      semanticsWith(
        label: 'Pro',
        hasCheckedState: true,
        isChecked: true,
        isInMutuallyExclusiveGroup: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester.getSemantics(find.text('Team')),
      semanticsWith(
        label: 'Team',
        hasCheckedState: true,
        isChecked: false,
        hasEnabledState: true,
        isEnabled: false,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    semantics.dispose();
  });

  testWidgets('a disabled radio still shows the checked state', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _app(const _GroupPlans(initial: 'Team', disabled: {'Team'})),
    );
    expect(
      tester.getSemantics(find.text('Team')),
      semanticsWith(hasCheckedState: true, isChecked: true, isEnabled: false),
    );
    semantics.dispose();
  });

  testWidgets('a long label wraps in a narrow column at text scale 2.0', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 160,
          child: Radio<int>(
            name: 'n',
            value: 1,
            groupValue: 1,
            label: 'A plan with a long name that wraps',
            onChanged: (_) {},
          ),
        ),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getSize(find.text('A plan with a long name that wraps')).height,
      greaterThan(40),
    );
  });
}
