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

/// The tree view in its common states: an open parent with a selected
/// child, a disabled node, a parent loading its children and one whose load
/// failed.
@Preview(
  group: 'Tree view',
  name: 'States, light',
  brightness: Brightness.light,
)
@Preview(group: 'Tree view', name: 'States, dark', brightness: Brightness.dark)
Widget treeStates() => const PreviewSheet(child: _Trees());

/// The same trees right to left at text scale 2.0 in a narrow column: the
/// chevrons point left, long labels end in an ellipsis and the load status
/// moves under the label.
@Preview(
  group: 'Tree view',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(320, 1400),
)
Widget treeRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Trees()),
);

/// Touch density: every row and chevron keeps a 44 by 44 target.
@Preview(group: 'Tree view', name: 'Touch density')
Widget treeTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Trees());

const List<TreeNode<String>> _files = [
  TreeNode(
    value: 'projects',
    label: 'Projects',
    children: [
      TreeNode(
        value: 'timelog',
        label: 'Timelog, the desktop app for logging hours',
        children: [
          TreeNode(value: 'readme', label: 'README.md'),
          TreeNode(value: 'pubspec', label: 'pubspec.yaml'),
        ],
      ),
      TreeNode(value: 'wireframe', label: 'Wireframe'),
      TreeNode(value: 'old', label: 'Old drafts', disabled: true),
    ],
  ),
  TreeNode(value: 'shared', label: 'Shared with me', hasChildren: true),
  TreeNode(value: 'remote', label: 'Remote drive', hasChildren: true),
  TreeNode(value: 'trash', label: 'Trash'),
];

class _Trees extends StatelessWidget {
  const _Trees();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 24,
        children: [
          TreeView<String>.uncontrolled(
            label: 'Files',
            nodes: _files,
            initialSelected: 'readme',
            initialExpanded: {'projects', 'timelog', 'shared', 'remote'},
            loading: {'shared'},
            loadErrors: {'remote'},
          ),
          TreeView<String>.uncontrolled(
            label: 'Archived files',
            nodes: _files,
            initialExpanded: {'projects'},
            enabled: false,
          ),
        ],
      ),
    );
  }
}
