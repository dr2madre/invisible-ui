import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

// The accessibility invariants the types cannot express, each held by a
// debug assertion (docs/flutter-team-guidance.md). The ones the types do
// express need no test: the code does not compile without them. Asserts
// that were already tested keep their test where they were:
// `an icon-only button refuses an empty label` (button_test.dart), the
// collapsed sidebar without icons (sidebar_test.dart) and the second current
// link (navigation_menu_test.dart).

void main() {
  group('the types cannot say it, a debug assertion does', () {
    test('a secondary data grid column or cell needs words', () {
      expect(
        () => DataGridColumn(id: 'sat', label: 'Saturday', secondaryLabel: ''),
        throwsAssertionError,
      );
      expect(
        () => DataGridCell(kind: DataGridCellKind.editable, secondaryLabel: ''),
        throwsAssertionError,
      );
      expect(
        const DataGridColumn(
          id: 'sat',
          label: 'Saturday',
          secondaryLabel: 'Non-working day',
        ).secondary,
        isTrue,
      );
      expect(
        const DataGridCell(kind: DataGridCellKind.editable).secondary,
        isFalse,
      );
    });

    test('an unavailable destination needs a reason in words', () {
      expect(
        () => NavigationDestination(
          value: 'reports',
          label: 'Reports',
          icon: const SizedBox(),
          unavailableReason: '',
        ),
        throwsAssertionError,
      );
      expect(
        () => SidebarItem(
          value: 'reports',
          label: 'Reports',
          unavailableReason: '',
        ),
        throwsAssertionError,
      );
    });

    test('a heading level stays in the range the heading allows', () {
      expect(() => Card(title: 'Usage', headingLevel: 1), throwsAssertionError);
      expect(() => Card(title: 'Usage', headingLevel: 7), throwsAssertionError);
      expect(
        () => Card.dashboard(title: 'Usage', headingLevel: 1),
        throwsAssertionError,
      );
      expect(
        () => EmptyState(title: 'No items', headingLevel: 0),
        throwsAssertionError,
      );
      expect(
        () => ErrorState(title: 'Failed', headingLevel: 7),
        throwsAssertionError,
      );
      expect(
        () => TableSet<Object>(title: 'Orders', headingLevel: 1),
        throwsAssertionError,
      );
    });

    testWidgets('a radio outside a radio group needs a name', (tester) async {
      await tester.pumpWidget(
        harness(
          Radio<int>(value: 1, groupValue: 1, label: 'Pro', onChanged: (_) {}),
        ),
      );
      expect(tester.takeException(), isAssertionError);
    });
  });
}
