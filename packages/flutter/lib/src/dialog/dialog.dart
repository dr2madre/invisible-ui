import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../theme/theme.dart';
import 'dialog_panel.dart';

/// A modal dialog, following the WAI-ARIA dialog pattern. Show it with
/// [showInvisibleDialog].
///
/// The header holds the [title], which names the dialog, an optional
/// [description] under it, which describes it, and a close button
/// ([closeButton], on by default) named by the theme's `dialogCloseLabel`.
/// [icon], [headerLead], [headerMeta] and [headerActions] add to it. The
/// body ([child]) is the only part that scrolls; the footer holds
/// [footerLead] at the inline-start, an optional Close button
/// ([footerClose]) and [actions] at the inline-end, wrapping on a narrow
/// screen in the same order.
///
/// When it opens, focus moves to [initialFocus], or to the dialog itself,
/// never to the close button. Escape, the close buttons and, unless the
/// route says otherwise, a press on the barrier close it.
///
/// A status area between the body and the footer holds messages about the
/// dialog's own task (ADR 0016): `Dialog.of(context).notify(...)` from the
/// content, or [controller] from outside.
class Dialog extends StatelessWidget {
  /// Creates a dialog.
  const Dialog({
    super.key,
    required this.title,
    this.hideTitle = false,
    this.description,
    this.child,
    this.actions = const [],
    this.footerLead = const [],
    this.footerClose = false,
    this.closeButton = true,
    this.icon,
    this.headerLead,
    this.headerMeta,
    this.headerActions,
    this.initialFocus,
    this.controller,
  });

  /// The title; it names the dialog.
  final String title;

  /// Whether the title is hidden from view. It still names the dialog.
  final bool hideTitle;

  /// A line under the title, which also describes the dialog.
  final String? description;

  /// The body.
  final Widget? child;

  /// The footer's actions at the inline-end, usually [Button]s.
  final List<Widget> actions;

  /// The footer's actions at the inline-start, such as Back.
  final List<Widget> footerLead;

  /// Whether the footer starts with a ghost Close button.
  final bool footerClose;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// A leading status icon in the header.
  final Widget? icon;

  /// A leading button in the header, such as Back.
  final Widget? headerLead;

  /// Context above the title, such as "Step 1 of 2". It carries no progress
  /// semantics of its own.
  final Widget? headerMeta;

  /// Actions in the header, before the close button.
  final Widget? headerActions;

  /// What takes focus when the dialog opens. Null focuses the dialog.
  final FocusNode? initialFocus;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  /// The status area of the dialog around [context].
  static DialogController of(BuildContext context) {
    final controller = maybeOf(context);
    assert(controller != null, 'Dialog.of called outside a dialog.');
    return controller!;
  }

  /// The status area of the dialog around [context], or null outside one.
  static DialogController? maybeOf(BuildContext context) =>
      maybeDialogControllerOf(context);

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    final lead = [
      ...footerLead,
      if (footerClose)
        Button(
          onPressed: () => Navigator.maybeOf(context)?.maybePop(),
          variant: ButtonVariant.ghost,
          child: Text(messages.dialogCloseLabel),
        ),
    ];
    return DialogPanel(
      title: title,
      role: SemanticsRole.dialog,
      spacing: DialogSpacing.dialog,
      hideTitle: hideTitle,
      subtitle: description,
      body: child,
      footer: lead.isEmpty && actions.isEmpty
          ? null
          : DialogFooter(lead: lead, actions: actions),
      closeButton: closeButton,
      icon: icon,
      headerLead: headerLead,
      headerMeta: headerMeta,
      headerActions: headerActions,
      initialFocus: initialFocus,
      controller: controller,
    );
  }
}

/// One action bar: [lead] at the inline-start, [actions] at the inline-end.
/// On a narrow screen it wraps and keeps that order, so the visual order
/// never contradicts the focus order.
class DialogFooter extends StatelessWidget {
  /// Creates the bar.
  const DialogFooter({super.key, this.lead = const [], required this.actions});

  /// The actions at the inline-start.
  final List<Widget> lead;

  /// The actions at the inline-end.
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    Wrap group(List<Widget> children) => Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: children,
    );
    return Wrap(
      alignment: lead.isEmpty ? WrapAlignment.end : WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        if (lead.isNotEmpty) group(lead),
        if (actions.isNotEmpty) group(actions),
      ],
    );
  }
}

/// A modal acknowledgement: an important message and one button that takes
/// note of it. Show it with [showInvisibleDialog].
///
/// It interrupts, as an alert dialog: assistive technology reads its
/// [title] and [description] when it opens. Focus starts on the button,
/// named [dismissLabel] or the theme's `dialogDismissLabel` ("OK"); prefer
/// naming the outcome ("Done", "I understand"). Escape, the barrier and the
/// optional close button are the same acknowledgement: [onDismiss] runs
/// after every way of closing.
///
/// For a choice that can stop a process use [ConfirmDialog].
class AlertDialog extends StatefulWidget {
  /// Creates an alert dialog.
  const AlertDialog({
    super.key,
    required this.title,
    required this.description,
    this.dismissLabel,
    this.onDismiss,
    this.closeButton = false,
    this.icon,
    this.controller,
  });

  /// The title; it names the alert.
  final String title;

  /// The message to acknowledge.
  final String description;

  /// The button's label. Defaults to the theme's `dialogDismissLabel`.
  final String? dismissLabel;

  /// Called after the alert closes, however it closed.
  final VoidCallback? onDismiss;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// A leading status icon in the header.
  final Widget? icon;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  @override
  State<AlertDialog> createState() => _AlertDialogState();
}

class _AlertDialogState extends State<AlertDialog> {
  final FocusNode _dismiss = FocusNode(debugLabel: 'Alert dismiss');

  @override
  void dispose() {
    _dismiss.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    return DialogPanel(
      title: widget.title,
      role: SemanticsRole.alertDialog,
      spacing: DialogSpacing.preset,
      message: widget.description,
      closeButton: widget.closeButton,
      icon: widget.icon,
      controller: widget.controller,
      // The only action: taking note.
      initialFocus: _dismiss,
      onClosed: () => widget.onDismiss?.call(),
      footer: DialogFooter(
        actions: [
          Button(
            onPressed: () => Navigator.maybeOf(context)?.maybePop(),
            focusNode: _dismiss,
            variant: ButtonVariant.primary,
            child: Text(widget.dismissLabel ?? messages.dialogDismissLabel),
          ),
        ],
      ),
    );
  }
}

/// A modal choice before going on: Cancel stops, confirm proceeds. Show it
/// with `showInvisibleDialog<bool>`, which completes with true when
/// confirmed, false when cancelled, and null when closed with Escape, the
/// barrier or the close button.
///
/// Name both buttons by their outcome, with [confirmLabel] and
/// [cancelLabel] ("Delete" and "Keep hours"); they default to the theme's
/// `dialogConfirmLabel` and `dialogCancelLabel`. For a destructive choice
/// set [confirmVariant] to [ButtonVariant.danger]. Focus starts on Cancel,
/// the safe choice. [urgent] makes it an alert dialog, which assistive
/// technology reads at once; nothing else changes.
class ConfirmDialog extends StatefulWidget {
  /// Creates a confirm dialog.
  const ConfirmDialog({
    super.key,
    required this.title,
    this.description,
    this.confirmLabel,
    this.cancelLabel,
    this.confirmVariant = ButtonVariant.primary,
    this.urgent = false,
    this.onConfirm,
    this.closeButton = false,
    this.icon,
    this.controller,
  });

  /// The title; it names the confirmation.
  final String title;

  /// The consequence of the choice.
  final String? description;

  /// The confirming button's label.
  final String? confirmLabel;

  /// The cancelling button's label.
  final String? cancelLabel;

  /// The confirming button's variant.
  final ButtonVariant confirmVariant;

  /// Whether the choice interrupts, as an alert dialog.
  final bool urgent;

  /// Called when the confirming button is pressed, before the dialog
  /// closes.
  final VoidCallback? onConfirm;

  /// Whether the header ends with a close button.
  final bool closeButton;

  /// A leading status icon in the header.
  final Widget? icon;

  /// The status area's controller, to reach it from outside the dialog.
  final DialogController? controller;

  @override
  State<ConfirmDialog> createState() => _ConfirmDialogState();
}

class _ConfirmDialogState extends State<ConfirmDialog> {
  final FocusNode _cancel = FocusNode(debugLabel: 'Confirm cancel');

  @override
  void dispose() {
    _cancel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = InvisibleTheme.of(context).messages;
    return DialogPanel(
      title: widget.title,
      role: widget.urgent ? SemanticsRole.alertDialog : SemanticsRole.dialog,
      spacing: DialogSpacing.preset,
      message: widget.description,
      closeButton: widget.closeButton,
      icon: widget.icon,
      controller: widget.controller,
      // The safe choice first.
      initialFocus: _cancel,
      footer: DialogFooter(
        actions: [
          Button(
            onPressed: () => Navigator.maybeOf(context)?.maybePop(false),
            focusNode: _cancel,
            variant: ButtonVariant.ghost,
            child: Text(widget.cancelLabel ?? messages.dialogCancelLabel),
          ),
          Button(
            onPressed: () {
              widget.onConfirm?.call();
              Navigator.maybeOf(context)?.maybePop(true);
            },
            variant: widget.confirmVariant,
            child: Text(widget.confirmLabel ?? messages.dialogConfirmLabel),
          ),
        ],
      ),
    );
  }
}
