import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

Finder _page(int number) => find.bySemanticsLabel('Go to page $number');

final Finder _previous = find.bySemanticsLabel('Go to previous page');
final Finder _next = find.bySemanticsLabel('Go to next page');

void main() {
  testWidgets('shows the boundary pages, the siblings and the gaps; a tap '
      'goes to a page and reports once', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        Pagination.uncontrolled(
          pageCount: 20,
          initialPage: 10,
          onPageChanged: reports.add,
        ),
      ),
    );
    expect(
      [
        for (final text in tester.widgetList<Text>(find.byType(Text)))
          text.data,
      ],
      ['1', '…', '9', '10', '11', '…', '20'],
    );
    await tester.tap(find.text('11'));
    await tester.pump();
    await tester.tap(_next);
    await tester.pump();
    expect(reports, [11, 12]);
    semantics.dispose();
  });

  testWidgets('previous and next are disabled at the ends', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        Pagination.uncontrolled(pageCount: 3, onPageChanged: reports.add),
      ),
    );
    expect(
      tester.getSemantics(_previous),
      semanticsWith(isButton: true, hasEnabledState: true, isEnabled: false),
    );
    await tester.tap(_previous);
    await tester.pump();
    expect(reports, isEmpty);
    await tester.tap(find.text('3'));
    await tester.pump();
    expect(
      tester.getSemantics(_next),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    semantics.dispose();
  });

  testWidgets('arrows move focus without moving the page, wrapping and '
      'skipping disabled controls; Enter and Space go; mirrored right to '
      'left', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        Pagination.uncontrolled(pageCount: 5, onPageChanged: reports.add),
        direction: TextDirection.rtl,
      ),
    );
    await focusOn(tester, find.text('1'));
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('2')), isTrue);
    expect(reports, isEmpty);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await pumpFocus(tester);
    expect(
      focusedOn(tester, find.byType(Glyph).last),
      isTrue,
      reason: 'wraps to next, skipping the disabled previous',
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('1')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(reports, [2]);
    await focusOn(tester, find.text('4'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, [2, 4]);
    expect(
      tester.getCenter(find.text('2')).dx,
      lessThan(tester.getCenter(find.text('1')).dx),
    );
    semantics.dispose();
  });

  testWidgets('a key press that disables previous moves focus to the current '
      'page', (tester) async {
    await tester.pumpWidget(
      harness(const Pagination.uncontrolled(pageCount: 5, initialPage: 2)),
    );
    await focusOn(tester, find.byType(Glyph).first);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('1')), isTrue);
  });

  testWidgets('one tab stop, on the current page', (tester) async {
    final before = FocusNode();
    final after = FocusNode();
    addTearDown(before.dispose);
    addTearDown(after.dispose);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Button(
                onPressed: () {},
                focusNode: before,
                child: const Text('Before'),
              ),
              const Pagination.uncontrolled(pageCount: 5, initialPage: 3),
              Button(
                onPressed: () {},
                focusNode: after,
                child: const Text('After'),
              ),
            ],
          ),
        ),
      ),
    );
    before.requestFocus();
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(focusedOn(tester, find.text('3')), isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await pumpFocus(tester);
    expect(after.hasFocus, isTrue);
  });

  testWidgets('semantics: a navigation named from the catalog; the current '
      'page is read as such', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(const Pagination.uncontrolled(pageCount: 5, initialPage: 2)),
    );
    expect(find.bySemanticsLabel('Pagination'), findsOneWidget);
    expect(
      tester.getSemantics(_page(2)),
      semanticsWith(
        label: 'Go to page 2',
        value: 'current page',
        isButton: true,
        hasTapAction: true,
      ),
    );
    expect(tester.getSemantics(_page(3)).value, isEmpty);
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('a changed page is shown, clamped, without a report', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final reports = <int>[];
    Widget build(int page) => harness(
      Pagination(page: page, pageCount: 5, onPageChanged: reports.add),
    );
    await tester.pumpWidget(build(1));
    await tester.pumpWidget(build(9));
    expect(tester.getSemantics(_page(5)).value, 'current page');
    expect(reports, isEmpty);
    semantics.dispose();
  });

  testWidgets('disabled: nothing focusable or pressable', (tester) async {
    final reports = <int>[];
    await tester.pumpWidget(
      harness(
        Pagination.uncontrolled(
          pageCount: 5,
          enabled: false,
          onPageChanged: reports.add,
        ),
      ),
    );
    await tester.tap(find.text('3'));
    await tester.pump();
    expect(reports, isEmpty);
    expect(Focus.of(tester.element(find.text('1'))).canRequestFocus, isFalse);
  });

  testWidgets('a long list wraps in a narrow column at text scale 2.0; '
      'buttons keep 44 by 44 under touch', (tester) async {
    await tester.pumpWidget(
      harness(
        const SizedBox(
          width: 200,
          child: Pagination.uncontrolled(pageCount: 20, initialPage: 10),
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getTopLeft(find.text('20')).dy,
      greaterThan(tester.getTopLeft(find.text('1')).dy),
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
