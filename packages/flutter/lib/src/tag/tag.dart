import 'package:flutter/widgets.dart';

import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The colour of a [Tag]. The tag's text carries the meaning; the colour
/// adds to it.
enum TagStatus {
  /// No particular meaning, the default.
  neutral,

  /// Information.
  info,

  /// Something done or valid.
  success,

  /// Something that needs attention.
  warning,

  /// Something failed or at risk.
  danger,

  /// A chosen item, such as an active filter.
  selected,
}

/// The weight of a [Tag].
enum TagVariant {
  /// A tinted surface with a border, the default.
  soft,

  /// A filled chip.
  solid,
}

/// The size of a [Tag].
enum TagSize {
  /// 12 pixel text.
  small,

  /// 13 pixel text, the default.
  medium,
}

// Sizes the web Tag sets in its own stylesheet, at text scale 1.
const double _minHeight = 24;
const double _gap = 4.8;
const double _removeSide = 24;
const double _restOpacity = 0.7;

/// A small coloured chip that labels or sorts content: a status colour, its
/// text, an optional leading [icon] and [trailing] content (a [Count], for
/// example). With [onRemoved] it carries a remove button.
///
/// Distinct from [Label], the form label, and from [Count], which a tag may
/// hold.
///
/// The chip is presentational and its meaning is its text, so the status
/// never rests on colour alone. The remove button is a button named
/// [removeLabel], or the catalog's "Remove", and its cross is decorative.
class Tag extends StatelessWidget {
  /// Creates the tag showing [child].
  const Tag({
    super.key,
    required this.child,
    this.status = TagStatus.neutral,
    this.variant = TagVariant.soft,
    this.size = TagSize.medium,
    this.icon,
    this.trailing,
    this.onRemoved,
    this.removeLabel,
  });

  /// The text, usually a [Text].
  final Widget child;

  /// The colour.
  final TagStatus status;

  /// The weight.
  final TagVariant variant;

  /// The size.
  final TagSize size;

  /// A decorative leading icon. It takes its size and colour from the
  /// surrounding [IconTheme], which the tag sets.
  final Widget? icon;

  /// Content after the text, such as a [Count].
  final Widget? trailing;

  /// Called when the remove button is pressed. Null shows no remove button.
  final VoidCallback? onRemoved;

  /// The accessible name of the remove button, in place of
  /// [InvisibleMessages.tagRemove].
  final String? removeLabel;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final paint = _TagPaint.of(status, variant, theme.colors);
    final scale = MediaQuery.textScalerOf(context);
    final small = size == TagSize.small;
    final fontSize = small ? 12.0 : 13.0;
    final onRemoved = this.onRemoved;
    final icon = this.icon;
    final trailing = this.trailing;

    return IconTheme(
      data: IconThemeData(
        color: paint.foreground,
        size: fontSize,
        applyTextScaling: true,
      ),
      child: DefaultTextStyle(
        style: theme.textStyle.copyWith(
          fontSize: fontSize,
          fontWeight: FontWeight.w500,
          height: InvisibleTypographyTokens.lineHeightTight,
          color: paint.foreground,
        ),
        child: Container(
          constraints: BoxConstraints(minHeight: scale.scale(_minHeight)),
          padding: small
              ? const EdgeInsets.symmetric(horizontal: 6.4, vertical: 0.8)
              : const EdgeInsets.symmetric(horizontal: 8, vertical: 2.4),
          decoration: BoxDecoration(
            color: paint.background,
            border: Border.all(color: paint.border),
            borderRadius: BorderRadius.circular(theme.controlRadius),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            spacing: _gap,
            children: [
              if (icon != null) ExcludeSemantics(child: icon),
              // Flexible, so a long text wraps in a narrow parent.
              Flexible(child: child),
              ?trailing,
              if (onRemoved != null)
                _RemoveButton(
                  onPressed: onRemoved,
                  label: removeLabel ?? theme.messages.tagRemove,
                  color: paint.foreground,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RemoveButton extends StatelessWidget {
  const _RemoveButton({
    required this.onPressed,
    required this.label,
    required this.color,
  });

  final VoidCallback onPressed;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final side = MediaQuery.textScalerOf(context).scale(_removeSide);
    return Semantics(
      container: true,
      button: true,
      label: label,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: side / 2,
          child: SizedBox.square(
            dimension: side,
            child: Center(
              child: Opacity(
                // Hover and focus strengthen the cross; no fill.
                opacity: states.hovered || states.focusVisible
                    ? 1
                    : _restOpacity,
                child: const Glyph(GlyphShape.close, strokeWidth: 2.6),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The colours of one status in one variant, as the web Tag's stylesheet
/// sets them.
class _TagPaint {
  const _TagPaint(this.background, this.foreground, this.border);

  final Color background;
  final Color foreground;
  final Color border;

  static const Color _clear = Color(0x00000000);

  static _TagPaint of(TagStatus status, TagVariant variant, InvisibleColors c) {
    if (variant == TagVariant.solid) {
      return switch (status) {
        TagStatus.neutral => _TagPaint(c.neutral, c.onStatus, _clear),
        TagStatus.info => _TagPaint(c.info, c.onStatus, _clear),
        TagStatus.success => _TagPaint(c.success, c.onStatus, _clear),
        TagStatus.warning => _TagPaint(c.warning, c.onWarning, _clear),
        TagStatus.danger => _TagPaint(c.danger, c.onStatus, _clear),
        TagStatus.selected => _TagPaint(c.secondary, c.onSecondary, _clear),
      };
    }
    return switch (status) {
      TagStatus.neutral => _TagPaint(
        c.neutralSurface,
        c.neutralText,
        c.neutralBorder,
      ),
      TagStatus.info => _TagPaint(c.infoSurface, c.infoText, c.infoBorder),
      TagStatus.success => _TagPaint(
        c.successSurface,
        c.successText,
        c.successBorder,
      ),
      TagStatus.warning => _TagPaint(
        c.warningSurface,
        c.warningText,
        c.warningBorder,
      ),
      TagStatus.danger => _TagPaint(
        c.dangerSurface,
        c.dangerText,
        c.dangerBorder,
      ),
      TagStatus.selected => _TagPaint(
        c.secondary.withValues(alpha: 0.08),
        c.selectedText,
        c.secondary.withValues(alpha: 0.22),
      ),
    };
  }
}
