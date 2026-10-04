import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';
import 'package:invisible_ui/src/field/field.dart';
import 'package:invisible_ui/src/internal/focus_ring.dart';

import 'harness.dart';

final Finder _node = find.byType(FieldSemantics);
final Finder _track = find.byType(AnimatedContainer);
final Finder _thumb = find.byType(AnimatedAlign);

AlignmentGeometry _thumbAlignment(WidgetTester tester) =>
    tester.widget<AnimatedAlign>(_thumb).alignment;

/// A parent that holds the value, as a controlled consumer does.
class _Controlled extends StatefulWidget {
  const _Controlled({super.key, required this.reports});

  final List<bool> reports;

  @override
  State<_Controlled> createState() => _ControlledState();
}

class _ControlledState extends State<_Controlled> {
  bool value = false;

  void replace(bool next) => setState(() => value = next);

  @override
  Widget build(BuildContext context) => Switch(
    label: 'Autosave',
    value: value,
    onChanged: (next) {
      widget.reports.add(next);
      setState(() => value = next);
    },
  );
}

void main() {
  tearDown(() {
    FocusManager.instance.highlightStrategy = FocusHighlightStrategy.automatic;
  });

  testWidgets('a tap on the track or the label flips it and reports once', (
    tester,
  ) async {
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(Switch.uncontrolled(label: 'Autosave', onChanged: reports.add)),
    );
    expect(_thumbAlignment(tester), AlignmentDirectional.centerStart);
    await tester.tap(_track);
    await tester.pump();
    expect(reports, [true]);
    expect(_thumbAlignment(tester), AlignmentDirectional.centerEnd);
    await tester.tap(find.text('Autosave'));
    await tester.pump();
    expect(reports, [true, false]);
  });

  testWidgets('Space flips it; Enter does not', (tester) async {
    final reports = <bool>[];
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Switch.uncontrolled(
          label: 'Autosave',
          focusNode: focus,
          onChanged: reports.add,
        ),
      ),
    );
    focus.requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(reports, [true]);
  });

  testWidgets('a changed value is shown and never reported; the callback is '
      'read at the press', (tester) async {
    final reports = <bool>[];
    final parent = GlobalKey<_ControlledState>();
    await tester.pumpWidget(
      harness(_Controlled(key: parent, reports: reports)),
    );
    parent.currentState!.replace(true);
    await tester.pump();
    expect(_thumbAlignment(tester), AlignmentDirectional.centerEnd);
    expect(reports, isEmpty);

    final calls = <String>[];
    Widget build(String name) => harness(
      Switch.uncontrolled(label: 'Autosave', onChanged: (_) => calls.add(name)),
    );
    await tester.pumpWidget(build('first'));
    await tester.pumpWidget(build('second'));
    await tester.tap(_track);
    expect(calls, ['second']);
  });

  testWidgets('semantics: one toggled node with name, description, error', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      harness(
        const Switch(
          label: 'Autosave',
          value: true,
          description: 'Saves every change.',
          error: 'Could not save.',
        ),
      ),
    );
    expect(
      tester.getSemantics(_node),
      semanticsWith(
        label: 'Autosave',
        hint: 'Saves every change.\nCould not save.',
        hasToggledState: true,
        isToggled: true,
        hasTapAction: true,
        isFocusable: true,
        validationResult: SemanticsValidationResult.invalid,
      ),
    );
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });

  testWidgets('disabled: no change, reported disabled, no focus', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    final reports = <bool>[];
    final focus = FocusNode();
    addTearDown(focus.dispose);
    await tester.pumpWidget(
      harness(
        Switch.uncontrolled(
          label: 'Autosave',
          enabled: false,
          focusNode: focus,
          onChanged: reports.add,
        ),
      ),
    );
    await tester.tap(_track);
    focus.requestFocus();
    await tester.pump();
    expect(reports, isEmpty);
    expect(focus.hasFocus, isFalse);
    expect(
      tester.getSemantics(_node),
      semanticsWith(
        label: 'Autosave',
        hasEnabledState: true,
        isEnabled: false,
        hasToggledState: true,
        isToggled: false,
      ),
    );
    semantics.dispose();
  });

  testWidgets('onOff shows the state as text from the messages', (
    tester,
  ) async {
    await tester.pumpWidget(
      harness(
        const Switch.uncontrolled(label: 'Autosave', onOff: true),
        theme: InvisibleThemeData.light(
          messages: const InvisibleMessages(switchOn: 'SÌ', switchOff: 'NO'),
        ),
      ),
    );
    expect(tester.getSize(_track).width, 60);
    final on = tester.widget<AnimatedOpacity>(
      find.ancestor(
        of: find.text('SÌ'),
        matching: find.byType(AnimatedOpacity),
      ),
    );
    final off = tester.widget<AnimatedOpacity>(
      find.ancestor(
        of: find.text('NO'),
        matching: find.byType(AnimatedOpacity),
      ),
    );
    expect(on.opacity, 0);
    expect(off.opacity, 1);
  });

  testWidgets('right to left: on puts the thumb at the left', (tester) async {
    await tester.pumpWidget(
      harness(
        const Switch.uncontrolled(label: 'Autosave', initialValue: true),
        direction: TextDirection.rtl,
      ),
    );
    final track = tester.getRect(_track);
    final thumb = tester.getRect(
      find.descendant(of: _thumb, matching: find.byType(Container)),
    );
    expect(thumb.center.dx, lessThan(track.center.dx));
  });

  testWidgets('reduced motion moves the thumb at once', (tester) async {
    await tester.pumpWidget(
      harness(
        const Switch.uncontrolled(label: 'Autosave'),
        disableAnimations: true,
      ),
    );
    expect(tester.widget<AnimatedAlign>(_thumb).duration, Duration.zero);
  });

  testWidgets('the ring follows the track on keyboard focus; 44 by 44 under '
      'touch; text scale 2.0 grows the track', (tester) async {
    final focus = FocusNode();
    addTearDown(focus.dispose);
    FocusManager.instance.highlightStrategy =
        FocusHighlightStrategy.alwaysTraditional;
    await tester.pumpWidget(
      harness(
        SizedBox(
          width: 220,
          child: Switch.uncontrolled(
            label: 'Save the draft every few seconds',
            focusNode: focus,
          ),
        ),
        textScale: 2,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    focus.requestFocus();
    await pumpFocus(tester);
    final ring = tester.widget<FocusRingPainter>(find.byType(FocusRingPainter));
    expect(ring.visible, isTrue);
    expect(tester.getSize(_track), const Size(80, 48));
    expect(
      tester.getSize(find.byType(GestureDetector).first).height,
      greaterThanOrEqualTo(48),
    );
  });

  testWidgets('a form reset restores the default without a report', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final reports = <bool>[];
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: Switch.uncontrolled(
            label: 'Autosave',
            initialValue: true,
            onChanged: reports.add,
          ),
        ),
      ),
    );
    await tester.tap(_track);
    await tester.pump();
    form.currentState!.reset();
    await tester.pump();
    expect(_thumbAlignment(tester), AlignmentDirectional.centerEnd);
    expect(reports, [false]);
  });

  testWidgets('a controlled reset restores the last value the parent set', (
    tester,
  ) async {
    final form = GlobalKey<FormState>();
    final reports = <bool>[];
    final parent = GlobalKey<_ControlledState>();
    await tester.pumpWidget(
      harness(
        Form(
          key: form,
          child: _Controlled(key: parent, reports: reports),
        ),
      ),
    );
    parent.currentState!.replace(true);
    await tester.pump();
    await tester.tap(_track);
    await tester.pump();
    expect(reports, [false]);
    form.currentState!.reset();
    await tester.pump();
    expect(_thumbAlignment(tester), AlignmentDirectional.centerEnd);
    expect(reports, [false]);
  });
}
