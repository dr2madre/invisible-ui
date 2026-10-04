import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../internal/collection.dart';
import '../internal/disclosure.dart';
import '../internal/glyphs.dart';
import '../internal/open_width.dart';
import '../internal/roving.dart';
import '../theme/theme.dart';

// Sizes the web Accordion sets in its own stylesheet.
const double _defaultWidth = 256;
const EdgeInsetsDirectional _triggerPadding = EdgeInsetsDirectional.symmetric(
  horizontal: 12.8,
  vertical: 9.6,
);
const EdgeInsetsDirectional _panelPadding = EdgeInsetsDirectional.fromSTEB(
  12.8,
  0,
  12.8,
  12.8,
);

/// One section of an [Accordion]: a header named [label] and its [child].
class AccordionItem<T> extends ChoiceItem<T> {
  /// Creates a section.
  const AccordionItem({
    required super.value,
    required super.label,
    required this.child,
    super.disabled,
  });

  /// The content shown while the section is expanded.
  final Widget child;
}

/// The expanded set after the user toggles [toggled], the rule of
/// `toggleValue` in `core/src/accordion/state.ts`: with [multiple], each
/// section opens and closes on its own; otherwise opening one closes the
/// other, and the open one closes only when [collapsible].
Set<T> toggleExpanded<T>(
  Set<T> expanded,
  T toggled, {
  required bool multiple,
  required bool collapsible,
}) {
  final open = expanded.contains(toggled);
  if (multiple) {
    return open ? ({...expanded}..remove(toggled)) : {...expanded, toggled};
  }
  if (open) return collapsible ? <T>{} : expanded;
  return {toggled};
}

/// Stacked sections that each show and hide their content, following the
/// WAI-ARIA accordion pattern.
///
/// Each header is a button in the focus order that reports itself expanded
/// or collapsed, and a heading of [headingLevel]. A tap, Enter or Space
/// toggles it. The up and down arrows move focus between the enabled
/// headers, wrapping, and Home and End jump to the first and the last.
///
/// By default one section is open at a time and the open one closes again
/// ([collapsible]); [multiple] lets each section open on its own. Hidden
/// content keeps its state and leaves the focus order.
///
/// Controlled, [Accordion] shows [value], the expanded sections, and
/// reports each change through [onChanged]; [Accordion.uncontrolled] keeps
/// its own set. A changed [value] is shown without a report. It takes the
/// width its parent gives, or 256 when the width is open.
class Accordion<T> extends StatefulWidget {
  /// An accordion that shows [value], controlled by the parent.
  const Accordion({
    super.key,
    required this.items,
    required Set<T> this.value,
    this.onChanged,
    this.multiple = false,
    this.collapsible = true,
    this.enabled = true,
    this.headingLevel = 3,
  }) : initialValue = const {},
       _controlled = true;

  /// An accordion that keeps its own expanded set, starting from
  /// [initialValue].
  const Accordion.uncontrolled({
    super.key,
    required this.items,
    this.initialValue = const {},
    this.onChanged,
    this.multiple = false,
    this.collapsible = true,
    this.enabled = true,
    this.headingLevel = 3,
  }) : value = null,
       _controlled = false;

  /// The sections, in order.
  final List<AccordionItem<T>> items;

  /// The expanded sections, when the parent controls them.
  final Set<T>? value;

  /// The sections the uncontrolled accordion starts with expanded.
  final Set<T> initialValue;

  /// Called with the expanded set after a user toggle. Never called for a
  /// changed [value].
  final ValueChanged<Set<T>>? onChanged;

  /// Whether several sections can be open at once.
  final bool multiple;

  /// With one section open at a time, whether the open one closes again.
  final bool collapsible;

  /// Whether the headers take focus and toggle.
  final bool enabled;

  /// The heading level of the headers, 1 to 6, so they fit the page
  /// outline.
  final int headingLevel;

  final bool _controlled;

  @override
  State<Accordion<T>> createState() => _AccordionState<T>();
}

class _AccordionState<T> extends State<Accordion<T>> {
  late Set<T> _value = widget._controlled ? widget.value! : widget.initialValue;
  final Map<T, FocusNode> _nodes = {};

  @override
  void didUpdateWidget(Accordion<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reflection (ADR 0011): a set the parent changed, never reported.
    if (widget._controlled && !setEquals(widget.value, oldWidget.value)) {
      _value = widget.value!;
    }
  }

  @override
  void dispose() {
    for (final node in _nodes.values) {
      node.dispose();
    }
    super.dispose();
  }

  FocusNode _node(T value) =>
      _nodes.putIfAbsent(value, () => FocusNode(debugLabel: 'Header $value'));

  T? _target(RovingKeyIntent intent) {
    final items = widget.items;
    final from = items
        .where((item) => _nodes[item.value]?.hasPrimaryFocus ?? false)
        .firstOrNull
        ?.value;
    if (from == null) return null;
    return switch (intent.key) {
      LogicalKeyboardKey.arrowDown => stepEnabled(items, from, 1),
      LogicalKeyboardKey.arrowUp => stepEnabled(items, from, -1),
      LogicalKeyboardKey.home => firstEnabled(items),
      LogicalKeyboardKey.end => lastEnabled(items),
      _ => null,
    };
  }

  void _toggle(T value) {
    final next = toggleExpanded(
      _value,
      value,
      multiple: widget.multiple,
      collapsible: widget.collapsible,
    );
    if (setEquals(next, _value)) return;
    setState(() => _value = next);
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final rtl = Directionality.of(context) == TextDirection.rtl;
    final divider = BorderSide(color: colors.border);
    final values = {for (final item in widget.items) item.value};
    for (final gone in _nodes.keys.where((v) => !values.contains(v)).toList()) {
      _nodes.remove(gone)!.dispose();
    }

    final sections = <Widget>[
      for (final (index, item) in widget.items.indexed)
        DecoratedBox(
          key: ValueKey(item.value),
          decoration: BoxDecoration(
            border: index > 0 ? Border(top: divider) : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DisclosureTrigger(
                expanded: _value.contains(item.value),
                onToggle: widget.enabled && !item.disabled
                    ? () => _toggle(item.value)
                    : null,
                label: Text(item.label),
                chevron: GlyphShape.chevronEnd,
                // The chevron turns toward the content: clockwise when it
                // points right, counter-clockwise when it points left.
                openTurns: rtl ? -0.25 : 0.25,
                padding: _triggerPadding,
                headingLevel: widget.headingLevel,
                ringInside: true,
                focusNode: _node(item.value),
              ),
              DisclosurePanel(
                visible: _value.contains(item.value),
                child: Padding(
                  padding: _panelPadding,
                  child: DefaultTextStyle(
                    style: theme.textStyle.copyWith(color: colors.text),
                    child: item.child,
                  ),
                ),
              ),
            ],
          ),
        ),
    ];

    final Widget box = DecoratedBox(
      position: DecorationPosition.foreground,
      decoration: BoxDecoration(
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(theme.controlRadius),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(theme.controlRadius),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: sections,
        ),
      ),
    );

    return Shortcuts(
      shortcuts: rovingShortcuts,
      child: Actions(
        actions: {
          RovingKeyIntent: RovingKeyAction(
            handles: (intent) => _target(intent) != null,
            onKey: (intent) => _node(_target(intent) as T).requestFocus(),
          ),
        },
        child: OpenWidth(width: _defaultWidth, child: box),
      ),
    );
  }
}
