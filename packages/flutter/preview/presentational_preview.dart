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

/// The display components: Avatar, AvatarGroup, Count, Tag, Kbd, Label,
/// FeedbackIcon and Skeleton.
@Preview(group: 'Display', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Display', name: 'Dark', brightness: Brightness.dark)
Widget displayStates() => const PreviewSheet(child: _Display());

/// The same set right to left at text scale 2.0 in a narrow column: the
/// tags and the chords wrap, the avatar group shrinks to fit.
@Preview(
  group: 'Display',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1400),
)
Widget displayRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Display()),
);

/// Touch density: the remove buttons keep a 44 by 44 target.
@Preview(group: 'Display', name: 'Touch density')
Widget displayTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Display());

/// The text components: Code, CodeBlock, Blockquote and ScrollArea.
@Preview(group: 'Text', name: 'Light', brightness: Brightness.light)
@Preview(group: 'Text', name: 'Dark', brightness: Brightness.dark)
Widget textStates() => const PreviewSheet(child: _Text());

/// The text components right to left at text scale 2.0: the code block
/// scrolls sideways, the quote wraps.
@Preview(
  group: 'Text',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1400),
)
Widget textRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Text()),
);

void _remove() {}

class _Display extends StatelessWidget {
  const _Display();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return const SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Avatar(name: 'Ada Lovelace', size: AvatarSize.small),
              Avatar(name: 'Grace Hopper'),
              Avatar(
                name: 'Alan Turing',
                size: AvatarSize.large,
                shape: AvatarShape.square,
              ),
            ],
          ),
          gap,
          AvatarGroup(
            label: 'Reviewers',
            max: 3,
            items: [
              AvatarGroupItem(name: 'Ada Lovelace'),
              AvatarGroupItem(name: 'Grace Hopper', color: Color(0xFFE0D4F5)),
              AvatarGroupItem(name: 'Alan Turing'),
              AvatarGroupItem(name: 'Edsger Dijkstra'),
              AvatarGroupItem(name: 'Barbara Liskov'),
            ],
          ),
          gap,
          Wrap(
            spacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Count(count: 3, semanticLabel: '3 unread messages'),
              Count(count: 120),
              Count(count: 5, status: NotificationStatus.info),
              Count(dot: true, semanticLabel: 'Online'),
            ],
          ),
          gap,
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Tag(child: Text('Draft')),
              Tag(status: TagStatus.success, child: Text('Approved')),
              Tag(status: TagStatus.warning, child: Text('Pending review')),
              Tag(
                status: TagStatus.danger,
                variant: TagVariant.solid,
                child: Text('Blocked'),
              ),
              Tag(
                status: TagStatus.selected,
                onRemoved: _remove,
                removeLabel: 'Remove Design',
                child: Text('Design'),
              ),
              Tag(
                status: TagStatus.info,
                size: TagSize.small,
                trailing: Count(count: 4, status: NotificationStatus.info),
                child: Text('Comments'),
              ),
            ],
          ),
          gap,
          Wrap(
            spacing: 12,
            children: [
              Kbd('Esc'),
              Kbd.chord(['⌘', 'K']),
              Kbd.chord(['Ctrl', 'Shift', 'P']),
            ],
          ),
          gap,
          Label('Billable hours', required: true),
          gap,
          Wrap(
            spacing: 8,
            children: [
              FeedbackIcon(status: NotificationStatus.info),
              FeedbackIcon(status: NotificationStatus.success),
              FeedbackIcon(status: NotificationStatus.warning),
              FeedbackIcon(
                status: NotificationStatus.danger,
                box: FeedbackIconBox.solid,
              ),
              FeedbackIcon(
                status: NotificationStatus.neutral,
                shape: FeedbackIconShape.round,
              ),
            ],
          ),
          gap,
          Row(
            children: [
              Skeleton(variant: SkeletonVariant.circle),
              SizedBox(width: 12),
              Expanded(child: Skeleton(lines: 3)),
            ],
          ),
          gap,
          Skeleton(variant: SkeletonVariant.rect, height: 80),
        ],
      ),
    );
  }
}

class _Text extends StatelessWidget {
  const _Text();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text.rich(
            TextSpan(
              children: [
                TextSpan(text: 'Run '),
                WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: Code('pnpm gate'),
                ),
                TextSpan(text: ' before you push.'),
              ],
            ),
          ),
          gap,
          const CodeBlock(
            language: 'Dart',
            code:
                "final theme = InvisibleThemeData.light(fontFamily: 'Inter');\n"
                'runApp(InvisibleTheme(data: theme, child: const App()));',
          ),
          gap,
          const Blockquote(
            cite: Text('Grace Hopper'),
            child: Text(
              'The most dangerous phrase in the language is: we have always '
              'done it this way.',
            ),
          ),
          gap,
          ScrollArea(
            maxHeight: 120,
            semanticLabel: 'Activity',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (var i = 1; i <= 12; i++) Text('Entry $i: two hours'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
