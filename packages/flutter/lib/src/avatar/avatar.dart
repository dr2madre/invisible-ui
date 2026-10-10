import 'package:flutter/widgets.dart';

import '../theme/theme.dart';

/// The size of an [Avatar] or an [AvatarGroup].
enum AvatarSize {
  /// 32 by 32 at text scale 1.
  small(32, 12, 11),

  /// 40 by 40 at text scale 1, the default.
  medium(40, 14, 13),

  /// 56 by 56 at text scale 1.
  large(56, 18, 16);

  const AvatarSize(this.side, this.fontSize, this.chipFontSize);

  /// The side of the box at text scale 1.
  final double side;

  /// The size of the initials at text scale 1.
  final double fontSize;

  /// The size of an avatar group's "+N" at text scale 1.
  final double chipFontSize;
}

/// The outline of an [Avatar] or an [AvatarGroup].
enum AvatarShape {
  /// A full circle, the default.
  circle,

  /// A square with the control radius.
  square,
}

final RegExp _space = RegExp(r'\s+');

/// Up to two initials from [name]: the first character of the first and the
/// last word, or the first two characters of a single word, in upper case.
/// A blank name gives "?".
///
/// A character is what a reader sees as one: an emoji or a letter with a
/// combining accent counts once. The cases are the shared vectors in
/// `core/src/avatar/__vectors__/initials.json`.
String initialsOf(String name) {
  final words = name.trim().split(_space).where((w) => w.isNotEmpty).toList();
  if (words.isEmpty) return '?';
  if (words.length == 1) {
    return words.single.characters.take(2).toString().toUpperCase();
  }
  return (words.first.characters.first + words.last.characters.first)
      .toUpperCase();
}

/// A small account image that falls back to the account's initials when it
/// has no [image] or the image fails to load.
///
/// [name] is required: it gives both the accessible name and the initials.
/// The whole avatar is one image to assistive technology, named [name] or
/// [semanticLabel], so it reads the same with the photo or the initials.
///
/// The box grows with the text scale.
class Avatar extends StatelessWidget {
  /// Creates the avatar of [name].
  const Avatar({
    super.key,
    required this.name,
    this.image,
    this.semanticLabel,
    this.size = AvatarSize.medium,
    this.shape = AvatarShape.circle,
    this.color,
  });

  /// The account's name: the accessible name and the source of the initials.
  final String name;

  /// The photo, such as a `NetworkImage`. The initials show while it loads
  /// and when it fails.
  final ImageProvider? image;

  /// The accessible name, in place of [name].
  final String? semanticLabel;

  /// The size.
  final AvatarSize size;

  /// The outline.
  final AvatarShape shape;

  /// The background behind the initials, in place of the surface colour.
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final side = MediaQuery.textScalerOf(context).scale(size.side);
    final Widget initials = Center(
      child: Text(
        initialsOf(name),
        maxLines: 1,
        softWrap: false,
        style: theme.textStyle.copyWith(
          fontSize: size.fontSize,
          fontWeight: FontWeight.w600,
          height: 1,
          color: theme.colors.text,
        ),
      ),
    );
    final image = this.image;
    return Semantics(
      container: true,
      image: true,
      label: semanticLabel ?? name,
      child: ExcludeSemantics(
        child: AvatarBox(
          side: side,
          shape: shape,
          color: color ?? theme.colors.surface,
          child: image == null
              ? initials
              : Image(
                  image: image,
                  fit: BoxFit.cover,
                  width: side,
                  height: side,
                  // The initials hold the place until the first frame, and
                  // stay when the image fails.
                  frameBuilder: (context, child, frame, _) =>
                      frame == null ? initials : child,
                  errorBuilder: (context, error, stack) => initials,
                ),
        ),
      ),
    );
  }
}

/// The clipped box of an avatar and of an avatar group's "+N" chip.
class AvatarBox extends StatelessWidget {
  /// Creates the box.
  const AvatarBox({
    super.key,
    required this.side,
    required this.shape,
    required this.color,
    required this.child,
  });

  /// The side, already scaled with the text.
  final double side;

  /// The outline.
  final AvatarShape shape;

  /// The background.
  final Color color;

  /// The content.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final radius = shape == AvatarShape.circle
        ? side / 2
        : InvisibleTheme.of(context).controlRadius;
    return SizedBox.square(
      dimension: side,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: ColoredBox(color: color, child: child),
      ),
    );
  }
}
