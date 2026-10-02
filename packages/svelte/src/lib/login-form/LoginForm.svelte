<script lang="ts">
  /**
   * LoginForm — a sign-in organism composed from the primitives: an optional
   * logo (snippet) on top, optional social-login buttons, the email + password
   * fields, a "forgot password" link, and the submit button.
   *
   * It is a real `<form>`: the fields are native inputs (via TextField) and
   * `onSubmit` receives `{ email, password }`. Presentation is a centered card;
   * themeable via `--ds-login-*` and the underlying component tokens.
   */
  import type { Snippet } from "svelte";
  import TextField from "../text-field/TextField.svelte";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  interface Props {
    heading?: string;
    subheading?: string;
    /** Submit button label. Defaults to the i18n catalog's "Sign in". */
    submitLabel?: string;
    forgotHref?: string;
    /** Forgot-password link text. Defaults to the i18n catalog's "Forgot password?". */
    forgotLabel?: string;
    /** Social providers rendered as white buttons above the fields. */
    providers?: { id: string; label: string }[];
    onSubmit?: (value: { email: string; password: string }) => void;
    onProvider?: (id: string) => void;
    /** A logo shown on top of the card. */
    logo?: Snippet;
    /** The icon of a social provider button, given the provider id. */
    providerIcon?: Snippet<[{ provider: string }]>;
  }

  let {
    heading,
    subheading,
    submitLabel,
    forgotHref = "#",
    forgotLabel,
    providers = [],
    onSubmit,
    onProvider,
    logo,
    providerIcon,
  }: Props = $props();

  let email = $state("");
  let password = $state("");

  const resolvedSubmitLabel = $derived(submitLabel ?? $t("loginForm.submit"));
  const resolvedForgotLabel = $derived(forgotLabel ?? $t("loginForm.forgot"));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit?.({ email, password });
  }

  // The controlled parent's own duty on a reset (ADR 0012): the fields put
  // themselves back, this state is ours. A task later, so a handler that
  // cancels the reset cancels this too.
  function onReset(event: Event) {
    setTimeout(() => {
      if (event.defaultPrevented) return;
      email = "";
      password = "";
    }, 0);
  }
</script>

<form class="login" onsubmit={submit} onreset={onReset}>
  {#if logo}
    <div class="login__logo">{@render logo()}</div>
  {/if}

  <div class="login__head">
    <h2 class="login__heading">{heading ?? $t("loginForm.heading")}</h2>
    {#if subheading}<p class="login__subheading">{subheading}</p>{/if}
  </div>

  {#if providers.length}
    <div class="login__providers">
      {#each providers as p (p.id)}
        <!-- Always passed: every provider button keeps its icon box, with or
             without a providerIcon, as it did before snippets. -->
        {#snippet providerLeft()}{@render providerIcon?.({ provider: p.id })}{/snippet}
        <Button variant="default" onpress={() => onProvider?.(p.id)} left={providerLeft}>
          Continue with {p.label}
        </Button>
      {/each}
    </div>
    <div class="login__divider"><span>or</span></div>
  {/if}

  <TextField
    label="Email"
    type="email"
    name="email"
    placeholder="you@example.com"
    bind:value={email}
  />

  <div class="login__field">
    <TextField label="Password" type="password" name="password" bind:value={password} />
    {#if forgotHref}
      <a class="login__forgot" href={forgotHref}>{resolvedForgotLabel}</a>
    {/if}
  </div>

  <Button variant="primary" type="submit">{resolvedSubmitLabel}</Button>
</form>

<style>
  .login {
    display: flex;
    flex-direction: column;
    gap: var(--ds-login-gap, 1rem);
    /* The width is the content box: the padding and the 1px border come out of
       100%, so the card never overflows a narrow container. */
    inline-size: min(
      100% - 2 * var(--ds-login-padding, 1.75rem) - 2px,
      var(--ds-login-width, 22rem)
    );
    padding: var(--ds-login-padding, 1.75rem);
    background: var(--ds-login-bg, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-login-border, var(--ds-color-border, #c7c1b7));
    border-radius: var(--ds-login-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(
      --ds-login-shadow,
      var(
        --ds-elevation-overlay,
        0 10px 15px -3px rgb(0 0 0 / 0.1),
        0 4px 6px -4px rgb(0 0 0 / 0.1)
      )
    );
  }
  .login__logo {
    display: flex;
    justify-content: center;
  }
  .login__head {
    text-align: center;
  }
  .login__heading {
    margin: 0;
    font-size: 1.25rem;
    color: var(--ds-color-text, #282420);
  }
  .login__subheading {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .login__providers {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .login__divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--ds-color-text-secondary, #524c44);
    font-size: 0.8125rem;
  }
  .login__divider::before,
  .login__divider::after {
    content: "";
    flex: 1;
    block-size: 1px;
    background: var(--ds-color-border, #c7c1b7);
  }
  .login__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .login__forgot {
    align-self: flex-end;
    font-size: 0.8125rem;
    color: var(--ds-color-secondary-body-text, #7a52cc);
    /* Underlined so it doesn't rely on color alone, and a visible focus ring. */
    text-decoration: underline;
    text-underline-offset: 2px;
    border-radius: 2px;
  }
  .login__forgot:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #8e6cd4));
    outline-offset: 2px;
  }
</style>
