import 'dart:async';
import 'dart:math' as math;
// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../i18n/messages.dart';
import '../internal/ambient.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../internal/roving.dart';
import '../theme/theme.dart';
import 'tree_logic.dart';

export 'tree_logic.dart' show TreeLoadRequest, TreeNode;

// Sizes the web TreeView sets in its own stylesheet.
const double _treePadding = 4;
const double _rowPaddingY = 4.8;
const double _rowPaddingEnd = 8;
const double _rowPaddingStart = 6.4;
const double _indent = 17.6;
const double _gap = 5.6;
const double _twistieSide = 24;
const double _glyphSide = 17.6;
const double _checkSide = 16;
const double _statusSize = 14;
const double _strokeWidth = 2.625;
const double _selectedTint = 0.1;
const double _selectedHoverTint = 0.16;
const double _disabledOpacity = 0.5;
const Duration _turn = Duration(milliseconds: 120);

// Grows with every request of every tree, as the web's counter does.
int _requestCounter = 0;

/// A tree of nodes, following the WAI-ARIA tree view pattern: one node is
/// selected, parents open and close, and the keyboard moves over the
/// visible nodes.
///
/// The tree is one tab stop: the node that last had focus, else the
/// selected one, else the first. Down and Up move between the visible
/// enabled nodes without wrapping, and Home and End jump to the ends. The
/// arrow toward the inline-end opens a closed parent and enters an open
/// one; the arrow toward the inline-start closes an open parent, else moves
/// to the parent; in right-to-left text the two swap. Enter, Space or a
/// press selects. Typing letters moves focus to the next node whose label
/// starts with them, and `*` opens every parent beside the focused node.
/// A press on a parent's chevron opens or closes it without selecting.
///
/// A node with [TreeNode.hasChildren] and no children loads them on demand:
/// opening it calls [onLoadChildren] once, and the app passes the children
/// back in [nodes]. While the parent is in [loading] or [loadErrors], its
/// row shows a status after the label; on a failure the arrow toward the
/// inline-end, or a press on the chevron, asks again.
///
/// Controlled, [TreeView] shows [selected] and [expanded] and reports each
/// change through [onSelectionChanged] and [onExpansionChanged];
/// [TreeView.uncontrolled] keeps its own. A changed [selected] or
/// [expanded] is shown without a report. It takes the width its parent
/// gives, or the width of its rows when the width is open.
class TreeView<T> extends StatefulWidget {
  /// A tree that shows [selected] and [expanded], controlled by the parent.
  const TreeView({
    super.key,
    required this.label,
    required this.nodes,
    required this.selected,
    required Set<T> this.expanded,
    this.onSelectionChanged,
    this.onExpansionChanged,
    this.loading = const {},
    this.loadErrors = const {},
    this.onLoadChildren,
    this.enabled = true,
  }) : initialSelected = null,
       initialExpanded = const {},
       _controlled = true;

  /// A tree that keeps its own selection and expanded set, starting from
  /// [initialSelected] and [initialExpanded].
  const TreeView.uncontrolled({
    super.key,
    required this.label,
    required this.nodes,
    this.initialSelected,
    this.initialExpanded = const {},
    this.onSelectionChanged,
    this.onExpansionChanged,
    this.loading = const {},
    this.loadErrors = const {},
    this.onLoadChildren,
    this.enabled = true,
  }) : selected = null,
       expanded = null,
       _controlled = false;

  /// The accessible name of the tree.
  final String label;

  /// The node forest. Each value appears once in the whole tree.
  final List<TreeNode<T>> nodes;

  /// The selected node when the parent controls it, or null.
  final T? selected;

  /// The open parents when the parent controls them.
  final Set<T>? expanded;

  /// The node the uncontrolled tree starts with selected.
  final T? initialSelected;

  /// The parents the uncontrolled tree starts with open.
  final Set<T> initialExpanded;

  /// Called with the selected node after a user selection. Never called for
  /// a changed [selected].
  final ValueChanged<T>? onSelectionChanged;

  /// Called with the open parents after the user opens or closes one. Never
  /// called for a changed [expanded].
  final ValueChanged<Set<T>>? onExpansionChanged;

  /// The unloaded parents whose children are on their way.
  final Set<T> loading;

  /// The unloaded parents whose latest request failed.
  final Set<T> loadErrors;

  /// Called once per opened unloaded parent, and on each retry, to ask the
  /// app for its children.
  final ValueChanged<TreeLoadRequest<T>>? onLoadChildren;

  /// Whether the nodes take focus, open and select.
  final bool enabled;

  final bool _controlled;

  @override
  State<TreeView<T>> createState() => _TreeViewState<T>();
}

class _TreeViewState<T> extends State<TreeView<T>> {
  late T? _selected = widget._controlled
      ? widget.selected
      : widget.initialSelected;
  late Set<T> _expanded = widget._controlled
      ? widget.expanded!
      : widget.initialExpanded;
  late Set<T> _loading = widget.loading;
  late Set<T> _loadErrors = widget.loadErrors;
  T? _focused;
  final Map<T, FocusNode> _nodes = {};
  String _query = '';
  Timer? _queryTimer;

  @override
  void initState() {
    super.initState();
    assert(treeValuesUnique(widget.nodes), 'TreeView values must be unique.');
  }

  @override
  void didUpdateWidget(TreeView<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    assert(treeValuesUnique(widget.nodes), 'TreeView values must be unique.');
    // Reflection (ADR 0011): only what the parent changed, compared with
    // the previous widget, never with the state; never reported.
    if (widget._controlled) {
      if (widget.selected != oldWidget.selected) _selected = widget.selected;
      if (!setEquals(widget.expanded, oldWidget.expanded)) {
        _expanded = widget.expanded!;
      }
    }
    if (!setEquals(widget.loading, oldWidget.loading)) {
      _loading = widget.loading;
    }
    if (!setEquals(widget.loadErrors, oldWidget.loadErrors)) {
      _loadErrors = widget.loadErrors;
    }
  }

  @override
  void dispose() {
    _queryTimer?.cancel();
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  TreeModel<T> get _model => TreeModel(
    widget.nodes,
    expanded: _expanded,
    disabled: !widget.enabled,
    loading: _loading,
    loadErrors: _loadErrors,
  );

  FocusNode _node(T value) =>
      _nodes.putIfAbsent(value, () => FocusNode(debugLabel: 'Node $value'));

  T? get _focusedNode =>
      _nodes.entries.where((e) => e.value.hasPrimaryFocus).firstOrNull?.key;

  /// Commits every change of [action] first, then reports each one once.
  void _apply(TreeAction<T> action) {
    final focus = action.focus;
    final expanded = action.expanded;
    final select = action.select == _selected ? null : action.select;
    final load = action.load;
    if (focus == null && expanded == null && select == null && load.isEmpty) {
      return;
    }
    setState(() {
      if (focus != null) _focused = focus;
      if (expanded != null) _expanded = expanded;
      if (select != null) _selected = select;
      if (load.isNotEmpty) {
        _loading = {..._loading, ...load};
        _loadErrors = _loadErrors.difference(load.toSet());
      }
    });
    if (focus != null) _node(focus).requestFocus();
    // Read from the widget now, so a replaced callback is the one called.
    if (expanded != null) widget.onExpansionChanged?.call(expanded);
    if (select != null) widget.onSelectionChanged?.call(select);
    for (final value in load) {
      widget.onLoadChildren?.call(
        TreeLoadRequest(value: value, requestId: ++_requestCounter),
      );
    }
  }

  void _press(T value) => _apply(TreeAction(focus: value, select: value));

  void _pressTwistie(T value) {
    final model = _model;
    final node = model.find(value);
    final failed = node?.loadState == TreeLoadState.error && node!.expanded;
    _apply(failed ? model.retry(value) : model.toggle(value));
  }

  void _onKey(RovingKeyIntent intent) {
    final from = _focusedNode;
    if (from == null) return;
    _apply(_model.key(from, intent.key, Directionality.of(context)));
  }

  // Typeahead and `*`, the two keys of the APG pattern the web tree lacks.
  KeyEventResult _onKeyEvent(FocusNode _, KeyEvent event) {
    final character = typedCharacter(event);
    final from = _focusedNode;
    if (character == null || from == null) return KeyEventResult.ignored;
    final model = _model;
    if (character == '*') {
      _apply(model.expandSiblings(from));
      return KeyEventResult.handled;
    }
    _query += character;
    _queryTimer?.cancel();
    _queryTimer = Timer(typeaheadReset, () => _query = '');
    _apply(TreeAction(focus: model.match(_query, from)));
    return KeyEventResult.handled;
  }

  String? _status(VisibleTreeNode<T> node, InvisibleMessages messages) {
    final template = switch (node.loadState) {
      TreeLoadState.loading => messages.treeLoading,
      TreeLoadState.error => messages.treeLoadError,
      _ => null,
    };
    return template == null
        ? null
        : InvisibleMessages.fill(template, {'name': node.node.label});
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    final model = _model;
    final stop = model.tabStop(_focused, _selected);
    final values = treeValues(widget.nodes);
    for (final gone in _nodes.keys.where((v) => !values.contains(v)).toList()) {
      _nodes.remove(gone)!.dispose();
    }

    // Built recursively, so a parent's children sit in a list of their own
    // right after it, and assistive technology reads the depth and the set
    // size from the nesting.
    List<Widget> items(List<TreeNode<T>> nodes) => [
      for (final node in nodes)
        if (model.find(node.value) case final info?)
          _TreeItem(
            key: ValueKey(node.value),
            row: _TreeRow<T>(
              info: info,
              selected: info.value == _selected,
              status: _status(info, messages),
              focusNode: _node(info.value)..skipTraversal = info.value != stop,
              onPressed: () => _press(info.value),
              onTwistie: () => _pressTwistie(info.value),
              onFocused: () => setState(() => _focused = info.value),
            ),
            children: info.expanded && info.childrenLoaded
                ? items(node.children!)
                : null,
          ),
    ];

    // The key handlers sit outside the list's node, so nothing comes between
    // the list and its items.
    return Shortcuts(
      shortcuts: rovingShortcuts,
      child: Actions(
        actions: {
          // Every arrow, Home and End stays in the tree, as the web
          // prevents their default.
          RovingKeyIntent: RovingKeyAction(
            handles: (_) => _focusedNode != null,
            onKey: _onKey,
          ),
        },
        child: Focus(
          canRequestFocus: false,
          skipTraversal: true,
          onKeyEvent: _onKeyEvent,
          child: Semantics(
            container: true,
            explicitChildNodes: true,
            role: SemanticsRole.list,
            label: widget.label,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final list = Padding(
                  padding: const EdgeInsets.all(_treePadding),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: items(widget.nodes),
                  ),
                );
                return constraints.hasBoundedWidth
                    ? list
                    : IntrinsicWidth(child: list);
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// A node's row and, while it is open, the list of its children.
class _TreeItem extends StatelessWidget {
  const _TreeItem({super.key, required this.row, required this.children});

  final Widget row;
  final List<Widget>? children;

  @override
  Widget build(BuildContext context) {
    final children = this.children;
    return Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.listItem,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          row,
          if (children != null)
            Semantics(
              container: true,
              explicitChildNodes: true,
              role: SemanticsRole.list,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: children,
              ),
            ),
        ],
      ),
    );
  }
}

class _TreeRow<T> extends StatelessWidget {
  const _TreeRow({
    required this.info,
    required this.selected,
    required this.status,
    required this.focusNode,
    required this.onPressed,
    required this.onTwistie,
    required this.onFocused,
  });

  final VisibleTreeNode<T> info;
  final bool selected;
  final String? status;
  final FocusNode focusNode;
  final VoidCallback onPressed;
  final VoidCallback onTwistie;
  final VoidCallback onFocused;

  void _focusChanged(BuildContext context, bool focused) {
    if (!focused) return;
    onFocused();
    // A row a scrolling parent has moved away comes into view.
    for (final policy in [
      ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
      ScrollPositionAlignmentPolicy.keepVisibleAtStart,
    ]) {
      unawaited(Scrollable.ensureVisible(context, alignmentPolicy: policy));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final scaler = MediaQuery.textScalerOf(context);
    final enabled = !info.disabled;
    final status = this.status;
    // The chevron's hit area: 24 pixels growing with the text, never under
    // the theme's minimum target. A leaf keeps the same space, so labels
    // line up.
    final twistieSide = math.max(
      scaler.scale(_twistieSide),
      theme.minTargetSize.longestSide,
    );
    final textStyle = theme.textStyle.copyWith(color: colors.text);

    return Semantics(
      container: true,
      label: info.node.label,
      hint: status,
      selected: selected,
      expanded: info.hasChildren ? info.expanded : null,
      enabled: enabled,
      onTap: enabled ? onPressed : null,
      child: Pressable(
        onPressed: enabled ? onPressed : null,
        focusNode: focusNode,
        onFocusChange: (focused) => _focusChanged(context, focused),
        alignment: AlignmentDirectional.centerStart,
        builder: (context, states) => Opacity(
          opacity: enabled ? 1 : _disabledOpacity,
          child: FocusRingPainter(
            visible: states.focusVisible,
            ring: theme.focusRing,
            radius: theme.controlRadius,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: selected
                    ? colors.secondary.withValues(
                        alpha: states.hovered
                            ? _selectedHoverTint
                            : _selectedTint,
                      )
                    : states.hovered
                    ? colors.neutralSurface
                    : null,
                borderRadius: BorderRadius.circular(theme.controlRadius),
              ),
              child: Padding(
                padding: EdgeInsetsDirectional.only(
                  start: _rowPaddingStart + _indent * (info.level - 1),
                  end: _rowPaddingEnd,
                  top: _rowPaddingY,
                  bottom: _rowPaddingY,
                ),
                child: Row(
                  spacing: _gap,
                  children: [
                    ExcludeSemantics(
                      child: info.hasChildren
                          ? _Twistie(
                              open: info.expanded,
                              side: twistieSide,
                              onPressed: enabled ? onTwistie : null,
                            )
                          : SizedBox.square(dimension: twistieSide),
                    ),
                    if (info.node.icon case final icon?)
                      ExcludeSemantics(
                        child: SizedBox.square(
                          dimension: scaler.scale(_glyphSide),
                          child: IconTheme(
                            data: IconThemeData(
                              color: colors.textSecondary,
                              size: _glyphSide,
                              applyTextScaling: true,
                            ),
                            child: Center(child: icon),
                          ),
                        ),
                      ),
                    // The status follows the label, and moves under it when
                    // the row is too narrow for both.
                    Expanded(
                      child: Wrap(
                        spacing: _gap,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          // The row's node carries the name.
                          ExcludeSemantics(
                            child: Text(
                              info.node.label,
                              maxLines: 1,
                              softWrap: false,
                              overflow: TextOverflow.ellipsis,
                              style: textStyle,
                            ),
                          ),
                          if (status != null)
                            Semantics(
                              container: true,
                              liveRegion: true,
                              label: status,
                              child: ExcludeSemantics(
                                child: Text(
                                  status,
                                  style: textStyle.copyWith(
                                    fontSize: _statusSize,
                                    color: info.loadState == TreeLoadState.error
                                        ? colors.dangerText
                                        : colors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    // The check's space is always kept, so a selected row is
                    // no wider than the others.
                    ExcludeSemantics(
                      child: SizedBox.square(
                        dimension: scaler.scale(_checkSide),
                        child: selected
                            ? IconTheme(
                                data: IconThemeData(
                                  color: colors.secondary,
                                  size: _checkSide,
                                  applyTextScaling: true,
                                ),
                                child: const Glyph(
                                  GlyphShape.check,
                                  strokeWidth: _strokeWidth,
                                ),
                              )
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A parent's chevron: it points to the inline-end and turns a quarter
/// toward the content while open.
class _Twistie extends StatelessWidget {
  const _Twistie({
    required this.open,
    required this.side,
    required this.onPressed,
  });

  final bool open;
  final double side;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final rtl = Directionality.of(context) == TextDirection.rtl;
    return MouseRegion(
      cursor: onPressed == null
          ? SystemMouseCursors.forbidden
          : SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        excludeFromSemantics: true,
        onTap: onPressed,
        child: SizedBox.square(
          dimension: side,
          child: Center(
            child: AnimatedRotation(
              // Clockwise in left-to-right text; the mirrored chevron turns
              // the other way.
              turns: open ? (rtl ? -0.25 : 0.25) : 0,
              duration: reducedMotion(context) ? Duration.zero : _turn,
              child: IconTheme(
                data: IconThemeData(
                  color: InvisibleTheme.of(context).colors.text,
                  size: _glyphSide,
                  applyTextScaling: true,
                ),
                child: const Glyph(
                  GlyphShape.chevronEnd,
                  strokeWidth: _strokeWidth,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
