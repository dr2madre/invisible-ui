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

const List<ChoiceItem<String>> _projects = [
  ChoiceItem(value: 'atlas', label: 'Atlas'),
  ChoiceItem(value: 'beacon', label: 'Beacon'),
  ChoiceItem(value: 'cargo', label: 'Cargo', disabled: true),
  ChoiceItem(value: 'delta', label: 'Delta app'),
];

/// Select and Combobox: open them with a click, Down or by typing.
@Preview(group: 'Pickers', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Pickers', name: 'Dark', brightness: Brightness.dark)
Widget pickers() => const PreviewSheet(child: _Pickers());

/// The same right to left at text scale 2.0 in a narrow column.
@Preview(
  group: 'Pickers',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget pickersRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Pickers()),
);

/// A cascading region picker in a popover: a search field and the regions
/// that match it.
@Preview(group: 'Popover', name: 'Region picker')
Widget regionPicker() => const PreviewSheet(child: _RegionPicker());

/// A hover preview on a link-like trigger.
@Preview(group: 'Popover', name: 'Hover')
Widget hoverPreview() => PreviewSheet(
  child: Align(
    alignment: AlignmentDirectional.topStart,
    child: Popover.hover(
      trigger: Button(
        onPressed: () {},
        variant: ButtonVariant.ghost,
        child: const Text('Ada Lovelace'),
      ),
      builder: (context, _) =>
          const Text('Engines team. Logged 32 hours this week.'),
    ),
  ),
);

class _Pickers extends StatelessWidget {
  const _Pickers();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return const Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Select<String>.uncontrolled(
          label: 'Status',
          items: [
            ChoiceItem(value: 'draft', label: 'Draft'),
            ChoiceItem(value: 'review', label: 'In review'),
            ChoiceItem(value: 'done', label: 'Done'),
          ],
        ),
        gap,
        Select<String>.uncontrolled(
          label: 'Currency',
          initialValue: 'eur',
          description: 'Used for rates and totals.',
          items: [
            ChoiceItem(value: 'eur', label: 'Euro'),
            ChoiceItem(value: 'usd', label: 'US dollar'),
            ChoiceItem(value: 'gbp', label: 'Pound sterling'),
          ],
        ),
        gap,
        Combobox<String>.uncontrolled(
          label: 'Project',
          items: _projects,
          required: true,
        ),
        gap,
        Combobox<String>.uncontrolled(
          label: 'Client',
          description: 'Optional.',
          initialValue: 'beacon',
          items: _projects,
        ),
      ],
    );
  }
}

class _RegionPicker extends StatefulWidget {
  const _RegionPicker();

  @override
  State<_RegionPicker> createState() => _RegionPickerState();
}

class _RegionPickerState extends State<_RegionPicker> {
  static const _regions = ['Liguria', 'Lombardia', 'Piemonte', 'Toscana'];
  String _query = '';
  String? _region;

  @override
  Widget build(BuildContext context) {
    final shown = [
      for (final region in _regions)
        if (region.toLowerCase().contains(_query.toLowerCase())) region,
    ];
    return Align(
      alignment: AlignmentDirectional.topStart,
      child: Popover(
        label: 'Region',
        trigger: Text(_region ?? 'Choose a region'),
        builder: (context, popover) => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            TextField.uncontrolled(
              label: 'Search regions',
              onChanged: (query) => setState(() => _query = query),
            ),
            for (final region in shown)
              Button(
                onPressed: () {
                  setState(() => _region = region);
                  popover.close();
                },
                variant: ButtonVariant.ghost,
                child: Text(region),
              ),
          ],
        ),
      ),
    );
  }
}
