import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

const _plus = Icon(IconData(0x2b), key: Key('icon'));

/// The painted surface of the button under test.
BoxDecoration _decoration(WidgetTester tester) {
  final container = tester.widget<AnimatedContainer>(
    find.descendant(
      of: find.byType(Button),
      matching: find.byType(AnimatedContainer),
    ),
  );
  return container.decoration! as BoxDecoration;
}

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  group('activation', () {
    testWidgets('a tap calls onPressed once', (tester) async {
      var presses = 0;
      await tester.pumpWidget(
        harness(Button(onPressed: () => presses++, child: const Text('Save'))),
      );
      expect(find.text('Save'), findsOneWidget);
      await tester.tap(find.byType(Button));
      await tester.pump();
      expect(presses, 1);
    });

    for (final (name, key) in [
      ('Enter', LogicalKeyboardKey.enter),
      ('Numpad Enter', LogicalKeyboardKey.numpadEnter),
      ('Space', LogicalKeyboardKey.space),
    ]) {
      testWidgets('$name activates the focused button', (tester) async {
        var presses = 0;
        final focus = FocusNode();
        addTearDown(focus.dispose);
        await tester.pumpWidget(
          harness(
            Button(
              onPressed: () => presses++,
              focusNode: focus,
              child: const Text('Save'),
            ),
          ),
        );
        focus.requestFocus();
        await tester.pump();
        expect(focus.hasFocus, isTrue);
        await tester.sendKeyEvent(key);
        await tester.pump();
        expect(presses, 1);
      });
    }

    testWidgets('keys do nothing while the button is not focused', (
      tester,
    ) async {
      var presses = 0;
      await tester.pumpWidget(
        harness(Button(onPressed: () => presses++, child: const Text('Save'))),
      );
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      expect(presses, 0);
    });

    testWidgets('the callback is read at the press', (tester) async {
      final calls = <String>[];
      Widget build(String name) => harness(
        Button(onPressed: () => calls.add(name), child: const Text('Save')),
      );
      await tester.pumpWidget(build('first'));
      await tester.pumpWidget(build('second'));
      await tester.tap(find.byType(Button));
      expect(calls, ['second']);
    });
  });

  group('disabled', () {
    testWidgets('a null onPressed disables the button', (tester) async {
      final semantics = tester.ensureSemantics();
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Button(onPressed: null, focusNode: focus, child: const Text('Save')),
        ),
      );
      focus.requestFocus();
      await tester.pump();
      expect(focus.hasFocus, isFalse, reason: 'leaves the focus order');
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(
          isButton: true,
          hasEnabledState: true,
          isEnabled: false,
          hasTapAction: false,
          label: 'Save',
        ),
      );
      final opacity = tester.widget<Opacity>(
        find.descendant(
          of: find.byType(Button),
          matching: find.byType(Opacity),
        ),
      );
      expect(opacity.opacity, 0.5);
      semantics.dispose();
    });

    testWidgets('Tab skips a disabled button', (tester) async {
      final first = FocusNode();
      final last = FocusNode();
      addTearDown(first.dispose);
      addTearDown(last.dispose);
      // WidgetsApp brings the platform's Tab traversal shortcuts.
      await tester.pumpWidget(
        WidgetsApp(
          color: const Color(0xFF000000),
          builder: (context, _) => harness(
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Button(
                  onPressed: () {},
                  focusNode: first,
                  child: const Text('One'),
                ),
                const Button(onPressed: null, child: Text('Two')),
                Button(
                  onPressed: () {},
                  focusNode: last,
                  child: const Text('Three'),
                ),
              ],
            ),
          ),
        ),
      );
      first.requestFocus();
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      expect(last.hasFocus, isTrue);
    });

    testWidgets('a disabled button shows no hover state', (tester) async {
      await tester.pumpWidget(
        harness(const Button(onPressed: null, child: Text('Save'))),
      );
      final rest = _decoration(tester).color;
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer();
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pumpAndSettle();
      expect(_decoration(tester).color, rest);
    });
  });

  group('loading', () {
    testWidgets('presses are ignored and focus stays', (tester) async {
      var presses = 0;
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () => presses++,
            loading: true,
            focusNode: focus,
            child: const Text('Save'),
          ),
        ),
      );
      await tester.tap(find.byType(Button));
      focus.requestFocus();
      await tester.pump();
      expect(focus.hasFocus, isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(presses, 0);
    });

    testWidgets('a spinner replaces the leading icon; the label stays', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            icon: _plus,
            loading: true,
            child: const Text('Save'),
          ),
        ),
      );
      expect(find.byType(Spinner), findsOneWidget);
      expect(find.byKey(const Key('icon')), findsNothing);
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('a spinner replaces the glyph of an icon-only button', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          Button.icon(
            onPressed: () {},
            icon: _plus,
            semanticLabel: 'Add',
            loading: true,
          ),
        ),
      );
      expect(find.byType(Spinner), findsOneWidget);
      expect(find.byKey(const Key('icon')), findsNothing);
    });

    testWidgets('the busy state is announced with the theme message', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Button(onPressed: () {}, loading: true, child: const Text('Save')),
          theme: InvisibleThemeData.light(
            messages: const InvisibleMessages(loadingLabel: 'Caricamento…'),
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(
          isButton: true,
          isEnabled: true,
          label: 'Save',
          value: 'Caricamento…',
        ),
      );
      semantics.dispose();
    });

    testWidgets('the spinner stands still under reduced motion', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          Button(onPressed: () {}, loading: true, child: const Text('Save')),
          disableAnimations: true,
        ),
      );
      expect(tester.hasRunningAnimations, isFalse);
    });
  });

  group('semantics', () {
    testWidgets('a text button is a focusable, enabled button named by its '
        'label', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(Button(onPressed: () {}, child: const Text('Save'))),
      );
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(
          isButton: true,
          hasEnabledState: true,
          isEnabled: true,
          isFocusable: true,
          hasTapAction: true,
          label: 'Save',
        ),
      );
      semantics.dispose();
    });

    testWidgets('an icon-only button is named by its semantic label', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Button.icon(onPressed: () {}, icon: _plus, semanticLabel: 'Add item'),
        ),
      );
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(isButton: true, label: 'Add item'),
      );
      semantics.dispose();
    });

    testWidgets('a semantic label replaces what the text says', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            semanticLabel: 'Save the draft',
            child: const Text('Save'),
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(label: 'Save the draft'),
      );
      semantics.dispose();
    });

    test('an icon-only button refuses an empty label', () {
      expect(
        () => Button.icon(onPressed: () {}, icon: _plus, semanticLabel: ''),
        throwsAssertionError,
      );
    });

    testWidgets('every button meets the labeled tap target guideline', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final variant in ButtonVariant.values)
                Button(
                  onPressed: () {},
                  variant: variant,
                  child: Text(variant.name),
                ),
              Button.icon(onPressed: () {}, icon: _plus, semanticLabel: 'Add'),
            ],
          ),
        ),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      semantics.dispose();
    });
  });

  group('target size', () {
    const guideline24 = MinimumTapTargetGuideline(
      size: Size(24, 24),
      link: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
    );
    const guideline44 = MinimumTapTargetGuideline(
      size: Size(44, 44),
      link:
          'https://developer.apple.com/design/human-interface-guidelines/accessibility',
    );

    // A small glyph keeps the painted icon-only button below 44 by 44.
    const tiny = SizedBox.square(dimension: 4);

    Widget smallButtons(InvisibleThemeData theme) => harness(
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Button.icon(onPressed: () {}, icon: tiny, semanticLabel: 'Add'),
          Button(onPressed: () {}, child: const Text('OK')),
        ],
      ),
      theme: theme,
    );

    testWidgets('targets are at least 24 by 24 under regular and compact', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      for (final density in [
        InvisibleDensity.regular,
        InvisibleDensity.compact,
      ]) {
        await tester.pumpWidget(
          smallButtons(InvisibleThemeData.light(density: density)),
        );
        await expectLater(tester, meetsGuideline(guideline24));
      }
      semantics.dispose();
    });

    testWidgets('targets are at least 44 by 44 under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        smallButtons(InvisibleThemeData.light(density: InvisibleDensity.touch)),
      );
      await expectLater(tester, meetsGuideline(guideline44));
      for (final button in tester.widgetList(find.byType(Button))) {
        final size = tester.getSize(find.byWidget(button));
        expect(size.width, greaterThanOrEqualTo(44));
        expect(size.height, greaterThanOrEqualTo(44));
      }
      semantics.dispose();
    });

    testWidgets('an explicit 44 by 44 target applies at regular density', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        smallButtons(
          InvisibleThemeData.light(minTargetSize: const Size(44, 44)),
        ),
      );
      await expectLater(tester, meetsGuideline(guideline44));
      semantics.dispose();
    });

    testWidgets('a press outside the painted button but inside the target '
        'counts', (tester) async {
      var presses = 0;
      await tester.pumpWidget(
        harness(
          Button(onPressed: () => presses++, child: const Text('OK')),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      final surface = tester.getRect(
        find.descendant(
          of: find.byType(Button),
          matching: find.byType(AnimatedContainer),
        ),
      );
      final target = tester.getRect(find.byType(Button));
      expect(target.height, greaterThan(surface.height));
      await tester.tapAt(Offset(target.center.dx, target.top + 1));
      expect(presses, 1);
    });
  });

  group('focus ring', () {
    testWidgets('shows for keyboard focus only', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Button(onPressed: () {}, focusNode: focus, child: const Text('Save')),
        ),
      );
      FocusManager.instance.highlightStrategy =
          FocusHighlightStrategy.alwaysTouch;
      focus.requestFocus();
      await tester.pump();
      expect(
        tester.widget<FocusRingPainter>(find.byType(FocusRingPainter)).visible,
        isFalse,
      );

      useKeyboardHighlight();
      await tester.pump();
      final ring = tester.widget<FocusRingPainter>(
        find.byType(FocusRingPainter),
      );
      expect(ring.visible, isTrue);
      expect(ring.ring.color, InvisibleColors.light.focusRing);
    });

    testWidgets('uses style.focus.onDark in the dark theme', (tester) async {
      useKeyboardHighlight();
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(
        harness(
          Button(onPressed: () {}, focusNode: focus, child: const Text('Save')),
          theme: InvisibleThemeData.dark(),
        ),
      );
      focus.requestFocus();
      // One frame applies the focus, the next paints its highlight.
      await tester.pump();
      await tester.pump();
      final ring = tester.widget<FocusRingPainter>(
        find.byType(FocusRingPainter),
      );
      expect(ring.visible, isTrue);
      expect(ring.ring.color, InvisibleStyleColors.focusOnDark);
    });
  });

  group('variants', () {
    testWidgets('danger shows the hazard glyph unless an icon is given', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            variant: ButtonVariant.danger,
            child: const Text('Delete'),
          ),
        ),
      );
      expect(find.byType(HazardGlyph), findsOneWidget);

      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            variant: ButtonVariant.danger,
            icon: _plus,
            child: const Text('Delete'),
          ),
        ),
      );
      expect(find.byType(HazardGlyph), findsNothing);
      expect(find.byKey(const Key('icon')), findsOneWidget);
    });

    testWidgets('ghost underlines its label', (tester) async {
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            variant: ButtonVariant.ghost,
            child: const Text('More'),
          ),
        ),
      );
      final style = tester
          .widget<DefaultTextStyle>(
            find
                .ancestor(
                  of: find.text('More'),
                  matching: find.byType(DefaultTextStyle),
                )
                .first,
          )
          .style;
      expect(style.decoration, TextDecoration.underline);
    });

    testWidgets('colours come from the theme roles', (tester) async {
      await tester.pumpWidget(
        harness(
          Button(
            onPressed: () {},
            variant: ButtonVariant.primary,
            child: const Text('Go'),
          ),
        ),
      );
      expect(_decoration(tester).color, InvisibleColors.light.primary);

      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer();
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pumpAndSettle();
      expect(_decoration(tester).color, InvisibleColors.light.primaryHover);
    });

    testWidgets('the label uses the theme font family', (tester) async {
      await tester.pumpWidget(
        harness(
          Button(onPressed: () {}, child: const Text('Save')),
          theme: InvisibleThemeData.light(fontFamily: 'Inter'),
        ),
      );
      final text = tester.widget<RichText>(
        find.descendant(of: find.text('Save'), matching: find.byType(RichText)),
      );
      expect(text.text.style?.fontFamily, 'Inter');
    });
  });

  group('direction and text scale', () {
    testWidgets('the leading icon leads in both directions', (tester) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(
          harness(
            Button(onPressed: () {}, icon: _plus, child: const Text('Save')),
            direction: direction,
          ),
        );
        final icon = tester.getCenter(find.byKey(const Key('icon'))).dx;
        final label = tester.getCenter(find.text('Save')).dx;
        expect(
          direction == TextDirection.ltr ? icon < label : icon > label,
          isTrue,
          reason: direction.name,
        );
      }
    });

    testWidgets('text scale 2.0 grows the button without overflow', (
      tester,
    ) async {
      Widget build(double scale) => harness(
        Button(onPressed: () {}, icon: _plus, child: const Text('Save')),
        textScale: scale,
      );
      await tester.pumpWidget(build(1));
      final regular = tester.getSize(find.byType(Button));
      await tester.pumpWidget(build(2));
      expect(tester.takeException(), isNull);
      final scaled = tester.getSize(find.byType(Button));
      expect(scaled.height, greaterThan(regular.height));
      expect(scaled.width, greaterThan(regular.width));
      final icon = tester.getSize(find.byKey(const Key('icon')));
      expect(icon.height, greaterThan(17.6 * 1.5), reason: 'icons scale too');
    });

    testWidgets('a long label wraps in a narrow space at text scale 2.0', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 160,
            child: Button(
              onPressed: () {},
              variant: ButtonVariant.danger,
              child: const Text('Delete every archived project'),
            ),
          ),
          textScale: 2,
          direction: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(tester.getSize(find.byType(Button)).width, lessThanOrEqualTo(160));
    });
  });
}
