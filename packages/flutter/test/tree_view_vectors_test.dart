import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/src/tree_view/tree_logic.dart';

// The language-neutral tree view vectors the core tests run against core/.
// Present in a checkout of the whole repository; a copy of this package
// alone skips them.
final File _file = File('../../core/src/tree-view/__vectors__/tree-view.json');

const Map<String, LogicalKeyboardKey> _keys = {
  'ArrowRight': LogicalKeyboardKey.arrowRight,
  'ArrowLeft': LogicalKeyboardKey.arrowLeft,
  'ArrowDown': LogicalKeyboardKey.arrowDown,
  'ArrowUp': LogicalKeyboardKey.arrowUp,
  'Home': LogicalKeyboardKey.home,
  'End': LogicalKeyboardKey.end,
  'Enter': LogicalKeyboardKey.enter,
  ' ': LogicalKeyboardKey.space,
};

List<Map<String, dynamic>> _cases(Object? json) =>
    (json! as List<dynamic>).cast<Map<String, dynamic>>();

Set<String> _set(Object? json) => {
  ...(json as List<dynamic>? ?? const []).cast<String>(),
};

List<TreeNode<String>> _nodes(Object? json) => [
  for (final node in _cases(json))
    TreeNode(
      value: node['value'] as String,
      label: node['value'] as String,
      disabled: node['disabled'] as bool? ?? false,
      hasChildren: node['hasChildren'] as bool? ?? false,
      children: node['children'] == null ? null : _nodes(node['children']),
    ),
];

void main() {
  final skip = _file.existsSync() ? false : 'core/ is not in this checkout';
  group('tree view keyboard vectors', () {
    if (skip != false) return;
    final file = jsonDecode(_file.readAsStringSync()) as Map<String, dynamic>;
    final nodes = _nodes(file['nodes']);
    for (final vector in _cases(file['keys'])) {
      test(vector['name'] as String, () {
        final model = TreeModel(
          nodes,
          expanded: _set(vector['initialExpanded']),
          loading: _set(vector['loading']),
          loadErrors: _set(vector['loadErrors']),
          disabled: vector['disabled'] as bool? ?? false,
        );
        final result = model.key(
          vector['from'] as String,
          _keys[vector['key']]!,
          vector['direction'] == 'rtl' ? TextDirection.rtl : TextDirection.ltr,
        );
        expect(result.load.length, lessThanOrEqualTo(1));
        expect(result.focus, vector['focus']);
        expect(result.expanded?.toList(), vector['expanded']);
        expect(result.select, vector['select']);
        expect(result.load.firstOrNull, vector['load']);
      });
    }
  }, skip: skip);
}
