import 'package:flutter/widgets.dart';

import '../internal/roving.dart';
import '../theme/theme.dart';
import '../toggle_button/toggle_button.dart';
import '../toolbar/toolbar.dart';

// Sizes the web ToggleGroup sets in its own stylesheet.
const double _gap = 6;
const double _borderWidth = 1;

/// How a [ToggleGroup] draws its toggles.
enum ToggleGroupVariant {
  /// Each toggle keeps its own border and corners, with a gap between them.
  separate,

  /// The toggles join into one bar: one border around them and a line
  /// between each two.
  segmented,
}

/// Lays out related [ToggleButton]s and gives them one look, such as the
/// Bold, Italic and Underline toggles of an editor, or a row of filter
/// chips. It holds no state: each toggle keeps its own value, name and
/// callback, and any number of them can be on at once. For one choice among
/// several options, use [SegmentedControl].
///
/// With three or more toggles the group is one tab stop: the arrow keys move
/// focus between its enabled toggles, wrapping at the ends, left and right
/// following the reading direction in a horizontal group, up and down in a
/// vertical one, and Home and End jump to the first and the last. Tab
/// returns to the toggle that had focus last. With one or two toggles each
/// toggle is its own tab stop. Inside a [Toolbar] the toolbar's keys apply
/// and the group adds none. Moving focus never flips a toggle; Enter and
/// Space do.
///
/// Toggles added or removed keep focus where it was: the focused toggle
/// keeps it, or, when it is the one removed, its neighbour takes it. Give
/// each toggle a [Key] when the list changes, so each keeps its own state.
///
/// [semanticLabel] names the group for assistive technology ("Formatting");
/// leave it out when the toggles are unrelated. With [wrap], a horizontal
/// [ToggleGroupVariant.separate] group wraps onto more rows instead of
/// overflowing; a segmented bar is one control and does not wrap.
///
/// ```dart
/// iu.ToggleGroup(
///   semanticLabel: 'Formatting',
///   children: [
///     iu.ToggleButton.uncontrolled(child: const Text('Bold')),
///     iu.ToggleButton.uncontrolled(child: const Text('Italic')),
///     iu.ToggleButton.uncontrolled(child: const Text('Underline')),
///   ],
/// )
/// ```
class ToggleGroup extends StatefulWidget {
  /// Groups [children].
  const ToggleGroup({
    super.key,
    required this.children,
    this.variant = ToggleGroupVariant.separate,
    this.orientation = Axis.horizontal,
    this.wrap = false,
    this.semanticLabel,
  });

  /// The toggles, usually [ToggleButton]s.
  final List<Widget> children;

  /// Separate toggles, or one joined bar.
  final ToggleGroupVariant variant;

  /// The layout axis, and the arrow keys that move between the toggles.
  final Axis orientation;

  /// Lets a horizontal separate group wrap onto more rows.
  final bool wrap;

  /// The group's accessible name.
  final String? semanticLabel;

  @override
  State<ToggleGroup> createState() => _ToggleGroupState();
}

/// The fewest toggles that make the group one tab stop.
const int _rovingMinimum = 3;

class _ToggleGroupState extends State<ToggleGroup> {
  final FocusNode _group = FocusNode(
    debugLabel: 'ToggleGroup',
    canRequestFocus: false,
    skipTraversal: true,
  );
  late final _ToggleGroupTraversalPolicy _policy = _ToggleGroupTraversalPolicy(
    this,
  );

  /// The toggle that holds the single tab stop.
  FocusNode? _tabStop;

  /// The toggle that had focus last, and its place among the toggles, so a
  /// neighbour can take focus when it is removed.
  FocusNode? _lastFocused;
  int _lastIndex = 0;

  late final Map<Type, Action<Intent>> _actions = {
    RovingKeyIntent: RovingKeyAction(
      handles: (intent) => _target(intent) != null,
      onKey: (intent) => (_tabStop = _target(intent))?.requestFocus(),
    ),
  };

  /// Whether the group is one tab stop with arrow keys.
  bool get _roving => widget.children.length >= _rovingMinimum;

  @override
  void initState() {
    super.initState();
    FocusManager.instance.addListener(_focusChanged);
  }

  @override
  void dispose() {
    FocusManager.instance.removeListener(_focusChanged);
    _group.dispose();
    super.dispose();
  }

  /// The enabled toggles, in reading order.
  List<FocusNode> _toggles() =>
      _policy.readingOrder(_group.traversalDescendants);

  /// The toggle a key moves focus to, or null when the key does not apply.
  FocusNode? _target(RovingKeyIntent intent) {
    final toggles = _toggles();
    final next = nextIndex(
      key: intent.key,
      index: toggles.indexWhere((node) => node.hasPrimaryFocus),
      count: toggles.length,
      axis: widget.orientation,
      direction: Directionality.of(context),
    );
    return next == null ? null : toggles[next];
  }

  /// The toggle that takes the tab stop among [toggles]: the focused one,
  /// else the last focused one while it is still enabled, else the first.
  FocusNode? _resolveTabStop(List<FocusNode> toggles) {
    if (toggles.isEmpty) return null;
    final focused = toggles.where((node) => node.hasPrimaryFocus).firstOrNull;
    return _tabStop =
        focused ?? (toggles.contains(_tabStop) ? _tabStop : toggles.first);
  }

  /// Follows focus into the group, and gives it to a neighbour when the
  /// focused toggle is removed and focus would otherwise fall to nothing.
  void _focusChanged() {
    final primary = FocusManager.instance.primaryFocus;
    if (primary != null && _group.hasFocus && primary != _group) {
      final toggles = _toggles();
      final index = toggles.indexOf(primary);
      if (index >= 0) {
        _lastFocused = primary;
        _lastIndex = index;
      }
      return;
    }
    final last = _lastFocused;
    _lastFocused = null;
    final lost = primary == null || primary is FocusScopeNode;
    if (last == null || !lost || _group.descendants.contains(last)) return;
    final toggles = _toggles();
    if (toggles.isEmpty) return;
    toggles[_lastIndex.clamp(0, toggles.length - 1)].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final horizontal = widget.orientation == Axis.horizontal;
    final children = widget.children;
    final Widget body = switch (widget.variant) {
      ToggleGroupVariant.separate =>
        widget.wrap && horizontal
            ? Wrap(spacing: _gap, runSpacing: _gap, children: children)
            : Flex(
                direction: widget.orientation,
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: _gap,
                children: children,
              ),
      ToggleGroupVariant.segmented => _Joined(
        orientation: widget.orientation,
        children: children,
      ),
    };
    final focus = Focus(focusNode: _group, child: body);
    // A toolbar moves focus through every control it holds, these toggles
    // included, so the group adds no keys or tab stop of its own there.
    final inToolbar = context.findAncestorWidgetOfExactType<Toolbar>() != null;
    // The same widgets wrap the toggles whatever their number, so a toggle
    // added or removed keeps the others, and their focus, in place.
    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.semanticLabel,
      child: inToolbar
          ? focus
          : FocusTraversalGroup(
              policy: _policy,
              child: Shortcuts(
                shortcuts: _roving ? rovingShortcuts : const {},
                child: Actions(
                  actions: _roving ? _actions : const {},
                  child: focus,
                ),
              ),
            ),
    );
  }
}

/// Keeps one tab stop in a group of three or more toggles: traversal from
/// outside sees only the toggle that holds it, so Tab enters the group once
/// and leaves it next. A smaller group keeps every toggle in reading order.
class _ToggleGroupTraversalPolicy extends ReadingOrderTraversalPolicy {
  _ToggleGroupTraversalPolicy(this._state);

  final _ToggleGroupState _state;

  /// Every toggle in reading order, for the arrow keys.
  List<FocusNode> readingOrder(Iterable<FocusNode> nodes) =>
      super.sortDescendants(nodes, nodes.firstOrNull ?? _state._group).toList();

  @override
  Iterable<FocusNode> sortDescendants(
    Iterable<FocusNode> descendants,
    FocusNode currentNode,
  ) {
    final sorted = readingOrder(descendants);
    if (!_state._roving) return sorted;
    final stop = _state._resolveTabStop(sorted);
    return stop == null ? const [] : [stop];
  }
}

/// The joined bar: one border, a line between each two toggles, and the
/// toggles without their own border and corners.
class _Joined extends StatelessWidget {
  const _Joined({required this.orientation, required this.children});

  final Axis orientation;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final border = theme.colors.controlBorder;
    final horizontal = orientation == Axis.horizontal;
    final divider = horizontal
        ? SizedBox(
            width: _borderWidth,
            child: ColoredBox(color: border),
          )
        : SizedBox(
            height: _borderWidth,
            child: ColoredBox(color: border),
          );
    final row = Flex(
      direction: orientation,
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (index, child) in children.indexed) ...[
          if (index > 0) divider,
          child,
        ],
      ],
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: border, width: _borderWidth),
        borderRadius: BorderRadius.circular(theme.controlRadius),
      ),
      child: Padding(
        padding: const EdgeInsets.all(_borderWidth),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(
            theme.controlRadius - _borderWidth,
          ),
          child: ToggleJoin(
            child: horizontal
                ? IntrinsicHeight(child: row)
                : IntrinsicWidth(child: row),
          ),
        ),
      ),
    );
  }
}
