import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

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
