import 'package:flutter/foundation.dart';

/// The text the components show or announce.
///
/// The defaults are the English catalog of `core/src/i18n/messages.ts`; each
/// field names its catalog key. Pass translated text through
/// [InvisibleThemeData.messages]. Only the keys a shipped widget uses are
/// here. A message with a `{name}` placeholder keeps it in the translation;
/// the widget fills it in.
@immutable
class InvisibleMessages {
  /// Creates a message set, English unless a field is given.
  const InvisibleMessages({
    this.loadingLabel = 'Loading…',
    this.submenuHint = 'submenu',
    this.closeLabel = 'Close',
    this.notificationRegionLabel = 'Notifications',
    this.numberFieldIncrement = 'Increase {label}',
    this.numberFieldDecrement = 'Decrease {label}',
    this.numberFieldParseError = 'Enter a number.',
    this.numberFieldRangeUnderflow = 'Enter a number that is at least {min}.',
    this.numberFieldRangeOverflow = 'Enter a number that is at most {max}.',
    this.numberFieldStepMismatch = 'Enter a multiple of {step}.',
    this.dialogCloseLabel = 'Close',
    this.dialogConfirmLabel = 'Confirm',
    this.dialogCancelLabel = 'Cancel',
    this.dialogDismissLabel = 'OK',
    this.switchOn = 'ON',
    this.switchOff = 'OFF',
    this.selectPlaceholder = 'Select…',
    this.comboboxPlaceholder = 'Search…',
    this.comboboxClear = 'Clear',
    this.comboboxEmpty = 'No results',
    this.comboboxShow = 'Show options',
    this.comboboxHide = 'Close options',
    this.popoverTriggerLabel = 'Open',
  });

  /// Announced while a control is busy. Catalog key `loading.label`.
  final String loadingLabel;

  /// The hint of a menu item that opens a submenu. Catalog key
  /// `menu.submenu`.
  final String submenuHint;

  /// The name of a notification's close button. Catalog key
  /// `inlineNotification.close`.
  final String closeLabel;

  /// The name of the notification region. Catalog key
  /// `notificationRegion.label`.
  final String notificationRegionLabel;

  /// The name of a number field's increment button, with `{label}`.
  /// Catalog key `numberField.increment`.
  final String numberFieldIncrement;

  /// The name of a number field's decrement button, with `{label}`.
  /// Catalog key `numberField.decrement`.
  final String numberFieldDecrement;

  /// Shown when a number field's text is not a number. Catalog key
  /// `numberField.parseError`.
  final String numberFieldParseError;

  /// Shown when a number is below the minimum, with `{min}`. Catalog key
  /// `numberField.rangeUnderflow`.
  final String numberFieldRangeUnderflow;

  /// Shown when a number is above the maximum, with `{max}`. Catalog key
  /// `numberField.rangeOverflow`.
  final String numberFieldRangeOverflow;

  /// Shown when a number is off the step grid, with `{step}`. Catalog key
  /// `numberField.stepMismatch`.
  final String numberFieldStepMismatch;

  /// The name of a dialog's close button and of its dismissible barrier.
  /// Catalog key `dialog.close`.
  final String dialogCloseLabel;

  /// The confirming button of a confirm dialog. Catalog key
  /// `dialog.confirm`.
  final String dialogConfirmLabel;

  /// The cancelling button of a confirm dialog. Catalog key `dialog.cancel`.
  final String dialogCancelLabel;

  /// The acknowledging button of an alert dialog. Catalog key
  /// `dialog.dismiss`.
  final String dialogDismissLabel;

  /// The text of a switch's on state. Catalog key `switch.on`.
  final String switchOn;

  /// The text of a switch's off state. Catalog key `switch.off`.
  final String switchOff;

  /// Shown by a select with nothing chosen. Catalog key
  /// `select.placeholder`.
  final String selectPlaceholder;

  /// Shown in an empty combobox. Catalog key `combobox.placeholder`.
  final String comboboxPlaceholder;

  /// The name of a combobox's clear button. Catalog key
  /// `combobox.clear`.
  final String comboboxClear;

  /// Shown when no option matches a combobox's text. Catalog key
  /// `combobox.empty`.
  final String comboboxEmpty;

  /// The name of a combobox's button while its list is closed.
  /// Catalog key `combobox.show`.
  final String comboboxShow;

  /// The name of a combobox's button while its list is open.
  /// Catalog key `combobox.hide`.
  final String comboboxHide;

  /// The text of a popover trigger given no content of its own.
  /// Catalog key `dialog.trigger`.
  final String popoverTriggerLabel;

  /// [message] with each `{name}` placeholder replaced from [values].
  static String fill(String message, Map<String, String> values) =>
      message.replaceAllMapped(
        RegExp(r'\{(\w+)\}'),
        (match) => values[match.group(1)] ?? match.group(0)!,
      );

  /// A copy with the given messages replaced.
  InvisibleMessages copyWith({
    String? loadingLabel,
    String? submenuHint,
    String? closeLabel,
    String? notificationRegionLabel,
    String? numberFieldIncrement,
    String? numberFieldDecrement,
    String? numberFieldParseError,
    String? numberFieldRangeUnderflow,
    String? numberFieldRangeOverflow,
    String? numberFieldStepMismatch,
    String? dialogCloseLabel,
    String? dialogConfirmLabel,
    String? dialogCancelLabel,
    String? dialogDismissLabel,
    String? switchOn,
    String? switchOff,
    String? selectPlaceholder,
    String? comboboxPlaceholder,
    String? comboboxClear,
    String? comboboxEmpty,
    String? comboboxShow,
    String? comboboxHide,
    String? popoverTriggerLabel,
  }) {
    return InvisibleMessages(
      loadingLabel: loadingLabel ?? this.loadingLabel,
      submenuHint: submenuHint ?? this.submenuHint,
      closeLabel: closeLabel ?? this.closeLabel,
      notificationRegionLabel:
          notificationRegionLabel ?? this.notificationRegionLabel,
      numberFieldIncrement: numberFieldIncrement ?? this.numberFieldIncrement,
      numberFieldDecrement: numberFieldDecrement ?? this.numberFieldDecrement,
      numberFieldParseError:
          numberFieldParseError ?? this.numberFieldParseError,
      numberFieldRangeUnderflow:
          numberFieldRangeUnderflow ?? this.numberFieldRangeUnderflow,
      numberFieldRangeOverflow:
          numberFieldRangeOverflow ?? this.numberFieldRangeOverflow,
      numberFieldStepMismatch:
          numberFieldStepMismatch ?? this.numberFieldStepMismatch,
      dialogCloseLabel: dialogCloseLabel ?? this.dialogCloseLabel,
      dialogConfirmLabel: dialogConfirmLabel ?? this.dialogConfirmLabel,
      dialogCancelLabel: dialogCancelLabel ?? this.dialogCancelLabel,
      dialogDismissLabel: dialogDismissLabel ?? this.dialogDismissLabel,
      switchOn: switchOn ?? this.switchOn,
      switchOff: switchOff ?? this.switchOff,
      selectPlaceholder: selectPlaceholder ?? this.selectPlaceholder,
      comboboxPlaceholder: comboboxPlaceholder ?? this.comboboxPlaceholder,
      comboboxClear: comboboxClear ?? this.comboboxClear,
      comboboxEmpty: comboboxEmpty ?? this.comboboxEmpty,
      comboboxShow: comboboxShow ?? this.comboboxShow,
      comboboxHide: comboboxHide ?? this.comboboxHide,
      popoverTriggerLabel: popoverTriggerLabel ?? this.popoverTriggerLabel,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is InvisibleMessages &&
      other.loadingLabel == loadingLabel &&
      other.submenuHint == submenuHint &&
      other.closeLabel == closeLabel &&
      other.notificationRegionLabel == notificationRegionLabel &&
      other.numberFieldIncrement == numberFieldIncrement &&
      other.numberFieldDecrement == numberFieldDecrement &&
      other.numberFieldParseError == numberFieldParseError &&
      other.numberFieldRangeUnderflow == numberFieldRangeUnderflow &&
      other.numberFieldRangeOverflow == numberFieldRangeOverflow &&
      other.numberFieldStepMismatch == numberFieldStepMismatch &&
      other.dialogCloseLabel == dialogCloseLabel &&
      other.dialogConfirmLabel == dialogConfirmLabel &&
      other.dialogCancelLabel == dialogCancelLabel &&
      other.dialogDismissLabel == dialogDismissLabel &&
      other.switchOn == switchOn &&
      other.switchOff == switchOff &&
      other.selectPlaceholder == selectPlaceholder &&
      other.comboboxPlaceholder == comboboxPlaceholder &&
      other.comboboxClear == comboboxClear &&
      other.comboboxEmpty == comboboxEmpty &&
      other.comboboxShow == comboboxShow &&
      other.comboboxHide == comboboxHide &&
      other.popoverTriggerLabel == popoverTriggerLabel;

  @override
  int get hashCode => Object.hashAll([
    loadingLabel,
    submenuHint,
    closeLabel,
    notificationRegionLabel,
    numberFieldIncrement,
    numberFieldDecrement,
    numberFieldParseError,
    numberFieldRangeUnderflow,
    numberFieldRangeOverflow,
    numberFieldStepMismatch,
    dialogCloseLabel,
    dialogConfirmLabel,
    dialogCancelLabel,
    dialogDismissLabel,
    switchOn,
    switchOff,
    selectPlaceholder,
    comboboxPlaceholder,
    comboboxClear,
    comboboxEmpty,
    comboboxShow,
    comboboxHide,
    popoverTriggerLabel,
  ]);
}
