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

/// The site navigation: a Navigation Menu bar over a Sidebar whose current
/// destination sits in a collapsible section.
@Preview(
  group: 'Site navigation',
  name: 'Light',
  brightness: Brightness.light,
  size: Size(720, 640),
)
@Preview(
  group: 'Site navigation',
  name: 'Dark',
  brightness: Brightness.dark,
  size: Size(720, 640),
)
Widget siteNavigationStates() => const PreviewSheet(child: _SiteNavigation());

/// Right to left at text scale 2.0 in a narrow column: the bar wraps onto
/// more rows and the sidebar takes the column's width, its labels wrapping.
@Preview(
  group: 'Site navigation',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1400),
)
Widget siteNavigationRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _SiteNavigation()),
);

/// Touch density: every trigger, link, heading and destination keeps a 44
/// by 44 target.
@Preview(group: 'Site navigation', name: 'Touch density', size: Size(720, 720))
Widget siteNavigationTouch() => const PreviewSheet(
  density: InvisibleDensity.touch,
  child: _SiteNavigation(),
);

/// The sidebar as a rail: icons only, a tooltip on each, and the toggle
/// that expands it again.
@Preview(group: 'Site navigation', name: 'Rail', size: Size(360, 640))
Widget siteNavigationRail() =>
    const PreviewSheet(child: _SiteNavigation(collapsed: true));

void _open() {}

const List<NavigationMenuItem<String>> _bar = [
  NavigationMenuItem.panel(
    value: 'products',
    label: 'Products',
    links: [
      NavigationMenuLink(
        label: 'Timesheets',
        description: 'Log hours against projects and tasks.',
        onPressed: _open,
      ),
      NavigationMenuLink(
        label: 'Reports',
        description: 'Totals by person, project and week.',
        onPressed: _open,
      ),
    ],
  ),
  NavigationMenuItem.panel(
    value: 'resources',
    label: 'Resources',
    links: [
      NavigationMenuLink(label: 'Guides', onPressed: _open),
      NavigationMenuLink(label: 'Release notes', onPressed: _open),
    ],
  ),
  NavigationMenuItem.link(value: 'pricing', label: 'Pricing', onPressed: _open),
];

const Widget _icon = PreviewGlyph();

const List<SidebarSection<String>> _sections = [
  SidebarSection(
    label: 'Workspace',
    items: [
      SidebarItem(value: 'home', label: 'Home', icon: _icon),
      SidebarItem(value: 'inbox', label: 'Inbox', icon: _icon),
    ],
  ),
  SidebarSection.collapsible(
    id: 'projects',
    label: 'Projects',
    items: [
      SidebarItem(value: 'timelog', label: 'Timelog', icon: _icon),
      SidebarItem(
        value: 'wireframe',
        label: 'Wireframe desktop editor',
        icon: _icon,
      ),
    ],
  ),
  SidebarSection.collapsible(
    id: 'settings',
    label: 'Settings',
    items: [SidebarItem(value: 'profile', label: 'Profile', icon: _icon)],
  ),
];

class _SiteNavigation extends StatefulWidget {
  const _SiteNavigation({this.collapsed = false});

  final bool collapsed;

  @override
  State<_SiteNavigation> createState() => _SiteNavigationState();
}

class _SiteNavigationState extends State<_SiteNavigation> {
  late bool _collapsed = widget.collapsed;
  String _current = 'timelog';

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 24,
      children: [
        if (!widget.collapsed)
          const NavigationMenu<String>(label: 'Site', items: _bar),
        Expanded(
          child: Align(
            alignment: AlignmentDirectional.topStart,
            child: Sidebar<String>(
              sections: _sections,
              value: _current,
              onSelected: (value) => setState(() => _current = value),
              collapsed: _collapsed,
              onCollapsedChanged: (value) => setState(() => _collapsed = value),
              logo: const Text('Timelog'),
              footer: const Text('Signed in as Ada'),
            ),
          ),
        ),
      ],
    );
  }
}
