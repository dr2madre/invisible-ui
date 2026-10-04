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

/// The disclosures and navigation in their common states: Collapsible,
/// Accordion, Tabs, Breadcrumb, Pagination and Link.
@Preview(
  group: 'Navigation',
  name: 'States, light',
  brightness: Brightness.light,
)
@Preview(group: 'Navigation', name: 'States, dark', brightness: Brightness.dark)
Widget navigationStates() => const PreviewSheet(child: _Navigation());

/// The same set right to left at text scale 2.0 in a narrow column: the tab
/// row scrolls sideways, the trail and the pager wrap.
@Preview(
  group: 'Navigation',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1800),
)
Widget navigationRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Navigation()),
);

/// Touch density: every header, tab, page and link keeps a 44 by 44 target.
@Preview(group: 'Navigation', name: 'Touch density')
Widget navigationTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Navigation());

/// Progress and Meter: bars, a ring, and the meter's judgement of the same
/// reading for battery and for disk.
@Preview(group: 'Values', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Values', name: 'Dark', brightness: Brightness.dark)
Widget valueStates() => const PreviewSheet(child: _Values());

/// The values right to left at text scale 2.0: the fills start at the right.
@Preview(
  group: 'Values',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 600),
)
Widget valuesRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Values()),
);

void _open() {}

class _Navigation extends StatelessWidget {
  const _Navigation();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 24);
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Breadcrumb(
            items: [
              BreadcrumbItem(label: 'Home', home: true, onPressed: _open),
              BreadcrumbItem(label: 'Projects', onPressed: _open),
              BreadcrumbItem(label: 'Timelog'),
            ],
          ),
          gap,
          const Tabs<String>.uncontrolled(
            label: 'Project',
            items: [
              TabItem(
                value: 'hours',
                label: 'Hours',
                count: 12,
                child: Text('This week: 32 hours.'),
              ),
              TabItem(
                value: 'people',
                label: 'People',
                child: Text('Four people log time here.'),
              ),
              TabItem(
                value: 'billing',
                label: 'Billing',
                disabled: true,
                child: Text('Not set up.'),
              ),
            ],
          ),
          gap,
          const Collapsible.uncontrolled(
            label: 'Filters',
            child: Text('Only billable hours are shown.'),
          ),
          gap,
          const Accordion<String>.uncontrolled(
            initialValue: {'shipping'},
            items: [
              AccordionItem(
                value: 'shipping',
                label: 'Shipping',
                child: Text('Ships in 2-3 days.'),
              ),
              AccordionItem(
                value: 'returns',
                label: 'Returns',
                child: Text('30-day returns.'),
              ),
              AccordionItem(
                value: 'gift',
                label: 'Gift wrap',
                disabled: true,
                child: Text('Not offered.'),
              ),
            ],
          ),
          gap,
          const Pagination.uncontrolled(pageCount: 20, initialPage: 10),
          gap,
          const Wrap(
            spacing: 16,
            children: [
              Link(onPressed: _open, child: Text('Read the guide')),
              Link(
                onPressed: _open,
                variant: LinkVariant.subtle,
                child: Text('Release notes'),
              ),
              Link(onPressed: _open, external: true, child: Text('Website')),
            ],
          ),
        ],
      ),
    );
  }
}

class _Values extends StatelessWidget {
  const _Values();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return const Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Progress(value: 7, max: 10, label: 'Achievements unlocked'),
        gap,
        Progress(
          value: 82,
          label: 'Profile completeness',
          shape: ProgressShape.circle,
          showValue: true,
        ),
        gap,
        Meter(value: 90, low: 20, high: 80, label: 'Battery'),
        gap,
        Meter(value: 90, low: 20, high: 80, optimum: 0, label: 'Disk usage'),
        gap,
        Meter(value: 50, low: 20, high: 80, label: 'Signal'),
      ],
    );
  }
}
