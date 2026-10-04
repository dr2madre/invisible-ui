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

/// The date and time fields: open a picker with a click, Enter, Space or
/// Down; type into the time field's segments.
@Preview(group: 'Dates', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Dates', name: 'Dark', brightness: Brightness.dark)
Widget dateFields() => const PreviewSheet(child: _DateFields());

/// The same right to left at text scale 2.0 in a narrow column.
@Preview(
  group: 'Dates',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget dateFieldsRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _DateFields()),
);

/// A calendar with bounds, in Italian, the week starting on Monday.
@Preview(group: 'Calendar', name: 'Month, Italian, bounded')
Widget calendarMonth() => PreviewSheet(
  child: Calendar.uncontrolled(
    initialValue: DateTime(2026, 6, 10),
    min: DateTime(2026, 6, 3),
    max: DateTime(2026, 6, 26),
    locale: const Locale('it'),
  ),
);

/// A range over two months, the week starting on Sunday.
@Preview(group: 'Calendar', name: 'Range, two months', size: Size(680, 520))
Widget calendarRange() => PreviewSheet(
  child: Calendar.rangeUncontrolled(
    initialRange: DateRange(DateTime(2026, 6, 24), DateTime(2026, 7, 3)),
    view: CalendarView.twoMonth,
    weekStartsOn: DateTime.sunday,
  ),
);

/// The same range under touch density, 44 by 44 days.
@Preview(group: 'Calendar', name: 'Touch', size: Size(400, 520))
Widget calendarTouch() => PreviewSheet(
  density: InvisibleDensity.touch,
  child: Calendar.rangeUncontrolled(
    initialRange: DateRange(DateTime(2026, 6, 8), DateTime(2026, 6, 12)),
  ),
);

class _DateFields extends StatelessWidget {
  const _DateFields();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DatePicker.uncontrolled(
          label: 'Day',
          initialValue: DateTime(2026, 6, 10),
          clearable: true,
        ),
        gap,
        const DateRangePicker.uncontrolled(
          label: 'Report period',
          description: 'Pick the first day, then the last.',
          clearable: true,
        ),
        gap,
        const TimeField.uncontrolled(label: 'Start', initialValue: '09:00'),
        gap,
        const TimeField.uncontrolled(
          label: 'End',
          hourCycle: 24,
          withSeconds: true,
          max: '18:00',
          initialValue: '18:30:00',
        ),
      ],
    );
  }
}
