import { defineComponent, h, ref, type PropType } from "vue";
import { Button } from "../button/Button";
import { useI18n } from "../i18n/i18n";
import { TextField } from "../text-field/TextField";

/** A social sign-in provider rendered as a button above the fields. */
export interface LoginFormProvider {
  id: string;
  label: string;
}

/** The credentials handed to `onSubmit`. */
export interface LoginFormValue {
  email: string;
  password: string;
}

export interface LoginFormProps {
  heading?: string;
  subheading?: string;
  /** Submit button label. Defaults to the catalog's "Sign in". */
  submitLabel?: string;
  forgotHref?: string;
  /** Forgot-password link text. Defaults to the catalog's "Forgot password?". */
  forgotLabel?: string;
  /** Social providers rendered as white buttons above the fields. */
  providers?: LoginFormProvider[];
  onSubmit?: (value: LoginFormValue) => void;
  onProvider?: (id: string) => void;
}

/**
 * LoginForm — a sign-in organism composed from the primitives, ported from the
 * Svelte adapter: an optional logo (slot) on top, optional social-login
 * buttons, the email + password fields, a "forgot password" link, and the
 * submit button.
 *
 * It is a real `<form>`: the fields are native inputs (via TextField) and
 * `onSubmit` receives `{ email, password }`. Presentation is a centered card,
 * themeable via `--ds-login-*` and the underlying component tokens.
 */
export const LoginForm = defineComponent({
  name: "LoginForm",
  props: {
    heading: { type: String, default: undefined },
    subheading: { type: String, default: undefined },
    submitLabel: { type: String, default: undefined },
    forgotHref: { type: String, default: "#" },
    forgotLabel: { type: String, default: undefined },
    providers: { type: Array as PropType<LoginFormProvider[]>, default: () => [] },
    onSubmit: { type: Function as PropType<(value: LoginFormValue) => void>, default: undefined },
    onProvider: { type: Function as PropType<(id: string) => void>, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();
    const email = ref("");
    const password = ref("");

    const submit = (event: Event) => {
      event.preventDefault();
      props.onSubmit?.({ email: email.value, password: password.value });
    };

    return () => {
      const { t } = i18n.value;
      const resolvedSubmitLabel = props.submitLabel ?? t("loginForm.submit");
      const resolvedForgotLabel = props.forgotLabel ?? t("loginForm.forgot");

      return h("form", { class: "login", onSubmit: submit }, [
        slots.logo ? h("div", { class: "login__logo" }, slots.logo()) : null,

        h("div", { class: "login__head" }, [
          h("h2", { class: "login__heading" }, props.heading ?? t("loginForm.heading")),
          props.subheading ? h("p", { class: "login__subheading" }, props.subheading) : null,
        ]),

        props.providers.length
          ? h("div", { class: "login__providers" }, [
              props.providers.map((provider) =>
                h(
                  Button,
                  {
                    key: provider.id,
                    variant: "default",
                    onPress: () => props.onProvider?.(provider.id),
                  },
                  {
                    left: slots.providerIcon
                      ? () => slots.providerIcon?.({ provider: provider.id })
                      : undefined,
                    default: () => `Continue with ${provider.label}`,
                  },
                ),
              ),
            ])
          : null,
        props.providers.length ? h("div", { class: "login__divider" }, [h("span", "or")]) : null,

        h(TextField, {
          label: "Email",
          type: "email",
          name: "email",
          placeholder: "you@example.com",
          modelValue: email.value,
          "onUpdate:modelValue": (next: string) => (email.value = next),
        }),

        h("div", { class: "login__field" }, [
          h(TextField, {
            label: "Password",
            type: "password",
            name: "password",
            modelValue: password.value,
            "onUpdate:modelValue": (next: string) => (password.value = next),
          }),
          props.forgotHref
            ? h("a", { class: "login__forgot", href: props.forgotHref }, resolvedForgotLabel)
            : null,
        ]),

        h(Button, { variant: "primary", type: "submit" }, { default: () => resolvedSubmitLabel }),
      ]);
    };
  },
});
