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
    },
    skip: _catalog.existsSync() ? false : 'core/ is not in this checkout',
  );

  test('a message can be replaced', () {
    const messages = InvisibleMessages();
    final italian = messages.copyWith(loadingLabel: 'Caricamento…');
    expect(italian.loadingLabel, 'Caricamento…');
    expect(italian, isNot(messages));
    expect(messages.copyWith(), messages);
  });
}
