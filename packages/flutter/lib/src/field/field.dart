// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';

import '../internal/glyphs.dart';
import '../theme/theme.dart';

// Sizes the web Field sets in its own stylesheet rather than in the tokens.
const double _gap = 6;
const double _labelSize = 14;
const double _errorGlyphGap = 5.6;

/// The width a field takes when its parent leaves the width open, the web
/// field's default `18rem`.
const double fieldDefaultWidth = 288;

/// A form field: a label, a control, an optional description and an
/// optional error message, tied together for assistive technology.
///
/// The label, the description and the error are part of the control's
/// semantics node: the label names it, the description and the error
/// describe it, and an error marks it invalid. The error also shows as text
/// with a hazard glyph, so the invalid state never relies on colour alone,
/// and it is a live region, so a new error is announced.
///
/// [child] is the control. Its own semantics merge into the field's node, so
/// it should not open a semantics container of its own. A tap on the label
/// moves focus to the first focusable widget in [child].
///
/// [TextField], [Textarea] and [NumberField] carry their own field; use
/// [Field] for any other control.
class Field extends StatefulWidget {
  /// Wraps [child] in a field named by [label].
  const Field({
    super.key,
    required this.label,
    required this.child,
    this.description,
    this.error,
    this.required = false,
    this.enabled = true,
    this.hideLabel = false,
  });

  /// The visible label, and the control's accessible name.
  final String label;

  /// The control.
  final Widget child;

  /// A hint shown under the control.
  final String? description;

  /// An error message. A non-empty one marks the field invalid.
  final String? error;

  /// Whether a value is required. The label shows an asterisk, and the
  /// control reports itself required.
  final bool required;

  /// Whether the field is enabled. A disabled field dims its label and
  /// reports the control disabled; the control disables itself.
  final bool enabled;

  /// Hides the label visually while it still names the control.
  final bool hideLabel;

  @override
  State<Field> createState() => _FieldState();
}

class _FieldState extends State<Field> {
  final FocusNode _scope = FocusNode(
    canRequestFocus: false,
    skipTraversal: true,
  );

  @override
  void dispose() {
    _scope.dispose();
    super.dispose();
  }

  void _focusControl() =>
      _scope.traversalDescendants.firstOrNull?.requestFocus();

  @override
  Widget build(BuildContext context) {
    return FieldFrame(
      label: widget.label,
      hideLabel: widget.hideLabel,
      required: widget.required,
      enabled: widget.enabled,
      description: widget.description,
      error: widget.error,
      onLabelTap: _focusControl,
      control: FieldSemantics(
        label: widget.label,
        description: widget.description,
        error: widget.error,
        required: widget.required,
        enabled: widget.enabled,
        child: Focus(focusNode: _scope, child: widget.child),
      ),
    );
  }
}

/// The semantics node of a field's control: the label names it, the
/// description and the error describe it, and an error marks it invalid.
class FieldSemantics extends StatelessWidget {
  /// Gives [child] the semantics of a field control.
  const FieldSemantics({
    super.key,
    required this.label,
    required this.child,
    this.description,
    this.error,
    this.placeholder,
    this.required = false,
    this.enabled = true,
    this.maxValueLength,
    this.currentValueLength,
    this.expanded,
    this.role,
    this.explicitChildNodes = false,
  });

  /// The accessible name.
  final String label;

  /// The description, read after the name.
  final String? description;

  /// The error, read after the description.
  final String? error;

  /// Read last, and only when given: the placeholder of an empty control.
  final String? placeholder;

  /// Whether a value is required.
  final bool required;

  /// Whether the control is enabled.
  final bool enabled;

  /// The maximum length of a text value.
  final int? maxValueLength;

  /// The current length of a text value.
  final int? currentValueLength;

  /// Whether the popup the control opens is showing; null when it opens none.
  final bool? expanded;

  /// The role of a group control, such as a radio group.
  final SemanticsRole? role;

  /// Keeps the children as nodes of their own, for a group of controls.
  final bool explicitChildNodes;

  /// The control.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final hint = [
      description,
      error,
      placeholder,
    ].where((part) => part != null && part.isNotEmpty).join('\n');
    return Semantics(
      container: true,
      explicitChildNodes: explicitChildNodes,
      role: role,
      label: label,
      hint: hint.isEmpty ? null : hint,
      enabled: enabled ? null : false,
      isRequired: required ? true : null,
      validationResult: error != null && error!.isNotEmpty
          ? SemanticsValidationResult.invalid
          : SemanticsValidationResult.none,
      maxValueLength: maxValueLength,
      currentValueLength: maxValueLength == null ? null : currentValueLength,
      expanded: expanded,
      child: child,
    );
  }
}

/// The layout of a field: the label, the control, the description and the
/// error, in a column as wide as the parent allows, or [fieldDefaultWidth]
/// when the parent leaves the width open.
///
/// The visible label and description stay out of the semantics tree, since
/// the control's [FieldSemantics] carries them. The error stays in it as a
/// live region, so a new error is announced.
class FieldFrame extends StatelessWidget {
  /// Lays out [control] with its label and messages.
  const FieldFrame({
    super.key,
    required this.label,
    required this.control,
    this.hideLabel = false,
    this.required = false,
    this.enabled = true,
    this.description,
    this.error,
    this.onLabelTap,
  });

  /// The visible label.
  final String label;

  /// The control, already wrapped in its [FieldSemantics].
  final Widget control;

  /// Hides the label visually.
  final bool hideLabel;

  /// Shows the required asterisk.
  final bool required;

  /// Dims the label when false.
  final bool enabled;

  /// The description under the control.
  final String? description;

  /// The error under the control.
  final String? error;

  /// Called when the label is tapped, to focus the control.
  final VoidCallback? onLabelTap;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final base = theme.textStyle;
    final error = this.error;
    final description = this.description;

    final column = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!hideLabel) ...[
          ExcludeSemantics(
            child: GestureDetector(
              onTap: onLabelTap,
              child: Text.rich(
                TextSpan(
                  text: label,
                  children: [
                    if (required)
                      TextSpan(
                        text: ' *',
                        style: TextStyle(color: colors.dangerBodyText),
                      ),
                  ],
                ),
                style: base.copyWith(
                  fontSize: _labelSize,
                  fontWeight: FontWeight.w600,
                  color: enabled ? colors.text : colors.textDisabled,
                ),
              ),
            ),
          ),
          const SizedBox(height: _gap),
        ],
        control,
        if (description != null && description.isNotEmpty) ...[
          const SizedBox(height: _gap),
          ExcludeSemantics(
            child: Text(
              description,
              style: base.copyWith(color: colors.textSecondary),
            ),
          ),
        ],
        if (error != null && error.isNotEmpty) ...[
          const SizedBox(height: _gap),
          Semantics(
            container: true,
            liveRegion: true,
            child: IconTheme(
              data: IconThemeData(
                color: colors.dangerBodyText,
                size: base.fontSize,
                applyTextScaling: true,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const HazardGlyph(),
                  const SizedBox(width: _errorGlyphGap),
                  Expanded(
                    child: Text(
                      error,
                      style: base.copyWith(color: colors.dangerBodyText),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );

    return LayoutBuilder(
      builder: (context, constraints) => SizedBox(
        width: constraints.hasBoundedWidth
            ? constraints.maxWidth
            : fieldDefaultWidth,
        child: column,
      ),
    );
  }
}
