import 'dart:ui' show SemanticsRole;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../field/field.dart';
import '../internal/text_box.dart';
import '../theme/theme.dart';
import 'dialog.dart';
import 'dialog_panel.dart';

/// A modal that asks for one value: everything [ConfirmDialog] has, plus a
/// text field. Show it with `showInvisibleDialog<String>`, which completes
/// with the entered text when confirmed and with null when cancelled or
/// closed with Escape, the barrier or the close button.
///
/// The field, named [label], takes focus when the dialog opens, and Enter
/// in it confirms. Enter that ends an input method composition only
/// commits the composed text. The value is optional: [required] keeps the
/// confirm button disabled while the field is blank, and [confirmValue]
/// keeps it disabled until the text matches exactly, a type-to-confirm gate
/// for a destructive action. [initialValue] fills the field each time the
/// dialog opens.
///
/// Confirming closes the dialog first, then calls [onConfirm] with the
/// text (ADR 0011). Name the buttons by their outcome with [confirmLabel]
/// and [cancelLabel]; for a destructive action set [confirmVariant] to
/// [ButtonVariant.danger] and [urgent], which makes it an alert dialog that
/// assistive technology reads at once.
///
/// ```dart
/// final name = await iu.showInvisibleDialog<String>(
///   context: context,
///   builder: (_) => const iu.PromptDialog(
///     title: 'Delete file',
///     description: 'The file report-q3.pdf will be permanently deleted.',
///     label: 'Type the file name to confirm',
///     confirmValue: 'report-q3.pdf',
///     confirmLabel: 'Delete file',
///     cancelLabel: 'Keep file',
///     confirmVariant: iu.ButtonVariant.danger,
///     urgent: true,
///   ),
/// );
/// ```
class PromptDialog extends StatefulWidget {
  /// Creates a prompt dialog.
  const PromptDialog({
    super.key,
    required this.title,
    required this.label,
    this.description,
    this.initialValue = '',
    this.placeholder,
    this.required = false,
    this.confirmValue,
    this.confirmLabel,
    this.cancelLabel,
    this.confirmVariant = ButtonVariant.primary,
    this.urgent = false,
    this.onConfirm,
    this.closeButton = false,
    this.icon,
    this.controller,
  });

  /// The title; it names the dialog.
  final String title;

  /// The visible label of the field, and its accessible name.
  final String label;

  /// A message under the title, which also describes the dialog.
  final String? description;

  /// The text the field holds when the dialog opens.
  final String initialValue;

  /// Shown in the empty field. It never replaces the label.
  final String? placeholder;

  /// Whether the field must hold more than spaces before confirming.
  final bool required;

  /// The exact text the field must hold before confirming.
  final String? confirmValue;

  /// The confirming button's label. Defaults to the theme's
  /// `dialogConfirmLabel`.
  final String? confirmLabel;

  /// The cancelling button's label. Defaults to the theme's
  /// `dialogCancelLabel`.
  final String? cancelLabel;

  /// The confirming button's variant.
  final ButtonVariant confirmVariant;

  /// Whether the question interrupts, as an alert dialog.
  final bool urgent;

  /// Called with the text after the dialog has closed on a confirmation.
  final ValueChanged<String>? onConfirm;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// A leading status icon in the header.
  final Widget? icon;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  @override
  State<PromptDialog> createState() => _PromptDialogState();
}

class _PromptDialogState extends State<PromptDialog> {
  late final TextEditingController _text = TextEditingController(
    text: widget.initialValue,
  )..addListener(_edited);
  final FocusNode _field = FocusNode(debugLabel: 'Prompt field');

  @override
  void dispose() {
    _text.dispose();
    _field.dispose();
    super.dispose();
  }

  void _edited() => setState(() {});

  bool get _canConfirm {
    final text = _text.text;
    final gate = widget.confirmValue;
    if (gate != null) return text == gate;
    return !widget.required || text.trim().isNotEmpty;
  }

  /// Closes with the text, then reports it.
  void _confirm() {
    if (!_canConfirm) return;
    final text = _text.text;
    final onConfirm = widget.onConfirm;
    final navigator = Navigator.maybeOf(context);
    if (navigator != null && navigator.canPop()) navigator.pop(text);
    onConfirm?.call(text);
  }

  void _submitted() {
    // Enter that ends a composition commits the composed text only.
    if (!isComposing(_text.value)) _confirm();
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    final text = _text.text;
    final field = FieldFrame(
      label: widget.label,
      required: widget.required,
      onLabelTap: _field.requestFocus,
      control: FieldSemantics(
        label: widget.label,
        placeholder: text.isEmpty ? widget.placeholder : null,
        required: widget.required,
        child: TextBox(
          controller: _text,
          focusNode: _field,
          placeholder: widget.placeholder,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _submitted(),
        ),
      ),
    );
    return DialogPanel(
      title: widget.title,
      role: widget.urgent ? SemanticsRole.alertDialog : SemanticsRole.dialog,
      spacing: DialogSpacing.preset,
      message: widget.description,
      body: field,
      closeButton: widget.closeButton,
      icon: widget.icon,
      controller: widget.controller,
      initialFocus: _field,
      footer: DialogFooter(
        actions: [
          Button(
            onPressed: () => Navigator.maybeOf(context)?.maybePop(),
            variant: ButtonVariant.ghost,
            child: Text(widget.cancelLabel ?? messages.dialogCancelLabel),
          ),
          Button(
            onPressed: _canConfirm ? _confirm : null,
            variant: widget.confirmVariant,
            child: Text(widget.confirmLabel ?? messages.dialogConfirmLabel),
          ),
        ],
      ),
    );
  }
}
