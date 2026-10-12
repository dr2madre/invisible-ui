import 'package:flutter/semantics.dart';
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

/// The toggle's own semantics node, around the focusable area.
final Finder _bold = find.text('Bold');

String? _requireOff(bool? on) => on == true ? 'Turn bold off.' : null;

void main() {
  testWidgets('a tap, Enter and Space each flip it and report once', (
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
    await tester.tap(_bold);
    await tester.pump();
    await focusOn(tester, _bold);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.numpadEnter);
    await tester.pump();
    expect(reports, [true, false, true, false]);
  });

  testWidgets('semantics: a button with a toggled state, never checked; the '
      'name stays the same in both states; icon-only meets the target and '
      'label guidelines', (tester) async {
    final semantics = tester.ensureSemantics();
    Widget build(bool on) => harness(
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ToggleButton(value: on, check: true, child: const Text('Bold')),
          ToggleButton(
            value: !on,
            semanticLabel: 'Italic',
            child: const _Square(),
          ),
        ],
      ),
    );
    await tester.pumpWidget(build(true));
    expect(
      tester.getSemantics(_bold),
      semanticsWith(
        label: 'Bold',
        isButton: true,
        hasToggledState: true,
        isToggled: true,
        hasCheckedState: false,
        isFocusable: true,
        hasTapAction: true,
      ),
    );
    expect(
      tester.getSemantics(find.byType(_Square)),
      semanticsWith(
        label: 'Italic',
        isButton: true,
        hasToggledState: true,
        isToggled: false,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));

    await tester.pumpWidget(build(false));
    expect(
      tester.getSemantics(_bold),
      semanticsWith(label: 'Bold', hasToggledState: true, isToggled: false),
    );
    expect(tester.getSemantics(_bold).label, 'Bold');
    expect(tester.getSemantics(find.byType(_Square)).label, 'Italic');
    semantics.dispose();
  });

  testWidgets('check shows a tick only while on, at the inline start; on '
      'takes the selection colour', (tester) async {
    Widget build(bool value, [TextDirection direction = TextDirection.ltr]) =>
        harness(
          ToggleButton(value: value, check: true, child: const Text('Design')),
          direction: direction,
        );
    await tester.pumpWidget(build(false));
    expect(find.byType(Glyph), findsNothing);
    await tester.pumpWidget(build(true));
    expect(find.byType(Glyph), findsOneWidget);
    expect(
      tester.getCenter(find.byType(Glyph)).dx,
      lessThan(tester.getCenter(find.text('Design')).dx),
    );
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
    await tester.pumpWidget(build(true, TextDirection.rtl));
    expect(
      tester.getCenter(find.byType(Glyph)).dx,
      greaterThan(tester.getCenter(find.text('Design')).dx),
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
    await tester.tap(_bold);
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
    await tester.tap(_bold);
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      tester.getSemantics(_bold),
      semanticsWith(hasEnabledState: true, isEnabled: false, isButton: true),
    );
    expect(Focus.of(tester.element(_bold)).canRequestFocus, isFalse);
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
    await focusOn(tester, _bold);
    final ring = tester.widget<CustomPaint>(
      find.ancestor(of: _bold, matching: find.byType(CustomPaint)).first,
    );
    expect(ring.foregroundPainter, isNotNull);
    final surface = find.ancestor(
      of: _bold,
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
    await tester.tap(_bold);
    await tester.pump();
    form.currentState!.save();
    expect(saved, isFalse);
    form.currentState!.reset();
    await tester.pump();
    expect(find.byType(Glyph), findsOneWidget);
    expect(reports, [false]);
  });

  group('error', () {
    testWidgets('the validator message shows with a hazard glyph, marks the '
        'toggle invalid and is announced; a form reset clears it and '
        'restores the default silently', (tester) async {
      final semantics = tester.ensureSemantics();
      final form = GlobalKey<FormState>();
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Form(
            key: form,
            child: ToggleButton.uncontrolled(
              validator: _requireOff,
              onChanged: reports.add,
              child: const Text('Bold'),
            ),
          ),
        ),
      );
      await tester.tap(_bold);
      await tester.pump();
      expect(form.currentState!.validate(), isFalse);
      await tester.pump();
      expect(find.text('Turn bold off.'), findsOneWidget);
      expect(find.byType(HazardGlyph), findsOneWidget);
      expect(
        tester.getSemantics(_bold),
        semanticsWith(
          label: 'Bold',
          hint: 'Turn bold off.',
          isButton: true,
          isToggled: true,
          validationResult: SemanticsValidationResult.invalid,
        ),
      );
      expect(
        tester.getSemantics(find.text('Turn bold off.')),
        semanticsWith(isLiveRegion: true),
      );

      form.currentState!.reset();
      await tester.pump();
      expect(find.text('Turn bold off.'), findsNothing);
      expect(find.byType(HazardGlyph), findsNothing);
      expect(
        tester.getSemantics(_bold),
        semanticsWith(hasToggledState: true, isToggled: false),
      );
      expect(reports, [true]);
      semantics.dispose();
    });

    testWidgets('the error prop takes precedence; focus stays on the toggle '
        'while an error shows and clears', (tester) async {
      final reports = <bool>[];
      await tester.pumpWidget(
        harness(
          Form(
            child: ToggleButton.uncontrolled(
              validator: _requireOff,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              onChanged: reports.add,
              child: const Text('Bold'),
            ),
          ),
        ),
      );
      await focusOn(tester, _bold);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(find.text('Turn bold off.'), findsOneWidget);
      expect(focusedOn(tester, _bold), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(find.text('Turn bold off.'), findsNothing);
      expect(focusedOn(tester, _bold), isTrue);
      expect(reports, [true, false]);

      await tester.pumpWidget(
        harness(
          const ToggleButton.uncontrolled(
            error: 'Not available.',
            validator: _requireOff,
            child: Text('Bold'),
          ),
        ),
      );
      expect(find.text('Not available.'), findsOneWidget);
    });

    testWidgets('a long error wraps at a narrow width and text scale 2.0', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          const SizedBox(
            width: 320,
            child: ToggleButton.uncontrolled(
              error: 'Bold is not available in this paragraph style.',
              child: Text('Bold'),
            ),
          ),
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      final message = find.textContaining('Bold is not');
      expect(tester.getSize(message).width, lessThanOrEqualTo(320));
      expect(
        tester.getSize(message).height,
        greaterThan(tester.getSize(_bold).height),
      );
    });
  });
}
