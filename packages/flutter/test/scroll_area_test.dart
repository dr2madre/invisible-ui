import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

Widget _rows([int count = 40]) => Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [for (var i = 0; i < count; i++) Text('Row $i')],
);

ScrollPosition _position(WidgetTester tester, Axis axis) => tester
    .widgetList<Scrollable>(find.byType(Scrollable))
    .map((s) => s.controller!.position)
    .firstWhere((p) => p.axis == axis);

Future<void> _focusViewport(WidgetTester tester) async {
  Focus.of(tester.element(find.byType(FocusRingPainter))).requestFocus();
  await pumpFocus(tester);
}

void main() {
  testWidgets('the viewport stops at maxHeight and scrolls with the keys '
      'while it has focus', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(width: 200, child: ScrollArea(maxHeight: 120, child: _rows())),
        disableAnimations: true,
      ),
    );
    expect(tester.getSize(find.byType(ScrollArea)).height, 120);
    final position = _position(tester, Axis.vertical);
    await _focusViewport(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(position.pixels, 40);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
    await tester.pump();
    expect(position.pixels, 0);
    await tester.sendKeyEvent(LogicalKeyboardKey.pageDown);
    await tester.pump();
    expect(position.pixels, 120 * 0.8);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(position.pixels, 120 * 0.8 * 2);
    await tester.sendKeyDownEvent(LogicalKeyboardKey.shiftLeft);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyUpEvent(LogicalKeyboardKey.shiftLeft);
    await tester.pump();
    expect(position.pixels, 120 * 0.8);
    await tester.sendKeyEvent(LogicalKeyboardKey.end);
    await tester.pump();
    expect(position.pixels, position.maxScrollExtent);
    await tester.sendKeyEvent(LogicalKeyboardKey.home);
    await tester.pump();
    expect(position.pixels, 0);
  });

  testWidgets('a control inside keeps its keys', (tester) async {
    final inner = FocusNode();
    addTearDown(inner.dispose);
    var pressed = 0;
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 200,
          child: ScrollArea(
            maxHeight: 120,
            child: Column(
              children: [
                Button(
                  onPressed: () => pressed++,
                  focusNode: inner,
                  child: const Text('Inside'),
                ),
                _rows(),
              ],
            ),
          ),
        ),
        disableAnimations: true,
      ),
    );
    inner.requestFocus();
    await pumpFocus(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(pressed, 1);
    expect(_position(tester, Axis.vertical).pixels, 0);
  });

  testWidgets('horizontal arrows follow the direction: right to left, the '
      'left arrow moves on', (tester) async {
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 200,
            child: ScrollArea(
              key: ValueKey(direction),
              orientation: ScrollAreaOrientation.horizontal,
              child: Text('x' * 100, softWrap: false),
            ),
          ),
          direction: direction,
          disableAnimations: true,
        ),
      );
      final position = _position(tester, Axis.horizontal);
      await _focusViewport(tester);
      await tester.sendKeyEvent(
        direction == TextDirection.ltr
            ? LogicalKeyboardKey.arrowRight
            : LogicalKeyboardKey.arrowLeft,
      );
      await tester.pump();
      expect(position.pixels, 40, reason: '$direction');
      // Page and end keys move the only axis that scrolls.
      await tester.sendKeyEvent(LogicalKeyboardKey.end);
      await tester.pump();
      expect(position.pixels, position.maxScrollExtent, reason: '$direction');
    }
  });

  testWidgets('both axes scroll, each with its own bar', (tester) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 200,
          child: ScrollArea(
            orientation: ScrollAreaOrientation.both,
            maxHeight: 100,
            child: Column(
              children: [
                for (var i = 0; i < 20; i++) Text('${'wide ' * 20}$i'),
              ],
            ),
          ),
        ),
        disableAnimations: true,
      ),
    );
    expect(find.byType(RawScrollbar), findsNWidgets(2));
    await _focusViewport(tester);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
    await tester.pump();
    expect(_position(tester, Axis.vertical).pixels, 40);
    expect(_position(tester, Axis.horizontal).pixels, 40);
  });

  testWidgets('the thumb drags; a wheel scrolls; the focus ring shows from '
      'the keyboard', (tester) async {
    useKeyboardHighlight();
    await tester.pumpWidget(
      harness(
        SizedBox(width: 200, child: ScrollArea(maxHeight: 120, child: _rows())),
      ),
    );
    // The bars fade in after the first frame.
    await tester.pumpAndSettle();
    final position = _position(tester, Axis.vertical);
    final area = tester.getRect(find.byType(ScrollArea));
    // The thumb sits at the inline-end, 2 from the edge.
    final drag = await tester.startGesture(
      area.topRight + const Offset(-6, 10),
      kind: PointerDeviceKind.mouse,
    );
    addTearDown(drag.removePointer);
    await tester.pump();
    await drag.moveBy(const Offset(0, 20));
    await tester.pumpAndSettle();
    await drag.up();
    await tester.pumpAndSettle();
    expect(position.pixels, greaterThan(0));

    final before = position.pixels;
    await drag.moveTo(area.center);
    await tester.sendEventToBinding(
      PointerScrollEvent(
        position: area.center,
        scrollDelta: const Offset(0, 30),
      ),
    );
    await tester.pumpAndSettle();
    expect(position.pixels, greaterThan(before));

    await _focusViewport(tester);
    expect(
      tester.widget<FocusRingPainter>(find.byType(FocusRingPainter)).visible,
      isTrue,
    );
  });

  testWidgets('semantics: a named region the keyboard reaches; text scale '
      '2.0 in a narrow parent', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 120,
          child: ScrollArea(semanticLabel: 'Activity', child: _rows(10)),
        ),
        textScale: 2,
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getSemantics(find.byType(ScrollArea)),
      semanticsWith(label: 'Activity', isFocusable: true),
    );
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });
}
