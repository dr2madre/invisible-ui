// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. The previewer arrived in Flutter 3.35, after the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// The choice controls in their common states: Checkbox, CheckboxGroup,
/// Switch, RadioButtonGroup and SegmentedControl.
@Preview(group: 'Choices', name: 'States, light', brightness: Brightness.light)
@Preview(group: 'Choices', name: 'States, dark', brightness: Brightness.dark)
Widget choiceStates() => const PreviewSheet(child: _Choices());

/// The same set right to left at text scale 2.0 in a narrow column: labels
/// wrap, the segmented bar scrolls sideways.
@Preview(
  group: 'Choices',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1600),
)
Widget choicesRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Choices()),
);

/// Touch density: every row and segment keeps a 44 by 44 target.
@Preview(group: 'Choices', name: 'Touch density')
Widget choicesTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Choices());

class _Choices extends StatelessWidget {
  const _Choices();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return const SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Checkbox.uncontrolled(
            label: 'Remember this device',
            description: 'For 30 days.',
          ),
          gap,
          Checkbox(label: 'All projects', value: null),
          gap,
          Checkbox.uncontrolled(
            label: 'I accept the terms',
            error: 'Accept the terms to go on.',
          ),
          gap,
          CheckboxGroup<int>.uncontrolled(
            label: 'Working days',
            description: 'May be empty.',
            initialValue: [1, 2, 3, 4, 5],
            items: [
              ChoiceItem(value: 1, label: 'Monday'),
              ChoiceItem(value: 2, label: 'Tuesday'),
              ChoiceItem(value: 3, label: 'Wednesday'),
              ChoiceItem(value: 4, label: 'Thursday'),
              ChoiceItem(value: 5, label: 'Friday'),
              ChoiceItem(value: 6, label: 'Saturday'),
              ChoiceItem(value: 7, label: 'Sunday', disabled: true),
            ],
          ),
          gap,
          Switch.uncontrolled(label: 'Autosave', initialValue: true),
          gap,
          Switch.uncontrolled(label: 'Compact rows', onOff: true),
          gap,
          Switch.uncontrolled(label: 'Sync', enabled: false),
          gap,
          RadioButtonGroup<String>.uncontrolled(
            label: 'Export',
            initialValue: 'month',
            items: [
              ChoiceItem(value: 'month', label: 'This month'),
              ChoiceItem(value: 'year', label: 'This year'),
              ChoiceItem(value: 'all', label: 'Everything'),
              ChoiceItem(value: 'view', label: 'The filtered view'),
            ],
          ),
          gap,
          SegmentedControl<String>.uncontrolled(
            label: 'Show',
            initialValue: 'active',
            items: [
              ChoiceItem(value: 'all', label: 'All'),
              ChoiceItem(value: 'active', label: 'Active'),
              ChoiceItem(value: 'archived', label: 'Archived'),
            ],
          ),
          gap,
          SegmentedControl<String>.uncontrolled(
            label: 'Range',
            initialValue: 'month',
            items: [
              ChoiceItem(value: 'month', label: 'Month'),
              ChoiceItem(value: 'year', label: 'Year'),
              ChoiceItem(value: 'all', label: 'All'),
              ChoiceItem(value: 'range', label: 'Range'),
            ],
          ),
        ],
      ),
    );
  }
}
