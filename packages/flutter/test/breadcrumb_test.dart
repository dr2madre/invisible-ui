// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

List<BreadcrumbItem> _trail(List<String> opened) => [
  BreadcrumbItem(label: 'Home', home: true, onPressed: () => opened.add('/')),
  BreadcrumbItem(
    label: 'Components',
    uri: Uri.parse('/components'),
    onPressed: () => opened.add('/components'),
  ),
  const BreadcrumbItem(label: 'Breadcrumb'),
];

void main() {
  testWidgets('ancestors open through their callbacks, by tap or Enter; the '
      'current page is not a link', (tester) async {
    final opened = <String>[];
    await tester.pumpWidget(harness(Breadcrumb(items: _trail(opened))));
    await tester.tap(find.text('Components'));
    await tester.pump();
    await focusOn(tester, find.byType(Glyph));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.tap(find.text('Breadcrumb'));
    await tester.pump();
    expect(opened, ['/components', '/']);
    expect(find.byType(Link), findsNWidgets(2));
  });

  testWidgets('semantics: a list named from the catalog; links named by '
      'their label, the home glyph too; the current page read as such', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(harness(Breadcrumb(items: _trail([]))));
    expect(tester.takeException(), isNull, reason: 'the role checks pass');
    final list = tester.getSemantics(find.byType(Breadcrumb));
    expect(list.label, 'Breadcrumb');
    expect(list.getSemanticsData().role, SemanticsRole.list);
    expect(find.text('Home'), findsNothing, reason: 'the glyph shows');
    expect(tester.getSemantics(find.byType(Glyph)).label, 'Home');
    expect(
      tester.getSemantics(find.text('Breadcrumb')),
      semanticsWith(label: 'Breadcrumb', value: 'current page'),
    );
    expect(
      tester
          .getSemantics(find.text('Components'))
          .parent!
          .getSemanticsData()
          .role,
      SemanticsRole.listItem,
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('the separators are decorative and the label is the app\'s '
      'when given', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        Breadcrumb(label: 'You are here', separator: '›', items: _trail([])),
      ),
    );
    expect(find.text('›'), findsNWidgets(2));
    expect(find.bySemanticsLabel('›'), findsNothing);
    expect(tester.getSemantics(find.byType(Breadcrumb)).label, 'You are here');
    semantics.dispose();
  });

  testWidgets('right to left the trail runs from the right; a long trail '
      'wraps at text scale 2.0 and keeps 44 by 44 links under touch', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 220,
          child: Breadcrumb(
            items: [
              ..._trail([]).take(2),
              BreadcrumbItem(label: 'Navigation patterns', onPressed: () {}),
              const BreadcrumbItem(label: 'Breadcrumb'),
            ],
          ),
        ),
        direction: TextDirection.rtl,
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getCenter(find.byType(Glyph)).dx,
      greaterThan(tester.getCenter(find.text('Components')).dx),
    );
    expect(
      tester.getTopLeft(find.text('Breadcrumb')).dy,
      greaterThan(tester.getTopLeft(find.byType(Glyph)).dy),
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
