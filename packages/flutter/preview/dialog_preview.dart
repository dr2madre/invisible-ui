// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. The previewer arrived in Flutter 3.35, after the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

/// Buttons that open each dialog of the family, on a navigator of their
/// own: try Tab, Escape, the barrier, a notice in the status area and a
/// confirmation opened on top of a dialog.
@Preview(group: 'Dialog', name: 'Interactive', size: Size(800, 600))
@Preview(
  group: 'Dialog',
  name: 'Interactive, dark',
  brightness: Brightness.dark,
  size: Size(800, 600),
)
Widget dialogPreview() => const PreviewSheet(child: _Launcher());

/// The destructive confirmation, open, right to left at text scale 2.0 on a
/// narrow screen.
@Preview(
  group: 'Dialog',
  name: 'Confirm, right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 720),
)
Widget confirmRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _DeleteHours()),
);

/// The panels as they show, without a route.
@Preview(group: 'Dialog', name: 'Panels', size: Size(560, 900))
Widget dialogPanels() => const PreviewSheet(
  child: SingleChildScrollView(
    child: Column(
      spacing: 8,
      children: [
        _DeleteHours(),
        AlertDialog(
          title: 'Export finished',
          description: 'The file is in your Downloads folder.',
          dismissLabel: 'Done',
        ),
      ],
    ),
  ),
);

class _DeleteHours extends StatelessWidget {
  const _DeleteHours();

  @override
  Widget build(BuildContext context) => const ConfirmDialog(
    title: 'Delete 6 hours?',
    description: 'The hours logged on Monday are removed from the report.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep hours',
    confirmVariant: ButtonVariant.danger,
  );
}

class _Launcher extends StatelessWidget {
  const _Launcher();

  @override
  Widget build(BuildContext context) {
    return Navigator(
      onGenerateRoute: (settings) => PageRouteBuilder<void>(
        settings: settings,
        pageBuilder: (context, _, _) => Center(
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Button(
                onPressed: () => showInvisibleDialog<void>(
                  context: context,
                  builder: (context) => const _Export(),
                ),
                child: const Text('Export…'),
              ),
              Button(
                onPressed: () => showInvisibleDialog<bool>(
                  context: context,
                  builder: (_) => const _DeleteHours(),
                ),
                variant: ButtonVariant.danger,
                child: const Text('Delete hours'),
              ),
              Button(
                onPressed: () => showInvisibleDialog<void>(
                  context: context,
                  builder: (_) => const AlertDialog(
                    title: 'Export finished',
                    description: 'The file is in your Downloads folder.',
                    dismissLabel: 'Done',
                  ),
                ),
                child: const Text('Alert'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Export extends StatelessWidget {
  const _Export();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      title: 'Export',
      description: 'Hours of the selected month, as a spreadsheet.',
      headerMeta: const Text('Step 1 of 2'),
      footerClose: true,
      actions: [
        Builder(
          builder: (context) => Button(
            onPressed: () => Dialog.of(context).notify(
              status: NotificationStatus.danger,
              title: 'Export failed',
              description: 'The disk is full.',
              action: const NotificationAction(label: 'Retry'),
            ),
            variant: ButtonVariant.primary,
            child: const Text('Export'),
          ),
        ),
      ],
      child: Builder(
        builder: (context) => Button(
          onPressed: () => showInvisibleDialog<bool>(
            context: context,
            builder: (_) => const ConfirmDialog(
              title: 'Discard the export settings?',
              confirmLabel: 'Discard',
              cancelLabel: 'Keep them',
            ),
          ),
          variant: ButtonVariant.ghost,
          child: const Text('Reset settings'),
        ),
      ),
    );
  }
}
