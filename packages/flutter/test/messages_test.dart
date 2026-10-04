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
