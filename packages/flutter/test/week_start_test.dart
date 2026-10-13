import 'dart:convert';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/calendar/week_start.dart';

import 'harness.dart';

// The vectors core/src/calendar/week-start.test.ts runs against core/.
// Present in a checkout of the whole repository; a copy of this package
// alone skips them.
final File _vectors = File(
  '../../core/src/calendar/__vectors__/week-start.json',
);

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

  group('CLDR week start vectors', () {
    test('the table matches the shared one', () {
      final table = json['firstDay'] as Map<String, dynamic>;
      final byRegion = <String, int>{
        for (final MapEntry(:key, :value)
            in (table['byRegion'] as Map<String, dynamic>).entries)
          for (final region in (value as List<dynamic>).cast<String>())
            region: int.parse(key),
      };
      expect(firstDayByRegion, byRegion);
      expect(likelyRegion, table['likelyRegion']);
      expect(table['default'], DateTime.monday);
    }, skip: skip);

    test('each locale starts on its CLDR day', () {
      for (final c
          in (json['cases'] as List<dynamic>).cast<Map<String, dynamic>>()) {
        expect(
          weekStartForTag(c['locale'] as String),
          c['firstDay'],
          reason: c['locale'] as String,
        );
      }
    }, skip: skip);
  });

  test('a Locale reads its country, then its language', () {
    expect(weekStartForLocale(const Locale('en', 'US')), DateTime.sunday);
    expect(weekStartForLocale(const Locale('en', 'GB')), DateTime.monday);
    expect(weekStartForLocale(const Locale('ar')), DateTime.saturday);
    expect(weekStartForLocale(const Locale('it')), DateTime.monday);
    expect(
      weekStartForLocale(
        const Locale.fromSubtags(
          languageCode: 'zh',
          scriptCode: 'Hant',
          countryCode: 'TW',
        ),
      ),
      DateTime.sunday,
    );
  });

  group('Calendar week start', () {
    Widget calendar({Locale? locale, int? weekStartsOn}) => harness(
      Calendar.uncontrolled(
        focusedDate: DateTime(2026, 10, 12),
        locale: locale,
        weekStartsOn: weekStartsOn,
      ),
    );

    testWidgets('defaults to the locale\'s CLDR first day', (tester) async {
      await tester.pumpWidget(calendar(locale: const Locale('en', 'US')));
      expect(_header(tester).first, 'Sun');
      await tester.pumpWidget(calendar(locale: const Locale('en', 'GB')));
      expect(_header(tester).first, 'Mon');
    });

    testWidgets('the app can override it', (tester) async {
      await tester.pumpWidget(
        calendar(
          locale: const Locale('en', 'US'),
          weekStartsOn: DateTime.monday,
        ),
      );
      expect(_header(tester).first, 'Mon');
    });

    testWidgets('follows the app locale from Localizations', (tester) async {
      await tester.pumpWidget(
        Localizations(
          locale: const Locale('en', 'GB'),
          delegates: const [DefaultWidgetsLocalizations.delegate],
          child: calendar(),
        ),
      );
      expect(_header(tester).first, 'Mon');
    });
  });
}
