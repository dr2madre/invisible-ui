import 'dart:async';

import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

// The badges and the unavailable destinations a Sidebar takes from a
// NavigationBar's destination list (docs/navigation-bar-spec.md, "Relation
// to Sidebar").

const Widget _icon = Glyph(GlyphShape.home);
const String _reason = 'Ask an administrator for access';

List<SidebarSection<String>> _sections({
  NavigationBadge? inbox = const NavigationBadge(
    label: '3 unread',
    content: '3',
  ),
}) => [
  SidebarSection(
    items: [
      const SidebarItem(value: 'home', label: 'Home', icon: _icon),
      SidebarItem(value: 'inbox', label: 'Inbox', icon: _icon, badge: inbox),
      const SidebarItem(
        value: 'profile',
        label: 'Profile',
        icon: _icon,
        badge: NavigationBadge(label: 'Needs attention'),
      ),
      SidebarItem.fromDestination(
        NavigationDestination(
          value: 'reports',
          label: 'Reports',
          icon: _icon,
          uri: Uri.parse('/reports'),
          unavailableReason: _reason,
        ),
      ),
    ],
  ),
];

Widget _sidebar({
  List<SidebarSection<String>>? sections,
  String? value = 'home',
  ValueChanged<String>? onSelected,
  bool collapsed = false,
  ModalObserver? modals,
}) => Sidebar<String>(
  sections: sections ?? _sections(),
  value: value,
  onSelected: onSelected,
  collapsed: collapsed,
  onCollapsedChanged: (_) {},
  modals: modals,
);

SemanticsNode _node(WidgetTester tester, String label) =>
    tester.getSemantics(find.bySemanticsLabel(label));

void main() {
  group('semantics', () {
    testWidgets('the badge text is part of the name', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_sidebar()));
      expect(_node(tester, 'Inbox, 3 unread'), isNotNull);
      expect(_node(tester, 'Profile, Needs attention'), isNotNull);
      semantics.dispose();
    });

    testWidgets('an unavailable destination is focusable, disabled, and reads '
        'its reason as the hint', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_sidebar()));
      expect(
        _node(tester, 'Reports'),
        semanticsWith(
          label: 'Reports',
          hint: _reason,
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: true,
          hasTapAction: false,
        ),
      );
      semantics.dispose();
    });

    testWidgets('the rail keeps the badge in the name and the reason in the '
        'hint', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_sidebar(collapsed: true)));
      expect(find.text('Inbox'), findsNothing, reason: 'the label is hidden');
      expect(
        _node(tester, 'Inbox, 3 unread'),
        semanticsWith(label: 'Inbox, 3 unread', tooltip: 'Inbox'),
      );
      expect(_node(tester, 'Reports'), semanticsWith(hint: _reason));
      semantics.dispose();
    });
  });

  group('activation', () {
    testWidgets('a tap, Enter or Space on an unavailable destination does '
        'nothing; Tab still reaches it', (tester) async {
      final selected = <String>[];
      await tester.pumpWidget(harness(_sidebar(onSelected: selected.add)));
      await tester.tap(find.text('Reports'));
      await tester.pump();
      expect(selected, isEmpty);

      for (var i = 0; i < 4; i++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      }
      await pumpFocus(tester);
      final focus = FocusManager.instance.primaryFocus;
      expect(
        find.ancestor(
          of: find.text('Reports'),
          matching: find.byWidgetPredicate(
            (widget) => widget is Focus && widget.focusNode == focus,
          ),
        ),
        findsWidgets,
        reason: 'the unavailable destination is in the focus order',
      );
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(selected, isEmpty);

      await tester.tap(find.text('Inbox'));
      expect(selected, ['inbox']);
    });
  });

  group('look and layout', () {
    testWidgets('a count, a dot, a lock and the reason under the label', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_sidebar()));
      expect(find.text('3'), findsOneWidget);
      expect(find.text(_reason), findsOneWidget);
      expect(
        tester.getTopLeft(find.text(_reason)).dy,
        greaterThan(tester.getTopLeft(find.text('Reports')).dy),
      );
      expect(
        find.byWidgetPredicate(
          (widget) => widget is Glyph && widget.shape == GlyphShape.lock,
        ),
        findsOneWidget,
      );
    });

    testWidgets('the rail shows the badge on the icon and marks the current '
        'destination with a bar, not by colour alone', (tester) async {
      await tester.pumpWidget(harness(_sidebar(collapsed: true)));
      // The count sits at the icon's inline-end top corner.
      final icon = tester.getRect(
        find.descendant(
          of: find
              .ancestor(of: find.text('3'), matching: find.byType(Stack))
              .first,
          matching: find.byType(Glyph),
        ),
      );
      final count = tester.getRect(find.text('3'));
      expect(count.left, greaterThan(icon.center.dx));
      expect(count.top, lessThan(icon.center.dy));
      final marks = find.byWidgetPredicate(
        (widget) => widget is Container && widget.foregroundDecoration != null,
      );
      expect(marks, findsOneWidget, reason: 'only the current destination');
      expect(
        find.ancestor(of: marks, matching: find.bySemanticsLabel('Home')),
        findsOneWidget,
        reason: 'Home, the first destination, is current',
      );
    });

    testWidgets('the rail tooltip gives back the name and the reason', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_sidebar(collapsed: true)));
      expect(
        _node(tester, 'Reports').tooltip,
        'Reports: Ask an administrator for access',
      );
      semantics.dispose();
    });

    testWidgets('text scale 2.0 in a narrow column: labels and reasons wrap, '
        'nothing overflows', (tester) async {
      await tester.pumpWidget(
        harness(SizedBox(width: 200, child: _sidebar()), textScale: 2),
      );
      expect(tester.takeException(), isNull);
      final line = tester.getSize(find.text('Home')).height;
      expect(
        tester.getSize(find.text(_reason)).height,
        greaterThan(line),
        reason: 'the reason wraps onto more lines',
      );
    });

    testWidgets('high contrast borders the badge', (tester) async {
      await tester.pumpWidget(harness(_sidebar(), highContrast: true));
      final dot = tester.widget<Container>(
        find
            .byWidgetPredicate(
              (widget) =>
                  widget is Container &&
                  widget.decoration is BoxDecoration &&
                  (widget.decoration! as BoxDecoration).shape ==
                      BoxShape.circle,
            )
            .first,
      );
      expect((dot.decoration! as BoxDecoration).border, isNotNull);
    });

    testWidgets('targets, names and contrast pass the guidelines', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_sidebar()));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline24));
      await tester.pumpWidget(
        harness(
          _sidebar(),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(targetGuideline44));
      semantics.dispose();
    });
  });

  group('badge announcements', () {
    testWidgets('once per change, none on first build, none with announce '
        'false', (tester) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(
        harness(_sidebar(sections: _sections(inbox: null))),
      );
      await tester.pump();
      expect(log, isEmpty, reason: 'nothing on first build');

      await tester.pumpWidget(harness(_sidebar()));
      await tester.pump();
      expect(log, [(message: 'Inbox: 3 unread', assertive: false)]);

      await tester.pumpWidget(
        harness(
          _sidebar(
            sections: _sections(
              inbox: const NavigationBadge(
                label: '4 unread',
                content: '4',
                announce: false,
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(log, hasLength(1), reason: 'announce false is silent');
    });

    testWidgets('held while a modal is open, made after it closes', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      await tester.pumpWidget(
        harness(_sidebar(sections: _sections(inbox: null), modals: modals)),
      );
      final release = modals.hold();
      await tester.pumpWidget(harness(_sidebar(modals: modals)));
      await tester.pump();
      expect(log, isEmpty);
      release();
      await tester.pump();
      expect(log, [(message: 'Inbox: 3 unread', assertive: false)]);
    });

    testWidgets('a sidebar in its own drawer announces: that modal is on '
        'screen', (tester) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      final badge = ValueNotifier<NavigationBadge?>(null);
      addTearDown(badge.dispose);
      await tester.pumpWidget(
        appHarness((context) => const SizedBox.shrink(), observers: [modals]),
      );
      unawaited(
        showSidebarDrawer<String>(
          context: tester.element(find.byType(SizedBox).first),
          builder: (context) => ValueListenableBuilder(
            valueListenable: badge,
            builder: (context, value, _) => _sidebar(
              sections: _sections(inbox: value),
              modals: modals,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(modals.hasModal, isTrue);
      badge.value = const NavigationBadge(label: '1 unread', content: '1');
      await tester.pumpAndSettle();
      expect(log, [(message: 'Inbox: 1 unread', assertive: false)]);
    });
  });
}
