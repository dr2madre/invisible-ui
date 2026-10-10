// semantics.dart exports SemanticsRole only in releases after Flutter 3.32.
// ignore: unnecessary_import
import 'dart:ui' show SemanticsRole;

import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';
import 'package:invisible_ui/src/sidebar/sidebar_item.dart'
    show resolveSectionIds;

import 'harness.dart';

const Widget _icon = Glyph(GlyphShape.home);

List<SidebarSection<String>> _sections({bool icons = true}) => [
  SidebarSection(
    label: 'Workspace',
    items: [
      SidebarItem(
        value: 'home',
        label: 'Home',
        icon: icons ? _icon : null,
        uri: Uri.parse('/home'),
      ),
      SidebarItem(value: 'inbox', label: 'Inbox', icon: icons ? _icon : null),
    ],
  ),
  SidebarSection.collapsible(
    id: 'projects',
    label: 'Projects',
    items: [
      SidebarItem(value: 'alpha', label: 'Alpha', icon: icons ? _icon : null),
      SidebarItem(value: 'beta', label: 'Beta', icon: icons ? _icon : null),
    ],
  ),
  SidebarSection.collapsible(
    id: 'settings',
    label: 'Settings',
    initiallyExpanded: true,
    items: [
      SidebarItem(
        value: 'profile',
        label: 'Profile',
        icon: icons ? _icon : null,
      ),
    ],
  ),
];

Widget _sidebar({
  List<SidebarSection<String>>? sections,
  String? value = 'home',
  String? label,
  ValueChanged<String>? onSelected,
  bool collapsed = false,
  ValueChanged<bool>? onCollapsedChanged,
  Set<String>? expandedSections,
  ValueChanged<Set<String>>? onExpandedSectionsChanged,
  Widget? footer,
  TextDirection direction = TextDirection.ltr,
  bool disableAnimations = false,
}) => harness(
  Sidebar<String>(
    sections: sections ?? _sections(),
    value: value,
    label: label,
    onSelected: onSelected,
    collapsed: collapsed,
    onCollapsedChanged: onCollapsedChanged,
    expandedSections: expandedSections,
    onExpandedSectionsChanged: onExpandedSectionsChanged,
    footer: footer,
  ),
  direction: direction,
  disableAnimations: disableAnimations,
);

final Finder _projects = find.text('PROJECTS');

bool _shows(String text) => find.text(text).hitTestable().evaluate().isNotEmpty;

/// The nearest ancestor with a role.
SemanticsNode _withRole(SemanticsNode node) {
  var parent = node.parent!;
  while (parent.getSemanticsData().role == SemanticsRole.none) {
    parent = parent.parent!;
  }
  return parent;
}

void main() {
  testWidgets('every destination reports its value; a link takes Enter, a '
      'button Enter and Space; the callback is read when pressed', (
    tester,
  ) async {
    final selected = <String>[];
    await tester.pumpWidget(_sidebar(onSelected: selected.add));
    await tester.tap(find.text('Home'));
    await tester.tap(find.text('Inbox'));
    await focusOn(tester, find.text('Home'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await focusOn(tester, find.text('Inbox'));
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    expect(selected, ['home', 'inbox', 'home', 'inbox', 'inbox']);

    final replaced = <String>[];
    await tester.pumpWidget(_sidebar(onSelected: replaced.add));
    await tester.tap(find.text('Profile'));
    expect(replaced, ['profile']);
    expect(selected, hasLength(5));
  });

  testWidgets('Tab moves through the destinations in order, with no roving', (
    tester,
  ) async {
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) => _sidebar(),
      ),
    );
    await focusOn(tester, find.text('Home'));
    for (final next in ['Inbox', 'PROJECTS', 'SETTINGS', 'Profile']) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text(next)), isTrue, reason: next);
    }
  });

  testWidgets('semantics: a container named from the catalog; sections are '
      'lists; the current destination is read as the current page; links '
      'carry their address', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(_sidebar());
    expect(tester.takeException(), isNull, reason: 'the role checks pass');
    expect(find.bySemanticsLabel('Main'), findsOneWidget);
    final home = tester.getSemantics(find.text('Home'));
    expect(home, semanticsWith(label: 'Home', value: 'current page'));
    expect(home.getSemanticsData().linkUrl, Uri.parse('/home'));
    // The flag API Flutter 3.32 has; later releases add flagsCollection.
    // ignore: deprecated_member_use
    expect(home.getSemanticsData().hasFlag(SemanticsFlag.isLink), isTrue);
    final inbox = tester.getSemantics(find.text('Inbox'));
    expect(inbox, semanticsWith(label: 'Inbox', isButton: true));
    expect(inbox.value, isEmpty);
    final list = _withRole(_withRole(home));
    expect(list.getSemanticsData().role, SemanticsRole.list);
    expect(list.label, 'Workspace', reason: 'the heading names the list');
    expect(
      tester.getSemantics(_projects),
      semanticsWith(
        label: 'Projects',
        isButton: true,
        hasExpandedState: true,
        isExpanded: false,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));
    await expectLater(tester, meetsGuideline(textContrastGuideline));

    await tester.pumpWidget(_sidebar(label: 'Project navigation'));
    expect(find.bySemanticsLabel('Project navigation'), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('left to itself: initially expanded sections open; a press '
      'toggles a section and reports the set', (tester) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(_sidebar(onExpandedSectionsChanged: reports.add));
    expect(_shows('Profile'), isTrue);
    expect(_shows('Alpha'), isFalse);
    await tester.tap(_projects);
    await tester.pump();
    expect(_shows('Alpha'), isTrue);
    await tester.tap(_projects);
    await tester.pump();
    expect(_shows('Alpha'), isFalse);
    expect(reports, [
      {'settings', 'projects'},
      {'settings'},
    ]);
  });

  testWidgets('left to itself: the section holding the current destination '
      'opens silently, when the value moves and when the sections change', (
    tester,
  ) async {
    final reports = <Set<String>>[];
    await tester.pumpWidget(
      _sidebar(value: 'beta', onExpandedSectionsChanged: reports.add),
    );
    expect(_shows('Alpha'), isTrue, reason: 'it starts open');
    await tester.tap(_projects);
    await tester.pump();
    expect(_shows('Alpha'), isFalse);
    await tester.pumpWidget(
      _sidebar(value: 'alpha', onExpandedSectionsChanged: reports.add),
    );
    expect(_shows('Alpha'), isFalse, reason: 'the same section holds it');
    await tester.pumpWidget(
      _sidebar(value: 'home', onExpandedSectionsChanged: reports.add),
    );
    await tester.pumpWidget(
      _sidebar(value: 'alpha', onExpandedSectionsChanged: reports.add),
    );
    expect(_shows('Alpha'), isTrue, reason: 'the holder changed');

    final moved = [
      ..._sections(),
      const SidebarSection<String>.collapsible(
        id: 'archive',
        label: 'Archive',
        items: [SidebarItem(value: 'old', label: 'Old', icon: _icon)],
      ),
    ];
    await tester.pumpWidget(
      _sidebar(value: 'old', onExpandedSectionsChanged: reports.add),
    );
    await tester.pumpWidget(
      _sidebar(
        value: 'old',
        sections: moved,
        onExpandedSectionsChanged: reports.add,
      ),
    );
    expect(_shows('Old'), isTrue, reason: 'the sections moved it');
    expect(reports, [
      {'settings'},
    ]);
  });

  testWidgets('owned by the app: a press only reports; the value moving '
      'opens nothing; handing back null continues from the set on screen', (
    tester,
  ) async {
    final reports = <Set<String>>[];
    Widget build(Set<String>? expanded, {String value = 'home'}) => _sidebar(
      value: value,
      expandedSections: expanded,
      onExpandedSectionsChanged: reports.add,
    );
    await tester.pumpWidget(build(const {}));
    expect(_shows('Profile'), isFalse, reason: 'the app set wins');
    await tester.tap(_projects);
    await tester.pump();
    expect(_shows('Alpha'), isFalse);
    expect(reports, [
      {'projects'},
    ]);
    await tester.pumpWidget(build(const {}, value: 'beta'));
    expect(_shows('Alpha'), isFalse);
    await tester.pumpWidget(build(const {'projects'}, value: 'beta'));
    expect(_shows('Alpha'), isTrue);

    await tester.pumpWidget(build(null, value: 'beta'));
    expect(_shows('Alpha'), isTrue, reason: 'the set on screen');
    expect(_shows('Profile'), isFalse);
    await tester.tap(find.text('SETTINGS'));
    await tester.pump();
    expect(_shows('Profile'), isTrue);
    expect(reports, [
      {'projects'},
      {'projects', 'settings'},
    ]);
  });

  testWidgets('the rail toggle reports the state it asks for, says whether '
      'the sidebar is collapsed and points the way it will go', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <bool>[];
    await tester.pumpWidget(_sidebar(onCollapsedChanged: reports.add));
    final collapse = find.bySemanticsLabel('Collapse the navigation');
    expect(
      tester.getSemantics(collapse),
      semanticsWith(isButton: true, hasToggledState: true, isToggled: false),
    );
    Glyph glyphOf(Finder toggle) => tester.widget<Glyph>(
      find.descendant(of: toggle, matching: find.byType(Glyph)),
    );
    expect(glyphOf(collapse).shape, GlyphShape.chevronStart);
    await tester.tap(collapse);
    await tester.pumpWidget(
      _sidebar(collapsed: true, onCollapsedChanged: reports.add),
    );
    final expand = find.bySemanticsLabel('Expand the navigation');
    expect(
      tester.getSemantics(expand),
      semanticsWith(isButton: true, hasToggledState: true, isToggled: true),
    );
    expect(glyphOf(expand).shape, GlyphShape.chevronEnd);
    await focusOn(
      tester,
      find.descendant(of: expand, matching: find.byType(Glyph)),
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    expect(reports, [true, false]);
    semantics.dispose();
  });

  testWidgets('the rail: 56 wide, labels and headings leave the screen and '
      'stay in semantics, each destination has a tooltip at the end', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(_sidebar(collapsed: true));
    expect(tester.getSize(find.byType(Sidebar<String>)).width, 56);
    for (final text in ['Home', 'Inbox', 'WORKSPACE', 'SETTINGS']) {
      expect(find.text(text), findsNothing, reason: text);
    }
    final home = tester.getSemantics(find.bySemanticsLabel('Home'));
    expect(home, semanticsWith(value: 'current page', tooltip: 'Home'));
    expect(_withRole(_withRole(home)).label, 'Workspace');
    expect(find.bySemanticsLabel('Settings'), findsOneWidget);
    final tooltips = tester.widgetList<Tooltip>(find.byType(Tooltip));
    expect(tooltips.map((tooltip) => tooltip.message), [
      'Home',
      'Inbox',
      'Profile',
    ]);
    expect(
      tooltips.every((tip) => tip.placement == TooltipPlacement.end),
      isTrue,
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(targetGuideline24));

    final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
    addTearDown(mouse.removePointer);
    await mouse.addPointer(location: Offset.zero);
    await mouse.moveTo(tester.getCenter(find.byType(Glyph).first));
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Home'), findsOneWidget, reason: 'the tooltip shows');
    semantics.dispose();
  });

  testWidgets('no rail without an icon on every destination: no toggle, and '
      'a collapsed sidebar fails an assertion', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _sidebar(sections: _sections(icons: false), onCollapsedChanged: (_) {}),
    );
    expect(find.bySemanticsLabel('Collapse the navigation'), findsNothing);
    await tester.pumpWidget(
      _sidebar(sections: _sections(icons: false), collapsed: true),
    );
    expect(tester.takeException(), isA<AssertionError>());
    semantics.dispose();
  });

  testWidgets('a section pressed in the rail expands the sidebar and opens '
      'the section, reporting both once', (tester) async {
    final log = <Object>[];
    await tester.pumpWidget(
      _sidebar(
        collapsed: true,
        onCollapsedChanged: log.add,
        onExpandedSectionsChanged: log.add,
      ),
    );
    await tester.tap(find.bySemanticsLabel('Projects'));
    await tester.pump();
    expect(log, [
      false,
      {'settings', 'projects'},
    ]);
    log.clear();
    await tester.tap(find.bySemanticsLabel('Settings'));
    await tester.pump();
    expect(log, [false], reason: 'an open section stays open');
  });

  testWidgets('section ids: a missing or repeated id fails an assertion; '
      'the fallback is deterministic and never shared', (tester) async {
    const plain = SidebarSection<String>(items: []);
    SidebarSection<String> group(String id) =>
        SidebarSection.collapsible(id: id, label: 'Group', items: const []);
    final resolved = resolveSectionIds([
      plain,
      group('a'),
      group(''),
      group('a'),
      group('a'),
      group('0'),
    ]);
    expect(resolved.ids, ['0', 'a', '2', 'a#2', 'a#3', '0#2']);
    expect(resolved.mistakes, hasLength(4));
    expect(resolveSectionIds(_sections()).mistakes, isEmpty);

    await tester.pumpWidget(_sidebar(sections: [group('a'), group('a')]));
    expect(tester.takeException(), isA<AssertionError>());
  });

  testWidgets('bounded height: the sections scroll and the footer sits at '
      'the bottom; unbounded: a plain column', (tester) async {
    const footer = Text('Signed in as Ada');
    await tester.pumpWidget(
      harness(
        SizedBox(
          height: 500,
          child: Sidebar<String>(sections: _sections(), footer: footer),
        ),
      ),
    );
    final box = tester.getRect(find.byType(Sidebar<String>));
    expect(box.height, 500);
    expect(
      tester.getBottomLeft(find.text('Signed in as Ada')).dy,
      moreOrLessEquals(box.bottom - 13, epsilon: 1),
    );
    expect(find.byType(SingleChildScrollView), findsOneWidget);

    await tester.pumpWidget(
      harness(
        SingleChildScrollView(
          child: Sidebar<String>(sections: _sections(), footer: footer),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(Sidebar<String>)).height, lessThan(500));
  });

  testWidgets('right to left at text scale 2.0 in a 320 wide parent: long '
      'labels wrap with no overflow; 44 by 44 targets under touch', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 320,
          child: Sidebar<String>(
            value: 'long',
            sections: [
              ..._sections(),
              const SidebarSection(
                label: 'Reports',
                items: [
                  SidebarItem(
                    value: 'long',
                    label: 'Quarterly revenue by region and channel',
                    icon: _icon,
                  ),
                ],
              ),
            ],
            onCollapsedChanged: (_) {},
          ),
        ),
        direction: TextDirection.rtl,
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(
      tester.getSize(find.byType(Sidebar<String>)).width,
      320,
      reason: 'the rem width grows with the text, up to the parent',
    );
    final label = find.text('Quarterly revenue by region and channel');
    expect(tester.getSize(label).height, greaterThan(60), reason: 'it wraps');
    expect(
      tester
          .getCenter(
            find.descendant(
              of: find
                  .ancestor(of: find.text('Home'), matching: find.byType(Row))
                  .first,
              matching: find.byType(Glyph),
            ),
          )
          .dx,
      greaterThan(tester.getCenter(find.text('Home')).dx),
      reason: 'the icon sits at the inline-start, the right',
    );
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('the rail right to left at text scale 2.0 under touch: no '
      'overflow, 44 by 44 targets', (tester) async {
    await tester.pumpWidget(
      harness(
        Sidebar<String>(
          sections: _sections(),
          value: 'home',
          collapsed: true,
          onCollapsedChanged: (_) {},
        ),
        direction: TextDirection.rtl,
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(tester.getSize(find.byType(Sidebar<String>)).width, 112);
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    semantics.dispose();
  });

  testWidgets('the heading chevron turns a quarter turn toward the content, '
      'mirrored right to left, at once under reduced motion', (tester) async {
    for (final direction in TextDirection.values) {
      await tester.pumpWidget(
        _sidebar(direction: direction, disableAnimations: true),
      );
      final turns = [
        for (final rotation in tester.widgetList<AnimatedRotation>(
          find.byType(AnimatedRotation),
        ))
          (rotation.turns, rotation.duration),
      ];
      final quarter = direction == TextDirection.ltr ? 0.25 : -0.25;
      expect(turns, [(0.0, Duration.zero), (quarter, Duration.zero)]);
    }
  });
}
