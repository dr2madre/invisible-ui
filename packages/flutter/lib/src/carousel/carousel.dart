import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../i18n/messages.dart';
import '../internal/ambient.dart';
import '../internal/announce.dart';
import '../internal/focus_ring.dart';
import '../internal/glyphs.dart';
import '../internal/pressable.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';
import 'carousel_logic.dart';

// Sizes the web Carousel sets in its own stylesheet.
const Duration _transition = Duration(milliseconds: 350);
const double _arrowOffset = 8;
const double _indicatorGap = 6.4;
const double _indicatorsTop = 12;
const double _dot = 8;
const double _currentDotWidth = 20;
const double _galleryItemWidth = 224;
const double _galleryGap = 16;
const double _coverflowHeight = 256;
const double _coverflowHeightVertical = 352;
const double _coverflowItem = 192;
const double _coverflowSpacing = 176;
const double _coverflowSpacingVertical = 144;
const double _overlayPadding = 24;
const double _titleSize = 24;
const double _perspective = 1 / 1200;

/// How a [Carousel] lays out its slides.
enum CarouselVariant {
  /// One full-width slide at a time.
  slide,

  /// A row of items that scrolls sideways.
  gallery,

  /// The current item in front, its neighbours receding on each side.
  coverflow,
}

/// A slide of a [Carousel]: an image with a title and a description over
/// it, or data for [Carousel.itemBuilder].
@immutable
class CarouselSlide {
  /// Creates a slide.
  const CarouselSlide({this.image, this.title, this.description, this.data});

  /// The background image. Decorative: the title and description carry the
  /// meaning.
  final ImageProvider? image;

  /// The title over the slide.
  final String? title;

  /// The description under the title.
  final String? description;

  /// Data of the app's own, for [Carousel.itemBuilder].
  final Object? data;
}

/// Builds the content of a slide.
typedef CarouselItemBuilder =
    Widget Function(
      BuildContext context,
      CarouselSlide item,
      int index,
      bool active,
    );

/// A carousel, following the WAI-ARIA carousel pattern: slides named
/// "2 of 5", previous and next buttons, and a slide picker.
///
/// The arrow keys move between slides while focus is inside the carousel:
/// left and right, swapped in right-to-left text, or up and down when
/// [orientation] is vertical. With [loop] the ends wrap. Each move the user
/// makes is announced with the slide's name and title. A button that a
/// press disables hands focus to the other one, so focus never drops.
///
/// [CarouselVariant.slide] shows one slide at a time and
/// [CarouselVariant.coverflow] the current one in front; in both, the
/// slides out of view are hidden from assistive technology and take no
/// focus. [CarouselVariant.gallery] is a row that scrolls to the current
/// item; its viewport takes focus, so the keyboard reaches it. The slides
/// move without animation under reduced motion, and the layout mirrors in
/// right-to-left text.
///
/// The carousel never advances on its own, so it needs no pause control.
/// Coverflow neighbours are scaled and turned, never faded, so their text
/// keeps its contrast.
///
/// Controlled, [Carousel] shows [index] and reports each move through
/// [onChanged]; [Carousel.uncontrolled] keeps its own index from
/// [initialIndex]. A changed [index] is shown without a report.
class Carousel extends StatefulWidget {
  /// A carousel that shows slide [index], controlled by the parent.
  const Carousel({
    super.key,
    required this.label,
    required this.items,
    required int this.index,
    this.onChanged,
    this.variant = CarouselVariant.slide,
    this.orientation = Axis.horizontal,
    this.loop = false,
    this.showIndicators = true,
    this.previousLabel,
    this.nextLabel,
    this.itemBuilder,
  }) : initialIndex = 0,
       _controlled = true;

  /// A carousel that keeps its own index, starting from [initialIndex].
  const Carousel.uncontrolled({
    super.key,
    required this.label,
    required this.items,
    this.initialIndex = 0,
    this.onChanged,
    this.variant = CarouselVariant.slide,
    this.orientation = Axis.horizontal,
    this.loop = false,
    this.showIndicators = true,
    this.previousLabel,
    this.nextLabel,
    this.itemBuilder,
  }) : index = null,
       _controlled = false;

  /// The carousel's accessible name.
  final String label;

  /// The slides, in order.
  final List<CarouselSlide> items;

  /// The current slide, from 0, when the parent controls it.
  final int? index;

  /// The slide the uncontrolled carousel starts on.
  final int initialIndex;

  /// Called with the new index after the user moves. Never called for a
  /// changed [index].
  final ValueChanged<int>? onChanged;

  /// The layout.
  final CarouselVariant variant;

  /// The axis of the coverflow and of the arrow keys.
  final Axis orientation;

  /// Whether the ends wrap around.
  final bool loop;

  /// Whether the slide picker shows.
  final bool showIndicators;

  /// The previous button's name. Defaults to
  /// [InvisibleMessages.carouselPrevious].
  final String? previousLabel;

  /// The next button's name. Defaults to [InvisibleMessages.carouselNext].
  final String? nextLabel;

  /// Builds a slide's content. Defaults to the image with the title and
  /// the description over it.
  final CarouselItemBuilder? itemBuilder;

  final bool _controlled;

  @override
  State<Carousel> createState() => _CarouselState();
}

class _KeyIntent extends Intent {
  const _KeyIntent(this.key);

  final LogicalKeyboardKey key;
}

class _CarouselState extends State<Carousel> with ValueControl<int, Carousel> {
  final FocusNode _previous = FocusNode(debugLabel: 'Carousel previous');
  final FocusNode _next = FocusNode(debugLabel: 'Carousel next');
  final ScrollController _gallery = ScrollController();
  final List<GlobalKey> _galleryKeys = [];

  static const Map<ShortcutActivator, Intent> _keys = {
    SingleActivator(LogicalKeyboardKey.arrowLeft): _KeyIntent(
      LogicalKeyboardKey.arrowLeft,
    ),
    SingleActivator(LogicalKeyboardKey.arrowRight): _KeyIntent(
      LogicalKeyboardKey.arrowRight,
    ),
    SingleActivator(LogicalKeyboardKey.arrowUp): _KeyIntent(
      LogicalKeyboardKey.arrowUp,
    ),
    SingleActivator(LogicalKeyboardKey.arrowDown): _KeyIntent(
      LogicalKeyboardKey.arrowDown,
    ),
  };

  @override
  bool get isControlled => widget._controlled;

  @override
  int controlledValueOf(Carousel widget) => widget.index!;

  @override
  int get initialValueOfWidget => widget.initialIndex;

  @override
  void didReplaceValue() => _revealGalleryItem();

  int get _count => widget.items.length;

  int get _index => clampSlide(value, _count);

  @override
  void dispose() {
    _previous.dispose();
    _next.dispose();
    _gallery.dispose();
    super.dispose();
  }

  void _go(int target, {FocusNode? from}) {
    final next = clampSlide(target, _count);
    if (next == _index) return;
    if (!commitValue(next)) return;
    // A button this press disabled cannot keep focus: the other one takes
    // it, so focus never drops to the page.
    if (from != null && from.hasPrimaryFocus) {
      final atStart = !canGoPrevious(next, _count, loop: widget.loop);
      final atEnd = !canGoNext(next, _count, loop: widget.loop);
      if (from == _previous && atStart) _next.requestFocus();
      if (from == _next && atEnd) _previous.requestFocus();
    }
    _revealGalleryItem();
    announce(context, _slideAnnouncement(next));
    widget.onChanged?.call(next);
  }

  String _slideName(int index) => InvisibleMessages.fill(
    InvisibleTheme.of(context).messages.carouselSlide,
    {'index': '${index + 1}', 'count': '$_count'},
  );

  String _slideAnnouncement(int index) {
    final title = widget.items[index].title;
    final name = _slideName(index);
    return title == null || title.isEmpty ? name : '$name, $title';
  }

  void _revealGalleryItem() {
    if (widget.variant != CarouselVariant.gallery) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _index >= _galleryKeys.length) return;
      final item = _galleryKeys[_index].currentContext;
      if (item == null) return;
      Scrollable.ensureVisible(
        item,
        duration: reducedMotion(context) ? Duration.zero : _transition,
        curve: Curves.ease,
      );
    });
  }

  // Arrow keys belong to a text field inside a slide while it has focus.
  bool _keysFree() {
    final focused = FocusManager.instance.primaryFocus?.context;
    return focused == null ||
        focused.findAncestorWidgetOfExactType<EditableText>() == null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final messages = theme.messages;
    final count = _count;
    final index = _index;
    final loop = widget.loop;
    final canPrevious = canGoPrevious(index, count, loop: loop);
    final canNext = canGoNext(index, count, loop: loop);

    final stage = Stack(
      children: [
        switch (widget.variant) {
          CarouselVariant.slide => _SlideTrack(
            index: index,
            children: [for (var i = 0; i < count; i++) _slide(i, index)],
          ),
          CarouselVariant.gallery => _galleryView(index),
          CarouselVariant.coverflow => _CoverflowTrack(
            index: index,
            orientation: widget.orientation,
            children: [for (var i = 0; i < count; i++) _slide(i, index)],
          ),
        },
        PositionedDirectional(
          start: _arrowOffset,
          top: 0,
          bottom: 0,
          child: Center(
            child: Button.icon(
              onPressed: canPrevious
                  ? () => _go(
                      previousSlide(index, count, loop: loop),
                      from: _previous,
                    )
                  : null,
              focusNode: _previous,
              semanticLabel: widget.previousLabel ?? messages.carouselPrevious,
              icon: const Glyph(GlyphShape.chevronStart),
            ),
          ),
        ),
        PositionedDirectional(
          end: _arrowOffset,
          top: 0,
          bottom: 0,
          child: Center(
            child: Button.icon(
              onPressed: canNext
                  ? () => _go(nextSlide(index, count, loop: loop), from: _next)
                  : null,
              focusNode: _next,
              semanticLabel: widget.nextLabel ?? messages.carouselNext,
              icon: const Glyph(GlyphShape.chevronEnd),
            ),
          ),
        ),
      ],
    );

    return Semantics(
      container: true,
      explicitChildNodes: true,
      label: widget.label,
      hint: messages.carouselRoleDescription,
      child: Shortcuts(
        shortcuts: _keys,
        child: Actions(
          actions: {
            _KeyIntent: CallbackAction<_KeyIntent>(
              onInvoke: (intent) {
                if (!_keysFree()) return null;
                final target = carouselKeyTarget(
                  key: intent.key,
                  index: _index,
                  count: _count,
                  loop: widget.loop,
                  orientation: widget.orientation,
                  direction: Directionality.of(context),
                );
                if (target != null) _go(target);
                return null;
              },
            ),
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              stage,
              if (widget.showIndicators && count > 0)
                Padding(
                  padding: const EdgeInsets.only(top: _indicatorsTop),
                  child: Semantics(
                    container: true,
                    explicitChildNodes: true,
                    label: messages.carouselChoose,
                    child: Wrap(
                      alignment: WrapAlignment.center,
                      spacing: _indicatorGap,
                      children: [
                        for (var i = 0; i < count; i++)
                          _Dot(
                            key: ValueKey(i),
                            label: InvisibleMessages.fill(
                              messages.carouselGoTo,
                              {'index': '${i + 1}'},
                            ),
                            current: i == index,
                            onPressed: () => _go(i),
                          ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _content(int i, bool active) {
    final item = widget.items[i];
    return widget.itemBuilder?.call(context, item, i, active) ??
        _DefaultSlide(
          item: item,
          square: widget.variant == CarouselVariant.coverflow,
        );
  }

  /// A slide named "2 of 5". Out of view in the slide and coverflow
  /// layouts, it is hidden from assistive technology and takes no focus or
  /// press, as the web's `inert` slide.
  Widget _slide(int i, int index) {
    final active = i == index;
    final slide = Semantics(
      container: true,
      explicitChildNodes: true,
      label: _slideName(i),
      hint: InvisibleTheme.of(context).messages.carouselSlideRoleDescription,
      child: _content(i, active),
    );
    if (active) return slide;
    return IgnorePointer(
      child: ExcludeFocus(child: ExcludeSemantics(child: slide)),
    );
  }

  Widget _galleryView(int index) {
    while (_galleryKeys.length < _count) {
      _galleryKeys.add(GlobalKey());
    }
    final width = MediaQuery.textScalerOf(context).scale(_galleryItemWidth);
    return _GalleryViewport(
      controller: _gallery,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: _galleryGap,
        children: [
          for (var i = 0; i < _count; i++)
            SizedBox(
              key: _galleryKeys[i],
              width: width,
              child: Semantics(
                container: true,
                explicitChildNodes: true,
                label: _slideName(i),
                hint: InvisibleTheme.of(
                  context,
                ).messages.carouselSlideRoleDescription,
                selected: i == index,
                child: _content(i, i == index),
              ),
            ),
        ],
      ),
    );
  }
}

/// The slide layout: one slide in view, the others beside it out of the
/// clip, moving into place.
class _SlideTrack extends StatelessWidget {
  const _SlideTrack({required this.index, required this.children});

  final int index;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final mirror = Directionality.of(context) == TextDirection.rtl ? -1 : 1;
    return ClipRRect(
      borderRadius: BorderRadius.circular(InvisibleRadiusTokens.container),
      child: TweenAnimationBuilder<double>(
        tween: Tween(end: index.toDouble()),
        duration: reducedMotion(context) ? Duration.zero : _transition,
        curve: Curves.ease,
        builder: (context, position, _) => Stack(
          children: [
            for (final (i, child) in children.indexed)
              FractionalTranslation(
                translation: Offset((i - position) * mirror, 0),
                child: child,
              ),
          ],
        ),
      ),
    );
  }
}

/// The coverflow layout: the current item centred and upright, its
/// neighbours scaled down and turned away on each side. Items further than
/// two places away are not drawn.
class _CoverflowTrack extends StatelessWidget {
  const _CoverflowTrack({
    required this.index,
    required this.orientation,
    required this.children,
  });

  final int index;
  final Axis orientation;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final vertical = orientation == Axis.vertical;
    final mirror = Directionality.of(context) == TextDirection.rtl ? -1.0 : 1.0;
    final scale = MediaQuery.textScalerOf(context).scale(1);
    return SizedBox(
      height: vertical ? _coverflowHeightVertical : _coverflowHeight,
      child: ClipRect(
        child: TweenAnimationBuilder<double>(
          tween: Tween(end: index.toDouble()),
          duration: reducedMotion(context) ? Duration.zero : _transition,
          curve: Curves.ease,
          builder: (context, position, _) {
            final order =
                [
                  for (var i = 0; i < children.length; i++)
                    if ((i - position).abs() <= 2.5) i,
                ]..sort(
                  (a, b) =>
                      (b - position).abs().compareTo((a - position).abs()),
                );
            return Stack(
              alignment: Alignment.center,
              children: [
                for (final i in order)
                  Transform(
                    alignment: Alignment.center,
                    transform: _matrix(i - position, vertical, mirror),
                    child: SizedBox(
                      width: _coverflowItem * scale,
                      child: children[i],
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }

  static Matrix4 _matrix(double offset, bool vertical, double mirror) {
    final shrink = math.max(0.0, 1 - offset.abs() * 0.15);
    final matrix = Matrix4.identity()..setEntry(3, 2, _perspective);
    if (vertical) {
      matrix
        ..multiply(
          Matrix4.translationValues(0, _coverflowSpacingVertical * offset, 0),
        )
        ..multiply(Matrix4.rotationX(offset * 8 * math.pi / 180));
    } else {
      matrix
        ..multiply(
          Matrix4.translationValues(_coverflowSpacing * offset * mirror, 0, 0),
        )
        ..multiply(Matrix4.rotationY(-offset * 18 * mirror * math.pi / 180));
    }
    return matrix..multiply(Matrix4.diagonal3Values(shrink, shrink, shrink));
  }
}

/// The gallery viewport: a row that scrolls sideways and takes focus, so
/// the arrow keys reach it, with the focus ring inside its bounds.
class _GalleryViewport extends StatefulWidget {
  const _GalleryViewport({required this.controller, required this.child});

  final ScrollController controller;
  final Widget child;

  @override
  State<_GalleryViewport> createState() => _GalleryViewportState();
}

class _GalleryViewportState extends State<_GalleryViewport> {
  bool _focusVisible = false;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    return FocusableActionDetector(
      onShowFocusHighlight: (value) => setState(() => _focusVisible = value),
      child: FocusRingPainter(
        visible: _focusVisible,
        ring: theme.focusRing,
        radius: InvisibleRadiusTokens.container,
        inside: true,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(InvisibleRadiusTokens.container),
          child: SingleChildScrollView(
            controller: widget.controller,
            scrollDirection: Axis.horizontal,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

/// A slide picker button: a dot, wider and filled for the current slide,
/// so the current one shows by its shape as well as its colour.
class _Dot extends StatelessWidget {
  const _Dot({
    super.key,
    required this.label,
    required this.current,
    required this.onPressed,
  });

  final String label;
  final bool current;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    return Semantics(
      container: true,
      button: true,
      selected: current,
      label: label,
      onTap: onPressed,
      child: Pressable(
        onPressed: onPressed,
        builder: (context, states) => FocusRingPainter(
          visible: states.focusVisible,
          ring: theme.focusRing,
          radius: _dot,
          child: SizedBox.square(
            dimension: 24,
            child: Center(
              child: Container(
                width: current ? _currentDotWidth : _dot,
                height: _dot,
                decoration: BoxDecoration(
                  color: current ? colors.primary : colors.controlBorder,
                  borderRadius: BorderRadius.circular(_dot),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The built-in slide: the image, or the neutral surface, with the title
/// and the description over a dark band strong enough for white text.
class _DefaultSlide extends StatelessWidget {
  const _DefaultSlide({required this.item, required this.square});

  final CarouselSlide item;
  final bool square;

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final image = item.image;
    final title = item.title;
    final description = item.description;
    final hasText =
        (title != null && title.isNotEmpty) ||
        (description != null && description.isNotEmpty);
    const onBand = Color(0xFFFFFFFF);
    // The ratio is a minimum: large text makes the slide taller instead of
    // cutting the title off.
    return LayoutBuilder(
      builder: (context, constraints) => Container(
        constraints: BoxConstraints(
          minHeight: constraints.hasBoundedWidth
              ? constraints.maxWidth / (square ? 1 : 16 / 9)
              : 0,
        ),
        alignment: Alignment.bottomCenter,
        decoration: BoxDecoration(
          color: theme.colors.neutralSurface,
          borderRadius: square
              ? BorderRadius.circular(InvisibleRadiusTokens.container)
              : null,
          image: image == null
              ? null
              : DecorationImage(image: image, fit: BoxFit.cover),
        ),
        child: !hasText
            ? null
            : Container(
                width: double.infinity,
                padding: const EdgeInsets.all(_overlayPadding),
                // The band stays at least 55% black under the text, so
                // white text keeps 4.5:1 over any image or surface.
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [Color(0xB3000000), Color(0x8C000000)],
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 5.6,
                  children: [
                    if (title != null && title.isNotEmpty)
                      Text(
                        title,
                        style: theme.textStyle.copyWith(
                          color: onBand,
                          fontSize: square ? 16.8 : _titleSize,
                          fontWeight: FontWeight.w700,
                          height: InvisibleTypographyTokens.lineHeightHeading,
                        ),
                      ),
                    if (description != null && description.isNotEmpty)
                      Text(
                        description,
                        style: theme.textStyle.copyWith(color: onBand),
                      ),
                  ],
                ),
              ),
      ),
    );
  }
}
