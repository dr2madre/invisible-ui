import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../button/button.dart';
import '../i18n/messages.dart';
import '../internal/elevation.dart';
import '../link/link.dart';
import '../text_field/text_field.dart';
import '../theme/theme.dart';
import '../tokens/tokens.g.dart';

// Sizes the web LoginForm sets in its own stylesheet.
const double _width = 352;
const double _padding = 28;
const double _gap = 16;
const double _headingSize = 20;
const double _subheadingSize = 14;
const double _smallSize = 13;
const double _providerGap = 8;
const double _fieldGap = 5.6;

/// A social sign-in provider of a [LoginForm].
@immutable
class LoginProvider {
  /// The provider [id], shown as "Continue with [label]".
  const LoginProvider({required this.id, required this.label});

  /// The id reported by [LoginForm.onProvider].
  final String id;

  /// The provider's name.
  final String label;
}

/// What [LoginForm.onSubmitted] receives.
@immutable
class LoginCredentials {
  /// The typed [email] and [password].
  const LoginCredentials({required this.email, required this.password});

  /// The email address, as typed.
  final String email;

  /// The password, as typed.
  final String password;
}

/// A sign-in form: an optional [logo], provider buttons, the email and the
/// password fields, a forgotten password link and the submit button, on a
/// card.
///
/// The fields carry the autofill hints a password manager reads (username
/// and email, then password) inside an [AutofillGroup], so the platform
/// offers saved credentials and offers to save new ones when the form
/// leaves the screen. The email field shows the email keyboard and Enter
/// moves to the password; Enter in the password field submits, as the
/// submit button does. The labels come from the catalog
/// (`loginForm.*`).
///
/// The form validates with [emailValidator] and [passwordValidator] on
/// submit, and reports the typed values through [onSubmitted] only when
/// both pass. The forgotten password link shows when [onForgotPassword] is
/// set. The widget never stores or logs the password.
class LoginForm extends StatefulWidget {
  /// Creates a sign-in form.
  const LoginForm({
    super.key,
    this.onSubmitted,
    this.heading,
    this.subheading,
    this.submitLabel,
    this.forgotLabel,
    this.onForgotPassword,
    this.providers = const [],
    this.onProvider,
    this.providerIcon,
    this.logo,
    this.emailValidator,
    this.passwordValidator,
  });

  /// Called with the typed credentials when the form is submitted and
  /// valid.
  final ValueChanged<LoginCredentials>? onSubmitted;

  /// The heading. Defaults to [InvisibleMessages.loginFormHeading].
  final String? heading;

  /// A line under the heading.
  final String? subheading;

  /// The submit button's text. Defaults to
  /// [InvisibleMessages.loginFormSubmit].
  final String? submitLabel;

  /// The forgotten password link's text. Defaults to
  /// [InvisibleMessages.loginFormForgot].
  final String? forgotLabel;

  /// Opens the app's password recovery; shows the link.
  final VoidCallback? onForgotPassword;

  /// Social sign-in providers, shown as buttons above the fields.
  final List<LoginProvider> providers;

  /// Called with the provider id when its button is pressed.
  final ValueChanged<String>? onProvider;

  /// The icon of a provider button, given the provider id. Decorative: the
  /// button's text names it.
  final Widget? Function(String id)? providerIcon;

  /// A logo above the heading.
  final Widget? logo;

  /// Checks the email on submit.
  final FormFieldValidator<String>? emailValidator;

  /// Checks the password on submit.
  final FormFieldValidator<String>? passwordValidator;

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final GlobalKey<FormState> _form = GlobalKey<FormState>();
  final FocusNode _password = FocusNode(debugLabel: 'LoginForm password');
  String _email = '';
  String _secret = '';

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    final form = _form.currentState;
    if (form == null || !form.validate()) return;
    // The values come from the fields themselves, so a reset never leaves
    // a stale copy behind.
    form.save();
    widget.onSubmitted?.call(
      LoginCredentials(email: _email, password: _secret),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = InvisibleTheme.of(context);
    final colors = theme.colors;
    final messages = theme.messages;
    final small = theme.textStyle.copyWith(
      color: colors.textSecondary,
      fontSize: _smallSize,
    );
    final subheading = widget.subheading;
    final divider = Expanded(child: Container(height: 1, color: colors.border));

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: _width + 2 * _padding),
      child: Container(
        padding: const EdgeInsets.all(_padding),
        decoration: BoxDecoration(
          color: colors.background,
          border: Border.all(color: colors.border),
          borderRadius: BorderRadius.circular(InvisibleRadiusTokens.surface),
          boxShadow: overlayShadow(theme.brightness),
        ),
        child: Form(
          key: _form,
          child: AutofillGroup(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: _gap,
              children: [
                if (widget.logo != null) Center(child: widget.logo),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Semantics(
                      header: true,
                      headingLevel: 2,
                      child: Text(
                        widget.heading ?? messages.loginFormHeading,
                        textAlign: TextAlign.center,
                        style: theme.textStyle.copyWith(
                          color: colors.text,
                          fontSize: _headingSize,
                          fontWeight: FontWeight.w700,
                          height: InvisibleTypographyTokens.lineHeightTight,
                        ),
                      ),
                    ),
                    if (subheading != null && subheading.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          subheading,
                          textAlign: TextAlign.center,
                          style: small.copyWith(fontSize: _subheadingSize),
                        ),
                      ),
                  ],
                ),
                if (widget.providers.isNotEmpty) ...[
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: _providerGap,
                    children: [
                      for (final provider in widget.providers)
                        Button(
                          key: ValueKey(provider.id),
                          onPressed: () => widget.onProvider?.call(provider.id),
                          icon: widget.providerIcon?.call(provider.id),
                          child: Text(
                            InvisibleMessages.fill(messages.loginFormProvider, {
                              'name': provider.label,
                            }),
                          ),
                        ),
                    ],
                  ),
                  Row(
                    spacing: 12,
                    children: [
                      divider,
                      Text(messages.loginFormDivider, style: small),
                      divider,
                    ],
                  ),
                ],
                TextField.uncontrolled(
                  label: messages.loginFormEmail,
                  placeholder: messages.loginFormEmailPlaceholder,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [
                    AutofillHints.username,
                    AutofillHints.email,
                  ],
                  validator: widget.emailValidator,
                  onSaved: (value) => _email = value ?? '',
                  onSubmitted: (_) => _password.requestFocus(),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: _fieldGap,
                  children: [
                    TextField.uncontrolled(
                      label: messages.loginFormPassword,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      focusNode: _password,
                      validator: widget.passwordValidator,
                      onSaved: (value) => _secret = value ?? '',
                      onSubmitted: (_) => _submit(),
                    ),
                    if (widget.onForgotPassword != null)
                      Align(
                        alignment: AlignmentDirectional.centerEnd,
                        child: DefaultTextStyle.merge(
                          style: const TextStyle(fontSize: _smallSize),
                          child: Link(
                            onPressed: widget.onForgotPassword!,
                            child: Text(
                              widget.forgotLabel ?? messages.loginFormForgot,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                Button(
                  variant: ButtonVariant.primary,
                  onPressed: _submit,
                  child: Text(widget.submitLabel ?? messages.loginFormSubmit),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
