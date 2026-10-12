import 'package:flutter/widgets.dart';

import '../theme/theme.dart';
import 'messages.dart';

// Languages and scripts written right to left: the fixed list of
// `core/src/i18n/locale.ts`, checked by the shared vectors in
// `core/src/i18n/__vectors__/locale-direction.json`.
const Set<String> _rtlLanguages = {
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'ku',
  'ps',
  'sd',
  'ug',
  'ur',
  'yi',
};
const Set<String> _rtlScripts = {'Arab', 'Hebr', 'Thaa', 'Nkoo', 'Rohg'};

/// The writing direction of [locale]: right to left for the right-to-left
/// scripts and languages (Arabic, Hebrew, Persian, Urdu and the others the
/// web adapters list), left to right otherwise.
TextDirection localeDirection(Locale locale) {
  final script = locale.scriptCode;
  if (script != null) {
    final canonical = script.length == 4
        ? '${script[0].toUpperCase()}${script.substring(1).toLowerCase()}'
        : script;
    if (_rtlScripts.contains(canonical)) return TextDirection.rtl;
    // A script that is given and not right to left decides: `ku-Latn`.
    return TextDirection.ltr;
  }
  return _rtlLanguages.contains(locale.languageCode.toLowerCase())
      ? TextDirection.rtl
      : TextDirection.ltr;
}

/// Sets the locale, the writing direction and the messages for everything
/// inside it, as the web's Locale Provider does.
///
/// [locale] reaches the components through Flutter's [Localizations]
/// (dates, numbers, the week start); [textDirection] defaults to the
/// locale's own ([localeDirection]); [messages] replaces the theme's
/// messages, for a translated catalog. A component's own label still wins.
/// Nested providers override their subtree only, and a change applies in
/// place: no state, focus or draft is lost.
///
/// An app with `WidgetsApp` or `MaterialApp` usually sets these at the top;
/// this widget is for a part of the screen in another language, or for an
/// app that builds its own root.
class LocaleProvider extends StatelessWidget {
  /// Applies [locale] to [child].
  const LocaleProvider({
    super.key,
    required this.locale,
    required this.child,
    this.textDirection,
    this.messages,
  });

  /// The locale.
  final Locale locale;

  /// The writing direction. Defaults to [localeDirection] of [locale].
  final TextDirection? textDirection;

  /// The messages for the components inside. Defaults to the theme's.
  final InvisibleMessages? messages;

  /// The subtree.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    Widget content = Directionality(
      textDirection: textDirection ?? localeDirection(locale),
      child: messages == null
          ? child
          : InvisibleTheme.merge(messages: messages, child: child),
    );
    // The surrounding app's delegates carry on with the new locale; with no
    // Localizations above, the subtree gets one of its own.
    final hasAncestor = Localizations.maybeLocaleOf(context) != null;
    content = hasAncestor
        ? Localizations.override(
            context: context,
            locale: locale,
            child: content,
          )
        : Localizations(
            locale: locale,
            delegates: const [DefaultWidgetsLocalizations.delegate],
            child: content,
          );
    return content;
  }
}
