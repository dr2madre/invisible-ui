import type { FormEvent, ReactNode } from "react";
import { Button } from "../button/Button";
import { useI18n } from "../i18n/i18n";
import { TextField } from "../text-field/TextField";

/** A social sign-in provider, rendered as a button above the fields. */
export interface LoginFormProvider {
  id: string;
  label: string;
}

/** What `onSubmit` receives. */
export interface LoginFormValue {
  email: string;
  password: string;
}

export interface LoginFormProps {
  /** The card's heading. Defaults to the catalog's "Sign in". */
  heading?: string;
  subheading?: string;
  /** Submit button label. Defaults to the catalog's "Sign in". */
  submitLabel?: string;
  /** Where the forgot-password link goes. An empty string leaves the link out. */
  forgotHref?: string;
  /** Forgot-password link text. Defaults to the catalog's "Forgot password?". */
  forgotLabel?: string;
  /** Social providers rendered as buttons above the fields. */
  providers?: LoginFormProvider[];
  /** Called with the typed credentials when the form is submitted. */
  onSubmit?: (value: LoginFormValue) => void;
  /** Called with the provider id when a provider button is pressed. */
  onProvider?: (id: string) => void;
  /** A logo shown on top of the card. */
  logo?: ReactNode;
  /** The icon of a provider button, given the provider id. */
  renderProviderIcon?: (provider: string) => ReactNode;
}

const EMPTY: never[] = [];

/**
 * LoginForm: a sign-in form composed from the primitives: an optional logo on
 * top, optional social sign-in buttons, the email and password fields, a
 * "forgot password" link, and the submit button.
 *
 * It is a real `<form>`: the fields are native inputs (through TextField), and
 * `onSubmit` receives `{ email, password }` read from the form itself, so a
 * form reset leaves nothing stale behind. Presentation is a centered card;
 * themeable via `--ds-login-*` and the underlying component tokens.
 */
export function LoginForm({
  heading,
  subheading,
  submitLabel,
  forgotHref = "#",
  forgotLabel,
  providers = EMPTY,
  onSubmit,
  onProvider,
  logo,
  renderProviderIcon,
}: LoginFormProps) {
  const { t } = useI18n();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit?.({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
  };

  return (
    <form className="login" onSubmit={submit}>
      {logo != null ? <div className="login__logo">{logo}</div> : null}

      <div className="login__head">
        <h2 className="login__heading">{heading ?? t("loginForm.heading")}</h2>
        {subheading ? <p className="login__subheading">{subheading}</p> : null}
      </div>

      {providers.length > 0 ? (
        <>
          <div className="login__providers">
            {providers.map((provider) => (
              <Button
                key={provider.id}
                variant="default"
                onPress={() => onProvider?.(provider.id)}
                left={renderProviderIcon?.(provider.id)}
              >
                {t("loginForm.provider", { name: provider.label })}
              </Button>
            ))}
          </div>
          <div className="login__divider">
            <span>{t("loginForm.divider")}</span>
          </div>
        </>
      ) : null}

      <TextField
        label={t("loginForm.email")}
        type="email"
        name="email"
        placeholder={t("loginForm.emailPlaceholder")}
      />

      <div className="login__field">
        <TextField label={t("loginForm.password")} type="password" name="password" />
        {forgotHref ? (
          <a className="login__forgot" href={forgotHref}>
            {forgotLabel ?? t("loginForm.forgot")}
          </a>
        ) : null}
      </div>

      <Button variant="primary" type="submit">
        {submitLabel ?? t("loginForm.submit")}
      </Button>
    </form>
  );
}
