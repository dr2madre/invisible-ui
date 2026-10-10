import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/focus_ring.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The axes a [ScrollArea] scrolls along.
enum ScrollAreaOrientation {
  /// Up and down, the default.
  vertical,

  /// Sideways.
  horizontal,

  /// Both ways.
  both,
}

// Sizes the web ScrollArea sets in its own stylesheet.
const double _defaultMaxHeight = 192;
const double _thickness = 8;
const double _margin = 2;
// What an arrow key scrolls, close to a browser's line step.
const double _lineStep = 40;
// What Page Up and Page Down scroll, as a share of the viewport.
const double _pageShare = 0.8;

/// A scrollable viewport with slim overlay scroll bars in the theme's
/// colours.
///
/// The viewport takes keyboard focus, so a keyboard user reaches it and
/// scrolls it: the arrows by a line (the horizontal ones mirrored right to
/// left), Page Up, Page Down and Space by most of a viewport, Home and End
/// to the ends. The keys act only while the viewport itself has focus, so a
/// control inside keeps its own. A thumb can be dragged. With
/// [semanticLabel] the viewport is a named region; two areas on one screen
/// should not share a name.
class ScrollArea extends StatelessWidget {
  /// Creates the area around [child].
  const ScrollArea({
    super.key,
    required this.child,
    this.orientation = ScrollAreaOrientation.vertical,
    this.maxHeight = _defaultMaxHeight,
    this.semanticLabel,
  });

  /// The content.
  final Widget child;

  /// The axes that scroll.
  final ScrollAreaOrientation orientation;

  /// The tallest the viewport grows before it scrolls, in logical pixels.
  /// Null lets it grow with its content.
  final double? maxHeight;

  /// The accessible name of the region.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Scroller(
      vertical: orientation != ScrollAreaOrientation.horizontal,
      horizontal: orientation != ScrollAreaOrientation.vertical,
      maxHeight: maxHeight,
      semanticLabel: semanticLabel,
      // The web area sets the text colour and keeps the surrounding font.
      child: DefaultTextStyle.merge(
        style: TextStyle(color: InvisibleTheme.of(context).colors.text),
        child: child,
      ),
    );
  }
}

/// The focusable viewport of [ScrollArea] and of a code block's sample:
/// scroll bars on the axes that scroll, the keyboard map and the focus ring,
/// drawn [ringInside] the bounds where an outer box clips.
class Scroller extends StatefulWidget {
  /// Creates the viewport around [child].
  const Scroller({
    super.key,
    required this.child,
    required this.vertical,
    required this.horizontal,
    this.maxHeight,
    this.semanticLabel,
    this.ringInside = false,
    this.padding = EdgeInsets.zero,
  });

  /// The content.
  final Widget child;

  /// Whether the content scrolls up and down.
  final bool vertical;

  /// Whether the content scrolls sideways.
  final bool horizontal;

  /// The tallest the viewport grows before it scrolls.
  final double? maxHeight;

  /// The accessible name of the region.
  final String? semanticLabel;

  /// Whether the focus ring is drawn within the bounds.
  final bool ringInside;

  /// The space around the content, inside the scrolling area.
  final EdgeInsetsGeometry padding;

  @override
  State<Scroller> createState() => _ScrollerState();
}

/// A scroll by the keyboard along [axis]: [lines] lines, [pages] pages, or
/// to an end when [toEnd] is set.
class _ScrollIntent extends Intent {
  const _ScrollIntent(this.axis, {this.lines = 0, this.pages = 0, this.toEnd});

  final Axis axis;
  final int lines;
  final int pages;
  final bool? toEnd;
}

class _ScrollerState extends State<Scroller> {
  final ScrollController _vertical = ScrollController();
  final ScrollController _horizontal = ScrollController();
  final FocusNode _node = FocusNode(debugLabel: 'Scroller');
  bool _focusVisible = false;

  static const Map<ShortcutActivator, Intent> _keys = {
    SingleActivator(LogicalKeyboardKey.arrowDown): _ScrollIntent(
      Axis.vertical,
      lines: 1,
    ),
    SingleActivator(LogicalKeyboardKey.arrowUp): _ScrollIntent(
      Axis.vertical,
      lines: -1,
    ),
    // The visual direction; the action mirrors it right to left.
    SingleActivator(LogicalKeyboardKey.arrowRight): _ScrollIntent(
      Axis.horizontal,
      lines: 1,
    ),
    SingleActivator(LogicalKeyboardKey.arrowLeft): _ScrollIntent(
      Axis.horizontal,
      lines: -1,
    ),
    SingleActivator(LogicalKeyboardKey.pageDown): _ScrollIntent(
      Axis.vertical,
      pages: 1,
    ),
    SingleActivator(LogicalKeyboardKey.pageUp): _ScrollIntent(
      Axis.vertical,
      pages: -1,
    ),
    SingleActivator(LogicalKeyboardKey.space): _ScrollIntent(
      Axis.vertical,
      pages: 1,
    ),
    SingleActivator(LogicalKeyboardKey.space, shift: true): _ScrollIntent(
      Axis.vertical,
      pages: -1,
    ),
    SingleActivator(LogicalKeyboardKey.home): _ScrollIntent(
      Axis.vertical,
      toEnd: false,
    ),
    SingleActivator(LogicalKeyboardKey.end): _ScrollIntent(
      Axis.vertical,
      toEnd: true,
    ),
  };

  late final Map<Type, Action<Intent>> _actions = {
    _ScrollIntent: _ScrollAction(this),
  };

  @override
  void dispose() {
    _vertical.dispose();
    _horizontal.dispose();
    _node.dispose();
    super.dispose();
  }

  // An arrow moves its own axis; a page or an end key moves the vertical
  // axis, or the horizontal one when only that one scrolls.
  ScrollController? _controllerFor(_ScrollIntent intent) {
    final vertical = widget.vertical ? _vertical : null;
    final horizontal = widget.horizontal ? _horizontal : null;
    if (intent.lines != 0) {
      return intent.axis == Axis.vertical ? vertical : horizontal;
    }
    return vertical ?? horizontal;
  }

  void _scroll(_ScrollIntent intent) {
    final controller = _controllerFor(intent);
    if (controller == null || !controller.hasClients) return;
    final position = controller.position;
    final double target;
    if (intent.toEnd != null) {
      target = intent.toEnd!
          ? position.maxScrollExtent
          : position.minScrollExtent;
    } else {
      var delta =
          intent.lines * _lineStep +
          intent.pages * position.viewportDimension * _pageShare;
      // A horizontal view starts at the right under right-to-left, so the
      // left arrow moves forward there.
      if (intent.lines != 0 &&
          intent.axis == Axis.horizontal &&
          Directionality.of(context) == TextDirection.rtl) {
        delta = -delta;
      }
      target = (position.pixels + delta).clamp(
        position.minScrollExtent,
        position.maxScrollExtent,
      );
    }
    if (target == position.pixels) return;
    if (reducedMotion(context)) {
      controller.jumpTo(target);
    } else {
      controller.animateTo(
        target,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOut,
      );
    }
  }

  Widget _bar(ScrollController controller, Widget child, {int depth = 0}) {
    final colors = InvisibleTheme.of(context).colors;
    return RawScrollbar(
      controller: controller,
      thumbVisibility: true,
      interactive: true,
      thickness: _thickness,
      radius: const Radius.circular(InvisibleRadiusTokens.pill),
      thumbColor: colors.border,
      mainAxisMargin: _margin,
      crossAxisMargin: _margin,
      notificationPredicate: (notification) => notification.depth == depth,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    Widget content = Padding(padding: widget.padding, child: widget.child);
    if (widget.horizontal) {
      content = SingleChildScrollView(
        controller: _horizontal,
        scrollDirection: Axis.horizontal,
        child: content,
      );
    }
    if (widget.vertical) {
      content = SingleChildScrollView(controller: _vertical, child: content);
    }
    // The theme's bars only: no platform bar on top of them.
    content = ScrollConfiguration(
      behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
      child: content,
    );
    if (widget.horizontal) {
      content = _bar(_horizontal, content, depth: widget.vertical ? 1 : 0);
    }
    if (widget.vertical) content = _bar(_vertical, content);

    final maxHeight = widget.maxHeight;
    if (maxHeight != null) {
      content = ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: content,
      );
    }

    final label = widget.semanticLabel;
    return Semantics(
      container: label != null,
      label: label,
      child: FocusableActionDetector(
        focusNode: _node,
        shortcuts: _keys,
        actions: _actions,
        onShowFocusHighlight: (value) => setState(() => _focusVisible = value),
        child: FocusRingPainter(
          visible: _focusVisible,
          ring: theme.focusRing,
          radius: 0,
          inside: widget.ringInside,
          child: content,
        ),
      ),
    );
  }
}

/// Scrolls the viewport for a key, and only while the viewport itself has
/// focus, so a control inside keeps its keys.
class _ScrollAction extends Action<_ScrollIntent> {
  _ScrollAction(this._state);

  final _ScrollerState _state;

  @override
  bool isEnabled(_ScrollIntent intent) => _state._node.hasPrimaryFocus;

  @override
  void invoke(_ScrollIntent intent) => _state._scroll(intent);
}
