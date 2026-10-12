// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'preview_sheet.dart';

const List<ChoiceItem<String>> _people = [
  ChoiceItem(value: 'ada', label: 'Ada Lovelace'),
  ChoiceItem(value: 'grace', label: 'Grace Hopper'),
  ChoiceItem(value: 'alan', label: 'Alan Turing', disabled: true),
  ChoiceItem(value: 'edsger', label: 'Edsger Dijkstra'),
];

const List<SearchDialogItem<String>> _results = [
  SearchDialogItem(value: 'hours', label: 'Hours', group: 'Pages'),
  SearchDialogItem(value: 'reports', label: 'Reports', group: 'Pages'),
  SearchDialogItem(
    value: 'new',
    label: 'New entry',
    group: 'Actions',
    shortcut: ['⌘', 'N'],
  ),
  SearchDialogItem(value: 'export', label: 'Export month', group: 'Actions'),
];

const List<SidebarSection<String>> _sections = [
  SidebarSection(
    label: 'Workspace',
    items: [
      SidebarItem(value: 'hours', label: 'Hours'),
      SidebarItem(value: 'reports', label: 'Reports'),
    ],
  ),
];

/// A search field with its clear and submit buttons, a filter without a
/// submit button and a multi select with chosen values, in each theme.
@Preview(group: 'Search', name: 'Fields, light', size: Size(480, 520))
@Preview(
  group: 'Search',
  name: 'Fields, dark',
  brightness: Brightness.dark,
  size: Size(480, 520),
)
Widget searchFields() => const PreviewSheet(child: _Fields());

/// The fields right to left at text scale 2.0 in a narrow column, under
/// touch density: tags wrap, targets stay 44 by 44.
@Preview(
  group: 'Search',
  name: 'Fields, right to left, text scale 2.0, touch',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget searchFieldsRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(density: InvisibleDensity.touch, child: _Fields()),
);

/// Buttons that open the prompt, the search dialog, a sheet on each edge
/// and the sidebar drawer: try Enter, Escape, the arrows and the handle.
@Preview(group: 'Search', name: 'Dialogs', size: Size(800, 600))
Widget searchDialogs() => const PreviewSheet(child: _Launcher());

/// The same dialogs right to left, dark: start and end sheets mirror.
@Preview(
  group: 'Search',
  name: 'Dialogs, right to left, dark',
  size: Size(800, 600),
  brightness: Brightness.dark,
)
Widget searchDialogsRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Launcher()),
);

/// The loading area: the dot field with a label zone, a plain area with a
/// spinner, and the result once loading ends.
@Preview(group: 'Search', name: 'Loading area', size: Size(560, 640))
@Preview(
  group: 'Search',
  name: 'Loading area, dark',
  brightness: Brightness.dark,
  size: Size(560, 640),
)
Widget loadingArea() => const PreviewSheet(child: _Areas());

class _Fields extends StatelessWidget {
  const _Fields();

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 24,
        children: [
          SearchField.uncontrolled(
            label: 'Search projects',
            initialValue: 'Atlas',
            placeholder: 'Name or client',
          ),
          SearchField.uncontrolled(label: 'Filter tables', submitButton: false),
          MultiSelect<String>.uncontrolled(
            label: 'Reviewers',
            items: _people,
            initialValues: ['ada', 'alan'],
            description: 'Alan Turing is assigned by the team lead.',
          ),
        ],
      ),
    );
  }
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
                onPressed: () => showInvisibleDialog<String>(
                  context: context,
                  builder: (_) => const PromptDialog(
                    title: 'Delete file',
                    description:
                        'The file report-q3.pdf will be permanently deleted.',
                    label: 'Type the file name to confirm',
                    placeholder: 'report-q3.pdf',
                    confirmValue: 'report-q3.pdf',
                    confirmLabel: 'Delete file',
                    cancelLabel: 'Keep file',
                    confirmVariant: ButtonVariant.danger,
                    urgent: true,
                  ),
                ),
                variant: ButtonVariant.danger,
                child: const Text('Delete file…'),
              ),
              Button(
                onPressed: () => showInvisibleDialog<String>(
                  context: context,
                  builder: (_) => const SearchDialog<String>(
                    items: _results,
                    suggestions: [
                      SearchDialogItem(
                        value: 'hours',
                        label: 'Hours',
                        group: 'Recent',
                      ),
                    ],
                  ),
                ),
                child: const Text('Search…'),
              ),
              for (final side in SheetDialogSide.values)
                Button(
                  onPressed: () => showInvisibleDialog<void>(
                    context: context,
                    builder: (context) => SheetDialog(
                      title: 'Filters',
                      description: 'Refine the results.',
                      side: side,
                      draggable: true,
                      actions: [
                        Button(
                          onPressed: () => Navigator.of(context).pop(),
                          variant: ButtonVariant.primary,
                          child: const Text('Apply'),
                        ),
                      ],
                      child: const Text('The filters go here.'),
                    ),
                  ),
                  child: Text('Sheet, ${side.name}'),
                ),
              Button(
                onPressed: () => showSidebarDrawer<String>(
                  context: context,
                  builder: (context) => const Sidebar<String>(
                    sections: _sections,
                    value: 'hours',
                  ),
                ),
                child: Text(InvisibleTheme.of(context).messages.sidebarOpen),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Areas extends StatelessWidget {
  const _Areas();

  @override
  Widget build(BuildContext context) {
    return const Column(
      spacing: 16,
      children: [
        Expanded(
          child: LoadingGenerationArea(
            status: 'Rendering',
            value: 40,
            detail: '3 of 8 files',
            labelPosition: LoadingAreaLabelPosition.bottom,
          ),
        ),
        Expanded(
          child: LoadingGenerationArea(
            field: false,
            indicator: Loading(
              variant: LoadingVariant.spinner,
              decorative: true,
            ),
          ),
        ),
        Expanded(
          child: LoadingGenerationArea(
            loading: false,
            child: Center(child: Text('The generated result')),
          ),
        ),
      ],
    );
  }
}
