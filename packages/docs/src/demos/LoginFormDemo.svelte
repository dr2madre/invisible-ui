<script>
  import LoginForm from "@design-system/svelte/LoginForm.svelte";

  let result = "";
</script>

<LoginForm
  heading="Sign in"
  subheading="Welcome back to Invisible UI"
  providers={[
    { id: "google", label: "Google" },
    { id: "github", label: "GitHub" },
  ]}
  onSubmit={(v) => (result = `Signing in as ${v.email}`)}
/>
{#if result}
  <p style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--ds-color-text-secondary);">
    {result}
  </p>
{/if}
