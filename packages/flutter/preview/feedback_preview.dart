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

/// Every Loading shape, a determinate bar with its texts, and a status
/// message.
@Preview(
  group: 'Loading',
  name: 'Variants, light',
  brightness: Brightness.light,
)
@Preview(group: 'Loading', name: 'Variants, dark', brightness: Brightness.dark)
Widget loadingPreview() => const PreviewSheet(child: _Loaders());

/// The same right to left at text scale 2.0 in a narrow column.
@Preview(
  group: 'Loading',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 640),
)
Widget loadingRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Loaders()),
);

class _Loaders extends StatelessWidget {
  const _Loaders();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          Loading(),
          Loading(variant: LoadingVariant.spinner, showLabel: true),
          Loading(variant: LoadingVariant.typing),
          Loading(variant: LoadingVariant.morph),
          Loading(variant: LoadingVariant.dots, status: 'Fetching records…'),
          Loading(variant: LoadingVariant.bar),
          Loading(
            variant: LoadingVariant.bar,
            value: 38,
            label: 'Downloading',
            showLabel: true,
            showValue: true,
            detail: '3 of 8 files',
          ),
        ],
      ),
    );
  }
}

/// An empty list and a failed load, side by side at two sizes.
@Preview(group: 'States', name: 'Empty and error, light')
@Preview(
  group: 'States',
  name: 'Empty and error, dark',
  brightness: Brightness.dark,
)
Widget statesPreview() => const PreviewSheet(child: _States());

/// The same right to left at text scale 2.0 in a narrow column.
@Preview(
  group: 'States',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget statesRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _States()),
);

class _States extends StatelessWidget {
  const _States();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          EmptyState(
            title: 'No projects yet',
            description: 'Create your first project to get started.',
            actions: [
              Button(onPressed: () {}, child: const Text('Add a project')),
              Button(
                onPressed: () {},
                variant: ButtonVariant.ghost,
                child: const Text('Import'),
              ),
            ],
          ),
          ErrorState(
            title: 'Connection failed',
            description: 'Check the server and try again.',
            size: FeedbackStateSize.small,
            actionLabel: 'Try again',
            onAction: () {},
          ),
        ],
      ),
    );
  }
}

/// A media card, a horizontal card and a dashboard tile.
@Preview(group: 'Card', name: 'Shapes, light', size: Size(720, 640))
@Preview(
  group: 'Card',
  name: 'Shapes, dark',
  brightness: Brightness.dark,
  size: Size(720, 640),
)
Widget cardPreview() => const PreviewSheet(child: _Cards());

/// The same in a narrow column at text scale 2.0: the horizontal card stacks.
@Preview(
  group: 'Card',
  name: 'Narrow, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget cardNarrow() => const PreviewSheet(child: _Cards());

class _Cards extends StatelessWidget {
  const _Cards();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Card(
            title: 'Timelog',
            description: 'Hours by project, week by week.',
            icon: const PreviewGlyph(),
            actions: [
              Button(
                onPressed: () {},
                variant: ButtonVariant.ghost,
                child: const Text('Details'),
              ),
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
            orientation: CardOrientation.horizontal,
            icon: const PreviewGlyph(),
            actions: [Button(onPressed: () {}, child: const Text('Open'))],
          ),
          const Card.dashboard(
            title: 'Hours this week',
            icon: PreviewGlyph(),
            value: '38.5',
            change: '+12 %',
            trend: CardTrend.up,
          ),
        ],
      ),
    );
  }
}
