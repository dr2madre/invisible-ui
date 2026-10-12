import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

/// Shows what the subtree reads: locale, direction and one message.
class _Probe extends StatelessWidget {
  const _Probe();

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final direction = Directionality.of(context);
    final messages = InvisibleTheme.of(context).messages;
    return Text('$locale ${direction.name} ${messages.calendarToday}');
  }
}

void main() {
  testWidgets('sets the locale, the direction from the locale and the '
      'messages for its subtree', (tester) async {
    await tester.pumpWidget(
      harness(
        LocaleProvider(
          locale: const Locale('ar', 'EG'),
          messages: const InvisibleMessages().copyWith(calendarToday: 'اليوم'),
          child: const _Probe(),
        ),
      ),
    );
    expect(find.text('ar_EG rtl اليوم'), findsOneWidget);
  });

  testWidgets('a given direction wins; nested providers override their '
      'subtree only, inside an app\'s own localizations', (tester) async {
    await tester.pumpWidget(
      appHarness(
        (_) => LocaleProvider(
          locale: const Locale('it'),
          child: const Column(
            children: [
              _Probe(),
              LocaleProvider(
                locale: Locale('he'),
                textDirection: TextDirection.ltr,
                child: _Probe(),
              ),
            ],
          ),
        ),
      ),
    );
    expect(find.text('it ltr Today'), findsOneWidget);
    expect(find.text('he ltr Today'), findsOneWidget);
  });

  testWidgets('a changed locale applies in place: state is kept', (
    tester,
  ) async {
    Widget build(Locale locale) => harness(
      LocaleProvider(
        locale: locale,
        child: const Column(
          children: [
            _Probe(),
            SizedBox(width: 200, child: TextField.uncontrolled(label: 'Name')),
          ],
        ),
      ),
    );
    await tester.pumpWidget(build(const Locale('en')));
    await tester.enterText(find.byType(EditableText), 'Ada');
    await tester.pumpWidget(build(const Locale('fa')));
    expect(find.text('fa rtl Today'), findsOneWidget);
    expect(find.text('Ada'), findsOneWidget);
  });
}
