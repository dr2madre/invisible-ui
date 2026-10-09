import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// The English catalog every web adapter reads. Present in a checkout of the
/// whole repository; a copy of this package alone skips the comparison.
final File _catalog = File('../../core/src/i18n/messages.ts');

String? _english(String key) {
  final match = RegExp(
    '"${RegExp.escape(key)}": "([^"]*)"',
  ).firstMatch(_catalog.readAsStringSync());
  return match?.group(1);
}

/// One plural form of a plural catalog message, such as `one` or `other`.
String? _plural(String key, String form) {
  final block = RegExp(
    '"${RegExp.escape(key)}": \\{(.*?)\\n\\s*\\}',
    dotAll: true,
  ).firstMatch(_catalog.readAsStringSync())?.group(1);
  if (block == null) return null;
  return RegExp('$form: "([^"]*)"').firstMatch(block)?.group(1);
}

void main() {
  test(
    'the English defaults match the shared catalog',
    () {
      const messages = InvisibleMessages();
      expect(messages.loadingLabel, _english('loading.label'));
      expect(messages.submenuHint, _english('menu.submenu'));
      expect(messages.closeLabel, _english('inlineNotification.close'));
      expect(
        messages.notificationRegionLabel,
        _english('notificationRegion.label'),
      );
      expect(messages.numberFieldIncrement, _english('numberField.increment'));
      expect(messages.numberFieldDecrement, _english('numberField.decrement'));
      expect(
        messages.numberFieldParseError,
        _english('numberField.parseError'),
      );
      expect(
        messages.numberFieldRangeUnderflow,
        _english('numberField.rangeUnderflow'),
      );
      expect(
        messages.numberFieldRangeOverflow,
        _english('numberField.rangeOverflow'),
      );
      expect(
        messages.numberFieldStepMismatch,
        _english('numberField.stepMismatch'),
      );
      expect(messages.dialogCloseLabel, _english('dialog.close'));
      expect(messages.dialogConfirmLabel, _english('dialog.confirm'));
      expect(messages.dialogCancelLabel, _english('dialog.cancel'));
      expect(messages.dialogDismissLabel, _english('dialog.dismiss'));
      expect(messages.switchOn, _english('switch.on'));
      expect(messages.switchOff, _english('switch.off'));
      expect(messages.selectPlaceholder, _english('select.placeholder'));
      expect(messages.comboboxPlaceholder, _english('combobox.placeholder'));
      expect(messages.comboboxClear, _english('combobox.clear'));
      expect(messages.comboboxEmpty, _english('combobox.empty'));
      expect(messages.comboboxShow, _english('combobox.show'));
      expect(messages.comboboxHide, _english('combobox.hide'));
      expect(messages.popoverTriggerLabel, _english('dialog.trigger'));
      expect(messages.calendarLabel, _english('calendar.label'));
      expect(messages.calendarPrevious, _english('calendar.previous'));
      expect(messages.calendarNext, _english('calendar.next'));
      expect(messages.calendarToday, _english('calendar.today'));
      expect(messages.calendarCurrent, _english('calendar.current'));
      expect(messages.calendarRangeStart, _english('calendar.rangeStart'));
      expect(messages.calendarRangeEnd, _english('calendar.rangeEnd'));
      expect(messages.datePickerLabel, _english('datePicker.label'));
      expect(
        messages.datePickerPlaceholder,
        _english('datePicker.placeholder'),
      );
      expect(messages.datePickerClear, _english('datePicker.clear'));
      expect(messages.dateRangePickerLabel, _english('dateRangePicker.label'));
      expect(
        messages.dateRangePickerPlaceholder,
        _english('dateRangePicker.placeholder'),
      );
      expect(messages.dateRangePickerClear, _english('dateRangePicker.clear'));
      expect(messages.timeFieldLabel, _english('timeField.label'));
      expect(messages.timeFieldHour, _english('timeField.hour'));
      expect(messages.timeFieldMinute, _english('timeField.minute'));
      expect(messages.timeFieldSecond, _english('timeField.second'));
      expect(messages.timeFieldDayPeriod, _english('timeField.dayPeriod'));
      expect(messages.timeFieldEmpty, _english('timeField.empty'));
      expect(
        messages.timeFieldInvalidFormat,
        _english('timeField.invalidFormat'),
      );
      expect(messages.timeFieldOutOfRange, _english('timeField.outOfRange'));
      expect(
        messages.timeFieldSecondsRequired,
        _english('timeField.secondsRequired'),
      );
      expect(
        messages.timeFieldSecondsNotAllowed,
        _english('timeField.secondsNotAllowed'),
      );
      expect(
        messages.timeFieldRangeUnderflow,
        _english('timeField.rangeUnderflow'),
      );
      expect(
        messages.timeFieldRangeOverflow,
        _english('timeField.rangeOverflow'),
      );
      expect(messages.collapsibleToggle, _english('collapsible.toggle'));
      expect(messages.paginationLabel, _english('pagination.label'));
      expect(messages.paginationPrevious, _english('pagination.previous'));
      expect(messages.paginationNext, _english('pagination.next'));
      expect(messages.paginationPage, _english('pagination.page'));
      expect(messages.paginationCurrent, _english('pagination.current'));
      expect(messages.breadcrumbLabel, _english('breadcrumb.label'));
      expect(messages.breadcrumbCurrent, _english('breadcrumb.current'));
      expect(
        messages.avatarGroupMore(1),
        InvisibleMessages.fill(_plural('avatarGroup.more', 'one')!, {
          'count': '1',
        }),
      );
      expect(
        messages.avatarGroupMore(5),
        InvisibleMessages.fill(_plural('avatarGroup.more', 'other')!, {
          'count': '5',
        }),
      );
      expect(messages.tagRemove, _english('tag.remove'));
      expect(messages.codeBlockLabel, _english('codeBlock.label'));
      expect(
        messages.codeBlockLabelLanguage,
        _english('codeBlock.labelLanguage'),
      );
      expect(messages.codeBlockSample, _english('codeBlock.sample'));
      expect(
        messages.codeBlockSampleLanguage,
        _english('codeBlock.sampleLanguage'),
      );
      expect(messages.codeBlockCopy, _english('codeBlock.copy'));
      expect(messages.codeBlockCopyText, _english('codeBlock.copyText'));
      expect(messages.codeBlockCopiedText, _english('codeBlock.copiedText'));
      expect(messages.codeBlockCopied, _english('codeBlock.copied'));
    },
    skip: _catalog.existsSync() ? false : 'core/ is not in this checkout',
  );

  test('a message can be replaced', () {
    const messages = InvisibleMessages();
    final italian = messages.copyWith(loadingLabel: 'Caricamento…');
    expect(italian.loadingLabel, 'Caricamento…');
    expect(italian, isNot(messages));
    expect(messages.copyWith(), messages);
    final menus = messages.copyWith(submenuHint: 'sottomenu');
    expect(menus.submenuHint, 'sottomenu');
    expect(menus.closeLabel, messages.closeLabel);
  });

  test('placeholders are filled; unknown ones stay', () {
    expect(
      InvisibleMessages.fill('Increase {label}', {'label': 'Hours'}),
      'Increase Hours',
    );
    expect(InvisibleMessages.fill('At least {min}.', {}), 'At least {min}.');
  });
}
