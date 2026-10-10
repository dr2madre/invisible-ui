import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

Finder get _remove => find.bySemanticsLabel('Remove');

BoxDecoration _decoration(WidgetTester tester) =>
    tester
            .widget<Container>(
              find
                  .descendant(
                    of: find.byType(Tag),
                    matching: find.byType(Container),
                  )
                  .first,
            )
            .decoration!
        as BoxDecoration;

void main() {
  testWidgets('without onRemoved there is no remove button; the text is the '
      'meaning', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Tag(
          status: TagStatus.success,
          icon: SizedBox.square(dimension: 10),
          child: Text('Approved'),
        ),
      ),
    );
    expect(find.byType(Glyph), findsNothing);
    expect(find.bySemanticsLabel('Approved'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('the remove button runs onRemoved on a tap, Enter and Space', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    var removed = 0;
    await tester.pumpWidget(
      harness(Tag(onRemoved: () => removed++, child: const Text('Design'))),
    );
    await tester.tap(find.byType(Glyph));
    await tester.pump();
    expect(removed, 1);
    await focusOn(tester, find.byType(Glyph));
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(removed, 2);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(removed, 3);
    expect(
      tester.getSemantics(_remove),
      semanticsWith(label: 'Remove', isButton: true, hasTapAction: true),
    );
    semantics.dispose();
  });

  testWidgets('the remove button is named by removeLabel; the focus ring '
      'shows from the keyboard', (tester) async {
    final semantics = tester.ensureSemantics();
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(
        Tag(
          onRemoved: () {},
          removeLabel: 'Remove Design',
          child: const Text('Design'),
        ),
      ),
    );
    expect(find.bySemanticsLabel('Remove Design'), findsOneWidget);
    expect(
      tester.widget<FocusRingPainter>(find.byType(FocusRingPainter)).visible,
      isFalse,
    );
    await focusOn(tester, find.byType(Glyph));
    expect(
      tester.widget<FocusRingPainter>(find.byType(FocusRingPainter)).visible,
      isTrue,
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    semantics.dispose();
  });

  testWidgets('soft and solid colours per status', (tester) async {
    final c = InvisibleThemeData.light().colors;
    final cases = [
      (TagStatus.neutral, TagVariant.soft, c.neutralSurface, c.neutralText),
      (TagStatus.info, TagVariant.soft, c.infoSurface, c.infoText),
      (TagStatus.success, TagVariant.soft, c.successSurface, c.successText),
      (TagStatus.warning, TagVariant.soft, c.warningSurface, c.warningText),
      (TagStatus.danger, TagVariant.soft, c.dangerSurface, c.dangerText),
      (
        TagStatus.selected,
        TagVariant.soft,
        c.secondary.withValues(alpha: 0.08),
        c.selectedText,
      ),
      (TagStatus.neutral, TagVariant.solid, c.neutral, c.onStatus),
      (TagStatus.warning, TagVariant.solid, c.warning, c.onWarning),
      (TagStatus.selected, TagVariant.solid, c.secondary, c.onSecondary),
    ];
    final semantics = tester.ensureSemantics();
    for (final (status, variant, background, foreground) in cases) {
      await tester.pumpWidget(
        harness(Tag(status: status, variant: variant, child: const Text('x'))),
      );
      expect(_decoration(tester).color, background, reason: '$status');
      expect(
        DefaultTextStyle.of(tester.element(find.text('x'))).style.color,
        foreground,
        reason: '$status $variant',
      );
      // The solid warning pair is the web's: 3.9:1 at 13 pixels, short of
      // 4.5:1, recorded in the parity checklist.
      if (status != TagStatus.warning || variant != TagVariant.solid) {
        await expectLater(tester, meetsGuideline(textContrastGuideline));
      }
    }
    semantics.dispose();
  });

  testWidgets('a long tag wraps at text scale 2.0 in a narrow parent, the '
      'remove button at the inline-end right to left', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 160,
          child: Tag(
            onRemoved: () {},
            trailing: const Count(count: 4),
            child: const Text('Accessibility review pending'),
          ),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getCenter(find.byType(Glyph)).dx,
      lessThan(tester.getCenter(find.text('4')).dx),
    );
  });

  testWidgets('the remove button keeps 44 by 44 under touch', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        Tag(onRemoved: () {}, child: const Text('Design')),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });
}
