# LoginForm parity checklist

Reference commit: `0c336bd6e53053c3c9e46ad4d7701879eba50315`

Reference paths: `packages/svelte/src/lib/login-form`

The Flutter `LoginForm` checked against the Svelte `LoginForm`
(`packages/svelte/src/lib/login-form/LoginForm.svelte`) and the React
`LoginForm`, which reads its labels from the catalog.
Docs page: [Login Form](https://dr2madre.github.io/invisible-ui/components/patterns/login-form/).

Each line is **matched**, **adapted** (with the platform reason) or **out of
scope**. Every matched line names the widget test in
`test/login_form_test.dart` that holds it.

## Names

| Flutter | Svelte | ADR 0011 meaning |
| --- | --- | --- |
| `onSubmitted: ValueChanged<LoginCredentials>` | `onSubmit({ email, password })` | the submitted values |
| `providers: [LoginProvider(id:, label:)]`, `onProvider` | `providers`, `onProvider` | social sign-in |
| `providerIcon` | `providerIcon` snippet | a provider's icon |
| `logo` | `logo` snippet | the logo |
| `heading`, `subheading`, `submitLabel`, `forgotLabel` | the same names | texts |
| `onForgotPassword` | `forgotHref` | the forgotten password link: Flutter opens it through the app's callback, as `Link` does |
| `emailValidator`, `passwordValidator` | none | Flutter's form validation; none by default |
| `LoginFormState.reset()`, through a `GlobalKey` | the native form's `reset()` | empties the fields |

## Behaviour

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A real form; submit reports the typed email and password | matched | `submit reports the typed values once; …` |
| Values read from the fields at submit, so a reset leaves nothing stale | matched | the fields save into the report (`FormState.save`), as React reads the form data |
| The password stays in its field until the app clears it | matched | the widget keeps no copy beyond the field and never logs it; the field keeps what was typed until the form resets or leaves the screen, as a native password field does. The app clears it after a successful sign-in with `LoginFormState.reset()`: `reset empties both fields; …` |
| Enter submits | adapted | Enter in the password field submits; Enter in the email field moves to the password field, the platform's next action on a touch keyboard: same test |
| Provider buttons report their id | matched | `providers: …` |
| The forgotten password link | adapted | shown when `onForgotPassword` is set; the web shows it with `href="#"` by default |
| Validation | adapted | none by default, as on the web; `emailValidator` and `passwordValidator` run on submit and block the report: `validators run on submit; …` |

## Semantics and autofill

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A level 2 heading | matched | `labels from the catalog; a heading; …` |
| Labels from the catalog (`loginForm.email`, `password`, `emailPlaceholder`, `divider`, `provider`) | matched | same test, `translated messages replace the labels`; the Svelte form writes them in English (an open point) |
| Email and password autofill | adapted | correct in Flutter: an `AutofillGroup` with `AutofillHints.username` and `AutofillHints.email` on the email field and `AutofillHints.password` on the password field, so a password manager fills and saves the credentials (WCAG 1.3.5). The web fields carry no `autocomplete` (an open point) |
| The email keyboard; the password hidden | matched | same test |
| Field errors announced | matched | the text field's error line, announced |
| Screen reader output | not yet verified | Assistive technology: not tested |

## Look and layout

| Line | Status | Evidence or reason |
| --- | --- | --- |
| A card at most 352 wide plus padding, never wider than its container | matched | `narrow at text scale 2.0, right to left: …` |
| Providers above an "or" divider | matched | `providers: …` |
| The forgotten password link under the password, at the inline end, underlined | matched | `Link` |
| Narrow at text scale 2.0, right to left: nothing overflows; 44 by 44 under touch; contrast | matched | same test |
