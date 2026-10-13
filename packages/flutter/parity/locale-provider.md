# LocaleProvider parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `core/src/i18n/locale.ts` `packages/svelte/src/lib/i18n`

The Flutter `LocaleProvider` checked against the Svelte `LocaleProvider`
(`packages/svelte/src/lib/i18n`) and `core/src/i18n/locale.ts`.
Docs page: [Locale Provider](https://dr2madre.github.io/invisible-ui/components/localization/locale-provider/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/locale_provider_test.dart` that holds it. The direction rule answers
the shared vectors in `core/src/i18n/__vectors__/locale-direction.json`
(`test/data_vectors_test.dart`).

## Names

| Flutter | Svelte | Meaning |
| --- | --- | --- |
| `LocaleProvider(locale: Locale)` | `locale` (a BCP-47 tag) | the locale |
| `textDirection` | `dir` | the writing direction |
| `messages: InvisibleMessages` | `messages` | message overrides |
| `localeDirection(Locale)` | `localeDirection(tag)` | the direction rule |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| Sets the locale for the subtree | matched | through Flutter's `Localizations`, which the components already read (calendar, number field, week start): `sets the locale, the direction from the locale and the messages for its subtree` |
| The direction follows the locale; a given direction wins | matched | same test, `a given direction wins; …` |
| Message overrides | adapted | a full `InvisibleMessages` (with `copyWith` for a few keys) on a nested theme, the Flutter way to carry the catalog; a component's own label still wins |
| Plural messages | adapted | the count messages are functions of the count (`ratingStars`, `avatarGroupMore`, `tableResults`), so a translation picks its own plural forms |
| Nested providers override their subtree | matched | `a given direction wins; nested providers …` |
| A change applies in place, keeping state | matched | `a changed locale applies in place: state is kept` |
| Tag canonicalization and the malformed-tag warning | out of scope | a `Locale` is already structured |
| Without a locale from the app: the page's or app's locale, then the international default (Monday, 24 hours) | adapted | the web reads the page's `lang`; Flutter reads the app's locale from `Localizations` (what `WidgetsApp` resolved from the platform), then `Locale('en', '001')` with `DateSymbols.international`. The shared vectors in `core/src/i18n/__vectors__/default-locale.json` hold the cases: `test/default_locale_test.dart` |
| `lang` on the wrapper for assistive technology | adapted | Flutter passes the locale to the platform through `Localizations`; assistive technology: not tested |
