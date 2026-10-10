import 'package:flutter/widgets.dart';

import '../theme/theme.dart';

/// Whether the platform asks for reduced motion, as the web's
/// `prefers-reduced-motion` does.
bool reducedMotion(BuildContext context) =>
    MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// The font size of the surrounding text, for a component sized in `em`
/// on the web; the theme's base size where none is set.
double surroundingFontSize(BuildContext context) =>
    DefaultTextStyle.of(context).style.fontSize ??
    InvisibleTheme.of(context).textStyle.fontSize!;
