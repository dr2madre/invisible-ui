import 'dart:convert';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/i18n/locale_provider.dart' show resolveLocale;

import 'harness.dart';

// The vectors core/src/i18n/vectors.test.ts runs against core/. Present in a
// checkout of the whole repository; a copy of this package alone skips them.
final File _vectors = File(
  '../../core/src/i18n/__vectors__/default-locale.json',
);

Locale _locale(String tag) {
  final parts = tag.split('-');
  return Locale(parts[0], parts.length > 1 ? parts[1] : null);
}

/// [child] under the app's [context] locale (Localizations, as WidgetsApp
/// sets it) and a LocaleProvider with [app], each only when given.
Widget _scope(Widget child, {String? app, String? context}) {
  Widget tree = child;
  if (app != null) tree = LocaleProvider(locale: _locale(app), child: tree);
  if (context != null) {
    tree = Localizations(
      locale: _locale(context),
      delegates: const [DefaultWidgetsLocalizations.delegate],
      child: tree,
    );
  }
  return harness(tree);
}

/// The weekday names of the header row, in order.
List<String> _header(WidgetTester tester) => [
  for (final text in tester.widgetList<Text>(find.byType(Text)))
    if (const {
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    }.contains(text.data))
      text.data!,
].take(7).toList();

void main() {
  final skip = _vectors.existsSync() ? false : 'core/ is not in this checkout';
  final json = _vectors.existsSync()
      ? jsonDecode(_vectors.readAsStringSync()) as Map<String, dynamic>
      : const <String, dynamic>{};

  group('default locale vectors', () {
    for (final c
        in (json['cases'] as List<dynamic>? ?? const [])
            .cast<Map<String, dynamic>>()) {
      final app = c['app'] as String?;
      final context = c['context'] as String?;
      testWidgets('app $app, context $context: ${c['source']}', (tester) async {
        late Locale locale;
        late int hourCycle;
        await tester.pumpWidget(
          _scope(
            Builder(
              builder: (context) {
                locale = resolveLocale(context);
                hourCycle = DateSymbols.resolve(context).hourCycle;
                return const SizedBox();
              },
            ),
            app: app,
            context: context,
          ),
        );
        expect(weekStartForLocale(locale), c['weekStart']);
        expect(hourCycle, c['hourCycle']);
      });
    }
  }, skip: skip);

  group('components without a locale', () {
    Widget fields() => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Calendar.uncontrolled(focusedDate: DateTime(2026, 6, 15)),
        TimeField.uncontrolled(initialValue: '21:30', label: 'Time'),
      ],
    );

    testWidgets('use Monday and 24 hours without the app\'s locale', (
      tester,
    ) async {
      await tester.pumpWidget(_scope(fields()));
      expect(_header(tester).first, 'Mon');
      expect(find.text('PM'), findsNothing);
    });

    testWidgets('follow the app\'s locale from Localizations', (tester) async {
      await tester.pumpWidget(_scope(fields(), context: 'en-US'));
      expect(_header(tester).first, 'Sun');
      expect(find.text('PM'), findsOneWidget);
    });

    testWidgets('follow the LocaleProvider over the app\'s locale', (
      tester,
    ) async {
      await tester.pumpWidget(_scope(fields(), app: 'it', context: 'en-US'));
      expect(find.text('PM'), findsNothing);
      expect(find.text('lun'), findsOneWidget);
    });
  });
}
