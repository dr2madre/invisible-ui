<script lang="ts">
  /**
   * LoginForm — a sign-in organism composed from the primitives: an optional
   * logo (slot) on top, optional social-login buttons, the email + password
   * fields, a "forgot password" link, and the submit button.
   *
   * It is a real `<form>`: the fields are native inputs (via TextField) and
   * `onSubmit` receives `{ email, password }`. Presentation is a centered card;
   * themeable via `--ds-login-*` and the underlying component tokens.
   */
  import TextField from "../text-field/TextField.svelte";
  import Button from "../button/Button.svelte";
  import { getI18n } from "../i18n/create-i18n";

  const { t } = getI18n();

  export let heading = "Sign in";
  export let subheading: string | undefined = undefined;
  /** Submit button label. Defaults to the i18n catalog's "Sign in". */
  export let submitLabel: string | undefined = undefined;
  export let forgotHref: string | undefined = "#";
  /** Forgot-password link text. Defaults to the i18n catalog's "Forgot password?". */
  export let forgotLabel: string | undefined = undefined;
  /** Social providers rendered as white buttons above the fields. */
  export let providers: { id: string; label: string }[] = [];
  export let onSubmit: ((value: { email: string; password: string }) => void) | undefined =
    undefined;
  export let onProvider: ((id: string) => void) | undefined = undefined;

  let email = "";
  let password = "";

  $: resolvedSubmitLabel = submitLabel ?? $t("loginForm.submit");
  $: resolvedForgotLabel = forgotLabel ?? $t("loginForm.forgot");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onSubmit?.({ email, password });
  }
</script>

<form class="login" on:submit={submit}>
  {#if $$slots.logo}
    <div class="login__logo"><slot name="logo" /></div>
  {/if}

  <div class="login__head">
    <h2 class="login__heading">{heading}</h2>
    {#if subheading}<p class="login__subheading">{subheading}</p>{/if}
  </div>

  {#if providers.length}
    <div class="login__providers">
      {#each providers as p (p.id)}
        <Button variant="default" onpress={() => onProvider?.(p.id)}>
          <svelte:fragment slot="left"
            ><slot name="provider-icon" provider={p.id} /></svelte:fragment
          >
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
    inline-size: min(100%, var(--ds-login-width, 22rem));
    padding: var(--ds-login-padding, 1.75rem);
    background: var(--ds-login-bg, var(--ds-color-background, #fff));
    border: 1px solid var(--ds-login-border, var(--ds-color-border, #e7e5e4));
    border-radius: var(--ds-login-radius, var(--ds-radius-surface, 0.75rem));
    box-shadow: var(--ds-login-shadow, var(--ds-elevation-overlay, 0 1px 3px rgb(0 0 0 / 0.1)));
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
    color: var(--ds-color-text, #1c1917);
  }
  .login__subheading {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    color: var(--ds-color-text-secondary, #57534e);
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
    color: var(--ds-color-text-secondary, #78716c);
    font-size: 0.8125rem;
  }
  .login__divider::before,
  .login__divider::after {
    content: "";
    flex: 1;
    block-size: 1px;
    background: var(--ds-color-border, #e7e5e4);
  }
  .login__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .login__forgot {
    align-self: flex-end;
    font-size: 0.8125rem;
    color: var(--ds-color-secondary, #7b52cc);
    /* Underlined so it doesn't rely on color alone, and a visible focus ring. */
    text-decoration: underline;
    text-underline-offset: 2px;
    border-radius: 2px;
  }
  .login__forgot:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow, 0 0 0 2px var(--ds-color-focus-ring, #7b52cc));
    outline-offset: 2px;
  }
</style>
