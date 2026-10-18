import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';
import 'package:invisible_ui/src/internal/glyphs.dart';

import 'harness.dart';

const Widget _icon = Glyph(GlyphShape.home);

List<NavigationDestination<String>> _destinations({
  NavigationBadge? profileBadge = const NavigationBadge(
    label: 'Needs attention',
  ),
  bool projectsUnavailable = true,
}) => [
  NavigationDestination(
    value: 'home',
    label: 'Home',
    icon: _icon,
    uri: Uri.parse('/home'),
  ),
  const NavigationDestination(
    value: 'clients',
    label: 'Clients',
    icon: _icon,
    badge: NavigationBadge(label: '3 unread', content: '3'),
  ),
  NavigationDestination(
    value: 'projects',
    label: 'Projects',
    icon: _icon,
    unavailableReason: projectsUnavailable ? 'Available online only' : null,
  ),
  const NavigationDestination(value: 'hours', label: 'Hours', icon: _icon),
  NavigationDestination(
    value: 'profile',
    label: 'Profile',
    icon: _icon,
    badge: profileBadge,
  ),
];

Widget _bar({
  List<NavigationDestination<String>>? destinations,
  String? value = 'hours',
  String? label,
  ValueChanged<String>? onSelected,
  NavigationBarSemanticsProfile? profile,
  ModalObserver? modals,
}) => NavigationBar<String>(
  destinations: destinations ?? _destinations(),
  value: value,
  label: label,
  onSelected: onSelected,
  semanticsProfile: profile,
  modals: modals,
);

/// The bar at the bottom of a 320 wide column, as an app places it.
Widget _placed(Widget bar, {double width = 320}) =>
    SizedBox(width: width, child: bar);

SemanticsNode _node(WidgetTester tester, String label) =>
    tester.getSemantics(find.bySemanticsLabel(label));

/// The visible label of a destination: inside its focus node.
Finder _label(String label) => find.text(label).last;

/// The focusable area of the destination named [label].
Finder _destination(String label) => find.ancestor(
  of: find.text(label).last,
  matching: find.byType(FocusableActionDetector),
);

void main() {
  group('semantics', () {
    testWidgets('a tab bar on iOS and Android: tab role, selected, position '
        'and badge in the name, the reason as the hint', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_placed(_bar())));
      expect(tester.takeException(), isNull, reason: 'the role checks pass');

      final hours = _node(tester, 'Hours, Tab 4 of 5');
      expect(hours.getSemanticsData().role, SemanticsRole.tab);
      expect(
        hours,
        semanticsWith(
          isButton: true,
          hasSelectedState: true,
          isSelected: true,
          hasEnabledState: true,
          isEnabled: true,
          isFocusable: true,
          hasTapAction: true,
        ),
      );
      expect(hours.indexInParent, 3);

      final bar = hours.parent!;
      expect(bar.getSemanticsData().role, SemanticsRole.tabBar);
      expect(bar.label, 'Main');
      expect(bar.childrenCount, 5);

      expect(
        _node(tester, 'Home, Tab 1 of 5'),
        semanticsWith(
          isButton: true,
          hasSelectedState: true,
          isSelected: false,
          hasTapAction: true,
        ),
      );
      expect(
        _node(tester, 'Clients, 3 unread, Tab 2 of 5'),
        semanticsWith(isButton: true),
      );
      expect(
        _node(tester, 'Profile, Needs attention, Tab 5 of 5'),
        semanticsWith(isButton: true),
      );
      final projects = _node(tester, 'Projects, Tab 3 of 5');
      expect(
        projects,
        semanticsWith(
          hint: 'Available online only',
          hasEnabledState: true,
          isEnabled: false,
          isFocusable: true,
        ),
      );
      expect(
        projects.getSemanticsData().hasAction(SemanticsAction.tap),
        isFalse,
      );
      // The icon and the badge glyph add nothing: the count "3" is not read.
      expect(find.bySemanticsLabel('3'), findsNothing);
      semantics.dispose();
    });

    testWidgets('a navigation list on desktop: navigation and list roles, '
        'links with their address, the current page as the value', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
      await tester.pumpWidget(harness(_placed(_bar(label: 'Sections'))));
      expect(tester.takeException(), isNull, reason: 'the role checks pass');

      final hours = _node(tester, 'Hours');
      expect(
        hours,
        semanticsWith(
          value: 'current page',
          isButton: true,
          hasSelectedState: true,
          isSelected: true,
          isEnabled: true,
          hasTapAction: true,
        ),
      );
      final item = hours.parent!;
      expect(item.getSemanticsData().role, SemanticsRole.listItem);
      final list = item.parent!;
      expect(list.getSemanticsData().role, SemanticsRole.list);
      final navigation = list.parent!;
      expect(navigation.getSemanticsData().role, SemanticsRole.navigation);
      expect(navigation.label, 'Sections');

      final home = _node(tester, 'Home');
      expect(home.getSemanticsData().flagsCollection.isLink, isTrue);
      expect(home.getSemanticsData().linkUrl, Uri.parse('/home'));
      expect(home, semanticsWith(isButton: false, hasSelectedState: false));
      expect(home.value, isEmpty);
      expect(_node(tester, 'Profile, Needs attention'), semanticsWith());
      expect(
        _node(tester, 'Projects'),
        semanticsWith(hint: 'Available online only', isEnabled: false),
      );
      debugDefaultTargetPlatformOverride = null;
      semantics.dispose();
    });

    testWidgets('the profile follows the app when it passes one', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          _placed(_bar(profile: NavigationBarSemanticsProfile.navigationList)),
        ),
      );
      expect(_node(tester, 'Hours'), semanticsWith(value: 'current page'));
      debugDefaultTargetPlatformOverride = TargetPlatform.windows;
      await tester.pumpWidget(
        harness(_placed(_bar(profile: NavigationBarSemanticsProfile.tabBar))),
      );
      expect(_node(tester, 'Hours, Tab 4 of 5'), semanticsWith(isButton: true));
      debugDefaultTargetPlatformOverride = null;
      semantics.dispose();
    });

    testWidgets('a value that names no destination marks nothing current', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_placed(_bar(value: 'settings'))));
      for (final label in [
        'Home, Tab 1 of 5',
        'Hours, Tab 4 of 5',
        'Projects, Tab 3 of 5',
      ]) {
        expect(_node(tester, label), semanticsWith(isSelected: false));
      }
      semantics.dispose();
    });

    testWidgets('targets, names and contrast pass the guidelines', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(harness(_placed(_bar())));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      await expectLater(tester, meetsGuideline(targetGuideline24));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      await tester.pumpWidget(
        harness(_placed(_bar()), theme: InvisibleThemeData.dark()),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      semantics.dispose();
    });

    testWidgets('44 by 44 targets under touch', (tester) async {
      final semantics = tester.ensureSemantics();
      await tester.pumpWidget(
        harness(
          _placed(_bar()),
          theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
        ),
      );
      await expectLater(tester, meetsGuideline(targetGuideline44));
      for (final label in ['Home', 'Projects', 'Profile']) {
        final size = tester.getSize(_destination(label));
        expect(size.width, greaterThanOrEqualTo(44));
        expect(size.height, greaterThanOrEqualTo(44));
      }
      semantics.dispose();
    });
  });

  group('activation', () {
    testWidgets('every press reports once, the current destination again; '
        'an unavailable one never', (tester) async {
      final semantics = tester.ensureSemantics();
      final log = <String>[];
      await tester.pumpWidget(harness(_placed(_bar(onSelected: log.add))));

      await tester.tap(_label('Clients'));
      await tester.tap(_label('Hours'));
      await tester.tap(_label('Projects'));
      expect(log, ['clients', 'hours']);

      tester.semantics.tap(find.semantics.byLabel('Home, Tab 1 of 5'));
      expect(log, ['clients', 'hours', 'home']);

      await focusOn(tester, _label('Projects'));
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      expect(log, ['clients', 'hours', 'home']);
      semantics.dispose();
    });

    testWidgets('the callback is read when pressed', (tester) async {
      final first = <String>[];
      final second = <String>[];
      await tester.pumpWidget(harness(_placed(_bar(onSelected: first.add))));
      await tester.pumpWidget(harness(_placed(_bar(onSelected: second.add))));
      await tester.tap(_label('Home'));
      expect(first, isEmpty);
      expect(second, ['home']);
    });

    testWidgets('a long press does nothing on an available destination', (
      tester,
    ) async {
      final log = <String>[];
      await tester.pumpWidget(harness(_placed(_bar(onSelected: log.add))));
      await tester.longPress(_label('Hours'));
      await tester.pump();
      expect(log, isEmpty);
    });
  });

  group('keyboard', () {
    testWidgets('Tab visits every destination in order, unavailable ones '
        'included, and leaves the bar', (tester) async {
      await tester.pumpWidget(
        appHarness(
          (context) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _placed(_bar()),
              Focus(child: Text('After', key: UniqueKey())),
            ],
          ),
        ),
      );
      final order = ['Home', 'Clients', 'Projects', 'Hours', 'Profile'];
      for (final label in order) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await pumpFocus(tester);
        expect(focusedOn(tester, _label(label)), isTrue, reason: label);
      }
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await pumpFocus(tester);
      expect(focusedOn(tester, find.text('After')), isTrue);

      await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
      await pumpFocus(tester);
      expect(focusedOn(tester, _label('Profile')), isTrue);
    });

    for (final direction in TextDirection.values) {
      testWidgets('arrows move focus, mirrored, with no wrap and no press '
          '(${direction.name})', (tester) async {
        final log = <String>[];
        await tester.pumpWidget(
          appHarness(
            (context) => _placed(_bar(onSelected: log.add)),
            direction: direction,
          ),
        );
        final forward = direction == TextDirection.ltr
            ? LogicalKeyboardKey.arrowRight
            : LogicalKeyboardKey.arrowLeft;
        final back = direction == TextDirection.ltr
            ? LogicalKeyboardKey.arrowLeft
            : LogicalKeyboardKey.arrowRight;

        await focusOn(tester, _label('Home'));
        await tester.sendKeyEvent(back);
        await pumpFocus(tester);
        expect(focusedOn(tester, _label('Home')), isTrue);

        for (final label in ['Clients', 'Projects', 'Hours', 'Profile']) {
          await tester.sendKeyEvent(forward);
          await pumpFocus(tester);
          expect(focusedOn(tester, _label(label)), isTrue);
        }
        await tester.sendKeyEvent(forward);
        await pumpFocus(tester);
        expect(focusedOn(tester, _label('Profile')), isTrue);

        await tester.sendKeyEvent(back);
        await pumpFocus(tester);
        expect(focusedOn(tester, _label('Hours')), isTrue);

        // Home and End are not handled.
        await tester.sendKeyEvent(LogicalKeyboardKey.home);
        await pumpFocus(tester);
        expect(focusedOn(tester, _label('Hours')), isTrue);
        expect(log, isEmpty);

        // In right-to-left text the first destination is at the right.
        final home = tester.getCenter(_destination('Home')).dx;
        final profile = tester.getCenter(_destination('Profile')).dx;
        expect(home < profile, direction == TextDirection.ltr);
      });
    }

    testWidgets('Enter presses every destination; Space presses a button '
        'and not a link', (tester) async {
      final log = <String>[];
      await tester.pumpWidget(
        appHarness((context) => _placed(_bar(onSelected: log.add))),
      );
      await focusOn(tester, _label('Hours'));
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      expect(log, ['hours', 'hours']);

      await focusOn(tester, _label('Home'));
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      expect(log, ['hours', 'hours']);
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      expect(log, ['hours', 'hours', 'home']);
    });

    testWidgets('the focus ring shows on keyboard focus only', (tester) async {
      await tester.pumpWidget(harness(_placed(_bar())));
      FocusManager.instance.highlightStrategy =
          FocusHighlightStrategy.alwaysTouch;
      await focusOn(tester, _label('Hours'));
      expect(_ringVisible(tester, 'Hours'), isFalse);
      useKeyboardHighlight();
      await pumpFocus(tester);
      expect(_ringVisible(tester, 'Hours'), isTrue);
      expect(_ringVisible(tester, 'Home'), isFalse);
    });
  });

  group('unavailable reason', () {
    testWidgets('a long press shows the reason until the finger lifts', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_placed(_bar())));
      expect(find.text('Available online only'), findsNothing);
      final gesture = await tester.startGesture(
        tester.getCenter(_label('Projects')),
      );
      await tester.pump(kLongPressTimeout + const Duration(milliseconds: 50));
      expect(find.text('Available online only'), findsOneWidget);
      await gesture.up();
      await tester.pump();
      expect(find.text('Available online only'), findsNothing);
    });

    testWidgets('keyboard focus shows the reason and Escape hides it', (
      tester,
    ) async {
      useKeyboardHighlight();
      await tester.pumpWidget(harness(_placed(_bar())));
      await focusOn(tester, _label('Projects'));
      expect(find.text('Available online only'), findsOneWidget);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      expect(find.text('Available online only'), findsNothing);

      // Leaving and coming back shows it again.
      await focusOn(tester, _label('Hours'));
      await focusOn(tester, _label('Projects'));
      expect(find.text('Available online only'), findsOneWidget);
    });

    testWidgets('the mouse resting on it shows the reason; leaving hides it', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_placed(_bar())));
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: Offset.zero);
      await mouse.moveTo(tester.getCenter(_label('Projects')));
      await tester.pump(const Duration(milliseconds: 350));
      expect(find.text('Available online only'), findsOneWidget);
      await mouse.moveTo(Offset.zero);
      await tester.pump(const Duration(milliseconds: 150));
      expect(find.text('Available online only'), findsNothing);
    });

    testWidgets('the app can replace the lock', (tester) async {
      await tester.pumpWidget(
        harness(
          _placed(
            NavigationBar<String>(
              destinations: _destinations(),
              unavailableIcon: const Text('!', key: Key('status')),
            ),
          ),
        ),
      );
      expect(find.byKey(const Key('status')), findsOneWidget);
      final lock = find.byWidgetPredicate(
        (widget) => widget is Glyph && widget.shape == GlyphShape.lock,
      );
      expect(lock, findsNothing);
    });
  });

  group('look and layout', () {
    testWidgets('text scale 2.0 at 320 wide: no overflow, labels wrap', (
      tester,
    ) async {
      await tester.pumpWidget(
        harness(
          _placed(
            _bar(
              destinations: [
                ..._destinations().take(4),
                const NavigationDestination(
                  value: 'settings',
                  label: 'Account settings',
                  icon: _icon,
                ),
              ],
            ),
          ),
          textScale: 2,
          direction: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      final label = tester.getSize(find.text('Account settings').last);
      // Two lines at least: the label wraps and is never cut.
      expect(label.height, greaterThan(12 * 2 * 1.2 * 1.5));
      final text = tester.widget<Text>(find.text('Account settings').last);
      expect(text.maxLines, isNull);
      expect(text.overflow, isNull);
      // Every destination takes an equal share and fills the bar's height.
      final heights = {
        for (final l in ['Home', 'Clients', 'Hours'])
          tester.getSize(_destination(l)).height,
      };
      expect(heights, hasLength(1));
      // Five shares of 320 with four gaps of 4.
      expect(tester.getSize(_destination('Home')).width, closeTo(60.8, 0.01));
    });

    testWidgets('the current state never changes the label width', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_placed(_bar(value: 'home'))));
      Size label() => tester.getSize(
        find
            .ancestor(of: find.text('Hours').last, matching: find.byType(Stack))
            .first,
      );
      final before = label();
      await tester.pumpWidget(harness(_placed(_bar())));
      expect(label(), before);
    });

    testWidgets('the current destination has an indicator and a bolder label; '
        'high contrast adds borders to the indicator and the dot', (
      tester,
    ) async {
      await tester.pumpWidget(harness(_placed(_bar())));
      final colors = InvisibleColors.light;
      BoxDecoration? indicator() => tester
          .widgetList<Container>(find.byType(Container))
          .map((c) => c.decoration)
          .whereType<BoxDecoration>()
          .where((d) => d.color == colors.navigationBarCurrentIndicator)
          .singleOrNull;
      BoxDecoration dot() => tester
          .widgetList<Container>(find.byType(Container))
          .map((c) => c.decoration)
          .whereType<BoxDecoration>()
          .singleWhere(
            (d) => d.color == colors.danger && d.shape == BoxShape.circle,
          );

      expect(indicator(), isNotNull);
      expect(indicator()!.border, isNull);
      expect(dot().border, isNull);
      final current = tester.widget<Text>(find.text('Hours').last);
      expect(current.style!.fontWeight, FontWeight.w600);
      expect(current.style!.color, colors.text);
      final other = tester.widget<Text>(find.text('Home').last);
      expect(other.style!.fontWeight, isNull);
      expect(other.style!.color, colors.textSecondary);
      final unavailable = tester.widget<Text>(find.text('Projects').last);
      expect(unavailable.style!.color, colors.textDisabled);

      await tester.pumpWidget(harness(_placed(_bar()), highContrast: true));
      expect(indicator()!.border, Border.all(color: colors.text, width: 2));
      expect(dot().border, Border.all(color: colors.text));

      await tester.pumpWidget(harness(_placed(_bar(value: null))));
      expect(indicator(), isNull);
    });

    testWidgets('the badge sits at the icon\'s inline-end top edge, the lock '
        'at its inline-end bottom corner, mirrored right to left', (
      tester,
    ) async {
      for (final direction in TextDirection.values) {
        await tester.pumpWidget(harness(_placed(_bar()), direction: direction));
        final ltr = direction == TextDirection.ltr;
        final icon = tester.getRect(
          find.descendant(
            of: _destination('Clients'),
            matching: find.byType(Glyph),
          ),
        );
        final badge = tester.getRect(find.text('3'));
        expect(
          ltr
              ? badge.center.dx > icon.center.dx
              : badge.center.dx < icon.center.dx,
          isTrue,
        );
        expect(badge.center.dy < icon.center.dy, isTrue);
        final lock = tester.getRect(
          find.byWidgetPredicate(
            (widget) => widget is Glyph && widget.shape == GlyphShape.lock,
          ),
        );
        final projects = tester.getRect(
          find.descendant(
            of: _destination('Projects'),
            matching: find.byWidgetPredicate(
              (widget) => widget is Glyph && widget.shape == GlyphShape.home,
            ),
          ),
        );
        expect(
          ltr
              ? lock.center.dx > projects.center.dx
              : lock.center.dx < projects.center.dx,
          isTrue,
        );
        expect(lock.center.dy > projects.center.dy, isTrue);
      }
    });

    testWidgets('the bar paints the surface colour and takes the hover tint '
        'under the mouse', (tester) async {
      await tester.pumpWidget(harness(_placed(_bar())));
      final colors = InvisibleColors.light;
      expect(
        tester
            .widgetList<DecoratedBox>(find.byType(DecoratedBox))
            .map((box) => box.decoration)
            .whereType<BoxDecoration>()
            .any((d) => d.color == colors.navigationBarBackground),
        isTrue,
      );
      bool tinted() => tester
          .widgetList<DecoratedBox>(find.byType(DecoratedBox))
          .map((box) => box.decoration)
          .whereType<BoxDecoration>()
          .any((d) => d.color == colors.stateHover);
      expect(tinted(), isFalse);
      final mouse = await tester.createGesture(kind: PointerDeviceKind.mouse);
      addTearDown(mouse.removePointer);
      await mouse.addPointer(location: Offset.zero);
      await mouse.moveTo(tester.getCenter(_label('Home')));
      await tester.pump();
      expect(tinted(), isTrue);
    });
  });

  group('consumer mistakes', () {
    testWidgets('a repeated value fails an assertion', (tester) async {
      await tester.pumpWidget(
        harness(
          _placed(
            _bar(
              destinations: const [
                NavigationDestination(value: 'a', label: 'A', icon: _icon),
                NavigationDestination(value: 'a', label: 'B', icon: _icon),
              ],
            ),
          ),
        ),
      );
      expect(tester.takeException(), isA<AssertionError>());
    });

    testWidgets('more than five destinations and a value that names none '
        'warn once in debug builds', (tester) async {
      final printed = <String>[];
      final previous = debugPrint;
      debugPrint = (message, {wrapWidth}) => printed.add(message ?? '');
      try {
        final six = [
          ..._destinations(),
          const NavigationDestination(
            value: 'more',
            label: 'More',
            icon: _icon,
          ),
        ];
        await tester.pumpWidget(
          harness(_placed(_bar(destinations: six, value: 'none'), width: 400)),
        );
        await tester.pumpWidget(
          harness(_placed(_bar(destinations: six, value: 'none'), width: 400)),
        );
      } finally {
        debugPrint = previous;
      }
      expect(printed, hasLength(2));
      expect(printed.first, contains('6 destinations'));
      expect(printed.last, contains('"none" names no destination'));
    });
  });

  group('badge announcements', () {
    testWidgets('once per change, none on first build, none when the badge '
        'goes away, none with announce false', (tester) async {
      final log = recordAnnouncements(tester);
      await tester.pumpWidget(harness(_placed(_bar())));
      await tester.pump();
      expect(log, isEmpty, reason: 'nothing on first build');

      await tester.pumpWidget(
        harness(_placed(_bar(destinations: _destinations(profileBadge: null)))),
      );
      await tester.pump();
      expect(log, isEmpty, reason: 'nothing when a badge goes away');

      await tester.pumpWidget(harness(_placed(_bar())));
      await tester.pump();
      expect(log, [(message: 'Profile: Needs attention', assertive: false)]);

      await tester.pumpWidget(harness(_placed(_bar())));
      await tester.pump();
      expect(log, hasLength(1), reason: 'an unchanged badge is not repeated');

      await tester.pumpWidget(
        harness(
          _placed(
            _bar(
              destinations: _destinations(
                profileBadge: const NavigationBadge(
                  label: '2 tasks',
                  content: '2',
                  announce: false,
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(log, hasLength(1), reason: 'announce false is silent');
    });

    testWidgets('held while a modal is open, the latest per destination made '
        'after the last one closes', (tester) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      await tester.pumpWidget(
        harness(
          _placed(
            _bar(
              destinations: _destinations(profileBadge: null),
              modals: modals,
            ),
          ),
        ),
      );
      final outer = modals.hold();
      final inner = modals.hold();
      for (final label in ['One task', 'Two tasks']) {
        await tester.pumpWidget(
          harness(
            _placed(
              _bar(
                destinations: _destinations(
                  profileBadge: NavigationBadge(label: label),
                ),
                modals: modals,
              ),
            ),
          ),
        );
        await tester.pump();
      }
      expect(log, isEmpty);
      inner();
      await tester.pump();
      expect(log, isEmpty, reason: 'one modal is still open');
      outer();
      await tester.pump();
      expect(log, [(message: 'Profile: Two tasks', assertive: false)]);
    });

    testWidgets('a dialog route holds them too', (tester) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      final badge = ValueNotifier<NavigationBadge?>(null);
      addTearDown(badge.dispose);
      await tester.pumpWidget(
        appHarness(
          (context) => ValueListenableBuilder(
            valueListenable: badge,
            builder: (context, value, _) => _placed(
              _bar(
                destinations: _destinations(profileBadge: value),
                modals: modals,
              ),
            ),
          ),
          observers: [modals],
        ),
      );
      final context = tester.element(find.text('Home').last);
      unawaited(
        showInvisibleDialog<void>(
          context: context,
          builder: (context) =>
              const Dialog(title: 'Edit', child: Text('Body')),
        ),
      );
      await tester.pumpAndSettle();
      badge.value = const NavigationBadge(label: 'Needs attention');
      await tester.pumpAndSettle();
      expect(log, isEmpty);

      Navigator.of(tester.element(find.text('Body'))).pop();
      await tester.pumpAndSettle();
      expect(log, [(message: 'Profile: Needs attention', assertive: false)]);
    });

    testWidgets('a bar inside the open dialog keeps announcing', (
      tester,
    ) async {
      final log = recordAnnouncements(tester);
      final modals = ModalObserver();
      addTearDown(modals.dispose);
      final badge = ValueNotifier<NavigationBadge?>(null);
      addTearDown(badge.dispose);
      await tester.pumpWidget(
        appHarness((context) => const SizedBox.shrink(), observers: [modals]),
      );
      unawaited(
        showInvisibleDialog<void>(
          context: tester.element(find.byType(SizedBox).first),
          builder: (context) => Dialog(
            title: 'Edit',
            child: ValueListenableBuilder(
              valueListenable: badge,
              builder: (context, value, _) => _bar(
                destinations: _destinations(profileBadge: value),
                modals: modals,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(modals.hasModal, isTrue);
      badge.value = const NavigationBadge(label: 'Needs attention');
      await tester.pumpAndSettle();
      expect(log, [(message: 'Profile: Needs attention', assertive: false)]);
    });
  });
}

bool _ringVisible(WidgetTester tester, String label) => tester
    .widget<FocusRingPainter>(
      find.descendant(
        of: _destination(label),
        matching: find.byType(FocusRingPainter),
      ),
    )
    .visible;
