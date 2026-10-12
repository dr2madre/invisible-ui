import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

class _Square extends StatelessWidget {
  const _Square();

  @override
  Widget build(BuildContext context) {
    final icons = IconTheme.of(context);
    return SizedBox.square(
      dimension: icons.size,
      child: ColoredBox(color: icons.color!),
    );
  }
}

void main() {
  testWidgets('a tap and Space flip it and report once; Enter does not', (
    tester,
  ) async {
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(
        ToggleButton.uncontrolled(
          onChanged: reports.add,
          child: const Text('Bold'),
        ),
      ),
    );
    await tester.tap(find.text('Bold'));
    await tester.pump();
    await focusOn(tester, find.text('Bold'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(reports, [true, false]);
  });

  testWidgets('semantics: checked when on, named by its text or its label; '
      'icon-only meets the target and label guidelines', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ToggleButton(value: true, child: Text('Bold')),
            ToggleButton(
              value: false,
              semanticLabel: 'Italic',
              child: _Square(),
            ),
          ],
        ),
      ),
    );
    expect(
      tester.getSemantics(find.text('Bold')),
      semanticsWith(
        label: 'Bold',
        hasCheckedState: true,
        isChecked: true,
        isFocusable: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester.getSemantics(find.byType(_Square)),
      semanticsWith(label: 'Italic', hasCheckedState: true, isChecked: false),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('check shows a tick only while on; on takes the selection '
      'colour', (tester) async {
    Widget build(bool value) => harness(
      ToggleButton(value: value, check: true, child: const Text('Design')),
    );
    await tester.pumpWidget(build(false));
    expect(find.byType(Glyph), findsNothing);
    await tester.pumpWidget(build(true));
    expect(find.byType(Glyph), findsOneWidget);
    expect(
      tester
          .widget<DefaultTextStyle>(
            find
                .ancestor(
                  of: find.text('Design'),
                  matching: find.byType(DefaultTextStyle),
                )
                .first,
          )
          .style
          .color,
      InvisibleColors.light.selected,
    );
  });

  testWidgets('controlled: a changed value is shown, never reported; the '
      'callback is read at the press', (tester) async {
    final first = <bool>[];
    final second = <bool>[];
    Widget build(bool value, ValueChanged<bool> onChanged) => harness(
      ToggleButton(
        value: value,
        onChanged: onChanged,
        check: true,
        child: const Text('Bold'),
      ),
    );
    await tester.pumpWidget(build(false, first.add));
    await tester.pumpWidget(build(true, first.add));
    expect(find.byType(Glyph), findsOneWidget);
    await tester.pumpWidget(build(true, second.add));
    await tester.tap(find.text('Bold'));
    await tester.pump();
    expect(first, isEmpty);
    expect(second, [false]);
  });

  testWidgets('disabled: no change, no focus, dimmed', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(
        ToggleButton.uncontrolled(
          enabled: false,
          onChanged: reports.add,
          child: const Text('Bold'),
        ),
      ),
    );
    await tester.tap(find.text('Bold'));
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      tester.getSemantics(find.text('Bold')),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    expect(
      Focus.of(tester.element(find.text('Bold'))).canRequestFocus,
      isFalse,
    );
    semantics.dispose();
  });

  testWidgets('the ring shows on keyboard focus; 44 by 44 under touch; text '
      'scale 2.0 grows the surface', (tester) async {
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(
        const ToggleButton.uncontrolled(child: Text('Bold')),
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        textScale: 2,
      ),
    );
    await focusOn(tester, find.text('Bold'));
    final ring = tester.widget<CustomPaint>(
      find
          .ancestor(of: find.text('Bold'), matching: find.byType(CustomPaint))
          .first,
    );
    expect(ring.foregroundPainter, isNotNull);
    final surface = find.ancestor(
      of: find.text('Bold'),
      matching: find.byType(AnimatedContainer),
    );
    expect(tester.getSize(surface).height, greaterThanOrEqualTo(72));
    await expectLater(tester, meetsGuideline(targetGuideline44));
  });

  testWidgets('a form reset restores the default without a report', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final reports = <bool>[];
    bool? saved;
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: ToggleButton.uncontrolled(
            initialValue: true,
            check: true,
            onChanged: reports.add,
            onSaved: (v) => saved = v,
            child: const Text('Bold'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Bold'));
    await tester.pump();
    form.currentState!.save();
    expect(saved, isFalse);
    form.currentState!.reset();
    await tester.pump();
    expect(find.byType(Glyph), findsOneWidget);
    expect(reports, [false]);
  });
}
