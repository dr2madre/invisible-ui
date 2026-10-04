import 'package:flutter/widgets.dart';

import '../internal/disclosure.dart';
import '../internal/glyphs.dart';
import '../internal/open_width.dart';
import '../theme/theme.dart';

// Sizes the web Collapsible sets in its own stylesheet.
const double _defaultWidth = 288;
const EdgeInsetsDirectional _triggerPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12,
  vertical: 8,
);
const EdgeInsetsDirectional _contentPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12,
  vertical: 10,
);

/// One disclosure, following the WAI-ARIA disclosure pattern: a header
/// button that shows and hides [child].
///
/// The header reports itself expanded or collapsed. A tap, Enter or Space
/// toggles it; the chevron turns while it is expanded, at once under
/// reduced motion. Hidden content keeps its state and leaves the focus
/// order and the semantics tree.
///
/// Controlled, [Collapsible] shows [expanded] and reports each toggle
/// through [onExpansionChanged]; [Collapsible.uncontrolled] keeps its own
/// state, starting from [initiallyExpanded]. A changed [expanded] is shown
/// without a report. It takes the width its parent gives, or 288 when the
/// width is open.
class Collapsible extends StatefulWidget {
  /// A disclosure that shows [expanded], controlled by the parent.
  const Collapsible({
    super.key,
    required bool this.expanded,
    required this.child,
    this.onExpansionChanged,
    this.label,
    this.trigger,
    this.enabled = true,
  }) : initiallyExpanded = false,
       _controlled = true;

  /// A disclosure that keeps its own state, starting from
  /// [initiallyExpanded].
  const Collapsible.uncontrolled({
    super.key,
    required this.child,
    this.initiallyExpanded = false,
    this.onExpansionChanged,
    this.label,
    this.trigger,
    this.enabled = true,
  }) : expanded = null,
       _controlled = false;

  /// Whether the content shows, when the parent controls it.
  final bool? expanded;

  /// Whether the uncontrolled disclosure starts expanded.
  final bool initiallyExpanded;

  /// Called with the new state after the user toggles it. Never called for
  /// a changed [expanded].
  final ValueChanged<bool>? onExpansionChanged;

  /// The header's text and accessible name. Defaults to
  /// [InvisibleMessages.collapsibleToggle].
  final String? label;

  /// The header's content in place of [label]; its text names the header.
  final Widget? trigger;

  /// Whether the header takes focus and toggles.
  final bool enabled;

  /// The content.
  final Widget child;

  final bool _controlled;

  @override
  State<Collapsible> createState() => _CollapsibleState();
}

class _CollapsibleState extends State<Collapsible> {
  late bool _expanded = widget._controlled
      ? widget.expanded!
      : widget.initiallyExpanded;

  @override
  void didUpdateWidget(Collapsible oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): a value the parent changed, never reported.
    if (widget._controlled && widget.expanded != oldWidget.expanded) {
      _expanded = widget.expanded!;
    }
  }

  void _toggle() {
    final next = !_expanded;
    setState(() => _expanded = next);
    widget.onExpansionChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final label = widget.label ?? theme.messages.collapsibleToggle;
    return OpenWidth(
      width: _defaultWidth,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DisclosureTrigger(
            expanded: _expanded,
            onToggle: widget.enabled ? _toggle : null,
            label: widget.trigger ?? Text(label),
            chevron: GlyphShape.chevronDown,
            openTurns: 0.5,
            padding: _triggerPadding,
            radius: theme.controlRadius,
            decoration: BoxDecoration(
              color: colors.background,
              border: Border.all(color: colors.controlBorder),
              borderRadius: BorderRadius.circular(theme.controlRadius),
            ),
          ),
          DisclosurePanel(
            visible: _expanded,
            child: Padding(
              padding: _contentPadding,
              child: DefaultTextStyle(
                style: theme.textStyle.copyWith(color: colors.text),
                child: widget.child,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
