import 'dart:async';
import 'dart:ui' show SemanticsRole;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../field/field.dart';
import '../internal/single_choice.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web SegmentedControl sets in its own stylesheet.
const double _gap = 6.4;
const double _stackedGap = 4;
const double _paddingX = 14.4;
const double _iconOnlyPadding = 7.2;
const double _stackedLabelSize = 12;
const double _iconEm = 1.15;
const double _checkedTint = 0.1;
const double _disabledOpacity = 0.5;

/// A bar of segments of which one is chosen, a compact single choice such
/// as All, Active and Archived. It follows the WAI-ARIA radio group pattern,
/// as the web control's native radio buttons do.
///
/// The bar is one tab stop: the chosen segment, or the first enabled one.
/// The arrow keys move to the next or previous enabled segment, wrapping,
/// and choose it; right and left follow the reading direction. Space or a
/// tap chooses the focused segment. The chosen segment is tinted and its
/// label bold, so the choice never relies on colour alone.
///
/// A horizontal bar wider than its parent scrolls sideways, and a focused
/// segment scrolls into view. [iconOnly] shows only the icons of the items
/// that have one, their labels still naming them; [stacked] puts each
/// icon above its label.
///
/// Controlled, [SegmentedControl] shows [value] (null when nothing is
/// chosen) and reports each choice through [onSelected];
/// [SegmentedControl.uncontrolled] keeps its own value. A changed [value] is
/// shown without calling [onSelected]. Inside a [Form] it validates, saves
/// and resets like the other value controls.
class SegmentedControl<T> extends StatefulWidget {
  /// A control that shows [value], controlled by the parent.
  const SegmentedControl({
    super.key,
    required this.label,
    required this.items,
    required this.value,
    this.onSelected,
    this.orientation = Axis.horizontal,
    this.iconOnly = false,
    this.stacked = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : initialValue = null,
       _controlled = true;

  /// A control that keeps its own value, starting from [initialValue].
  const SegmentedControl.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialValue,
    this.onSelected,
    this.orientation = Axis.horizontal,
    this.iconOnly = false,
    this.stacked = false,
    this.hideLabel = false,
    this.description,
    this.error,
    this.enabled = true,
    this.validator,
    this.onSaved,
    this.autovalidateMode,
  }) : value = null,
       _controlled = false;

  /// The visible label and accessible name.
  final String label;

  /// The segments, in order.
  final List<ChoiceItem<T>> items;

  /// The chosen value when the parent controls it; null when none is.
  final T? value;

  /// The starting value of the uncontrolled form, and its reset default.
  final T? initialValue;

  /// Called with the chosen value after a user choice. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<T>? onSelected;

  /// A row of segments, or a column (a sidebar, for instance).
  final Axis orientation;

  /// Shows only the icon of each item that has one.
  final bool iconOnly;

  /// Puts each segment's icon above its label.
  final bool stacked;

  /// Hides the label visually while it still names the control.
  final bool hideLabel;

  /// A hint shown under the control and read after its name.
  final String? description;

  /// An error message. A non-empty one marks the control invalid; it shows
  /// with a hazard glyph and is announced.
  final String? error;

  /// Whether the control takes focus and changes.
  final bool enabled;

  /// Checks the value when the enclosing [Form] validates.
  final FormFieldValidator<T?>? validator;

  /// Called with the value when the enclosing [Form] saves.
  final FormFieldSetter<T?>? onSaved;

  /// When the [validator] runs on its own.
  final AutovalidateMode? autovalidateMode;

  final bool _controlled;

  @override
  State<SegmentedControl<T>> createState() => _SegmentedControlState<T>();
}

class _SegmentedControlState<T> extends State<SegmentedControl<T>>
    with ValueControl<T?, SegmentedControl<T>> {
  final SingleChoiceFocus<T> _focus = SingleChoiceFocus<T>();

  @override
  bool get isControlled => widget._controlled;

  @override
  T? controlledValueOf(SegmentedControl<T> widget) => widget.value;

  @override
  T? get initialValueOfWidget => widget.initialValue;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _choose(T next) {
    if (commitValue(next)) widget.onSelected?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final items = widget.items;
    final horizontal = widget.orientation == Axis.horizontal;
    _focus.sync(items, value, enabled: widget.enabled);

    final segments = <Widget>[
      for (final (index, item) in items.indexed)
        _Segment<T>(
          key: ValueKey(item.value),
          item: item,
          checked: item.value == value,
          enabled: widget.enabled && !item.disabled,
          iconOnly: widget.iconOnly && item.icon != null && !widget.stacked,
          stacked: widget.stacked,
          divider: index > 0,
          horizontal: horizontal,
          focusNode: _focus.nodeFor(item.value),
          onChoose: () => _choose(item.value),
        ),
    ];

    final Widget bar = DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: theme.colors.controlBorder),
        borderRadius: BorderRadius.circular(theme.controlRadius),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(theme.controlRadius - 1),
        child: horizontal
            ? SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: IntrinsicHeight(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: segments,
                  ),
                ),
              )
            : IntrinsicWidth(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: segments,
                ),
              ),
      ),
    );

    return buildFormField(
      enabled: widget.enabled,
      validator: widget.validator,
      onSaved: widget.onSaved,
      autovalidateMode: widget.autovalidateMode,
      builder: (errorText) {
        final error = widget.error ?? errorText;
        return FieldFrame(
          label: widget.label,
          hideLabel: widget.hideLabel,
          enabled: widget.enabled,
          description: widget.description,
          error: error,
          onLabelTap: _focus.focusTabStop,
          control: FieldSemantics(
            label: widget.label,
            description: widget.description,
            error: error,
            enabled: widget.enabled,
            role: SemanticsRole.radioGroup,
            explicitChildNodes: true,
            child: SingleChoiceKeys<T>(
              focus: _focus,
              items: items,
              onMove: _choose,
              // The bar keeps its own width, at the inline-start of the field.
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                widthFactor: 1,
                child: bar,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Segment<T> extends StatefulWidget {
  const _Segment({
    super.key,
    required this.item,
    required this.checked,
    required this.enabled,
    required this.iconOnly,
    required this.stacked,
    required this.divider,
    required this.horizontal,
    required this.focusNode,
    required this.onChoose,
  });

  final ChoiceItem<T> item;
  final bool checked;
  final bool enabled;
  final bool iconOnly;
  final bool stacked;
  final bool divider;
  final bool horizontal;
  final FocusNode focusNode;
  final VoidCallback onChoose;

  @override
  State<_Segment<T>> createState() => _SegmentState<T>();
}

class _SegmentState<T> extends State<_Segment<T>> {
  bool _focusVisible = false;
  bool _focused = false;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => _choose()),
  };

  void _choose() {
    if (widget.enabled) widget.onChoose();
  }

  void _focusChanged(bool focused) {
    setState(() => _focused = focused);
    // A segment the bar has scrolled away comes into view.
    if (focused) {
      for (final policy in [
        ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
        ScrollPositionAlignmentPolicy.keepVisibleAtStart,
      ]) {
        unawaited(Scrollable.ensureVisible(context, alignmentPolicy: policy));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final item = widget.item;
    final checked = widget.checked;
    final fontSize = theme.textStyle.fontSize!;
    final foreground = checked ? colors.secondaryBodyText : colors.text;
    final icon = item.icon;
    final showLabel = !widget.iconOnly;

    final label = Text(
      item.label,
      textAlign: TextAlign.center,
      style: theme.textStyle.copyWith(
        color: foreground,
        fontWeight: checked ? FontWeight.w600 : FontWeight.w400,
        fontSize: widget.stacked ? _stackedLabelSize : null,
        height: widget.stacked
            ? InvisibleTypographyTokens.lineHeightTight
            : null,
      ),
    );

    final content = IconTheme(
      data: IconThemeData(
        color: foreground,
        size: fontSize * _iconEm,
        applyTextScaling: true,
      ),
      child: Flex(
        direction: widget.stacked ? Axis.vertical : Axis.horizontal,
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: widget.horizontal
            ? MainAxisAlignment.center
            : MainAxisAlignment.start,
        spacing: widget.stacked ? _stackedGap : _gap,
        children: [
          if (icon != null) ExcludeSemantics(child: icon),
          if (showLabel) label,
        ],
      ),
    );

    final padding = widget.iconOnly
        ? const EdgeInsets.all(_iconOnlyPadding)
        : EdgeInsetsDirectional.symmetric(
            horizontal: _paddingX,
            vertical: theme.controlPadding.top,
          );
    final divider = BorderSide(color: colors.border);
    final ring = theme.focusRing;
    final target = theme.minTargetSize;

    final surface = DecoratedBox(
      decoration: BoxDecoration(
        color: checked
            ? colors.secondary.withValues(alpha: _checkedTint)
            : null,
        border: widget.divider
            ? BorderDirectional(
                start: widget.horizontal ? divider : BorderSide.none,
                top: widget.horizontal ? BorderSide.none : divider,
              )
            : null,
      ),
      // The bar clips its segments, so the focus ring goes inside.
      position: DecorationPosition.background,
      child: DecoratedBox(
        position: DecorationPosition.foreground,
        decoration: BoxDecoration(
          border: _focusVisible
              ? Border.all(color: ring.color, width: ring.width)
              : null,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: target.width,
            minHeight: target.height,
          ),
          child: Padding(
            padding: padding,
            child: Align(
              alignment: widget.horizontal
                  ? Alignment.center
                  : AlignmentDirectional.centerStart,
              widthFactor: 1,
              heightFactor: 1,
              child: content,
            ),
          ),
        ),
      ),
    );

    return Semantics(
      container: true,
      label: item.label,
      checked: checked,
      inMutuallyExclusiveGroup: true,
      enabled: widget.enabled,
      focusable: widget.enabled,
      focused: _focused,
      onTap: widget.enabled ? _choose : null,
      child: ExcludeSemantics(
        child: FocusableActionDetector(
          enabled: widget.enabled,
          focusNode: widget.focusNode,
          shortcuts: _shortcuts,
          actions: _actions,
          mouseCursor: widget.enabled
              ? SystemMouseCursors.click
              : SystemMouseCursors.forbidden,
          onFocusChange: _focusChanged,
          onShowFocusHighlight: (value) =>
              setState(() => _focusVisible = value),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: widget.enabled ? _choose : null,
            child: Opacity(
              opacity: widget.enabled ? 1 : _disabledOpacity,
              child: surface,
            ),
          ),
        ),
      ),
    );
  }
}
