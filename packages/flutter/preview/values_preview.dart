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

/// The value controls in their common states: Slider, RangeSlider,
/// RatingGroup, PinInput, Radio, ToggleButton, ToggleGroup, ButtonGroup,
/// Stepper and Separator.
@Preview(group: 'Values', name: 'States, light', brightness: Brightness.light)
@Preview(group: 'Values', name: 'States, dark', brightness: Brightness.dark)
Widget valueStates() => const PreviewSheet(child: _Values());

/// The same set right to left at text scale 2.0 in a narrow column: the
/// arrows and the tracks mirror, the stepper stacks, the cells wrap.
@Preview(
  group: 'Values',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 2400),
)
Widget valuesRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: PreviewSheet(child: _Values()),
);

/// Touch density: thumbs, stars, toggles and steps keep a 44 by 44 target.
@Preview(group: 'Values', name: 'Touch density', size: Size(480, 2000))
Widget valuesTouch() =>
    const PreviewSheet(density: InvisibleDensity.touch, child: _Values());

class _Values extends StatelessWidget {
  const _Values();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 24);
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Slider.uncontrolled(
            label: 'Volume',
            initialValue: 40,
            showValue: true,
            showRange: true,
          ),
          gap,
          Slider.uncontrolled(
            label: 'Hours',
            initialValue: 4,
            max: 8,
            ticks: true,
            showValue: true,
            format: (v) => '${v.round()} h',
          ),
          gap,
          const Slider.uncontrolled(label: 'Locked', enabled: false),
          gap,
          const RangeSlider.uncontrolled(
            label: 'Price',
            thumbLabels: ('Minimum price', 'Maximum price'),
            initialValue: (20, 80),
            minDistance: 10,
            showValue: true,
          ),
          gap,
          const RatingGroup.uncontrolled(label: 'Rating', initialValue: 3),
          gap,
          const PinInput.uncontrolled(label: 'Verification code'),
          gap,
          const PinInput.uncontrolled(
            label: 'PIN',
            length: 4,
            initialValue: '12',
            obscureText: true,
            invalid: true,
          ),
          gap,
          const _Plans(),
          gap,
          const ToggleGroup(
            semanticLabel: 'Formatting',
            variant: ToggleGroupVariant.segmented,
            children: [
              ToggleButton.uncontrolled(initialValue: true, child: Text('B')),
              ToggleButton.uncontrolled(child: Text('I')),
              ToggleButton.uncontrolled(child: Text('U')),
            ],
          ),
          gap,
          const ToggleGroup(
            semanticLabel: 'Filters',
            wrap: true,
            children: [
              ToggleButton.uncontrolled(
                initialValue: true,
                check: true,
                child: Text('Design'),
              ),
              ToggleButton.uncontrolled(check: true, child: Text('Research')),
              ToggleButton.uncontrolled(check: true, child: Text('Writing')),
              ToggleButton.uncontrolled(enabled: false, child: Text('Legal')),
            ],
          ),
          gap,
          ButtonGroup(
            semanticLabel: 'History',
            children: [
              Button(onPressed: () {}, child: const Text('Undo')),
              Button(onPressed: () {}, child: const Text('Redo')),
              Button.icon(
                onPressed: () {},
                icon: const PreviewGlyph(),
                semanticLabel: 'More',
              ),
            ],
          ),
          gap,
          const Separator(),
          gap,
          const Stepper.uncontrolled(
            initialStep: 1,
            steps: [
              StepItem(label: 'Account'),
              StepItem(label: 'Profile', description: 'Name and photo'),
              StepItem(label: 'Review'),
            ],
          ),
        ],
      ),
    );
  }
}

/// Three radios the app lays out itself.
class _Plans extends StatefulWidget {
  const _Plans();

  @override
  State<_Plans> createState() => _PlansState();
}

class _PlansState extends State<_Plans> {
  String _plan = 'pro';

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final (value, label) in [
          ('free', 'Free'),
          ('pro', 'Pro, billed monthly'),
          ('team', 'Team'),
        ])
          Radio<String>(
            name: 'plan',
            value: value,
            groupValue: _plan,
            label: label,
            onChanged: (next) => setState(() => _plan = next),
          ),
      ],
    );
  }
}
