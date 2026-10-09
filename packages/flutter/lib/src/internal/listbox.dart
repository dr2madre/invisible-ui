import 'dart:async';
import 'dart:ui' show SemanticsRole;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'ambient.dart';
import 'anchored_layout.dart';
import 'announce.dart';
import 'elevation.dart';
import 'glyphs.dart';
import 'tap_group.dart';

// Sizes the web listbox popup sets in its own stylesheet.
const double _maxHeight = 256;
const double _panelPadding = 4;
const double _panelBorder = 1;
const EdgeInsets _optionPadding = EdgeInsets.symmetric(
  horizontal: 8,
  vertical: 6.4,
);
const double _optionGap = 8;
const double _checkSide = 16;
const double _iconSide = 17.6;
const double _selectedTint = 0.1;

/// The open state and the highlighted option of a listbox popup, the part
/// [Select] and [Combobox] share.
///
/// Focus stays on the control that owns the popup, as the web keeps it on
/// the trigger or the input and points at the highlighted option with
/// `aria-activedescendant`; the owner reads keys and moves [active].
class ListboxController<T> extends ChangeNotifier {
  /// The overlay that shows the popup.
  final OverlayPortalController portal = OverlayPortalController();

  final Map<T, GlobalKey> _keys = {};
  bool _open = false;
  T? _active;

  /// Whether the popup shows.
  bool get isOpen => _open;

  /// The highlighted option, or null.
  T? get active => _active;

  /// Shows the popup with [active] highlighted.
  void open(T? active) {
    _active = active;
    if (!_open) {
      _open = true;
      portal.show();
    }
    notifyListeners();
    _reveal();
  }

  /// Hides the popup and drops the highlight.
  void close() {
    if (!_open) return;
    _open = false;
    _active = null;
    portal.hide();
    notifyListeners();
  }

  /// Highlights [value], scrolling it into view.
  void activate(T? value) {
    if (value == _active) return;
    _active = value;
    notifyListeners();
    _reveal();
  }

  /// Highlights [next] from the keyboard, opening the popup when [open], and
  /// announces its label from [items] politely when the highlight moved, as
  /// a screen reader reads the web's `aria-activedescendant`.
  void highlight(
    BuildContext context,
    List<ChoiceItem<T>> items,
    T? next, {
    bool open = false,
  }) {
    final moved = next != null && next != _active;
    open ? this.open(next) : activate(next);
    if (!moved) return;
    final label = items.where((item) => item.value == next).firstOrNull?.label;
    if (label != null) announce(context, label);
  }

  /// The key of the option [value], for scrolling it into view.
  GlobalKey keyFor(T value) => _keys.putIfAbsent(value, GlobalKey.new);

  void _reveal() {
    final value = _active;
    if (value == null) return;
    SchedulerBinding.instance.addPostFrameCallback((_) {
      final context = _keys[value]?.currentContext;
      if (_active != value || context == null || !context.mounted) return;
      for (final policy in [
        ScrollPositionAlignmentPolicy.keepVisibleAtEnd,
        ScrollPositionAlignmentPolicy.keepVisibleAtStart,
      ]) {
        unawaited(Scrollable.ensureVisible(context, alignmentPolicy: policy));
      }
    });
  }
}

/// The control that owns a listbox popup, and the popup below it: an
/// overlay as wide as [child] at least, flipping above it when there is no
/// room below, closed by a press outside both.
class ListboxPopup<T> extends StatefulWidget {
  /// Anchors the popup of [controller] to [child].
  const ListboxPopup({
    super.key,
    required this.controller,
    required this.items,
    required this.selected,
    required this.onSelect,
    required this.onPressOutside,
    required this.semanticLabel,
    required this.child,
    this.emptyText,
    this.loading = false,
  });

  /// The open state and the highlight.
  final ListboxController<T> controller;

  /// The options shown, in order.
  final List<ChoiceItem<T>> items;

  /// The chosen value, ticked in the list.
  final T? selected;

  /// Chooses an option the pointer pressed.
  final ValueChanged<T> onSelect;

  /// A press landed outside the control and the popup.
  final VoidCallback onPressOutside;

  /// The accessible name of the list.
  final String semanticLabel;

  /// Shown when [items] is empty.
  final String? emptyText;

  /// Whether the options are still loading. The list says so in place of
  /// [emptyText].
  final bool loading;

  /// The control the popup hangs from.
  final Widget child;

  @override
  State<ListboxPopup<T>> createState() => _ListboxPopupState<T>();
}

class _ListboxPopupState<T> extends State<ListboxPopup<T>> {
  final GlobalKey _anchor = GlobalKey();

  Widget _buildPopup(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final anchor = anchorRectIn(context, _anchor.currentContext!);
    final hasIcons = widget.items.any((item) => item.icon != null);
    final message = widget.loading
        ? theme.messages.loadingLabel
        : widget.items.isEmpty
        ? widget.emptyText
        : null;

    final list = Semantics(
      container: true,
      explicitChildNodes: true,
      role: SemanticsRole.list,
      label: widget.semanticLabel,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final item in widget.items)
            _Option<T>(
              key: widget.controller.keyFor(item.value),
              controller: widget.controller,
              item: item,
              selected: item.value == widget.selected,
              iconSlot: hasIcons,
              onSelect: widget.onSelect,
            ),
          if (message != null)
            Semantics(
              container: true,
              liveRegion: widget.loading,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Text(
                  message,
                  style: theme.textStyle.copyWith(color: colors.textSecondary),
                ),
              ),
            ),
        ],
      ),
    );

    return CustomSingleChildLayout(
      delegate: AnchoredLayout(
        anchor: anchor,
        side: AnchorSide.bottom,
        direction: Directionality.of(context),
        matchAnchorWidth: true,
      ),
      // Inside a popover, a press on the list is a press inside it too.
      child: OverlayTapGroup.wrap(
        context,
        TapRegion(
          groupId: this,
          onTapOutside: (_) => widget.onPressOutside(),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.textScalerOf(context).scale(_maxHeight),
            ),
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: colors.background,
                border: Border.all(color: colors.border, width: _panelBorder),
                borderRadius: BorderRadius.circular(
                  InvisibleRadiusTokens.surface,
                ),
                boxShadow: overlayShadow(theme.brightness),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(
                  InvisibleRadiusTokens.surface - _panelBorder,
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(_panelPadding),
                  child: list,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return OverlayPortal(
      controller: widget.controller.portal,
      overlayChildBuilder: _buildPopup,
      child: TapRegion(
        groupId: this,
        child: KeyedSubtree(key: _anchor, child: widget.child),
      ),
    );
  }
}

class _Option<T> extends StatelessWidget {
  const _Option({
    super.key,
    required this.controller,
    required this.item,
    required this.selected,
    required this.iconSlot,
    required this.onSelect,
  });

  final ListboxController<T> controller;
  final ChoiceItem<T> item;
  final bool selected;
  final bool iconSlot;
  final ValueChanged<T> onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = !item.disabled;
    final scaler = MediaQuery.textScalerOf(context);
    final target = theme.minTargetSize;
    final foreground = enabled ? colors.text : colors.textDisabled;

    final row = Row(
      children: [
        SizedBox.square(
          dimension: scaler.scale(_checkSide),
          child: selected
              ? IconTheme(
                  data: IconThemeData(
                    color: colors.selected,
                    size: _checkSide,
                    applyTextScaling: true,
                  ),
                  child: const Glyph(GlyphShape.check, strokeWidth: 2.5),
                )
              : null,
        ),
        const SizedBox(width: _optionGap),
        if (iconSlot) ...[
          SizedBox.square(
            dimension: scaler.scale(_iconSide),
            child: IconTheme(
              data: IconThemeData(
                color: colors.textSecondary,
                size: _iconSide,
                applyTextScaling: true,
              ),
              child: ExcludeSemantics(child: item.icon ?? const SizedBox()),
            ),
          ),
          const SizedBox(width: _optionGap),
        ],
        Expanded(
          child: Text(
            item.label,
            style: theme.textStyle.copyWith(
              color: foreground,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ],
    );

    return Semantics(
      container: true,
      role: SemanticsRole.listItem,
      label: item.label,
      selected: selected,
      enabled: enabled,
      onTap: enabled ? () => onSelect(item.value) : null,
      child: ExcludeSemantics(
        child: MouseRegion(
          cursor: enabled
              ? SystemMouseCursors.click
              : SystemMouseCursors.forbidden,
          onEnter: enabled ? (_) => controller.activate(item.value) : null,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: enabled ? () => onSelect(item.value) : null,
            child: ListenableBuilder(
              listenable: controller,
              builder: (context, _) {
                final active = controller.active == item.value;
                return ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: target.height,
                    minWidth: target.width,
                  ),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: selected
                          ? colors.selected.withValues(alpha: _selectedTint)
                          : active
                          ? colors.stateHover
                          : null,
                      borderRadius: BorderRadius.circular(theme.controlRadius),
                      // Focus stays on the control, so the highlighted option
                      // shows a ring of its own, inside the scrolling list.
                      border: active
                          ? Border.all(
                              color: colors.focusRing,
                              width: theme.focusRing.width,
                            )
                          : null,
                    ),
                    child: Padding(
                      padding: _optionPadding,
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        heightFactor: 1,
                        child: row,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

/// The chevron of a field that opens a list, half a turn up while [open].
class ListboxChevron extends StatelessWidget {
  /// Draws the chevron.
  const ListboxChevron({super.key, required this.open});

  /// Whether the list shows.
  final bool open;

  @override
  Widget build(BuildContext context) {
    final reduceMotion = reducedMotion(context);
    return AnimatedRotation(
      turns: open ? 0.5 : 0,
      duration: reduceMotion
          ? Duration.zero
          : const Duration(milliseconds: 150),
      child: const Glyph(GlyphShape.chevronDown),
    );
  }
}
