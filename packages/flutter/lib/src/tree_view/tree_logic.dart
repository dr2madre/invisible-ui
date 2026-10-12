import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../accordion/accordion.dart' show toggleExpanded;
import '../choice/choice_item.dart';
import '../internal/collection.dart';

// The tree rules of `core/src/tree-view/state.ts` and `connect.ts`, in Dart.
// They take data and return data, so the shared vectors in
// core/src/tree-view/__vectors__ hold both implementations to the same
// answers.

/// One node of a [TreeView]: a row named [label], and its [children].
///
/// A node with [hasChildren] and no [children] is a parent whose children
/// are not loaded yet; the tree asks for them when it opens. An empty
/// [children] list is a loaded leaf. Values identify the nodes, so each
/// value appears once in the whole tree.
class TreeNode<T> extends ChoiceItem<T> {
  /// Creates a node.
  const TreeNode({
    required super.value,
    required super.label,
    super.disabled,
    super.icon,
    this.hasChildren = false,
    this.children,
  });

  /// Whether the node is a parent whose [children] are not loaded yet.
  /// Ignored once [children] is set.
  final bool hasChildren;

  /// The child nodes, or null while they are not loaded.
  final List<TreeNode<T>>? children;
}

/// One request for the children of an unloaded parent. The tree never
/// fetches: the app loads them and passes them back in [TreeNode.children].
@immutable
class TreeLoadRequest<T> {
  /// Creates a request.
  const TreeLoadRequest({required this.value, required this.requestId});

  /// The parent whose children are asked for.
  final T value;

  /// A number that grows with every request, so the app can drop a
  /// response that arrives after a newer request.
  final int requestId;

  @override
  bool operator ==(Object other) =>
      other is TreeLoadRequest<T> &&
      other.value == value &&
      other.requestId == requestId;

  @override
  int get hashCode => Object.hash(value, requestId);

  @override
  String toString() => 'TreeLoadRequest($value, $requestId)';
}

/// The load state of a parent whose children are not loaded.
enum TreeLoadState {
  /// Not asked for yet.
  idle,

  /// Asked for, with no answer yet.
  loading,

  /// The latest request failed.
  error,
}

/// A node as the tree shows it, with what the rules need to know about it.
@immutable
class VisibleTreeNode<T> {
  /// Describes [node].
  const VisibleTreeNode({
    required this.node,
    required this.level,
    required this.parent,
    required this.disabled,
    required this.hasChildren,
    required this.childrenLoaded,
    required this.expanded,
    required this.loadState,
  });

  /// The node.
  final TreeNode<T> node;

  /// The depth, 1 at the root.
  final int level;

  /// The parent node, or null at the root.
  final TreeNode<T>? parent;

  /// Whether the node or the whole tree is disabled.
  final bool disabled;

  /// Whether the node opens: loaded children, or an unloaded parent.
  final bool hasChildren;

  /// Whether the children list is set.
  final bool childrenLoaded;

  /// Whether the node is an open parent.
  final bool expanded;

  /// The load state of an unloaded parent; null for leaves and loaded
  /// parents.
  final TreeLoadState? loadState;

  /// The node's value.
  T get value => node.value;
}

/// What a user action changes: the node focus moves to, the new expanded
/// set, the node selected and the parents whose children to request. Each
/// is null, or empty, when the action does not change it.
@immutable
class TreeAction<T> {
  /// Creates an action result.
  const TreeAction({
    this.focus,
    this.expanded,
    this.select,
    this.load = const [],
  });

  /// The node focus moves to.
  final T? focus;

  /// The expanded set after the action.
  final Set<T>? expanded;

  /// The node the action selects.
  final T? select;

  /// The parents whose children the action requests.
  final List<T> load;
}

/// Whether every value in [nodes] appears once, children included.
bool treeValuesUnique<T>(List<TreeNode<T>> nodes) {
  final seen = <T>{};
  bool walk(List<TreeNode<T>> list) => list.every(
    (node) => seen.add(node.value) && walk(node.children ?? const []),
  );
  return walk(nodes);
}

/// The values of every node in [nodes], children included.
Set<T> treeValues<T>(List<TreeNode<T>> nodes) => {
  for (final node in nodes) ...[
    node.value,
    ...treeValues(node.children ?? const []),
  ],
};

/// A tree's state, and what each user action does to it.
///
/// Only the nodes under open parents are visible, and keys move over the
/// visible enabled ones, in reading order, without wrapping.
class TreeModel<T> {
  /// The state of [nodes] with [expanded] open. [loading] holds the
  /// unloaded parents with a request out, and [loadErrors] those whose
  /// latest request failed.
  TreeModel(
    this.nodes, {
    required this.expanded,
    this.disabled = false,
    this.loading = const {},
    this.loadErrors = const {},
  });

  /// The node forest.
  final List<TreeNode<T>> nodes;

  /// The open parents.
  final Set<T> expanded;

  /// Whether the whole tree is disabled.
  final bool disabled;

  /// The unloaded parents with a request out.
  final Set<T> loading;

  /// The unloaded parents whose latest request failed.
  final Set<T> loadErrors;

  /// The visible nodes, in reading order.
  late final List<VisibleTreeNode<T>> visible = _walk(nodes, 1, null);

  late final Map<T, VisibleTreeNode<T>> _byValue = {
    for (final node in visible) node.value: node,
  };

  late final List<T> _enabled = [
    for (final node in visible)
      if (!node.disabled) node.value,
  ];

  List<VisibleTreeNode<T>> _walk(
    List<TreeNode<T>> list,
    int level,
    TreeNode<T>? parent,
  ) {
    final out = <VisibleTreeNode<T>>[];
    for (final node in list) {
      final children = node.children;
      final loaded = children != null;
      // An empty list is a completed load with no children; only a missing
      // list with hasChildren is a parent still to load.
      final hasChildren = loaded ? children.isNotEmpty : node.hasChildren;
      final open = hasChildren && expanded.contains(node.value);
      out.add(
        VisibleTreeNode(
          node: node,
          level: level,
          parent: parent,
          disabled: disabled || node.disabled,
          hasChildren: hasChildren,
          childrenLoaded: loaded,
          expanded: open,
          loadState: loaded || !node.hasChildren
              ? null
              : loading.contains(node.value)
              ? TreeLoadState.loading
              : loadErrors.contains(node.value)
              ? TreeLoadState.error
              : TreeLoadState.idle,
        ),
      );
      if (open && loaded) out.addAll(_walk(children, level + 1, node));
    }
    return out;
  }

  /// The visible node [value], or null when it is hidden or unknown.
  VisibleTreeNode<T>? find(T value) => _byValue[value];

  /// The first visible enabled node.
  T? get first => _enabled.firstOrNull;

  /// The last visible enabled node.
  T? get last => _enabled.lastOrNull;

  /// The visible enabled node after [value], or null at the end.
  T? next(T value) {
    final index = _enabled.indexOf(value);
    return index == -1 || index + 1 >= _enabled.length
        ? null
        : _enabled[index + 1];
  }

  /// The visible enabled node before [value], or null at the start.
  T? previous(T value) {
    final index = _enabled.indexOf(value);
    return index <= 0 ? null : _enabled[index - 1];
  }

  bool _canFocus(T? value) =>
      value != null && !(find(value as T)?.disabled ?? true);

  /// The single tab stop: [focused], else [selected], else the first
  /// visible enabled node, skipping a hidden or disabled one.
  T? tabStop(T? focused, T? selected) => _canFocus(focused)
      ? focused
      : _canFocus(selected)
      ? selected
      : first;

  List<T> _load(T value) {
    final node = find(value);
    if (node == null ||
        node.disabled ||
        node.childrenLoaded ||
        loading.contains(value)) {
      return const [];
    }
    return [value];
  }

  /// Opens or closes the parent [value], and requests its children when it
  /// opens unloaded. Nothing for a leaf or a disabled node.
  TreeAction<T> toggle(T value) {
    final node = find(value);
    if (node == null || node.disabled || !node.hasChildren) {
      return const TreeAction();
    }
    return TreeAction(
      expanded: toggleExpanded(
        expanded,
        value,
        multiple: true,
        collapsible: true,
      ),
      load: node.expanded || node.childrenLoaded ? const [] : _load(value),
    );
  }

  /// Requests again the children of the open parent [value] whose latest
  /// request failed.
  TreeAction<T> retry(T value) {
    final node = find(value);
    if (node == null ||
        !node.expanded ||
        node.loadState != TreeLoadState.error) {
      return const TreeAction();
    }
    return TreeAction(load: _load(value));
  }

  /// What [key] pressed on the node [from] does.
  ///
  /// Down and Up move to the next and previous visible enabled node. The
  /// arrow toward the inline-end opens a closed parent, enters an open
  /// loaded one, and requests the children of an open unloaded one; the
  /// arrow toward the inline-start closes an open parent, else moves to the
  /// parent. In right-to-left text left and right swap. Home and End jump
  /// to the ends; Enter and Space select.
  TreeAction<T> key(T from, LogicalKeyboardKey key, TextDirection direction) {
    final node = find(from);
    if (node == null) return const TreeAction();
    final rtl = direction == TextDirection.rtl;
    final inward = rtl
        ? LogicalKeyboardKey.arrowLeft
        : LogicalKeyboardKey.arrowRight;
    final outward = rtl
        ? LogicalKeyboardKey.arrowRight
        : LogicalKeyboardKey.arrowLeft;
    if (key == LogicalKeyboardKey.arrowDown) {
      return TreeAction(focus: next(from));
    }
    if (key == LogicalKeyboardKey.arrowUp) {
      return TreeAction(focus: previous(from));
    }
    if (key == inward) {
      if (!node.hasChildren) return const TreeAction();
      if (!node.expanded) return toggle(from);
      // The next visible node of an open loaded parent is its first child.
      if (node.childrenLoaded) return TreeAction(focus: next(from));
      return TreeAction(load: _load(from));
    }
    if (key == outward) {
      if (node.hasChildren && node.expanded) return toggle(from);
      return TreeAction(focus: node.parent?.value);
    }
    if (key == LogicalKeyboardKey.home) return TreeAction(focus: first);
    if (key == LogicalKeyboardKey.end) return TreeAction(focus: last);
    if (key == LogicalKeyboardKey.enter || key == LogicalKeyboardKey.space) {
      return TreeAction(select: node.disabled ? null : from);
    }
    return const TreeAction();
  }

  /// The next visible enabled node after [from] whose label starts with
  /// [query], ignoring case and wrapping.
  T? match(String query, T from) => matchOption(
    [
      for (final node in visible)
        if (!node.disabled) node.node,
    ],
    query,
    from,
  );

  /// Opens every closed, enabled parent beside [from] at its level, and
  /// requests the children of those not loaded.
  TreeAction<T> expandSiblings(T from) {
    final node = find(from);
    if (node == null) return const TreeAction();
    final closed = [
      for (final sibling in visible)
        if (identical(sibling.parent, node.parent) &&
            sibling.hasChildren &&
            !sibling.disabled &&
            !sibling.expanded)
          sibling,
    ];
    if (closed.isEmpty) return const TreeAction();
    return TreeAction(
      expanded: {...expanded, for (final s in closed) s.value},
      load: [for (final s in closed) ..._load(s.value)],
    );
  }
}
