import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Future<Object?>? _result;

Widget _page(
  WidgetBuilder dialog, {
  InvisibleThemeData? theme,
  TextDirection direction = TextDirection.ltr,
  double textScale = 1,
  bool reduceMotion = false,
}) => WidgetsApp(
  color: const Color(0xFF000000),
  pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
    settings: settings,
    pageBuilder: (context, _, _) => builder(context),
  ),
  builder: (context, child) => MediaQuery(
    data: MediaQuery.of(context).copyWith(
      textScaler: TextScaler.linear(textScale),
      disableAnimations: reduceMotion,
    ),
    child: Directionality(
      textDirection: direction,
      child: InvisibleTheme(
        data: theme ?? InvisibleThemeData.light(),
        child: child!,
      ),
    ),
  ),
  home: Builder(
    builder: (context) => Center(
      child: Button(
        onPressed: () => _result = showInvisibleDialog<Object?>(
          context: context,
          builder: dialog,
        ),
        child: const Text('Open'),
      ),
    ),
  ),
);

/// Opens from the keyboard, so the trigger holds focus.
Future<void> _open(WidgetTester tester) async {
  await tester.sendKeyEvent(LogicalKeyboardKey.tab);
  await tester.sendKeyEvent(LogicalKeyboardKey.enter);
  await tester.pumpAndSettle();
}

/// The painted panel.
final Finder _panel = find.byWidgetPredicate(
  (widget) =>
      widget is DecoratedBox &&
      widget.decoration is BoxDecoration &&
      (widget.decoration as BoxDecoration).boxShadow != null,
);

final Finder _handle = find.byWidgetPredicate(
  (widget) =>
      widget is MouseRegion &&
      (widget.cursor == SystemMouseCursors.grab ||
          widget.cursor == SystemMouseCursors.grabbing),
);

Widget _filters(
  BuildContext context, {
  SheetDialogSide side = SheetDialogSide.end,
  bool draggable = false,
  DialogController? controller,
}) => SheetDialog(
  title: 'Filters',
  description: 'Refine the results.',
  side: side,
  draggable: draggable,
  controller: controller,
  actions: [
    Button(
      onPressed: () => Navigator.of(context).pop('applied'),
      variant: ButtonVariant.primary,
      child: const Text('Apply'),
    ),
  ],
  child: const Text('Body text'),
);

void main() {
  tearDown(() => _result = null);
  // An 800 by 600 screen, the test default.
  const screen = Size(800, 600);

  group('a dialog in every way', () {
    testWidgets('modal, named and described, focus on the panel; the close '
        'button is named from the catalog', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(_filters));
      await _open(tester);
      final node = tester.getSemantics(
        find
            .byWidgetPredicate(
              (widget) =>
                  widget is Semantics && widget.properties.namesRoute == true,
            )
            .last,
      );
      expect(
        node,
        semanticsWith(
          label: 'Filters',
          hint: 'Refine the results.',
          namesRoute: true,
        ),
      );
      expect(node.getSemanticsData().role, SemanticsRole.dialog);
      expect(FocusManager.instance.primaryFocus?.debugLabel, 'Dialog');
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Button && widget.semanticLabel == 'Close',
        ),
        findsOneWidget,
      );
      semantics.dispose();
    });

    testWidgets('Escape and the close button close it; focus returns', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_filters));
      await _open(tester);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
      expect(
        Focus.of(tester.element(find.text('Open'))).hasPrimaryFocus,
        isTrue,
      );
      await _open(tester);
      await tester.tap(
        find.byWidgetPredicate(
          (widget) => widget is Button && widget.semanticLabel == 'Close',
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
      await _open(tester);
      await tester.tap(find.text('Apply'));
      await tester.pumpAndSettle();
      expect(await _result, 'applied');
    });

    testWidgets('the footer sits at the bottom, set apart by a border; a '
        'notice goes between the body and the footer', (tester) async {
      final controller = DialogController();
      await tester.pumpWidget(
        _page((context) => _filters(context, controller: controller)),
      );
      await _open(tester);
      controller.notify(title: 'Two filters could not load');
      await tester.pump();
      final apply = tester.getRect(find.text('Apply'));
      expect(apply.bottom, greaterThan(screen.height - 60));
      final notice = tester.getRect(find.text('Two filters could not load'));
      expect(
        notice.top,
        greaterThan(tester.getRect(find.text('Body text')).bottom),
      );
      expect(notice.bottom, lessThan(apply.top));
    });
  });

  group('placement', () {
    testWidgets('end is the right edge left to right and the left edge right '
        'to left; start is the opposite', (tester) async {
      Future<Rect> panelFor(
        SheetDialogSide side,
        TextDirection direction,
      ) async {
        await tester.pumpWidget(
          _page(
            (context) => _filters(context, side: side),
            direction: direction,
          ),
        );
        await _open(tester);
        final rect = tester.getRect(_panel);
        await tester.sendKeyEvent(LogicalKeyboardKey.escape);
        await tester.pumpAndSettle();
        return rect;
      }

      final endLtr = await panelFor(SheetDialogSide.end, TextDirection.ltr);
      expect(endLtr.right, screen.width);
      expect(endLtr.width, 320);
      expect(endLtr.height, screen.height);
      final endRtl = await panelFor(SheetDialogSide.end, TextDirection.rtl);
      expect(endRtl.left, 0);
      final startLtr = await panelFor(SheetDialogSide.start, TextDirection.ltr);
      expect(startLtr.left, 0);
      final startRtl = await panelFor(SheetDialogSide.start, TextDirection.rtl);
      expect(startRtl.right, screen.width);
      final bottom = await panelFor(SheetDialogSide.bottom, TextDirection.ltr);
      expect(bottom.bottom, screen.height);
      expect(bottom.width, screen.width);
      expect(bottom.height, 256);
      final top = await panelFor(SheetDialogSide.top, TextDirection.ltr);
      expect(top.top, 0);
    });

    testWidgets('the size grows with the text and stops at the screen', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_filters, textScale: 2));
      await _open(tester);
      expect(tester.getSize(_panel).width, 640);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      await tester.pumpWidget(_page(_filters, textScale: 3));
      await _open(tester);
      expect(tester.getSize(_panel).width, screen.width);
    });
  });

  group('motion', () {
    testWidgets('it slides in from its edge, mirrored right to left', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_filters));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(tester.getRect(_panel).right, greaterThan(screen.width));
      await tester.pumpAndSettle();
      expect(tester.getRect(_panel).right, screen.width);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();

      await tester.pumpWidget(_page(_filters, direction: TextDirection.rtl));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(tester.getRect(_panel).left, lessThan(0));
      await tester.pumpAndSettle();
    });

    testWidgets('under reduced motion it shows in place at once', (
      tester,
    ) async {
      await tester.pumpWidget(_page(_filters, reduceMotion: true));
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      await tester.pump();
      expect(tester.getRect(_panel).right, screen.width);
      expect(tester.hasRunningAnimations, isFalse);
    });
  });

  group('drag to dismiss', () {
    testWidgets('the handle shows only when draggable and not at the top, '
        'and stays out of the semantics tree', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(_page(_filters));
      await _open(tester);
      expect(_handle, findsNothing);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      await tester.pumpWidget(
        _page(
          (context) =>
              _filters(context, side: SheetDialogSide.top, draggable: true),
        ),
      );
      await _open(tester);
      expect(_handle, findsNothing);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      await tester.pumpWidget(
        _page((context) => _filters(context, draggable: true)),
      );
      await _open(tester);
      expect(_handle, findsOneWidget);
      expect(
        find.descendant(of: find.byType(ExcludeSemantics), matching: _handle),
        findsOneWidget,
      );
      semantics.dispose();
    });

    testWidgets('dragging past a quarter toward the edge closes; less snaps '
        'home', (tester) async {
      await tester.pumpWidget(
        _page((context) => _filters(context, draggable: true)),
      );
      await _open(tester);
      final start = tester.getCenter(_handle);
      final gesture = await tester.startGesture(start);
      await gesture.moveBy(const Offset(20, 0));
      await gesture.moveBy(const Offset(40, 0));
      await tester.pump();
      expect(tester.getRect(_panel).right, screen.width + 60);
      await tester.pump(const Duration(seconds: 1));
      await gesture.up();
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsOneWidget);
      expect(tester.getRect(_panel).right, screen.width);

      await tester.timedDrag(
        _handle,
        const Offset(100, 0),
        const Duration(seconds: 1),
      );
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
    });

    testWidgets('a flick toward the edge closes', (tester) async {
      await tester.pumpWidget(
        _page(
          (context) =>
              _filters(context, side: SheetDialogSide.bottom, draggable: true),
        ),
      );
      await _open(tester);
      await tester.fling(_handle, const Offset(0, 50), 1500);
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
    });

    testWidgets('right to left the end panel is dragged toward the left edge; '
        'a drag inward does nothing', (tester) async {
      await tester.pumpWidget(
        _page(
          (context) => _filters(context, draggable: true),
          direction: TextDirection.rtl,
        ),
      );
      await _open(tester);
      await tester.timedDrag(
        _handle,
        const Offset(100, 0),
        const Duration(seconds: 1),
      );
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsOneWidget);
      expect(tester.getRect(_panel).left, 0);
      await tester.timedDrag(
        _handle,
        const Offset(-100, 0),
        const Duration(seconds: 1),
      );
      await tester.pumpAndSettle();
      expect(find.byType(SheetDialog), findsNothing);
    });

    testWidgets('under reduced motion a short drag snaps home at once', (
      tester,
    ) async {
      await tester.pumpWidget(
        _page(
          (context) => _filters(context, draggable: true),
          reduceMotion: true,
        ),
      );
      await _open(tester);
      await tester.timedDrag(
        _handle,
        const Offset(30, 0),
        const Duration(seconds: 1),
      );
      await tester.pump();
      expect(tester.getRect(_panel).right, screen.width);
      expect(tester.hasRunningAnimations, isFalse);
    });
  });

  group('accessibility', () {
    testWidgets('right to left at text scale 2.0 on a narrow screen: no '
        'overflow; labelled 44 by 44 targets under touch', (tester) async {
      tester.view.physicalSize = const Size(320, 720);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        _page(
          (context) => _filters(context, side: SheetDialogSide.bottom),
          direction: TextDirection.rtl,
          textScale: 2,
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await _open(tester);
      expect(tester.takeException(), isNull);
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline44));
      semantics.dispose();
    });

    testWidgets('text contrast, light and dark', (tester) async {
      final semantics = tester.ensureSemantics();
      for (final theme in [
        InvisibleThemeData.light(),
        InvisibleThemeData.dark(),
      ]) {
        await tester.pumpWidget(_page(_filters, theme: theme));
        await _open(tester);
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await tester.sendKeyEvent(LogicalKeyboardKey.escape);
        await tester.pumpAndSettle();
      }
      semantics.dispose();
    });
  });
}
