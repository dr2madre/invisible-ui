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

/// A tooltip on an icon-only button: hover it, or focus it with Tab.
@Preview(group: 'Tooltip', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Tooltip', name: 'Dark', brightness: Brightness.dark)
Widget tooltipPreview() => PreviewSheet(
  child: Center(
    child: Tooltip(
      message: 'Adds a row below the current one',
      child: Button.icon(
        onPressed: () {},
        icon: const PreviewGlyph(),
        semanticLabel: 'Add row',
      ),
    ),
  ),
);

/// A formatting toolbar with groups, and the same toolbar right to left at
/// text scale 2.0 in a narrow column, where it wraps.
@Preview(group: 'Toolbar', name: 'Horizontal')
Widget toolbarPreview() => const PreviewSheet(child: _Formatting());

@Preview(
  group: 'Toolbar',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 640),
)
Widget toolbarRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Formatting()),
);

@Preview(group: 'Toolbar', name: 'Vertical, touch')
Widget toolbarVertical() => const PreviewSheet(
  density: InvisibleDensity.touch,
  child: _Formatting(orientation: Axis.vertical),
);

class _Formatting extends StatelessWidget {
  const _Formatting({this.orientation = Axis.horizontal});

  final Axis orientation;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: AlignmentDirectional.topStart,
      child: Toolbar(
        semanticLabel: 'Formatting',
        orientation: orientation,
        children: [
          Button(onPressed: () {}, child: const Text('Bold')),
          Button(onPressed: () {}, child: const Text('Italic')),
          const ToolbarSeparator(),
          Button(onPressed: () {}, child: const Text('Left')),
          Button(onPressed: null, child: const Text('Centre')),
          Button(onPressed: () {}, child: const Text('Right')),
        ],
      ),
    );
  }
}

/// A Dropdown Menu with groups, checkable items and a two-level submenu.
@Preview(group: 'Dropdown Menu', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Dropdown Menu', name: 'Dark', brightness: Brightness.dark)
Widget dropdownMenuPreview() => const PreviewSheet(child: _FileMenu());

@Preview(
  group: 'Dropdown Menu',
  name: 'Right to left, narrow, text scale 2.0',
  textScaleFactor: 2,
  size: Size(320, 640),
)
Widget dropdownMenuRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _FileMenu()),
);

class _FileMenu extends StatefulWidget {
  const _FileMenu();

  @override
  State<_FileMenu> createState() => _FileMenuState();
}

class _FileMenuState extends State<_FileMenu> {
  bool _wrap = true;
  String _theme = 'light';
  String _last = 'Nothing chosen yet';

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownMenu<String>(
          label: 'File',
          onSelected: (value) => setState(() {
            _last = 'Chose $value';
            if (value == 'wrap') _wrap = !_wrap;
            if (value.startsWith('theme-')) _theme = value.substring(6);
          }),
          items: [
            const MenuItem(value: 'new', label: 'New file'),
            const MenuSubmenu(
              value: 'recent',
              label: 'Open recent',
              items: [
                MenuItem(value: 'notes', label: 'Notes'),
                MenuItem(value: 'budget', label: 'Budget'),
                MenuSubmenu(
                  value: 'older',
                  label: 'Older',
                  items: [MenuItem(value: 'archive', label: 'Archive 2025')],
                ),
              ],
            ),
            const MenuSubmenu(
              value: 'share',
              label: 'Share',
              disabled: true,
              items: [MenuItem(value: 'mail', label: 'Mail')],
            ),
            const MenuSeparator(),
            MenuGroup(
              label: 'View',
              items: [
                MenuItem(
                  value: 'wrap',
                  label: 'Word wrap',
                  kind: MenuItemKind.checkbox,
                  checked: _wrap,
                ),
                MenuItem(
                  value: 'theme-light',
                  label: 'Light theme',
                  kind: MenuItemKind.radio,
                  checked: _theme == 'light',
                ),
                MenuItem(
                  value: 'theme-dark',
                  label: 'Dark theme',
                  kind: MenuItemKind.radio,
                  checked: _theme == 'dark',
                ),
              ],
            ),
            const MenuItem(value: 'quit', label: 'Quit'),
          ],
        ),
        const SizedBox(height: 16),
        Text(_last),
      ],
    );
  }
}

/// Inline notifications in every status, with an action and a close button.
@Preview(group: 'Notifications', name: 'Inline, light')
@Preview(
  group: 'Notifications',
  name: 'Inline, dark',
  brightness: Brightness.dark,
)
Widget inlineNotificationPreview() => PreviewSheet(
  child: SingleChildScrollView(
    child: Column(
      spacing: 8,
      children: [
        for (final status in NotificationStatus.values)
          InlineNotification(
            status: status,
            title: 'A ${status.name} message',
            description: 'What happened and what to do next.',
            actions: status == NotificationStatus.danger
                ? [NotificationAction(label: 'Retry', onPressed: () {})]
                : const [],
            onClose: () {},
          ),
        const InlineNotification(
          title: 'Inverted',
          description: 'A high-contrast surface.',
          inverted: true,
        ),
      ],
    ),
  ),
);

/// A notification region with buttons that add toasts.
@Preview(group: 'Notifications', name: 'Region', size: Size(800, 600))
Widget notificationRegionPreview() => const PreviewSheet(child: _Toasts());

class _Toasts extends StatefulWidget {
  const _Toasts();

  @override
  State<_Toasts> createState() => _ToastsState();
}

class _ToastsState extends State<_Toasts> {
  final NotificationController _notices = NotificationController();
  int _count = 0;

  @override
  void dispose() {
    _notices.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NotificationRegion(
      controller: _notices,
      child: Align(
        alignment: AlignmentDirectional.bottomStart,
        child: Wrap(
          spacing: 8,
          children: [
            Button(
              onPressed: () => _notices.success(
                'Saved ${++_count}',
                duration: const Duration(seconds: 5),
              ),
              child: const Text('Saved, 5 s'),
            ),
            Button(
              onPressed: () => _notices.danger(
                'Upload failed',
                text: 'The connection dropped.',
                actions: [const NotificationAction(label: 'Retry')],
              ),
              child: const Text('Failed, stays'),
            ),
          ],
        ),
      ),
    );
  }
}
