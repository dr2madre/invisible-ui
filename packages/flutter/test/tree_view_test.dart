// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';
import 'package:invisible_ui/src/internal/pressable.dart';
import 'package:invisible_ui/src/internal/roving.dart';

import 'harness.dart';

const List<TreeNode<String>> _nodes = [
  TreeNode(
    value: 'docs',
    label: 'Documents',
    children: [
      TreeNode(
        value: 'reports',
        label: 'Reports',
        children: [
          TreeNode(value: 'q1', label: 'First quarter'),
          TreeNode(value: 'q2', label: 'Second quarter'),
        ],
      ),
      TreeNode(value: 'notes', label: 'Notes'),
      TreeNode(value: 'archive', label: 'Archive', disabled: true),
    ],
  ),
  TreeNode(value: 'pictures', label: 'Pictures', hasChildren: true),
  TreeNode(value: 'music', label: 'Music', disabled: true),
  TreeNode(value: 'videos', label: 'Videos'),
];

const List<TreeNode<String>> _loadedPictures = [
  TreeNode(
    value: 'docs',
    label: 'Documents',
    children: [TreeNode(value: 'notes', label: 'Notes')],
  ),
  TreeNode(
    value: 'pictures',
    label: 'Pictures',
    children: [TreeNode(value: 'beach', label: 'Beach')],
  ),
];

/// What the tree reported, in order.
class _Log {
  final List<String> selected = [];
  final List<Set<String>> expanded = [];
  final List<TreeLoadRequest<String>> loads = [];
}

Widget _tree(
  _Log log, {
  String? initialSelected,
  Set<String> initialExpanded = const {},
  List<TreeNode<String>> nodes = _nodes,
  bool enabled = true,
}) => TreeView<String>.uncontrolled(
  label: 'Files',
  nodes: nodes,
  initialSelected: initialSelected,
  initialExpanded: initialExpanded,
  onSelectionChanged: log.selected.add,
  onExpansionChanged: log.expanded.add,
  onLoadChildren: log.loads.add,
  enabled: enabled,
);

Widget _controlled(
  _Log log, {
  String? selected,
  Set<String> expanded = const {},
  Set<String> loading = const {},
  Set<String> loadErrors = const {},
  List<TreeNode<String>> nodes = _nodes,
}) => TreeView<String>(
  label: 'Files',
  nodes: nodes,
  selected: selected,
  expanded: expanded,
  loading: loading,
  loadErrors: loadErrors,
  onSelectionChanged: log.selected.add,
  onExpansionChanged: log.expanded.add,
  onLoadChildren: log.loads.add,
);

Finder _row(String label) =>
    find.ancestor(of: find.text(label), matching: find.byType(Pressable));

Finder _twistie(String label) => find.descendant(
  of: _row(label),
  matching: find.byWidgetPredicate(
    (widget) => widget is Glyph && widget.shape == GlyphShape.chevronEnd,
  ),
);

bool _checked(WidgetTester tester, String label) => find
    .descendant(
      of: _row(label),
      matching: find.byWidgetPredicate(
        (widget) => widget is Glyph && widget.shape == GlyphShape.check,
      ),
    )
    .evaluate()
    .isNotEmpty;

Color? _background(WidgetTester tester, String label) =>
    (tester
                .widget<DecoratedBox>(
                  find
                      .descendant(
                        of: _row(label),
                        matching: find.byType(DecoratedBox),
                      )
                      .first,
                )
                .decoration
            as BoxDecoration)
        .color;

double _turns(WidgetTester tester, String label) => tester
    .widget<AnimatedRotation>(
      find.descendant(of: _row(label), matching: find.byType(AnimatedRotation)),
    )
    .turns;

Future<void> _key(WidgetTester tester, LogicalKeyboardKey key) async {
  await tester.sendKeyEvent(key);
  await pumpFocus(tester);
}

Future<void> _type(WidgetTester tester, String character) async {
  await tester.sendKeyEvent(
    character == '*'
        ? LogicalKeyboardKey.numpadMultiply
        : LogicalKeyboardKey(character.toLowerCase().codeUnitAt(0)),
    character: character,
  );
  await pumpFocus(tester);
}

bool _focused(WidgetTester tester, String label) =>
    focusedOn(tester, find.text(label));

void main() {
  group('pointer', () {
    testWidgets('a press on a row focuses and selects it, reports once and '
        'shows the check on that row only', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log)));
      expect(find.text('Notes'), findsNothing, reason: 'children start hidden');
      await tester.tap(find.text('Videos'));
      await pumpFocus(tester);
      await tester.tap(find.text('Videos'));
      await pumpFocus(tester);
      expect(log.selected, ['videos']);
      expect(log.expanded, isEmpty);
      expect(_focused(tester, 'Videos'), isTrue);
      expect(_checked(tester, 'Videos'), isTrue);
      expect(_checked(tester, 'Documents'), isFalse);
    });

    testWidgets('a press on the chevron opens and closes the parent without '
        'selecting; children sit right after it, indented', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log)));
      await tester.tap(_twistie('Documents'));
      await tester.pumpAndSettle();
      expect(log.expanded, [
        {'docs'},
      ]);
      expect(log.selected, isEmpty);
      final docs = tester.getRect(find.text('Documents'));
      final reports = tester.getRect(find.text('Reports'));
      final pictures = tester.getRect(find.text('Pictures'));
      expect(reports.top, greaterThan(docs.top));
      expect(reports.top, lessThan(pictures.top));
      expect(reports.left, greaterThan(docs.left));
      await tester.tap(_twistie('Documents'));
      await tester.pumpAndSettle();
      expect(log.expanded.last, isEmpty);
      expect(find.text('Reports'), findsNothing);
    });

    testWidgets('selected rows are tinted with the secondary role, deeper on '
        'hover; other rows take the neutral surface on hover', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log, initialSelected: 'videos')));
      final colors = InvisibleColors.light;
      expect(
        _background(tester, 'Videos'),
        colors.secondary.withValues(alpha: 0.1),
      );
      expect(_background(tester, 'Documents'), isNull);
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer();
      await mouse.moveTo(tester.getCenter(find.text('Videos')));
      await tester.pump();
      expect(
        _background(tester, 'Videos'),
        colors.secondary.withValues(alpha: 0.16),
      );
      await mouse.moveTo(tester.getCenter(find.text('Documents')));
      await tester.pump();
      expect(_background(tester, 'Documents'), colors.neutralSurface);
    });
  });

  group('keyboard', () {
    testWidgets('left to right: Down and Up move over visible enabled nodes '
        'without wrapping; Right opens, then enters; Left rises, then '
        'closes; Home and End jump', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log)));
      await focusOn(tester, find.text('Documents'));
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_focused(tester, 'Documents'), isTrue, reason: 'no wrap');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester, 'Pictures'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester, 'Videos'), isTrue, reason: 'Music is disabled');
      await _key(tester, LogicalKeyboardKey.arrowDown);
      expect(_focused(tester, 'Videos'), isTrue, reason: 'no wrap');
      await _key(tester, LogicalKeyboardKey.home);
      expect(_focused(tester, 'Documents'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.expanded, [
        {'docs'},
      ]);
      expect(_focused(tester, 'Documents'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester, 'Reports'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focused(tester, 'Documents'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(log.expanded.last, isEmpty);
      await _key(tester, LogicalKeyboardKey.end);
      expect(_focused(tester, 'Videos'), isTrue);
      expect(log.selected, isEmpty, reason: 'moving never selects');
    });

    testWidgets('right to left: Left opens and enters, Right rises and '
        'closes; the chevron turns the other way', (tester) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_tree(log), direction: TextDirection.rtl),
      );
      await focusOn(tester, find.text('Documents'));
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.expanded, isEmpty);
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(log.expanded, [
        {'docs'},
      ]);
      expect(_turns(tester, 'Documents'), -0.25);
      await _key(tester, LogicalKeyboardKey.arrowLeft);
      expect(_focused(tester, 'Reports'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(_focused(tester, 'Documents'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.expanded.last, isEmpty);
      expect(
        tester.getRect(_twistie('Documents')).left,
        greaterThan(tester.getRect(find.text('Documents')).right),
        reason: 'the chevron sits at the inline-start, on the right',
      );
    });

    testWidgets('Enter and Space select the focused node, once each', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log, initialExpanded: {'docs'})));
      await focusOn(tester, find.text('Notes'));
      await _key(tester, LogicalKeyboardKey.enter);
      await _key(tester, LogicalKeyboardKey.enter);
      expect(log.selected, ['notes']);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      await _key(tester, LogicalKeyboardKey.space);
      expect(log.selected, ['notes', 'reports']);
      expect(_checked(tester, 'Reports'), isTrue);
    });

    testWidgets('typeahead moves focus to the next visible enabled label that '
        'starts with the typed text, ignoring case and wrapping', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log, initialExpanded: {'docs'})));
      await focusOn(tester, find.text('Documents'));
      await _type(tester, 'n');
      expect(_focused(tester, 'Notes'), isTrue);
      await tester.pump(typeaheadReset);
      await _type(tester, 'M');
      expect(_focused(tester, 'Notes'), isTrue, reason: 'Music is disabled');
      await tester.pump(typeaheadReset);
      await _type(tester, 'v');
      expect(_focused(tester, 'Videos'), isTrue);
      await tester.pump(typeaheadReset);
      await _type(tester, 'r');
      expect(_focused(tester, 'Reports'), isTrue, reason: 'wraps');
      await tester.pump(typeaheadReset);
      await _type(tester, 'f');
      expect(
        _focused(tester, 'Reports'),
        isTrue,
        reason: 'First quarter is hidden',
      );
      await tester.pump(typeaheadReset);
      await _type(tester, 'p');
      await _type(tester, 'i');
      expect(_focused(tester, 'Pictures'), isTrue, reason: 'one query');
      expect(log.selected, isEmpty);
      expect(log.expanded, isEmpty);
    });

    testWidgets('* opens every closed enabled parent beside the focused node, '
        'reports once and requests the unloaded ones', (tester) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log)));
      await focusOn(tester, find.text('Videos'));
      await _type(tester, '*');
      expect(log.expanded, [
        {'docs', 'pictures'},
      ]);
      expect(log.loads.map((r) => r.value), ['pictures']);
      expect(_focused(tester, 'Videos'), isTrue);
      await focusOn(tester, find.text('Notes'));
      await _type(tester, '*');
      expect(log.expanded.last, {'docs', 'pictures', 'reports'});
      await _type(tester, '*');
      expect(log.expanded.length, 2, reason: 'nothing left to open');
      expect(log.loads.length, 1);
    });

    testWidgets('one tab stop: the first node, else the selected one, else '
        'the node that last had focus', (tester) async {
      final before = FocusNode();
      final after = FocusNode();
      addTearDown(before.dispose);
      addTearDown(after.dispose);
      Widget page(String? selected) => WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => harness(
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Button(
                onPressed: () {},
                focusNode: before,
                child: const Text('Before'),
              ),
              _tree(_Log(), initialSelected: selected),
              Button(
                onPressed: () {},
                focusNode: after,
                child: const Text('After'),
              ),
            ],
          ),
        ),
      );
      await tester.pumpWidget(page(null));
      before.requestFocus();
      await pumpFocus(tester);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester, 'Documents'), isTrue);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(after.hasPrimaryFocus, isTrue, reason: 'one stop');

      await tester.pumpWidget(const SizedBox());
      await tester.pumpWidget(page('videos'));
      before.requestFocus();
      await pumpFocus(tester);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(_focused(tester, 'Videos'), isTrue);
      await _key(tester, LogicalKeyboardKey.arrowUp);
      expect(_focused(tester, 'Pictures'), isTrue);
      await _key(tester, LogicalKeyboardKey.tab);
      expect(after.hasPrimaryFocus, isTrue);
      await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
      await _key(tester, LogicalKeyboardKey.tab);
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
      await pumpFocus(tester);
      expect(_focused(tester, 'Pictures'), isTrue);
    });
  });

  group('state', () {
    testWidgets('controlled: a changed selection or expanded set is shown '
        'without a report; a press reports and the echo moves nothing', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(harness(_controlled(log)));
      await tester.pumpWidget(
        harness(_controlled(log, selected: 'notes', expanded: {'docs'})),
      );
      expect(find.text('Notes'), findsOneWidget);
      expect(_checked(tester, 'Notes'), isTrue);
      expect(log.selected, isEmpty);
      expect(log.expanded, isEmpty);

      await tester.tap(find.text('Videos'));
      await tester.pump();
      expect(log.selected, ['videos']);
      expect(_checked(tester, 'Videos'), isTrue);
      await tester.pumpWidget(
        harness(_controlled(log, selected: 'videos', expanded: {'docs'})),
      );
      await tester.tap(_twistie('Documents'));
      await tester.pumpAndSettle();
      expect(log.expanded, [<String>{}]);
      await tester.pumpWidget(harness(_controlled(log, selected: 'videos')));
      expect(log.selected, ['videos']);
      expect(log.expanded.length, 1);
      expect(find.text('Notes'), findsNothing);
    });

    testWidgets('uncontrolled: starts from the initial values and keeps its '
        'own state', (tester) async {
      final log = _Log();
      await tester.pumpWidget(
        harness(_tree(log, initialSelected: 'q1', initialExpanded: {'docs'})),
      );
      expect(find.text('Reports'), findsOneWidget);
      expect(find.text('First quarter'), findsNothing);
      await tester.tap(_twistie('Reports'));
      await tester.pumpAndSettle();
      expect(_checked(tester, 'First quarter'), isTrue);
      expect(log.expanded, [
        {'docs', 'reports'},
      ]);
    });

    testWidgets('callbacks are read when the action happens', (tester) async {
      final first = <String>[];
      final second = <String>[];
      Widget build(ValueChanged<String> onSelectionChanged) => harness(
        TreeView<String>.uncontrolled(
          label: 'Files',
          nodes: _nodes,
          onSelectionChanged: onSelectionChanged,
        ),
      );
      await tester.pumpWidget(build(first.add));
      await tester.pumpWidget(build(second.add));
      await tester.tap(find.text('Videos'));
      await tester.pump();
      expect(first, isEmpty);
      expect(second, ['videos']);
    });
  });

  group('lazy loading', () {
    testWidgets('opening an unloaded parent requests its children once and '
        'shows the loading status in a live region and as the hint', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final log = _Log();
      await tester.pumpWidget(harness(_controlled(log)));
      await focusOn(tester, find.text('Pictures'));
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.loads.length, 1);
      expect(log.loads.single.value, 'pictures');
      expect(log.expanded, [
        {'pictures'},
      ]);
      // The parent has not passed `loading` yet: the tree still asks once.
      await tester.tap(_twistie('Pictures'));
      await tester.pump();
      await tester.tap(_twistie('Pictures'));
      await tester.pump();
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.loads.length, 1);

      await tester.pumpWidget(
        harness(
          _controlled(log, expanded: {'pictures'}, loading: {'pictures'}),
        ),
      );
      expect(find.text('Loading Pictures…'), findsOneWidget);
      expect(
        tester.getSemantics(find.text('Loading Pictures…')),
        semanticsWith(label: 'Loading Pictures…', isLiveRegion: true),
      );
      expect(
        tester.getSemantics(find.text('Pictures')),
        semanticsWith(
          label: 'Pictures',
          hint: 'Loading Pictures…',
          hasExpandedState: true,
          isExpanded: true,
        ),
      );
      semantics.dispose();
    });

    testWidgets('a failure shows the error status in the danger role; the '
        'inline-end arrow and the chevron retry with a newer request id', (
      tester,
    ) async {
      final log = _Log();
      const error = 'Could not load Pictures. Press Right Arrow to retry.';
      await tester.pumpWidget(
        harness(
          _controlled(log, expanded: {'pictures'}, loadErrors: {'pictures'}),
        ),
      );
      expect(
        tester.widget<Text>(find.text(error)).style?.color,
        InvisibleColors.light.dangerText,
      );
      await focusOn(tester, find.text('Pictures'));
      await _key(tester, LogicalKeyboardKey.arrowRight);
      expect(log.loads.map((r) => r.value), ['pictures']);
      expect(find.text('Loading Pictures…'), findsOneWidget);
      expect(log.expanded, isEmpty, reason: 'a retry keeps the parent open');

      await tester.pumpWidget(
        harness(
          _controlled(log, expanded: {'pictures'}, loading: {'pictures'}),
        ),
      );
      await tester.pumpWidget(
        harness(
          _controlled(
            log,
            expanded: {'pictures'},
            loadErrors: {'pictures', 'docs'},
          ),
        ),
      );
      await tester.tap(_twistie('Pictures'));
      await tester.pump();
      expect(log.loads.length, 2);
      expect(log.loads[1].requestId, greaterThan(log.loads[0].requestId));
      expect(log.expanded, isEmpty);
      expect(log.selected, isEmpty);

      await tester.pumpWidget(
        harness(
          _controlled(log, expanded: {'pictures'}, nodes: _loadedPictures),
        ),
      );
      expect(find.text('Beach'), findsOneWidget);
      expect(find.textContaining('Pictures.'), findsNothing);
      expect(find.text('Loading Pictures…'), findsNothing);
    });
  });

  group('disabled', () {
    testWidgets('a disabled node is dimmed, takes no focus and no press', (
      tester,
    ) async {
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log)));
      await tester.tap(find.text('Music'), warnIfMissed: false);
      await pumpFocus(tester);
      expect(log.selected, isEmpty);
      expect(_focused(tester, 'Music'), isFalse);
      expect(
        tester
            .widget<Opacity>(
              find.descendant(
                of: _row('Music'),
                matching: find.byType(Opacity),
              ),
            )
            .opacity,
        0.5,
      );
    });

    testWidgets('a disabled tree has no tab stop, opens and selects nothing', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      final log = _Log();
      await tester.pumpWidget(harness(_tree(log, enabled: false)));
      await tester.tap(find.text('Videos'), warnIfMissed: false);
      await tester.tap(_twistie('Documents'), warnIfMissed: false);
      await pumpFocus(tester);
      expect(log.selected, isEmpty);
      expect(log.expanded, isEmpty);
      for (final label in ['Documents', 'Pictures', 'Videos']) {
        expect(
          tester.getSemantics(find.text(label)),
          semanticsWith(
            hasEnabledState: true,
            isEnabled: false,
            isFocusable: false,
          ),
        );
      }
      semantics.dispose();
    });
  });

  group('semantics and layout', () {
    testWidgets('rows carry selected, expanded only on parents, enabled and '
        'focus; each level is a list of list items named by the tree', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          _tree(_Log(), initialSelected: 'notes', initialExpanded: {'docs'}),
        ),
      );
      expect(tester.takeException(), isNull, reason: 'the role checks pass');
      expect(
        tester.getSemantics(find.text('Notes')),
        semanticsWith(
          label: 'Notes',
          hasSelectedState: true,
          isSelected: true,
          hasEnabledState: true,
          isEnabled: true,
          isFocusable: true,
          hasTapAction: true,
          hasExpandedState: false,
        ),
      );
      expect(
        tester.getSemantics(find.text('Documents')),
        semanticsWith(
          hasSelectedState: true,
          isSelected: false,
          hasExpandedState: true,
          isExpanded: true,
        ),
      );
      expect(
        tester.getSemantics(find.text('Pictures')),
        semanticsWith(hasExpandedState: true, isExpanded: false),
      );
      expect(
        tester.getSemantics(find.text('Music')),
        semanticsWith(hasEnabledState: true, isEnabled: false),
      );

      final notes = tester.getSemantics(find.text('Notes'));
      final item = notes.parent!;
      final level2 = item.parent!;
      final docsItem = level2.parent!;
      final tree = docsItem.parent!;
      expect(item.getSemanticsData().role, SemanticsRole.listItem);
      expect(level2.getSemanticsData().role, SemanticsRole.list);
      expect(level2.childrenCount, 3);
      expect(docsItem.getSemanticsData().role, SemanticsRole.listItem);
      expect(tree.getSemanticsData().role, SemanticsRole.list);
      expect(tree.label, 'Files');
      expect(tree.childrenCount, 4);

      await focusOn(tester, find.text('Notes'));
      expect(
        tester.getSemantics(find.text('Notes')),
        semanticsWith(isFocused: true),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline24));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('the focus ring shows on the focused row after keyboard use', (
      tester,
    ) async {
      useKeyboardHighlight();
      await tester.pumpWidget(harness(_tree(_Log())));
      await focusOn(tester, find.text('Documents'));
      await _key(tester, LogicalKeyboardKey.arrowDown);
      bool ring(String label) => tester
          .widget<FocusRingPainter>(
            find.descendant(
              of: _row(label),
              matching: find.byType(FocusRingPainter),
            ),
          )
          .visible;
      expect(ring('Pictures'), isTrue);
      expect(ring('Documents'), isFalse);
    });

    testWidgets('text scale 2.0 in a 320 pixel parent: nothing overflows and '
        'long labels end in an ellipsis', (tester) async {
      const nodes = [
        TreeNode(
          value: 'a',
          label: 'A folder with a rather long name that cannot fit',
          children: [
            TreeNode(
              value: 'b',
              label: 'Nested folder with another long name',
              hasChildren: true,
            ),
          ],
        ),
      ];
      await tester.pumpWidget(
        harness(
          SizedBox(
            width: 320,
            child: TreeView<String>(
              label: 'Files',
              nodes: nodes,
              selected: 'a',
              expanded: const {'a', 'b'},
              loading: const {'b'},
            ),
          ),
          textScale: 2,
        ),
      );
      expect(tester.takeException(), isNull);
      final label = tester.widget<Text>(find.textContaining('A folder'));
      expect(label.maxLines, 1);
      expect(label.overflow, TextOverflow.ellipsis);
      expect(
        tester.getRect(_row('Nested folder with another long name')).right,
        lessThanOrEqualTo(tester.getRect(find.byType(TreeView<String>)).right),
      );
    });

    testWidgets('every row and chevron keeps 44 by 44 under touch', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          _tree(_Log(), initialExpanded: {'docs'}),
          theme: InvisibleThemeData.light().copyWith(
            density: InvisibleDensity.touch,
          ),
        ),
      );
      await expectLater(tester, meetsGuideline(targetGuideline44));
      expect(tester.getSize(_twistie('Documents')).width, lessThan(44));
      final chevron = find.ancestor(
        of: _twistie('Documents'),
        matching: find.byType(GestureDetector),
      );
      expect(tester.getSize(chevron.first).width, greaterThanOrEqualTo(44));
      semantics.dispose();
    });

    testWidgets('the chevron turns a quarter while open, instantly under '
        'reduced motion', (tester) async {
      await tester.pumpWidget(harness(_tree(_Log())));
      await tester.tap(_twistie('Documents'));
      await tester.pump();
      expect(_turns(tester, 'Documents'), 0.25);
      expect(tester.hasRunningAnimations, isTrue);
      await tester.pumpAndSettle();

      await tester.pumpWidget(const SizedBox());
      await tester.pumpWidget(harness(_tree(_Log()), disableAnimations: true));
      await tester.tap(_twistie('Documents'));
      await tester.pump();
      expect(_turns(tester, 'Documents'), 0.25);
      expect(tester.hasRunningAnimations, isFalse);
    });
  });
}
