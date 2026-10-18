// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. Preview groups arrived after Flutter 3.35, the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart' hide RadioGroup;

import 'preview_sheet.dart';

/// Radios inside the widgets library's RadioGroup: a group with a checked
/// radio, and one whose checked radio is disabled.
@Preview(
  group: 'Radio',
  name: 'In a RadioGroup, light',
  brightness: Brightness.light,
)
@Preview(
  group: 'Radio',
  name: 'In a RadioGroup, dark',
  brightness: Brightness.dark,
)
Widget radioStates() => const PreviewSheet(child: _Radios());

/// Right to left at text scale 2.0 in a narrow column: the labels wrap and
/// the horizontal arrows mirror.
@Preview(
  group: 'Radio',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 900),
)
Widget radioRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Radios()),
);

/// Touch density: every row keeps a 44 by 44 target.
@Preview(group: 'Radio', name: 'Touch density')
Widget radioTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Radios());

class _Radios extends StatelessWidget {
  const _Radios();

  @override
  Widget build(BuildContext context) {
    return const Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 16,
      children: [
        _Group(initial: 'pro'),
        _Group(initial: 'team', teamDisabled: true),
      ],
    );
  }
}

class _Group extends StatefulWidget {
  const _Group({required this.initial, this.teamDisabled = false});

  final String initial;
  final bool teamDisabled;

  @override
  State<_Group> createState() => _GroupState();
}

class _GroupState extends State<_Group> {
  late String? _plan = widget.initial;

  @override
  Widget build(BuildContext context) {
    return RadioGroup<String>(
      groupValue: _plan,
      onChanged: (next) => setState(() => _plan = next),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Radio<String>(value: 'free', label: 'Free'),
          const Radio<String>(value: 'pro', label: 'Pro, billed monthly'),
          Radio<String>(
            value: 'team',
            label: 'Team',
            enabled: !widget.teamDisabled,
          ),
        ],
      ),
    );
  }
}
