import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import 'focus_ring.dart';

// Sizes the web field sets in its own stylesheet rather than in the tokens.
const EdgeInsetsDirectional _padding = EdgeInsetsDirectional.symmetric(
  horizontal: 12,
  vertical: 8,
);
const double _borderWidth = 1;
const double _iconGap = 8;
const double _dangerHalo = 0.3;

/// The editable box of a text control, on [EditableText]: the border, the
/// background, the placeholder, decorative icons, the focus ring and the
/// pointer gestures (tap, drag and double-click selection).
///
/// The ring shows whenever the box has focus, in any highlight mode, as a
/// text input matches `:focus-visible` on the web whatever focused it. An
/// invalid box shows a danger ring at rest too.
class TextBox extends StatefulWidget {
  /// Creates the box around [controller].
  const TextBox({
    super.key,
    required this.controller,
    required this.focusNode,
    this.enabled = true,
    this.readOnly = false,
    this.invalid = false,
    this.autofocus = false,
    this.placeholder,
    this.obscureText = false,
    this.minLines,
    this.maxLines = 1,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.autofillHints,
    this.textAlign = TextAlign.start,
    this.onSubmitted,
    this.leading,
    this.trailing,
  });

  /// The text.
  final TextEditingController controller;

  /// The focus node of the editable text.
  final FocusNode focusNode;

  /// A disabled box takes no focus, no pointer and no edits.
  final bool enabled;

  /// A read-only box takes focus and selection, not edits.
  final bool readOnly;

  /// Paints the danger border and ring.
  final bool invalid;

  /// Takes focus when it first appears.
  final bool autofocus;

  /// Shown while the text is empty.
  final String? placeholder;

  /// Hides the characters, for passwords.
  final bool obscureText;

  /// The lines the box shows at least.
  final int? minLines;

  /// The lines the box grows to before it scrolls; null grows without limit.
  final int? maxLines;

  /// The keyboard a touch device shows.
  final TextInputType? keyboardType;

  /// The action key of a touch keyboard.
  final TextInputAction? textInputAction;

  /// Rules applied to typed text.
  final List<TextInputFormatter>? inputFormatters;

  /// Autofill hints.
  final Iterable<String>? autofillHints;

  /// How the text aligns.
  final TextAlign textAlign;

  /// Called on Enter in a single-line box.
  final ValueChanged<String>? onSubmitted;

  /// A decorative widget before the text.
  final Widget? leading;

  /// A decorative widget after the text.
  final Widget? trailing;

  @override
  State<TextBox> createState() => _TextBoxState();
}

class _TextBoxState extends State<TextBox>
    implements TextSelectionGestureDetectorBuilderDelegate {
  @override
  final GlobalKey<EditableTextState> editableTextKey =
      GlobalKey<EditableTextState>();

  @override
  bool get forcePressEnabled => false;

  @override
  bool get selectionEnabled => widget.enabled;

  late final TextSelectionGestureDetectorBuilder _gestures =
      TextSelectionGestureDetectorBuilder(delegate: this);

  @override
  void initState() {
    super.initState();
    widget.focusNode.addListener(_focusChanged);
    _applyEnabled();
  }

  @override
  void didUpdateWidget(TextBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      oldWidget.focusNode.removeListener(_focusChanged);
      widget.focusNode.addListener(_focusChanged);
    }
    _applyEnabled();
  }

  // A disabled box leaves the focus order, as a disabled input does.
  void _applyEnabled() {
    widget.focusNode.canRequestFocus = widget.enabled;
    if (!widget.enabled && widget.focusNode.hasFocus) {
      widget.focusNode.unfocus();
    }
  }

  @override
  void dispose() {
    widget.focusNode.removeListener(_focusChanged);
    super.dispose();
  }

  void _focusChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final focused = widget.focusNode.hasFocus;
    final style = theme.textStyle.copyWith(
      color: widget.enabled ? colors.text : colors.textDisabled,
    );

    final Widget editable = EditableText(
      key: editableTextKey,
      controller: widget.controller,
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      style: style,
      cursorColor: colors.text,
      backgroundCursorColor: colors.textDisabled,
      selectionColor: colors.focusHalo,
      readOnly: widget.readOnly || !widget.enabled,
      obscureText: widget.obscureText,
      minLines: widget.minLines,
      maxLines: widget.maxLines,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      inputFormatters: widget.inputFormatters,
      autofillHints: widget.autofillHints,
      textAlign: widget.textAlign,
      onSubmitted: widget.onSubmitted,
      // Enter keeps focus in the box, as it does in a web input.
      onEditingComplete: () {},
      enableInteractiveSelection: widget.enabled,
      rendererIgnoresPointer: true,
    );

    // The owner rebuilds the box on every edit, so the text read here is
    // current. The placeholder is in the owner's semantics hint.
    final placeholder = widget.placeholder;
    final Widget text = placeholder == null || widget.controller.text.isNotEmpty
        ? editable
        : Stack(
            children: [
              Positioned.fill(
                child: IgnorePointer(
                  child: ExcludeSemantics(
                    child: Text(
                      placeholder,
                      style: style.copyWith(color: colors.textSecondary),
                      textAlign: widget.textAlign,
                      maxLines: widget.maxLines,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
              editable,
            ],
          );

    final ring = widget.invalid
        ? theme.focusRing.copyWith(
            color: colors.danger,
            haloColor: colors.danger.withValues(alpha: _dangerHalo),
          )
        : theme.focusRing;
    final radius = theme.controlRadius;

    Widget box = FocusRingPainter(
      visible: focused || widget.invalid,
      ring: ring,
      radius: radius,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minHeight: theme.minTargetSize.height,
          minWidth: theme.minTargetSize.width,
        ),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: widget.enabled ? colors.background : colors.disabled,
            border: Border.all(
              width: _borderWidth,
              color: widget.invalid
                  ? colors.danger
                  : focused
                  ? colors.focusRing
                  : colors.controlBorder,
            ),
            borderRadius: BorderRadius.circular(radius),
          ),
          child: Padding(
            padding: _padding,
            child: IconTheme(
              data: IconThemeData(
                color: colors.textSecondary,
                size: (theme.textStyle.fontSize ?? 16) * 1.15,
                applyTextScaling: true,
              ),
              child: Row(
                children: [
                  if (widget.leading case final leading?) ...[
                    ExcludeSemantics(child: leading),
                    const SizedBox(width: _iconGap),
                  ],
                  Expanded(child: text),
                  if (widget.trailing case final trailing?) ...[
                    const SizedBox(width: _iconGap),
                    ExcludeSemantics(child: trailing),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );

    box = _gestures.buildGestureDetector(
      behavior: HitTestBehavior.translucent,
      child: box,
    );

    return MouseRegion(
      cursor: widget.enabled
          ? SystemMouseCursors.text
          : SystemMouseCursors.forbidden,
      child: IgnorePointer(ignoring: !widget.enabled, child: box),
    );
  }
}
