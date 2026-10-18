// Reference images of a representative set of components, in light and
// dark. Text renders differently on each operating system, so the images
// come from the Linux CI job and the tests run on Linux only (dart_test.yaml).
// Regenerate them as docs/visual-testing.md describes.
@Tags(['golden'])
library;

// Flutter 3.35 adds its own RadioGroup; the test uses the package's.
import 'package:flutter/widgets.dart' hide RadioGroup;
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import '../harness.dart' show focusOn, useKeyboardHighlight;
import 'golden_harness.dart';

void main() {
  goldenTest('Button: variants, disabled, loading and focused', (
    tester,
    brightness,
  ) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(560, 440),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 12,
        children: [
          for (final variant in ButtonVariant.values)
            Row(
              spacing: 8,
              children: [
                Button(
                  onPressed: () {},
                  variant: variant,
                  child: Text(variant.name),
                ),
                Button(
                  onPressed: null,
                  variant: variant,
                  child: const Text('Disabled'),
                ),
                Button.icon(
                  onPressed: () {},
                  variant: variant,
                  icon: const GoldenGlyph(),
                  semanticLabel: 'Add',
                ),
              ],
            ),
          Row(
            spacing: 8,
            children: [
              Button(
                onPressed: () {},
                variant: ButtonVariant.primary,
                loading: true,
                child: const Text('Saving'),
              ),
              Button(onPressed: () {}, child: const Text('Focused')),
            ],
          ),
        ],
      ),
    );
    useKeyboardHighlight();
    await focusOn(tester, find.text('Focused'));
    await expectGolden('button_${brightness.name}');
  });

  goldenTest('TextField: empty, filled, with an error, disabled', (
    tester,
    brightness,
  ) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 420),
      const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          TextField.uncontrolled(
            label: 'Name',
            description: 'As it appears on your badge.',
            placeholder: 'Ada Lovelace',
            required: true,
          ),
          TextField.uncontrolled(
            label: 'Email',
            initialValue: 'ada@',
            error: 'Enter a complete address.',
          ),
          TextField.uncontrolled(
            label: 'Team',
            initialValue: 'Engines',
            enabled: false,
          ),
        ],
      ),
    );
    await expectGolden('text_field_${brightness.name}');
  });

  goldenTest('Checkbox, RadioGroup and Switch: on, off, mixed, error, '
      'disabled', (tester, brightness) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 720),
      const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 12,
        children: [
          Checkbox.uncontrolled(label: 'Remember this device'),
          Checkbox.uncontrolled(label: 'Send a copy', initialValue: true),
          Checkbox(label: 'All projects', value: null),
          Checkbox.uncontrolled(
            label: 'I accept the terms',
            error: 'Accept the terms to go on.',
          ),
          Checkbox.uncontrolled(label: 'Archived', enabled: false),
          RadioGroup<String>.uncontrolled(
            label: 'Export',
            initialValue: 'month',
            items: [
              ChoiceItem(value: 'month', label: 'This month'),
              ChoiceItem(value: 'year', label: 'This year'),
              ChoiceItem(value: 'all', label: 'Everything', disabled: true),
            ],
          ),
          Switch.uncontrolled(label: 'Autosave', initialValue: true),
          Switch.uncontrolled(label: 'Compact rows'),
          Switch.uncontrolled(label: 'Sync', enabled: false),
        ],
      ),
    );
    await expectGolden('choices_${brightness.name}');
  });

  goldenTest('Select: closed, empty and chosen', (tester, brightness) async {
    const items = [
      ChoiceItem(value: 'open', label: 'Open'),
      ChoiceItem(value: 'closed', label: 'Closed'),
    ];
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 240),
      const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Select<String>.uncontrolled(label: 'Status', items: items),
          Select<String>.uncontrolled(
            label: 'Status',
            items: items,
            initialValue: 'open',
          ),
        ],
      ),
    );
    await expectGolden('select_${brightness.name}');
  });

  goldenTest('Tabs: selected, with a count, disabled', (
    tester,
    brightness,
  ) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(480, 200),
      const Tabs<String>.uncontrolled(
        label: 'Project',
        items: [
          TabItem(
            value: 'hours',
            label: 'Hours',
            count: 12,
            child: Text('This week: 32 hours.'),
          ),
          TabItem(
            value: 'people',
            label: 'People',
            child: Text('Four people log time here.'),
          ),
          TabItem(
            value: 'billing',
            label: 'Billing',
            disabled: true,
            child: Text('Not set up.'),
          ),
        ],
      ),
    );
    await expectGolden('tabs_${brightness.name}');
  });

  goldenTest('Card: default and secondary', (tester, brightness) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 560),
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Card(
            title: 'Timelog',
            description: 'Hours by project, week by week.',
            icon: const GoldenGlyph(),
            actions: [
              Button(
                onPressed: () {},
                variant: ButtonVariant.primary,
                child: const Text('Open'),
              ),
            ],
          ),
          Card(
            title: 'Wireframe',
            description: 'Screens and their flows.',
            secondary: true,
            icon: const GoldenGlyph(),
            actions: [Button(onPressed: () {}, child: const Text('Open'))],
          ),
        ],
      ),
    );
    await expectGolden('card_${brightness.name}');
  });

  goldenTest('Dialog: open over the page', (tester, brightness) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(560, 420),
      Builder(
        builder: (context) => Align(
          alignment: AlignmentDirectional.topStart,
          child: Button(
            onPressed: () => showInvisibleDialog<void>(
              context: context,
              builder: (context) => Dialog(
                title: 'Rename project',
                description: 'The new name shows in every report.',
                footerClose: true,
                actions: [
                  Button(
                    onPressed: () => Navigator.of(context).pop(),
                    variant: ButtonVariant.primary,
                    child: const Text('Save'),
                  ),
                ],
                child: const Text('Reports keep their history.'),
              ),
            ),
            child: const Text('Rename'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('Rename'));
    await tester.pumpAndSettle();
    await expectGolden('dialog_${brightness.name}');
  });

  goldenTest('DropdownMenu: open, with a submenu, a disabled item, a group '
      'and a checked item', (tester, brightness) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 420),
      Align(
        alignment: AlignmentDirectional.topStart,
        child: DropdownMenu<String>(
          label: 'File',
          onSelected: (_) {},
          items: const [
            MenuItem(value: 'new', label: 'New file'),
            MenuSubmenu(
              value: 'recent',
              label: 'Open recent',
              items: [MenuItem(value: 'notes', label: 'Notes')],
            ),
            MenuItem(value: 'share', label: 'Share', disabled: true),
            MenuSeparator(),
            MenuGroup(
              label: 'View',
              items: [
                MenuItem(
                  value: 'wrap',
                  label: 'Word wrap',
                  kind: MenuItemKind.checkbox,
                  checked: true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
    await tester.tap(find.text('File'));
    await tester.pumpAndSettle();
    await expectGolden('menu_${brightness.name}');
  });

  goldenTest('CodeBlock: with a caption and the copy button', (
    tester,
    brightness,
  ) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(480, 200),
      const CodeBlock(
        language: 'Dart',
        code:
            'final theme = InvisibleThemeData.light();\n'
            'print(theme.brightness);',
      ),
    );
    await expectGolden('code_block_${brightness.name}');
  });

  goldenTest('NavigationBar: current, badges and an unavailable destination', (
    tester,
    brightness,
  ) async {
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(420, 160),
      Align(
        alignment: Alignment.bottomCenter,
        child: NavigationBar<String>(
          value: 'hours',
          onSelected: (_) {},
          destinations: const [
            NavigationDestination(
              value: 'home',
              label: 'Home',
              icon: GoldenGlyph(),
            ),
            NavigationDestination(
              value: 'clients',
              label: 'Clients',
              icon: GoldenGlyph(),
              badge: NavigationBadge(label: '3 new', content: '3'),
            ),
            NavigationDestination(
              value: 'projects',
              label: 'Projects',
              icon: GoldenGlyph(),
              unavailableReason: 'Available online only',
            ),
            NavigationDestination(
              value: 'hours',
              label: 'Hours',
              icon: GoldenGlyph(),
            ),
            NavigationDestination(
              value: 'profile',
              label: 'Profile',
              icon: GoldenGlyph(),
              badge: NavigationBadge(label: 'Needs attention'),
            ),
          ],
        ),
      ),
    );
    await expectGolden('navigation_bar_${brightness.name}');
  });

  goldenTest('DataGrid: two rows and three days, with totals and a summary '
      'cell', (tester, brightness) async {
    const values = <(String, String), double>{
      ('px', 'mon'): 8,
      ('px', 'tue'): 7.5,
      ('ops', 'wed'): 2,
    };
    await pumpGolden(
      tester,
      brightness: brightness,
      size: const Size(560, 300),
      DataGrid(
        label: 'Week 41',
        rowHeaderLabel: 'Project',
        columns: const [
          DataGridColumn(id: 'mon', label: 'Monday', header: Text('Mon 6')),
          DataGridColumn(id: 'tue', label: 'Tuesday', header: Text('Tue 7')),
          DataGridColumn(id: 'wed', label: 'Wednesday', header: Text('Wed 8')),
        ],
        rows: const [
          DataGridRow(id: 'px', code: 'PX-12', name: 'Project X'),
          DataGridRow(id: 'ops', code: 'OPS', name: 'Operations'),
        ],
        editor: const DataGridEditor(min: 0, max: 24, step: 0.5),
        cell: (row, column) {
          final summary = row == 'ops' && column == 'wed';
          return DataGridCell(
            kind: summary
                ? DataGridCellKind.summary
                : DataGridCellKind.editable,
            value: values[(row, column)],
            badge: summary ? '2 entries' : null,
          );
        },
        onCellChanged: (_) {},
      ),
    );
    await expectGolden('data_grid_${brightness.name}');
  });
}
