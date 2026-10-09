import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import 'avatar.dart';

// The web group's overlap, `0.625rem`, at text scale 1.
const double _overlap = 10;

/// One person in an [AvatarGroup].
@immutable
class AvatarGroupItem {
  /// Creates the entry for [name].
  const AvatarGroupItem({
    required this.name,
    this.image,
    this.semanticLabel,
    this.color,
  });

  /// The person's name: the accessible name and the source of the initials.
  final String name;

  /// The photo; the initials show while it loads and when it fails.
  final ImageProvider? image;

  /// The accessible name, in place of [name].
  final String? semanticLabel;

  /// The background behind the initials.
  final Color? color;
}

/// A row of overlapping avatars, such as a team or the people at a meeting.
/// It shows at most [max] and folds the rest into a "+N" chip.
///
/// The row is a group named [label]; each avatar keeps its own name, and the
/// chip is named from [InvisibleMessages.avatarGroupMore] ("3 more"). The
/// row grows with the text scale and shrinks to fit a narrow parent.
class AvatarGroup extends StatelessWidget {
  /// Creates the group of [items].
  const AvatarGroup({
    super.key,
    required this.items,
    required this.label,
    this.max = 4,
    this.size = AvatarSize.medium,
    this.shape = AvatarShape.circle,
  });

  /// The people in the group.
  final List<AvatarGroupItem> items;

  /// The accessible name of the group.
  final String label;

  /// How many avatars show before the rest fold into the chip.
  final int max;

  /// The size of every avatar.
  final AvatarSize size;

  /// The outline of every avatar.
  final AvatarShape shape;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final scale = MediaQuery.textScalerOf(context);
    final visible = items.take(math.max(0, max)).toList();
    final overflow = items.length - visible.length;
    final side = scale.scale(size.side);
    final step = side - scale.scale(_overlap);
    final count = visible.length + (overflow > 0 ? 1 : 0);
    if (count == 0) return const SizedBox.shrink();

    final Widget? chip = overflow > 0
        ? Semantics(
            container: true,
            image: true,
            label: theme.messages.avatarGroupMore(overflow),
            child: ExcludeSemantics(
              child: AvatarBox(
                side: side,
                shape: shape,
                color: theme.colors.neutralSurface,
                child: Center(
                  child: Text(
                    '+$overflow',
                    maxLines: 1,
                    softWrap: false,
                    style: theme.textStyle.copyWith(
                      fontSize: size.chipFontSize,
                      fontWeight: FontWeight.w600,
                      height: 1,
                      color: theme.colors.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
          )
        : null;

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: label,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: AlignmentDirectional.centerStart,
        child: SizedBox(
          width: side + step * (count - 1),
          height: side,
          // Each avatar overlaps the one before it, from the inline-start.
          child: Stack(
            children: [
              for (final (index, item) in visible.indexed)
                PositionedDirectional(
                  // Two people may share a name, so the position is part of
                  // the key; a new name remounts the avatar.
                  key: ValueKey((index, item.name)),
                  start: step * index,
                  top: 0,
                  child: Avatar(
                    name: item.name,
                    image: item.image,
                    semanticLabel: item.semanticLabel,
                    color: item.color,
                    size: size,
                    shape: shape,
                  ),
                ),
              if (chip != null)
                PositionedDirectional(
                  start: step * visible.length,
                  top: 0,
                  child: chip,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
