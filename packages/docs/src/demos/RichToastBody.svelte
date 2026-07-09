<script>
  // Arbitrary rich body rendered inside a notification via the notifier's
  // `component` option — here an avatar + a two-line message.
  export let name = "Ada Lovelace";
  export let message = "commented on your pull request";
</script>

<span style="display: flex; align-items: center; gap: 0.625rem;">
  <span
    aria-hidden="true"
    style="flex: none; inline-size: 2rem; block-size: 2rem; border-radius: 999px; display: grid; place-items: center; font-weight: 600; color: #fff; background: var(--ds-color-secondary, #7b52cc);"
  >
    {name.charAt(0)}
  </span>
  <span style="display: grid; gap: 0.1rem; line-height: 1.35;">
    <strong>{name}</strong>
    <span style="color: var(--ds-color-text-secondary);">{message}</span>
  </span>
</span>
