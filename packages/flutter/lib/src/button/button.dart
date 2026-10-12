import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../internal/ambient.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/grouped_corners.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// What a button's action means in its flow. The variant sets the colours;
/// the meaning stays with the variant, whatever the theme paints.
enum ButtonVariant {
  /// The baseline, medium-emphasis button. The web adapters call it `default`.
  standard,

  /// The most important action, the one that moves the flow forward.
  primary,

  /// An alternative emphasised action, often next to a primary one.
  secondary,

  /// A low-emphasis action with no fill or border at rest. Its text label is
  /// underlined, so it still reads as an action without colour.
  ghost,

  /// A destructive action. It shows a hazard glyph unless [Button.icon] is
  /// set, so its meaning never relies on colour alone.
  danger,
}

// Sizes the web Button sets in its own stylesheet rather than in the tokens.
const double _gap = 8;
const double _iconOnlyPadding = 8;
const double _iconOnlyMinSide = 36;
const double _borderWidth = 1;
const double _leadingIconEm = 1.1;
const double _iconOnlyGlyphEm = 1.25;
const double _disabledOpacity = 0.5;

/// A button, following the WAI-ARIA button pattern.
///
/// It runs [onPressed] on a tap, a click, Enter or Space. A null [onPressed]
/// disables it: it leaves the focus order and reports itself disabled.
///
/// While [loading], a spinner replaces the leading icon (or the glyph of an
/// icon-only button), the label stays, the button stays focusable and
/// presses are ignored. The busy state is announced as the button's value.
///
/// The hit area is never smaller than [InvisibleThemeData.minTargetSize],
/// and the button grows with its label and with the text scale.
class Button extends StatefulWidget {
  /// A button with a text [child] and an optional leading [icon].
  const Button({
    super.key,
    required this.onPressed,
    required Widget this.child,
    this.icon,
    this.variant = ButtonVariant.standard,
    this.loading = false,
    this.semanticLabel,
    this.focusNode,
    this.autofocus = false,
  }) : _iconOnly = false;

  /// A button that shows only [icon]. With no visible text, [semanticLabel]
  /// is its accessible name.
  const Button.icon({
    super.key,
    required this.onPressed,
    required Widget this.icon,
    required String this.semanticLabel,
    this.variant = ButtonVariant.standard,
    this.loading = false,
    this.focusNode,
    this.autofocus = false,
  }) : assert(semanticLabel != '', 'An icon-only button needs a label.'),
       child = null,
       _iconOnly = true;

  /// Called when the button is activated. Null disables the button.
  final VoidCallback? onPressed;

  /// The label, usually a [Text].
  final Widget? child;

  /// The leading icon, or the only content of [Button.icon]. It takes its size
  /// and colour from the surrounding [IconTheme], which the button sets.
  final Widget? icon;

  /// The meaning of the action.
  final ButtonVariant variant;

  /// Whether the action is in progress.
  final bool loading;

  /// The accessible name. It replaces what the label says to assistive
  /// technology; an icon-only button requires it.
  final String? semanticLabel;

  /// The focus node, for moving focus to the button from code.
  final FocusNode? focusNode;

  /// Whether the button takes focus when it first appears.
  final bool autofocus;

  final bool _iconOnly;

  @override
  State<Button> createState() => _ButtonState();
}

class _ButtonState extends State<Button> {
  bool _focusVisible = false;
  bool _hovered = false;

  static const Map<ShortcutActivator, Intent> _shortcuts = {
    SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.numpadEnter): ActivateIntent(),
    SingleActivator(LogicalKeyboardKey.space): ActivateIntent(),
  };

  late final Map<Type, Action<Intent>> _actions = {
    ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => _press()),
  };

  bool get _enabled => widget.onPressed != null;

  void _press() {
    // Read from the widget at the press, so a replaced callback is the one run.
    if (widget.loading) return;
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final paint = _VariantPaint.of(
      widget.variant,
      theme.colors,
      hovered: _hovered && _enabled,
    );
    final iconOnly = widget._iconOnly;
    final fontSize = theme.textStyle.fontSize!;

    final Widget? leading = widget.loading
        ? const Spinner()
        : widget.icon ??
              (widget.variant == ButtonVariant.danger
                  ? const HazardGlyph()
                  : null);

    final Widget content = IconTheme(
      data: IconThemeData(
        color: paint.foreground,
        size: fontSize * (iconOnly ? _iconOnlyGlyphEm : _leadingIconEm),
        applyTextScaling: true,
      ),
      child: DefaultTextStyle(
        style: theme.textStyle.copyWith(
          color: paint.foreground,
          fontWeight: FontWeight.w500,
          height: InvisibleTypographyTokens.lineHeightTight,
          decoration: widget.variant == ButtonVariant.ghost
              ? TextDecoration.underline
              : null,
          decorationColor: paint.foreground,
        ),
        textAlign: TextAlign.center,
        child: iconOnly
            ? leading!
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (leading != null) ...[
                    leading,
                    const SizedBox(width: _gap),
                  ],
                  // Flexible, so a long label wraps instead of overflowing.
                  Flexible(child: widget.child!),
                ],
              ),
      ),
    );

    final radius = theme.controlRadius;
    // Inside an attached ButtonGroup the group owns the outer corners.
    final grouped = GroupedCorners.maybeOf(context);
    final duration = reducedMotion(context)
        ? Duration.zero
        : const Duration(milliseconds: 120);
    final target = theme.minTargetSize;

    final Widget surface = FocusRingPainter(
      visible: _focusVisible,
      ring: theme.focusRing,
      radius: radius,
      corners: grouped,
      inside: grouped != null,
      child: AnimatedContainer(
        duration: duration,
        curve: Curves.ease,
        constraints: iconOnly
            ? const BoxConstraints(
                minWidth: _iconOnlyMinSide,
                minHeight: _iconOnlyMinSide,
              )
            : null,
        padding: iconOnly
            ? const EdgeInsets.all(_iconOnlyPadding)
            : theme.controlPadding,
        decoration: BoxDecoration(
          color: paint.background,
          border: Border.all(color: paint.border, width: _borderWidth),
          borderRadius: grouped ?? BorderRadius.circular(radius),
        ),
        child: Center(
          widthFactor: 1,
          heightFactor: 1,
          child: ExcludeSemantics(
            excluding: widget.semanticLabel != null,
            child: content,
          ),
        ),
      ),
    );

    return Semantics(
      container: true,
      button: true,
      enabled: _enabled,
      label: widget.semanticLabel,
      value: widget.loading ? theme.messages.loadingLabel : null,
      onTap: _enabled ? _press : null,
      child: FocusableActionDetector(
        enabled: _enabled,
        focusNode: widget.focusNode,
        autofocus: widget.autofocus,
        shortcuts: _shortcuts,
        actions: _actions,
        mouseCursor: !_enabled
            ? SystemMouseCursors.forbidden
            : widget.loading
            ? SystemMouseCursors.progress
            : SystemMouseCursors.click,
        onShowFocusHighlight: (value) => setState(() => _focusVisible = value),
        // Hover follows the mouse alone, as CSS :hover does, whatever the
        // focus highlight mode.
        child: MouseRegion(
          onEnter: (_) => setState(() => _hovered = true),
          onExit: (_) => setState(() => _hovered = false),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            excludeFromSemantics: true,
            onTap: _enabled ? _press : null,
            // The hit area: at least the minimum target size, with the painted
            // button centred in it.
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minWidth: target.width,
                minHeight: target.height,
              ),
              child: Center(
                widthFactor: 1,
                heightFactor: 1,
                child: Opacity(
                  opacity: _enabled ? 1 : _disabledOpacity,
                  child: surface,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The colours of one variant in one state, as the web Button's stylesheet
/// derives them from the colour roles.
class _VariantPaint {
  const _VariantPaint(this.background, this.foreground, this.border);

  final Color background;
  final Color foreground;
  final Color border;

  static const Color _clear = Color(0x00000000);

  /// [amount] of [color] over [over], as CSS `color-mix()` in sRGB.
  static Color _mix(Color color, double amount, Color over) =>
      Color.lerp(over, color, amount)!;

  static _VariantPaint of(
    ButtonVariant variant,
    InvisibleColors c, {
    required bool hovered,
  }) {
    return switch (variant) {
      ButtonVariant.standard => _VariantPaint(
        hovered ? c.surface : c.background,
        c.text,
        _mix(c.controlBorder, 0.7, c.background),
      ),
      ButtonVariant.primary => _VariantPaint(
        hovered ? c.primaryHover : c.primary,
        c.onPrimary,
        _clear,
      ),
      ButtonVariant.secondary => _VariantPaint(
        hovered ? _mix(c.primary, 0.24, c.background) : c.secondarySurface,
        c.onSecondarySurface,
        c.primary.withValues(alpha: 0.55),
      ),
      ButtonVariant.ghost => _VariantPaint(
        hovered ? c.stateHover : _clear,
        c.text,
        _clear,
      ),
      ButtonVariant.danger => _VariantPaint(
        hovered ? _mix(c.danger, 0.18, c.background) : c.destructiveSurface,
        c.onDestructiveSurface,
        c.danger.withValues(alpha: 0.35),
      ),
    };
  }
}
