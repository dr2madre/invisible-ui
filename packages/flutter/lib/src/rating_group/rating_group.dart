import 'dart:ui' show SemanticsRole;

import 'package:flutter/widgets.dart';

import '../choice/choice_item.dart';
import '../internal/single_choice.dart';
import '../internal/toggle_tile.dart';
import '../internal/value_control.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web RatingGroup sets in its own stylesheet.
const double _star = 24;
const double _gap = 2;
const double _labelGap = 8;
const double _labelSize = 14;
const double _ringRadius = 2;

/// A star rating, such as 4 of 5 stars, following the WAI-ARIA radio group
/// pattern: each star is a radio named "N stars", as on the web.
///
/// The group is one tab stop: the chosen star, or the first one when none
/// is chosen. The arrow keys move to the next or previous star, wrapping,
/// and choose it; right and left follow the reading direction. Space or a
/// tap chooses the focused star. While the pointer is over the stars, those
/// up to it show a grey preview of the rating about to be set.
///
/// Controlled, [RatingGroup] shows [value] (1 to [max], or null) and reports
/// each choice through [onChanged]; [RatingGroup.uncontrolled] keeps its own
/// value. A changed [value] is shown without a report. Inside a [Form] it
/// saves with [onSaved], and a form reset restores the current default
/// silently. The star names come from [InvisibleMessages.ratingStars].
class RatingGroup extends StatefulWidget {
  /// A rating that shows [value], controlled by the parent.
  const RatingGroup({
    super.key,
    required this.label,
    required this.value,
    this.onChanged,
    this.max = 5,
    this.enabled = true,
    this.onSaved,
  }) : initialValue = null,
       _controlled = true;

  /// A rating that keeps its own value, starting from [initialValue].
  const RatingGroup.uncontrolled({
    super.key,
    required this.label,
    this.initialValue,
    this.onChanged,
    this.max = 5,
    this.enabled = true,
    this.onSaved,
  }) : value = null,
       _controlled = false;

  /// The visible label and the group's accessible name.
  final String label;

  /// The rating when the parent controls it; null when none is set.
  final int? value;

  /// The starting rating of the uncontrolled form, and its reset default.
  final int? initialValue;

  /// Called with the chosen rating after a user choice. Never called for a
  /// changed [value] or a form reset.
  final ValueChanged<int>? onChanged;

  /// The number of stars.
  final int max;

  /// Whether the stars take focus and change.
  final bool enabled;

  /// Called with the rating when the enclosing [Form] saves.
  final FormFieldSetter<int?>? onSaved;

  final bool _controlled;

  @override
  State<RatingGroup> createState() => _RatingGroupState();
}

class _RatingGroupState extends State<RatingGroup>
    with ValueControl<int?, RatingGroup> {
  final SingleChoiceFocus<int> _focus = SingleChoiceFocus<int>();
  int _hovered = 0;

  @override
  bool get isControlled => widget._controlled;

  @override
  int? controlledValueOf(RatingGroup widget) => widget.value;

  @override
  int? get initialValueOfWidget => widget.initialValue;

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  void _choose(int next) {
    if (commitValue(next)) widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final enabled = widget.enabled;
    final items = [
      for (var n = 1; n <= widget.max; n++)
        ChoiceItem(value: n, label: theme.messages.ratingStars(n)),
    ];
    _focus.sync(items, value, enabled: enabled);
    final chosen = value ?? 0;

    final stars = MouseRegion(
      onExit: (_) => setState(() => _hovered = 0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        spacing: _gap,
        children: [
          for (final item in items)
            MouseRegion(
              key: ValueKey(item.value),
              onEnter: enabled
                  ? (_) => setState(() => _hovered = item.value)
                  : null,
              child: ToggleTile(
                label: item.label,
                semanticLabel: item.label,
                hideLabel: true,
                indicator: _StarGlyph(
                  look: _hovered > 0
                      ? (item.value <= _hovered ? _Look.preview : _Look.empty)
                      : (item.value <= chosen ? _Look.filled : _Look.empty),
                ),
                indicatorRadius: _ringRadius,
                onActivate: enabled ? () => _choose(item.value) : null,
                checked: item.value == value,
                inMutuallyExclusiveGroup: true,
                focusNode: _focus.nodeFor(item.value),
              ),
            ),
        ],
      ),
    );

    return buildFormField(
      enabled: enabled,
      onSaved: widget.onSaved,
      builder: (_) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: _labelGap,
        children: [
          ExcludeSemantics(
            child: GestureDetector(
              onTap: _focus.focusTabStop,
              child: Text(
                widget.label,
                style: theme.textStyle.copyWith(
                  fontSize: _labelSize,
                  fontWeight: FontWeight.w600,
                  color: colors.text,
                ),
              ),
            ),
          ),
          Semantics(
            container: true,
            explicitChildNodes: true,
            role: SemanticsRole.radioGroup,
            label: widget.label,
            enabled: enabled ? null : false,
            child: SingleChoiceKeys<int>(
              focus: _focus,
              items: items,
              onMove: _choose,
              child: stars,
            ),
          ),
        ],
      ),
    );
  }
}

/// How a star is painted.
enum _Look {
  /// An outline.
  empty,

  /// Filled grey: the rating the pointer is about to set.
  preview,

  /// Filled with the selection colour: the rating set.
  filled,
}

/// A star, 1.5rem at text scale 1, coloured by its [look].
class _StarGlyph extends StatelessWidget {
  const _StarGlyph({required this.look});

  final _Look look;

  @override
  Widget build(BuildContext context) {
    final color = switch (look) {
      _Look.empty => InvisiblePalette.grey400,
      _Look.preview => InvisiblePalette.grey300,
      _Look.filled => InvisibleTheme.of(context).colors.secondary,
    };
    return CustomPaint(
      size: Size.square(indicatorSide(context, _star)),
      painter: _StarPainter(color: color, filled: look != _Look.empty),
    );
  }
}

/// The web's star, on its 24 by 24 grid: stroked, and filled when [filled].
class _StarPainter extends CustomPainter {
  const _StarPainter({required this.color, required this.filled});

  final Color color;
  final bool filled;

  static const List<double> _points = [
    12, 2, 15.09, 8.26, 22, 9.27, 17, 14.14, 18.18, 21.02, //
    12, 17.77, 5.82, 21.02, 7, 14.14, 2, 9.27, 8.91, 8.26,
  ];

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24);
    final path = Path()..moveTo(_points[0], _points[1]);
    for (var i = 2; i < _points.length; i += 2) {
      path.lineTo(_points[i], _points[i + 1]);
    }
    path.close();
    if (filled) canvas.drawPath(path, Paint()..color = color);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeJoin = StrokeJoin.round
        ..color = color,
    );
  }

  @override
  bool shouldRepaint(_StarPainter old) =>
      old.color != color || old.filled != filled;
}
