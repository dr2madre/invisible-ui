// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// The bar at the bottom of a phone-sized column: Hours is current, Clients
/// has a count, Projects is unavailable and Profile needs attention. Press a
/// destination to make it current.
@Preview(
  group: 'Navigation bar',
  name: 'Light',
  brightness: Brightness.light,
  size: Size(360, 240),
)
@Preview(
  group: 'Navigation bar',
  name: 'Dark',
  brightness: Brightness.dark,
  size: Size(360, 240),
)
Widget navigationBarStates() => const PreviewSheet(child: _Bar());

/// Right to left at text scale 2.0 in a 320 wide column: the first
/// destination is at the right, labels wrap and the bar grows taller.
@Preview(
  group: 'Navigation bar',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(352, 360),
)
Widget navigationBarRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Bar()),
);

/// Touch density: every destination keeps a 44 by 44 target.
@Preview(group: 'Navigation bar', name: 'Touch density', size: Size(360, 240))
Widget navigationBarTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Bar());

enum _Section { home, clients, projects, hours, profile }

class _Bar extends StatefulWidget {
  const _Bar();

  @override
  State<_Bar> createState() => _BarState();
}

class _BarState extends State<_Bar> {
  _Section _section = _Section.hours;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        NavigationBar<_Section>(
          value: _section,
          onSelected: (section) => setState(() => _section = section),
          destinations: const [
            NavigationDestination(
              value: _Section.home,
              label: 'Home',
              icon: PreviewGlyph(),
            ),
            NavigationDestination(
              value: _Section.clients,
              label: 'Clients',
              icon: PreviewGlyph(),
              badge: NavigationBadge(label: '3 new', content: '3'),
            ),
            NavigationDestination(
              value: _Section.projects,
              label: 'Projects',
              icon: PreviewGlyph(),
              unavailableReason: 'Available online only',
            ),
            NavigationDestination(
              value: _Section.hours,
              label: 'Hours',
              icon: PreviewGlyph(),
            ),
            NavigationDestination(
              value: _Section.profile,
              label: 'Profile',
              icon: PreviewGlyph(),
              badge: NavigationBadge(label: 'Needs attention'),
            ),
          ],
        ),
      ],
    );
  }
}
