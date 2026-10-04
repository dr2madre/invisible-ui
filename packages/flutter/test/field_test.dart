import 'package:flutter/semantics.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

/// A control of the consumer's own: focusable, with plain semantics that
/// merge into the field's node.
class _Swatch extends StatelessWidget {
  const _Swatch({required this.focusNode});

  final FocusNode focusNode;

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: focusNode,
      child: Semantics(
        button: true,
        value: 'Purple',
        onTap: () {},
        child: const SizedBox(width: 48, height: 32),
      ),
    );
  }
}

void main() {
  testWidgets('label, description and error describe the control', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Field(
          label: 'Colour',
          description: 'Used for the badge.',
          error: 'Pick another colour.',
          required: true,
          child: _Swatch(focusNode: focus),
        ),
      ),
    );
    expect(
      tester.getSemantics(find.byType(_Swatch)),
      semanticsWith(
        label: 'Colour',
        value: 'Purple',
        isButton: true,
        hint: 'Used for the badge.\nPick another colour.',
        isRequired: true,
        validationResult: SemanticsValidationResult.invalid,
      ),
    );
    expect(find.text('Used for the badge.'), findsOneWidget);
    expect(find.byType(HazardGlyph), findsOneWidget);
    expect(
      tester.getSemantics(find.text('Pick another colour.')),
      semanticsWith(isLiveRegion: true),
    );
    semantics.dispose();
  });

  testWidgets('the required asterisk is shown and kept out of the name', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Field(
          label: 'Colour',
          required: true,
          child: _Swatch(focusNode: focus),
        ),
      ),
    );
    expect(find.text('Colour *', findRichText: true), findsOneWidget);
    expect(tester.getSemantics(find.byType(_Swatch)).label, 'Colour');
    semantics.dispose();
  });

  testWidgets('a tap on the label focuses the control', (tester) async {
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Field(
          label: 'Colour',
          child: _Swatch(focusNode: focus),
        ),
      ),
    );
    await tester.tap(find.text('Colour'));
    await tester.pump();
    expect(focus.hasFocus, isTrue);
  });

  testWidgets('a disabled field dims its label and reports disabled', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Field(
          label: 'Colour',
          enabled: false,
          child: _Swatch(focusNode: focus),
        ),
      ),
    );
    expect(
      tester.widget<Text>(find.text('Colour')).style?.color,
      InvisibleColors.light.textDisabled,
    );
    expect(
      tester.getSemantics(find.byType(_Swatch)),
      semanticsWith(hasEnabledState: true, isEnabled: false),
    );
    semantics.dispose();
  });

  testWidgets('a hidden label still names the control', (tester) async {
    final semantics = tester.ensureSemantics();
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Field(
          label: 'Colour',
          hideLabel: true,
          child: _Swatch(focusNode: focus),
        ),
      ),
    );
    expect(find.text('Colour'), findsNothing);
    expect(
      tester.getSemantics(find.byType(_Swatch)),
      semanticsWith(label: 'Colour'),
    );
    semantics.dispose();
  });

  testWidgets('right to left at text scale 2.0 in a narrow column', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(280, 600);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 280,
          child: Field(
            label: 'لون الشارة المستخدم في الملف',
            description: 'يستخدم للشارة في كل مكان من التطبيق.',
            error: 'اختر لونًا آخر من فضلك.',
            child: _Swatch(focusNode: focus),
          ),
        ),
        direction: TextDirection.rtl,
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    final field = tester.getRect(find.byType(Field));
    final glyph = tester.getRect(find.byType(HazardGlyph));
    expect(glyph.right, moreOrLessEquals(field.right, epsilon: 1));
  });
}
