# LocaleProvider parity checklist

Reference commit: `ade01acbb98d397c01af108a15c9da4bb9420720`

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
| An overlay rendered outside the tree takes the direction of the control that opens it | open | on the web the core reads it with `i18n.elementDirection`; Flutter builds an `OverlayPortal` child in the context of the control, so its `Directionality` applies, but no widget test holds it |
| Sets the locale for the subtree | matched | through Flutter's `Localizations`, which the components already read (calendar, number field, week start): `sets the locale, the direction from the locale and the messages for its subtree` |
| The direction follows the locale; a given direction wins | matched | same test, `a given direction wins; …` |
| Message overrides | adapted | a full `InvisibleMessages` (with `copyWith` for a few keys) on a nested theme, the Flutter way to carry the catalog; a component's own label still wins |
| The provider's messages reach the texts components take from the catalog, not only their labels (the web test covers the avatar group's overflow, the code block, the carousel, the table set's view switch and result count, a calendar day's events and range ends, the login form) | matched | Flutter components read the theme's messages, which the provider replaces: `sets the locale, the direction from the locale and the messages for its subtree`. Whether each component takes a given text from the catalog is a line of that component's checklist, for example `translated messages replace the labels` (`test/login_form_test.dart`) |
| Plural messages | adapted | the count messages are functions of the count (`ratingStars`, `avatarGroupMore`, `tableResults`), so a translation picks its own plural forms |
| Nested providers override their subtree | matched | `a given direction wins; nested providers …` |
| A change applies in place, keeping state | matched | `a changed locale applies in place: state is kept` |
| Tag canonicalization and the malformed-tag warning | out of scope | a `Locale` is already structured |
| Without a locale from the app: the page's or app's locale, then the international default (Monday, 24 hours) | adapted | the web reads the page's `lang` and `dir`, on the root element or the body; Flutter reads the app's locale from `Localizations` (what `WidgetsApp` resolved from the platform), then `Locale('en', '001')` with `DateSymbols.international`. The shared vectors in `core/src/i18n/__vectors__/default-locale.json` hold the cases: `test/default_locale_test.dart` |
| `lang` on the wrapper for assistive technology | adapted | Flutter passes the locale to the platform through `Localizations`; assistive technology: not tested |
