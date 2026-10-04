import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

const _glyph = SizedBox.square(dimension: 16);

Widget _tooltipped({
  FocusNode? focus,
  TooltipPlacement placement = TooltipPlacement.top,
  String message = 'Adds a row below',
}) => Tooltip(
  message: message,
  placement: placement,
  child: Button.icon(
    onPressed: () {},
    focusNode: focus,
    icon: _glyph,
    semanticLabel: 'Add row',
  ),
);

Finder get _bubble => find.text('Adds a row below');

Future<TestGesture> _mouse(WidgetTester tester) async {
  final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
  addTearDown(mouse.removePointer);
  await mouse.addPointer(location: Offset.zero);
  return mouse;
}

void main() {
  group('showing and hiding', () {
    testWidgets('hover shows it after the wait and hides it after leaving', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_tooltipped()));
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pump(const Duration(milliseconds: 299));
      expect(_bubble, findsNothing);
      await tester.pump(const Duration(milliseconds: 1));
      expect(_bubble, findsOneWidget);

      await mouse.moveTo(Offset.zero);
      await tester.pump(const Duration(milliseconds: 99));
      expect(_bubble, findsOneWidget);
      await tester.pump(const Duration(milliseconds: 1));
      expect(_bubble, findsNothing);
    });

    testWidgets('the delays follow the widget', (tester) async {
      await tester.pumpWidget(
        harness(
          Tooltip(
            message: 'Adds a row below',
            waitDuration: Duration.zero,
            child: Button(onPressed: () {}, child: const Text('Add')),
          ),
        ),
      );
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pump();
      expect(_bubble, findsOneWidget);
    });

    testWidgets('keyboard focus shows it at once; leaving focus hides it', (
      tester,
    ) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(harness(_tooltipped(focus: focus)));
      focus.requestFocus();
      await pumpFocus(tester);
      expect(_bubble, findsOneWidget);
      focus.unfocus();
      await pumpFocus(tester);
      expect(_bubble, findsNothing);
    });

    testWidgets('Escape hides it, even while hovered', (tester) async {
      await tester.pumpWidget(harness(_tooltipped()));
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pump(const Duration(milliseconds: 300));
      expect(_bubble, findsOneWidget);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_bubble, findsNothing);
    });

    testWidgets('it stays while the pointer moves onto it', (tester) async {
      await tester.pumpWidget(harness(_tooltipped()));
      final mouse = await _mouse(tester);
      await mouse.moveTo(tester.getCenter(find.byType(Button)));
      await tester.pump(const Duration(milliseconds: 300));
      await mouse.moveTo(tester.getCenter(_bubble));
      await tester.pump(const Duration(milliseconds: 500));
      expect(_bubble, findsOneWidget);
      await mouse.moveTo(Offset.zero);
      await tester.pump(const Duration(milliseconds: 100));
      expect(_bubble, findsNothing);
    });

    testWidgets('a tap with a finger toggles it', (tester) async {
      var presses = 0;
      await tester.pumpWidget(
        harness(
          Tooltip(
            message: 'Adds a row below',
            child: Button(onPressed: () => presses++, child: const Text('Add')),
          ),
        ),
      );
      await tester.tap(find.byType(Button));
      await tester.pump();
      expect(_bubble, findsOneWidget);
      expect(presses, 1, reason: 'the trigger still works');
      await tester.tap(find.byType(Button));
      await tester.pump();
      expect(_bubble, findsNothing);
    });
  });

  group('semantics', () {
    testWidgets('the message is the trigger tooltip, never its name', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(harness(_tooltipped(focus: focus)));
      focus.requestFocus();
      await pumpFocus(tester);
      expect(_bubble, findsOneWidget);
      expect(
        tester.getSemantics(find.byType(Button)),
        semanticsWith(
          isButton: true,
          label: 'Add row',
          tooltip: 'Adds a row below',
        ),
      );
      // The bubble is not read a second time.
      expect(find.bySemanticsLabel('Adds a row below'), findsNothing);
      semantics.dispose();
    });

    testWidgets('meets the text contrast guideline', (tester) async {
      final semantics = tester.ensureSemantics();
      final focus = FocusNode();
      addTearDown(focus.dispose);
      for (final theme in [
        InvisibleThemeData.light(),
        InvisibleThemeData.dark(),
      ]) {
        await tester.pumpWidget(
          harness(_tooltipped(focus: focus), theme: theme),
        );
        focus.requestFocus();
        await pumpFocus(tester);
        await expectLater(tester, meetsGuideline(textContrastGuideline));
      }
      semantics.dispose();
    });
  });

  group('placement', () {
    Future<(Rect, Rect)> rects(
      WidgetTester tester,
      Widget Function(FocusNode focus) build, {
      String message = 'Adds a row below',
    }) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(build(focus));
      focus.requestFocus();
      await pumpFocus(tester);
      return (
        tester.getRect(find.byType(Button)),
        tester.getRect(find.text(message)),
      );
    }

    testWidgets('above the trigger by default', (tester) async {
      final (trigger, bubble) = await rects(
        tester,
        (focus) => harness(_tooltipped(focus: focus)),
      );
      expect(bubble.bottom, lessThan(trigger.top));
      expect(bubble.center.dx, moreOrLessEquals(trigger.center.dx, epsilon: 1));
    });

    testWidgets('below the trigger when the top has no room', (tester) async {
      final (trigger, bubble) = await rects(
        tester,
        (focus) => harness(
          Align(
            alignment: Alignment.topCenter,
            child: _tooltipped(focus: focus),
          ),
        ),
      );
      expect(bubble.top, greaterThan(trigger.bottom));
    });

    testWidgets('end follows the reading direction', (tester) async {
      for (final direction in TextDirection.values) {
        final (trigger, bubble) = await rects(
          tester,
          (focus) => harness(
            _tooltipped(focus: focus, placement: TooltipPlacement.end),
            direction: direction,
          ),
        );
        expect(
          direction == TextDirection.ltr
              ? bubble.left > trigger.right
              : bubble.right < trigger.left,
          isTrue,
          reason: direction.name,
        );
      }
    });

    testWidgets('a long message wraps inside a narrow screen at text scale '
        '2.0', (tester) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      const long = 'Adds a row below the current one and moves focus to it';
      final (_, bubble) = await rects(
        tester,
        (focus) =>
            harness(_tooltipped(focus: focus, message: long), textScale: 2),
        message: long,
      );
      expect(tester.takeException(), isNull);
      expect(bubble.left, greaterThanOrEqualTo(8));
      expect(bubble.right, lessThanOrEqualTo(312));
    });
  });
}
