// Widget previews for review: run `flutter widget-preview start` in
// packages/flutter. The previewer arrived in Flutter 3.35, after the package's
// lower bound, so this file sits outside lib/ and test/.
import 'package:flutter/widget_previews.dart';
// widgets.dart exports Brightness only from Flutter 3.44 on.
// ignore: unnecessary_import
import 'package:flutter/foundation.dart' show Brightness;
import 'package:flutter/widgets.dart';
import 'package:invisible_ui/invisible_ui.dart';

/// Every field in its common states, in the theme that matches the
/// preview's brightness.
@Preview(group: 'Fields', name: 'States, light', brightness: Brightness.light)
@Preview(group: 'Fields', name: 'States, dark', brightness: Brightness.dark)
Widget fieldStates() => const _Sheet(child: _AllFields());

/// The same set right to left at text scale 2.0, in a narrow column.
@Preview(
  group: 'Fields',
  name: 'Right to left, text scale 2.0',
  textScaleFactor: 2,
  size: Size(360, 1400),
)
Widget fieldsRightToLeft() => const Directionality(
  textDirection: TextDirection.rtl,
  child: _Sheet(locale: Locale('ar', 'EG'), child: _AllFields()),
);

/// Touch density: the text boxes and step buttons keep 44 by 44 targets.
@Preview(group: 'Fields', name: 'Touch density')
Widget fieldsTouch() => const _Sheet(
  density: InvisibleDensity.touch,
  child: NumberField.uncontrolled(label: 'Hours', initialValue: 7.5, step: 0.5),
);

/// Paints the page, picks the theme from the preview's brightness and sets
/// the locale the number field reads.
class _Sheet extends StatelessWidget {
  const _Sheet({
    required this.child,
    this.density = InvisibleDensity.regular,
    this.locale = const Locale('en'),
  });

  final Widget child;
  final InvisibleDensity density;
  final Locale locale;

  @override
  Widget build(BuildContext context) {
    final theme = MediaQuery.platformBrightnessOf(context) == Brightness.dark
        ? InvisibleThemeData.dark(density: density)
        : InvisibleThemeData.light(density: density);
    return Localizations(
      locale: locale,
      delegates: const [DefaultWidgetsLocalizations.delegate],
      child: InvisibleTheme(
        data: theme,
        child: ColoredBox(
          color: theme.colors.background,
          // Scrolls when large text makes the sheet taller than the preview.
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: DefaultTextStyle(
              style: theme.textStyle.copyWith(color: theme.colors.text),
              // Fields fill the width they get; a form caps it.
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: child,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AllFields extends StatelessWidget {
  const _AllFields();

  @override
  Widget build(BuildContext context) {
    const gap = SizedBox(height: 16);
    return const Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField.uncontrolled(
          label: 'Name',
          description: 'As it appears on your badge.',
          placeholder: 'Ada Lovelace',
          required: true,
        ),
        gap,
        TextField.uncontrolled(
          label: 'Email',
          initialValue: 'ada@',
          error: 'Enter a complete address.',
        ),
        gap,
        TextField.uncontrolled(
          label: 'Team',
          initialValue: 'Engines',
          enabled: false,
        ),
        gap,
        TextField.uncontrolled(
          label: 'Account',
          initialValue: 'ada-1815',
          readOnly: true,
        ),
        gap,
        Textarea.uncontrolled(
          label: 'Notes',
          description: 'Three to six lines.',
          maxLines: 6,
        ),
        gap,
        NumberField.uncontrolled(
          label: 'Hours',
          description: 'Round to the nearest half hour.',
          initialValue: 1234.5,
          min: 0,
          max: 10000,
          step: 0.5,
        ),
        gap,
        NumberField.uncontrolled(label: 'Rate', initialValue: 12, max: 10),
      ],
    );
  }
}
