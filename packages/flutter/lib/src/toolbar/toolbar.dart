import 'package:flutter/widgets.dart';

import '../internal/roving.dart';
import '../theme/theme.dart';

// Sizes the web Toolbar sets in its own stylesheet.
const double _gap = 6;
const double _padding = 4;
const double _borderWidth = 1;

/// A named group of related controls, following the WAI-ARIA toolbar
/// pattern.
///
/// The whole toolbar is one tab stop. Arrow keys move focus between its
/// enabled controls, wrapping at the ends: left and right in a horizontal
/// toolbar, following the reading direction, up and down in a vertical one.
/// Home and End jump to the first and the last control. Focus returns to the
/// control that had it last, or to the first enabled one when that control is
/// gone or disabled.
///
/// A crowded horizontal toolbar wraps onto more rows instead of overflowing.
/// Put a [ToolbarSeparator] between groups of controls.
class Toolbar extends StatefulWidget {
  /// Creates a toolbar named [semanticLabel].
  const Toolbar({
    super.key,
    required this.semanticLabel,
    required this.children,
    this.orientation = Axis.horizontal,
  });

  /// The accessible name of the toolbar.
  final String semanticLabel;

  /// The controls and separators, in order.
  final List<Widget> children;

  /// The layout and the arrow keys that move between the controls.
  final Axis orientation;

  @override
  State<Toolbar> createState() => _ToolbarState();
}

class _ToolbarState extends State<Toolbar> {
  final FocusNode _group = FocusNode(
    debugLabel: 'Toolbar',
    canRequestFocus: false,
    skipTraversal: true,
  );
  late final _ToolbarTraversalPolicy _policy = _ToolbarTraversalPolicy(this);

  /// The control that holds the single tab stop.
  FocusNode? _tabStop;

  late final Map<Type, Action<Intent>> _actions = {
    RovingKeyIntent: RovingKeyAction(
      handles: (intent) => _target(intent) != null,
      onKey: (intent) => (_tabStop = _target(intent))?.requestFocus(),
    ),
  };

  @override
  void dispose() {
    _group.dispose();
    super.dispose();
  }

  /// The enabled controls, in reading order.
  List<FocusNode> _controls() =>
      _policy.readingOrder(_group.traversalDescendants);

  /// The control a key moves focus to, or null when the key does not apply.
  FocusNode? _target(RovingKeyIntent intent) {
    final controls = _controls();
    final next = nextIndex(
      key: intent.key,
      index: controls.indexWhere((node) => node.hasPrimaryFocus),
      count: controls.length,
      axis: widget.orientation,
      direction: Directionality.of(context),
    );
    return next == null ? null : controls[next];
  }

  /// The control that takes the tab stop among [controls]: the focused one,
  /// else the last focused one while it is still enabled, else the first.
  FocusNode? _resolveTabStop(Iterable<FocusNode> controls) {
    final list = controls.toList();
    if (list.isEmpty) return null;
    final focused = list.where((node) => node.hasPrimaryFocus).firstOrNull;
    return _tabStop =
        focused ?? (list.contains(_tabStop) ? _tabStop : list.first);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final horizontal = widget.orientation == Axis.horizontal;
    return _ToolbarOrientation(
      axis: widget.orientation,
      child: Semantics(
        container: true,
        explicitChildNodes: true,
        label: widget.semanticLabel,
        child: FocusTraversalGroup(
          policy: _policy,
          child: Focus(
            focusNode: _group,
            // Remember the control that had focus last.
            onFocusChange: (_) => _resolveTabStop(_group.traversalDescendants),
            child: Shortcuts(
              shortcuts: rovingShortcuts,
              child: Actions(
                actions: _actions,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: theme.colors.background,
                    border: Border.all(
                      color: theme.colors.border,
                      width: _borderWidth,
                    ),
                    borderRadius: BorderRadius.circular(theme.controlRadius),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(_padding),
                    child: horizontal
                        ? Wrap(
                            spacing: _gap,
                            runSpacing: _gap,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: widget.children,
                          )
                        : IntrinsicWidth(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              spacing: _gap,
                              children: widget.children,
                            ),
                          ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Keeps one tab stop in the toolbar: traversal from outside sees only the
/// control that holds it, so Tab enters the toolbar once and leaves it next.
class _ToolbarTraversalPolicy extends ReadingOrderTraversalPolicy {
  _ToolbarTraversalPolicy(this._toolbar);

  final _ToolbarState _toolbar;

  /// Every control in reading order, for the arrow keys.
  List<FocusNode> readingOrder(Iterable<FocusNode> nodes) => super
      .sortDescendants(nodes, nodes.firstOrNull ?? _toolbar._group)
      .toList();

  @override
  Iterable<FocusNode> sortDescendants(
    Iterable<FocusNode> descendants,
    FocusNode currentNode,
  ) {
    final stop = _toolbar._resolveTabStop(readingOrder(descendants));
    return stop == null ? const [] : [stop];
  }
}

/// The orientation a [ToolbarSeparator] draws across.
class _ToolbarOrientation extends InheritedWidget {
  const _ToolbarOrientation({required this.axis, required super.child});

  final Axis axis;

  @override
  bool updateShouldNotify(_ToolbarOrientation old) => old.axis != axis;
}

/// A line between groups of controls in a [Toolbar]. It takes no focus and
/// has no semantics.
class ToolbarSeparator extends StatelessWidget {
  /// Creates a separator.
  const ToolbarSeparator({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final horizontal =
        context
            .dependOnInheritedWidgetOfExactType<_ToolbarOrientation>()
            ?.axis !=
        Axis.vertical;
    final line = ColoredBox(color: theme.colors.border);
    return horizontal
        ? SizedBox(
            width: 1,
            // As tall as a line of control text, at any text scale.
            height: MediaQuery.textScalerOf(
              context,
            ).scale(theme.textStyle.fontSize! * 1.5),
            child: line,
          )
        : SizedBox(height: 1, child: line);
  }
}
