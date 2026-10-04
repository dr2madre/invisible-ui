import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

final Finder _panel = find.byWidgetPredicate(
  (widget) => widget is Semantics && widget.properties.role?.name == 'dialog',
);

bool _open(WidgetTester tester) =>
    find.text('Panel text').evaluate().isNotEmpty;

FocusNode _focusOf(WidgetTester tester, Finder finder) =>
    Focus.of(tester.element(finder));

/// A region picker: a search field and a list of choices in the panel.
Widget _picker({
  PopoverController? controller,
  ValueChanged<bool>? onOpenChanged,
  List<String>? chosen,
}) => Popover(
  label: 'Region',
  trigger: const Text('Choose region'),
  controller: controller,
  onOpenChanged: onOpenChanged,
  builder: (context, popover) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const Text('Panel text'),
      const TextField.uncontrolled(label: 'Search regions'),
      Button(
        onPressed: () {
          chosen?.add('Lombardy');
          popover.close();
        },
        child: const Text('Lombardy'),
      ),
    ],
  ),
);

void main() {
  group('click', () {
    testWidgets('a press opens, focus moves to the first control, Escape '
        'closes and returns focus; each change is reported once', (
      tester,
    ) async {
      final reports = <bool>[];
      await tester.pumpWidget(harness(_picker(onOpenChanged: reports.add)));
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      expect(_open(tester), isTrue);
      expect(
        tester
            .widget<EditableText>(find.byType(EditableText))
            .focusNode
            .hasFocus,
        isTrue,
      );
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_focusOf(tester, find.text('Choose region')).hasFocus, isTrue);
      expect(reports, [true, false]);
    });

    testWidgets('a panel with nothing focusable takes focus itself', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          Popover(
            label: 'Details',
            builder: (context, _) => const Text('Panel text'),
          ),
        ),
      );
      expect(find.text('Open'), findsOneWidget, reason: 'the default trigger');
      await tester.tap(find.text('Open'));
      await tester.pump();
      await tester.pump();
      expect(FocusManager.instance.primaryFocus?.debugLabel, 'Popover panel');
    });

    testWidgets('a press outside closes and leaves focus; a second press on '
        'the trigger closes', (tester) async {
      final reports = <bool>[];
      await tester.pumpWidget(harness(_picker(onOpenChanged: reports.add)));
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      await tester.tapAt(const Offset(5, 5));
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(_focusOf(tester, find.text('Choose region')).hasFocus, isFalse);
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(reports, [true, false, true, false]);
    });

    testWidgets('focus moving out of the trigger and the panel closes it', (
      tester,
    ) async {
      final outside = FocusNode();
      addTearDown(outside.dispose);
      await tester.pumpWidget(
        harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _picker(),
              Button(
                onPressed: () {},
                focusNode: outside,
                child: const Text('Elsewhere'),
              ),
            ],
          ),
        ),
      );
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      outside.requestFocus();
      // Focus lands, the panel notices after the frame, then it rebuilds.
      await tester.pump();
      await tester.pump();
      await tester.pump();
      expect(_open(tester), isFalse);
      expect(outside.hasFocus, isTrue, reason: 'focus is not pulled back');
    });

    testWidgets('a controller opens and closes without a report; closing '
        'from the content returns focus to the trigger', (tester) async {
      final reports = <bool>[];
      final chosen = <String>[];
      final controller = PopoverController();
      await tester.pumpWidget(
        harness(
          _picker(
            controller: controller,
            onOpenChanged: reports.add,
            chosen: chosen,
          ),
        ),
      );
      controller.open();
      await tester.pump();
      await tester.pump();
      expect(controller.isOpen, isTrue);
      expect(_open(tester), isTrue);
      _focusOf(tester, find.text('Lombardy')).requestFocus();
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(chosen, ['Lombardy']);
      expect(_open(tester), isFalse);
      expect(_focusOf(tester, find.text('Choose region')).hasFocus, isTrue);
      expect(reports, isEmpty);
    });

    testWidgets('semantics: the trigger is an expandable button, the panel a '
        'dialog named by the label', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_picker()));
      expect(
        tester.getSemantics(find.text('Choose region')),
        semanticsWith(
          label: 'Choose region',
          isButton: true,
          hasExpandedState: true,
          isExpanded: false,
        ),
      );
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      expect(
        tester.getSemantics(find.text('Choose region')),
        semanticsWith(hasExpandedState: true, isExpanded: true),
      );
      expect(tester.getSemantics(_panel), semanticsWith(label: 'Region'));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('inside a dialog, Escape closes the popover and the dialog '
        'stays (ADR 0016)', (tester) async {
      await tester.pumpWidget(
        appHarness(
          (context) => Button(
            onPressed: () => showInvisibleDialog<void>(
              context: context,
              builder: (context) => Dialog(title: 'Export', child: _picker()),
            ),
            child: const Text('Export…'),
          ),
        ),
      );
      await tester.tap(find.text('Export…'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      expect(_open(tester), isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(_open(tester), isFalse);
      expect(find.text('Export'), findsOneWidget, reason: 'the dialog stays');
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Export'), findsNothing);
    });

    testWidgets('a select in the panel: choosing an option keeps the '
        'popover open', (tester) async {
      final chosen = <String>[];
      await tester.pumpWidget(
        harness(
          Popover(
            label: 'Region',
            builder: (context, _) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Panel text'),
                Select<String>.uncontrolled(
                  label: 'Country',
                  onChanged: chosen.add,
                  items: const [
                    ChoiceItem(value: 'it', label: 'Italy'),
                    ChoiceItem(value: 'pt', label: 'Portugal'),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open'));
      await tester.pump();
      await tester.pump();
      await tester.tap(find.text('Select…'));
      await tester.pump();
      await tester.tap(find.text('Portugal'));
      await tester.pump();
      await tester.pump();
      await tester.pump();
      expect(chosen, ['pt']);
      expect(_open(tester), isTrue);
    });

    testWidgets('below by default; flips above near the bottom; start and end '
        'follow the reading direction', (tester) async {
      Widget build(Alignment alignment, PopoverPlacement placement) => harness(
        Align(
          alignment: alignment,
          child: Popover(
            label: 'Info',
            placement: placement,
            builder: (context, _) => const Text('Panel text'),
          ),
        ),
        direction: TextDirection.rtl,
      );
      await tester.pumpWidget(build(Alignment.center, PopoverPlacement.bottom));
      await tester.tap(find.text('Open'));
      await tester.pump();
      expect(
        tester.getTopLeft(find.text('Panel text')).dy,
        greaterThan(tester.getBottomLeft(find.text('Open')).dy),
      );
      await tester.tap(find.text('Open'));
      await tester.pump();

      await tester.pumpWidget(
        build(Alignment.bottomCenter, PopoverPlacement.bottom),
      );
      await tester.tap(find.text('Open'));
      await tester.pump();
      expect(
        tester.getBottomLeft(find.text('Panel text')).dy,
        lessThan(tester.getTopLeft(find.text('Open')).dy),
      );
      await tester.tap(find.text('Open'));
      await tester.pump();

      await tester.pumpWidget(build(Alignment.center, PopoverPlacement.end));
      await tester.tap(find.text('Open'));
      await tester.pump();
      expect(
        tester.getCenter(find.text('Panel text')).dx,
        lessThan(tester.getCenter(find.text('Open')).dx),
        reason: 'end is the left in right-to-left text',
      );
    });

    testWidgets('a region picker fits a narrow window at text scale 2.0', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(360, 700);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(harness(_picker(), textScale: 2));
      await tester.tap(find.text('Choose region'));
      await tester.pump();
      await tester.pump();
      expect(tester.takeException(), isNull);
      final panel = tester.getRect(_panel);
      expect(panel.left, greaterThanOrEqualTo(8));
      expect(panel.right, lessThanOrEqualTo(352));
    });
  });

  group('hover', () {
    Widget hover({ValueChanged<bool>? onOpenChanged, FocusNode? focus}) =>
        Popover.hover(
          onOpenChanged: onOpenChanged,
          trigger: Button(
            onPressed: () {},
            focusNode: focus,
            child: const Text('Ada Lovelace'),
          ),
          builder: (context, _) => const Text('Panel text'),
        );

    testWidgets('the pointer resting opens after the delay; leaving closes '
        'after the delay; the panel itself keeps it open', (tester) async {
      final reports = <bool>[];
      await tester.pumpWidget(harness(hover(onOpenChanged: reports.add)));
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: Offset.zero);
      await mouse.moveTo(tester.getCenter(find.text('Ada Lovelace')));
      await tester.pump(const Duration(milliseconds: 200));
      expect(_open(tester), isFalse);
      await tester.pump(const Duration(milliseconds: 150));
      expect(_open(tester), isTrue);
      await mouse.moveTo(tester.getCenter(find.text('Panel text')));
      await tester.pump(const Duration(milliseconds: 400));
      expect(_open(tester), isTrue, reason: 'hoverable');
      await mouse.moveTo(Offset.zero);
      await tester.pump(const Duration(milliseconds: 250));
      expect(_open(tester), isFalse);
      expect(reports, [true, false]);
    });

    testWidgets('keyboard focus opens after the delay, focus stays on the '
        'trigger, Escape closes', (tester) async {
      final focus = FocusNode();
      addTearDown(focus.dispose);
      await tester.pumpWidget(harness(hover(focus: focus)));
      focus.requestFocus();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 350));
      expect(_open(tester), isTrue);
      expect(focus.hasPrimaryFocus, isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(_open(tester), isFalse);
    });

    testWidgets('a tap with a finger toggles it', (tester) async {
      await tester.pumpWidget(harness(hover()));
      await tester.tap(find.text('Ada Lovelace'));
      await tester.pump();
      expect(_open(tester), isTrue);
      await tester.tap(find.text('Ada Lovelace'));
      await tester.pump();
      expect(_open(tester), isFalse);
    });
  });
}
