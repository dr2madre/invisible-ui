import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:invisible_ui/invisible_ui.dart';

import 'harness.dart';

Finder _field(String label) =>
    find.ancestor(of: find.text(label), matching: find.byType(TextField));

EditableText _editable(WidgetTester tester, String label) =>
    tester.widget<EditableText>(
      find.descendant(of: _field(label), matching: find.byType(EditableText)),
    );

void main() {
  testWidgets('labels from the catalog; a heading; autofill hints for a '
      'password manager; the email keyboard; a hidden password', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(appHarness((_) => const LoginForm()));
    expect(find.byType(AutofillGroup), findsOneWidget);
    expect(
      tester.getSemantics(find.text('Sign in').first),
      semanticsWith(isHeader: true),
    );
    final email = _editable(tester, 'Email');
    expect(email.autofillHints, [AutofillHints.username, AutofillHints.email]);
    expect(email.keyboardType, TextInputType.emailAddress);
    expect(email.textInputAction, TextInputAction.next);
    expect(find.text('you@example.com'), findsOneWidget);
    final password = _editable(tester, 'Password');
    expect(password.autofillHints, [AutofillHints.password]);
    expect(password.obscureText, isTrue);
    expect(find.text('Forgot password?'), findsNothing);
    expect(find.text('or'), findsNothing);
    semantics.dispose();
  });

  testWidgets('submit reports the typed values once; Enter in the email '
      'moves to the password, Enter there submits', (tester) async {
    final reports = <LoginCredentials>[];
    await tester.pumpWidget(
      appHarness((_) => LoginForm(onSubmitted: reports.add)),
    );
    await tester.enterText(_field('Email'), 'ada@example.com');
    await tester.testTextInput.receiveAction(TextInputAction.next);
    await tester.pump();
    expect(_editable(tester, 'Password').focusNode.hasFocus, isTrue);
    await tester.enterText(_field('Password'), 'secret');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    expect(reports, hasLength(1));
    expect(reports.single.email, 'ada@example.com');
    expect(reports.single.password, 'secret');
    await tester.tap(find.text('Sign in').last);
    await tester.pump();
    expect(reports, hasLength(2));
  });

  testWidgets('validators run on submit; an error shows and nothing is '
      'reported', (tester) async {
    final semantics = tester.ensureSemantics();
    final reports = <LoginCredentials>[];
    await tester.pumpWidget(
      appHarness(
        (_) => LoginForm(
          onSubmitted: reports.add,
          emailValidator: (value) =>
              (value ?? '').contains('@') ? null : 'Enter an email address.',
        ),
      ),
    );
    await tester.enterText(_field('Email'), 'ada');
    await tester.tap(find.text('Sign in').last);
    await tester.pump();
    expect(reports, isEmpty);
    expect(
      find.text('Enter an email address.', findRichText: true),
      findsOneWidget,
    );
    semantics.dispose();
  });

  testWidgets('reset empties both fields; the password field holds the '
      'typed text until then', (tester) async {
    final login = GlobalKey<LoginFormState>();
    final reports = <LoginCredentials>[];
    await tester.pumpWidget(
      appHarness((_) => LoginForm(key: login, onSubmitted: reports.add)),
    );
    await tester.enterText(_field('Email'), 'ada@example.com');
    await tester.enterText(_field('Password'), 'secret');
    await tester.tap(find.text('Sign in').last);
    await tester.pump();
    expect(reports.single.password, 'secret');
    expect(_editable(tester, 'Password').controller.text, 'secret');
    login.currentState!.reset();
    await tester.pump();
    expect(_editable(tester, 'Password').controller.text, isEmpty);
    expect(_editable(tester, 'Email').controller.text, isEmpty);
  });

  testWidgets('providers: "Continue with" buttons above an "or" divider; '
      'the forgotten password link with its callback', (tester) async {
    final providers = <String>[];
    var forgot = 0;
    await tester.pumpWidget(
      appHarness(
        (_) => LoginForm(
          providers: const [
            LoginProvider(id: 'google', label: 'Google'),
            LoginProvider(id: 'github', label: 'GitHub'),
          ],
          onProvider: providers.add,
          onForgotPassword: () => forgot++,
          heading: 'Welcome back',
          subheading: 'Use your work account',
        ),
      ),
    );
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Use your work account'), findsOneWidget);
    expect(find.text('or'), findsOneWidget);
    await tester.tap(find.text('Continue with GitHub'));
    await tester.tap(find.text('Forgot password?'));
    expect(providers, ['github']);
    expect(forgot, 1);
  });

  testWidgets('translated messages replace the labels', (tester) async {
    await tester.pumpWidget(
      appHarness(
        (_) => const LoginForm(),
        theme: InvisibleThemeData.light(
          messages: const InvisibleMessages().copyWith(
            loginFormEmail: 'E-mail',
            loginFormSubmit: 'Accedi',
          ),
        ),
      ),
    );
    expect(find.text('E-mail'), findsOneWidget);
    expect(find.text('Accedi'), findsOneWidget);
  });

  testWidgets('narrow at text scale 2.0, right to left: nothing overflows; '
      'targets 44 by 44 under touch; text contrast', (tester) async {
    await tester.pumpWidget(
      appHarness(
        (_) => SizedBox(
          width: 320,
          child: SingleChildScrollView(
            child: LoginForm(
              providers: const [LoginProvider(id: 'google', label: 'Google')],
              onForgotPassword: () {},
            ),
          ),
        ),
        textScale: 2,
        direction: TextDirection.rtl,
        theme: InvisibleThemeData.light(density: InvisibleDensity.touch),
      ),
    );
    expect(tester.takeException(), isNull);
    final semantics = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(targetGuideline44));
    await expectLater(tester, meetsGuideline(textContrastGuideline));
    semantics.dispose();
  });
}
