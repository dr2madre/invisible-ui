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

/// A menubar over a canvas with a context menu: open a menu with a click or
/// the keyboard, and the context menu with a secondary click, a long press
/// or Shift+F10.
@Preview(group: 'Menus', name: 'Menubar and Context Menu, light')
@Preview(
  group: 'Menus',
  name: 'Menubar and Context Menu, dark',
  brightness: Brightness.dark,
)
Widget menusPreview() => const PreviewSheet(child: _Menus());

/// The same right to left at text scale 2.0 in a narrow column: the bar
/// wraps and every menu stays inside.
@Preview(
  group: 'Menus',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 720),
)
Widget menusRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Menus()),
);

/// Touch density: every trigger and item keeps a 44 by 44 target.
@Preview(group: 'Menus', name: 'Touch density')
Widget menusTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Menus());

const List<MenuEntry<String>> _arrange = [
  MenuItem(value: 'front', label: 'Bring to front'),
  MenuItem(value: 'back', label: 'Send to back'),
];

class _Menus extends StatefulWidget {
  const _Menus();

  @override
  State<_Menus> createState() => _MenusState();
}

class _MenusState extends State<_Menus> {
  bool _grid = true;
  String _last = 'Nothing chosen yet';

  void _choose(String value) => setState(() {
    _last = 'Chose $value';
    if (value == 'grid') _grid = !_grid;
  });

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          Menubar<String>(
            label: 'Application',
            onSelected: (menu, item) => _choose('$menu, $item'),
            menus: [
              const MenubarMenu(
                value: 'file',
                label: 'File',
                items: [
                  MenuItem(value: 'new', label: 'New file'),
                  MenuSubmenu(
                    value: 'recent',
                    label: 'Open recent',
                    items: [
                      MenuItem(value: 'notes', label: 'Notes'),
                      MenuItem(value: 'budget', label: 'Budget'),
                    ],
                  ),
                  MenuSeparator(),
                  MenuItem(value: 'quit', label: 'Quit'),
                ],
              ),
              const MenubarMenu(
                value: 'edit',
                label: 'Edit',
                items: [
                  MenuItem(value: 'undo', label: 'Undo'),
                  MenuItem(value: 'redo', label: 'Redo'),
                ],
              ),
              MenubarMenu(
                value: 'view',
                label: 'View',
                items: [
                  MenuItem(
                    value: 'grid',
                    label: 'Show grid',
                    kind: MenuItemKind.checkbox,
                    checked: _grid,
                  ),
                ],
              ),
              const MenubarMenu(
                value: 'help',
                label: 'Help',
                disabled: true,
                items: [MenuItem(value: 'about', label: 'About')],
              ),
            ],
          ),
          ContextMenu<String>(
            onSelected: _choose,
            items: [
              const MenuItem(value: 'cut', label: 'Cut'),
              const MenuItem(value: 'copy', label: 'Copy'),
              const MenuItem(value: 'paste', label: 'Paste', disabled: true),
              const MenuSeparator(),
              const MenuSubmenu(
                value: 'arrange',
                label: 'Arrange',
                items: _arrange,
              ),
              MenuItem(
                value: 'grid',
                label: 'Show grid',
                kind: MenuItemKind.checkbox,
                checked: _grid,
              ),
            ],
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(color: theme.colors.border),
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: const SizedBox(
                height: 160,
                width: double.infinity,
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Secondary click or long press here',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Text(_last),
        ],
      ),
    );
  }
}
