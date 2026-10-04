import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

/// The direction of a media [Card].
enum CardOrientation {
  /// Media on top, then the text, then the actions.
  vertical,

  /// Media at the inline-start, the text beside it, the actions at the
  /// inline-end. Narrower than [Card.horizontalMinWidth], scaled with the
  /// text, it stacks as [vertical].
  horizontal,
}

/// Which way a dashboard [Card]'s change went. It sets the colour of the
/// change text, which itself says the direction ("+12 %").
enum CardTrend {
  /// An increase.
  up,

  /// A decrease.
  down,

  /// No direction.
  neutral,
}

// Sizes the web Card sets in its own stylesheet.
const double _padding = 16;
const double _gap = 8;
const double _iconSide = 40;
const double _dashboardIconSide = 28;
const double _horizontalMedia = 128;

/// A container for related content: optional media, a [title] heading, a
/// [description], extra content and actions.
///
/// [Card.new] is a media card, vertical or horizontal. [Card.dashboard] is a
/// metric tile: an icon over the title, a large value and its change beside
/// it. The card is one semantics group whose heading is the title; the card
/// itself takes no action, so put buttons in [actions].
class Card extends StatelessWidget {
  /// A media card: [media] or [icon] on top (or at the inline-start), then
  /// [tags], [title], [description], [child] and [actions].
  const Card({
    super.key,
    this.title,
    this.headingLevel = 3,
    this.description,
    this.child,
    this.media,
    this.icon,
    this.tags = const [],
    this.actions = const [],
    this.orientation = CardOrientation.vertical,
    this.secondary = false,
  }) : assert(headingLevel >= 2 && headingLevel <= 6),
       value = null,
       change = null,
       trend = CardTrend.neutral,
       metric = null,
       _dashboard = false;

  /// A metric tile: [icon] over [title], [value] with its [change] and an
  /// optional [metric] beside them.
  const Card.dashboard({
    super.key,
    this.title,
    this.headingLevel = 3,
    this.icon,
    this.value,
    this.change,
    this.trend = CardTrend.neutral,
    this.metric,
    this.secondary = false,
  }) : assert(headingLevel >= 2 && headingLevel <= 6),
       description = null,
       child = null,
       media = null,
       tags = const [],
       actions = const [],
       orientation = CardOrientation.vertical,
       _dashboard = true;

  /// The width, at text scale 1, under which a horizontal card stacks
  /// vertically.
  static const double horizontalMinWidth = 400;

  /// The heading.
  final String? title;

  /// The heading level of the title, 2 to 6.
  final int headingLevel;

  /// The body text.
  final String? description;

  /// Extra body content under the description.
  final Widget? child;

  /// The media area, such as an [Image]. Give the image a semantic label, or
  /// exclude it from semantics when it is decorative.
  final Widget? media;

  /// An icon: in the media area of a media card without [media], beside the
  /// title of a dashboard card. It is decorative.
  final Widget? icon;

  /// Tags shown with the title.
  final List<Widget> tags;

  /// Buttons at the end of the card.
  final List<Widget> actions;

  /// The direction of a media card.
  final CardOrientation orientation;

  /// Whether the card uses the quieter secondary surface.
  final bool secondary;

  /// The large value of a dashboard card.
  final String? value;

  /// The change shown beside [value].
  final String? change;

  /// The direction of [change].
  final CardTrend trend;

  /// Extra content after the value and the change.
  final Widget? metric;

  final bool _dashboard;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final c = theme.colors;
    final text = theme.textStyle.copyWith(color: c.text);
    final heading = title == null || title!.isEmpty
        ? null
        : Semantics(
            header: true,
            headingLevel: headingLevel,
            child: Text(
              title!,
              style: text.copyWith(
                fontSize: 16.8,
                fontWeight: FontWeight.w600,
                height: InvisibleTypographyTokens.lineHeightTight,
              ),
            ),
          );

    final Widget body = _dashboard
        ? _buildDashboard(context, heading, text)
        : LayoutBuilder(
            builder: (context, constraints) => _buildMedia(
              context,
              heading,
              text,
              horizontal:
                  orientation == CardOrientation.horizontal &&
                  constraints.maxWidth >=
                      MediaQuery.textScalerOf(
                        context,
                      ).scale(horizontalMinWidth),
            ),
          );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: secondary ? c.neutralSurface : c.background,
          border: Border.all(color: c.border),
          borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(
            InvisibleRadiusTokens.surface - 1,
          ),
          child: DefaultTextStyle(style: text, child: body),
        ),
      ),
    );
  }

  Widget _icon(BuildContext context, double side, Color color) =>
      ExcludeSemantics(
        child: IconTheme(
          data: IconThemeData(color: color, size: side, applyTextScaling: true),
          child: SizedBox.square(
            dimension: MediaQuery.textScalerOf(context).scale(side),
            child: FittedBox(child: icon),
          ),
        ),
      );

  Widget _buildMedia(
    BuildContext context,
    Widget? heading,
    TextStyle text, {
    required bool horizontal,
  }) {
    final c = InvisibleTheme.of(context).colors;
    final mediaArea = media != null || icon != null
        ? ColoredBox(
            color: c.neutralSurface,
            child: media != null
                ? Center(widthFactor: 1, heightFactor: 1, child: media)
                : Padding(
                    padding: horizontal
                        ? const EdgeInsets.symmetric(horizontal: 20)
                        : const EdgeInsets.all(24),
                    child: Center(
                      widthFactor: 1,
                      heightFactor: 1,
                      child: _icon(context, _iconSide, c.textSecondary),
                    ),
                  ),
          )
        : null;

    final tagRow = tags.isEmpty
        ? null
        : Wrap(spacing: 5.6, runSpacing: 5.6, children: tags);
    final head = horizontal
        ? Wrap(
            spacing: _gap,
            runSpacing: _gap,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [?heading, ...tags],
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 6.4,
            children: [?tagRow, ?heading],
          );

    final content = Padding(
      padding: const EdgeInsets.all(_padding),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: _gap,
        children: [
          if (heading != null || tags.isNotEmpty) head,
          if (description != null && description!.isNotEmpty)
            Text(description!, style: text.copyWith(color: c.textSecondary)),
          if (child != null)
            Padding(padding: const EdgeInsets.only(top: 4), child: child),
        ],
      ),
    );

    final actionRow = actions.isEmpty
        ? null
        : Padding(
            padding: horizontal
                ? const EdgeInsetsDirectional.only(end: _padding)
                : const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            child: Wrap(
              alignment: horizontal
                  ? WrapAlignment.end
                  : WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: _gap,
              runSpacing: _gap,
              children: actions,
            ),
          );

    if (!horizontal) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [?mediaArea, content, ?actionRow],
      );
    }
    // The media keeps its own height: a row stretches its children only to
    // a known height, and measuring arbitrary content for it is not always
    // possible.
    return Row(
      children: [
        if (mediaArea != null)
          media != null
              ? SizedBox(width: _horizontalMedia, child: mediaArea)
              : mediaArea,
        Expanded(child: content),
        ?actionRow,
      ],
    );
  }

  Widget _buildDashboard(
    BuildContext context,
    Widget? heading,
    TextStyle text,
  ) {
    final c = InvisibleTheme.of(context).colors;
    final changeColor = switch (trend) {
      CardTrend.up => c.successText,
      CardTrend.down => c.dangerText,
      CardTrend.neutral => c.textSecondary,
    };
    final head = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: _gap,
      children: [
        if (icon != null) _icon(context, _dashboardIconSide, c.textSecondary),
        ?heading,
      ],
    );
    final figures = Wrap(
      spacing: 6.4,
      crossAxisAlignment: WrapCrossAlignment.end,
      children: [
        if (value != null)
          Text(
            value!,
            style: text.copyWith(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              height: 1,
            ),
          ),
        if (change != null)
          Text(
            change!,
            style: text.copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: changeColor,
            ),
          ),
        ?metric,
      ],
    );
    return Padding(
      padding: const EdgeInsets.all(_padding),
      // Side by side when they fit; the figures wrap under the title on a
      // narrow card.
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        spacing: _padding,
        runSpacing: _gap,
        children: [head, figures],
      ),
    );
  }
}
