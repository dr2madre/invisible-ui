import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';

import 'harness.dart';

const List<ChoiceItem<String>> _filters = [
  ChoiceItem(value: 'all', label: 'All'),
  ChoiceItem(value: 'active', label: 'Active'),
  ChoiceItem(value: 'archived', label: 'Archived'),
];

FontWeight? _weight(WidgetTester tester, String label) =>
    tester.widget<Text>(find.text(label)).style?.fontWeight;

bool _focused(WidgetTester tester, String label) =>
    Focus.of(tester.element(find.text(label))).hasPrimaryFocus;

class _Square extends StatelessWidget {
  const _Square();

  @override
  Widget build(BuildContext context) {
    final icons = IconTheme.of(context);
    return SizedBox.square(
      dimension: icons.size,
      child: ColoredBox(color: icons.color!),
    );
  }
}

void main() {
  testWidgets('a tap chooses, reports once through onSelected, and the '
      'choice is bold as well as tinted', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        SegmentedControl<String>.uncontrolled(
          label: 'Show',
          items: _filters,
          initialValue: 'all',
          onSelected: reports.add,
        ),
      ),
    );
    expect(_weight(tester, 'All'), FontWeight.w600);
    expect(_weight(tester, 'Active'), FontWeight.w400);
    await tester.tap(find.text('Active'));
    await tester.pump();
    await tester.tap(find.text('Active'));
    await tester.pump();
    expect(reports, ['active']);
    expect(_weight(tester, 'Active'), FontWeight.w600);
  });

  testWidgets('arrows move and choose, wrapping, mirrored right to left', (
    tester,
  ) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        SegmentedControl<String>.uncontrolled(
          label: 'Show',
          items: _filters,
          initialValue: 'all',
          onSelected: reports.add,
        ),
        direction: TextDirection.rtl,
      ),
    );
    await tester.tap(find.text('Show'));
    await tester.pump();
    expect(_focused(tester, 'All'), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pump();
    expect(reports, ['active']);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, ['active', 'all', 'archived']);
    expect(
      tester.getCenter(find.text('Active')).dx,
      lessThan(tester.getCenter(find.text('All')).dx),
    );
  });

  testWidgets('one tab stop; Space chooses; a changed value is not reported', (
    tester,
  ) async {
    final reports = <String>[];
    Widget build(String? value) => harness(
      SegmentedControl<String>(
        label: 'Show',
        items: _filters,
        value: value,
        onSelected: reports.add,
      ),
    );
    await tester.pumpWidget(build(null));
    await tester.tap(find.text('Show'));
    await tester.pump();
    expect(_focused(tester, 'All'), isTrue, reason: 'first enabled');
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, ['all']);
    await tester.pumpWidget(build('archived'));
    expect(_weight(tester, 'Archived'), FontWeight.w600);
    expect(reports, ['all']);
  });

  testWidgets('a disabled segment is skipped and takes no tap', (tester) async {
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        SegmentedControl<String>.uncontrolled(
          label: 'Show',
          items: const [
            ChoiceItem(value: 'all', label: 'All'),
            ChoiceItem(value: 'active', label: 'Active', disabled: true),
            ChoiceItem(value: 'archived', label: 'Archived'),
          ],
          initialValue: 'all',
          onSelected: reports.add,
        ),
      ),
    );
    await tester.tap(find.text('Active'));
    await tester.pump();
    expect(reports, isEmpty);
    await tester.tap(find.text('Show'));
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(reports, ['archived']);
  });

  testWidgets('semantics: a radio group; icon-only segments keep their name', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const SegmentedControl<String>(
          label: 'View',
          items: [
            ChoiceItem(value: 'summary', label: 'Summary', icon: _Square()),
            ChoiceItem(value: 'enter', label: 'Enter hours', icon: _Square()),
          ],
          value: 'summary',
          iconOnly: true,
        ),
      ),
    );
    expect(find.text('Summary'), findsNothing);
    expect(
      tester.getSemantics(find.byType(FieldSemantics)),
      semanticsWith(label: 'View'),
    );
    expect(
      tester.getSemantics(find.byType(_Square).first),
      semanticsWith(
        label: 'Summary',
        hasCheckedState: true,
        isChecked: true,
        isInMutuallyExclusiveGroup: true,
        hasTapAction: true,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('stacked puts the icon above the label', (tester) async {
    await tester.pumpWidget(
      harness(
        const SegmentedControl<String>.uncontrolled(
          label: 'View',
          stacked: true,
          items: [
            ChoiceItem(value: 'summary', label: 'Summary', icon: _Square()),
          ],
        ),
      ),
    );
    expect(
      tester.getCenter(find.byType(_Square)).dy,
      lessThan(tester.getCenter(find.text('Summary')).dy),
    );
  });

  testWidgets('a narrow bar scrolls sideways and a focused segment comes into '
      'view, at text scale 2.0', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: SegmentedControl<String>.uncontrolled(
            label: 'Range',
            items: [
              ChoiceItem(value: 'month', label: 'Month'),
              ChoiceItem(value: 'year', label: 'Year'),
              ChoiceItem(value: 'all', label: 'All'),
              ChoiceItem(value: 'range', label: 'Range'),
            ],
            initialValue: 'month',
          ),
        ),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.byType(SingleChildScrollView), findsOneWidget);
    await tester.tap(find.text('Range').first);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await tester.pumpAndSettle();
    final segment = tester.getRect(find.text('Range').last);
    expect(segment.right, lessThanOrEqualTo(400 + 100 + 1));
    expect(segment.left, greaterThanOrEqualTo(300 - 1));
  });

  testWidgets('vertical stacks the segments; segments keep 44 by 44 under '
      'touch', (tester) async {
    await tester.pumpWidget(
      harness(
        const SegmentedControl<String>.uncontrolled(
          label: 'Show',
          items: _filters,
          orientation: Axis.vertical,
        ),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(
      tester.getTopLeft(find.text('Active')).dy,
      greaterThan(tester.getTopLeft(find.text('All')).dy),
    );
    final segment = find.ancestor(
      of: find.text('All'),
      matching: find.byType(ConstrainedBox),
    );
    expect(tester.getSize(segment.first).height, greaterThanOrEqualTo(44));
  });

  testWidgets('a form reset restores the default without a report', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final reports = <String>[];
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: SegmentedControl<String>.uncontrolled(
            label: 'Show',
            items: _filters,
            initialValue: 'active',
            onSelected: reports.add,
          ),
        ),
      ),
    );
    await tester.tap(find.text('Archived'));
    await tester.pump();
    form.currentState!.reset();
    await tester.pump();
    expect(_weight(tester, 'Active'), FontWeight.w600);
    expect(reports, ['archived']);
  });
}
