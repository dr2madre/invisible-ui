<script>
  import NotificationRegion from "@design-system/svelte/NotificationRegion.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import { createNotifier } from "@design-system/svelte";

  // Snack: high-contrast, centered near the user's locus of attention,
  // for outcomes of what the user was actively doing. Persistent by
  // default — the user reads and closes at their own pace.
  const snacks = createNotifier();
  const showSnack = () =>
    snacks.show({
      status: "info",
      inverted: true,
      title: "File deleted",
      text: "report-january.pdf was moved to trash.",
      actions: [{ label: "Undo" }],
    });

  // Toast: peripheral corner, for background information the user was NOT
  // actively involved in (incoming messages, finished background jobs).
  // Auto-dismiss is acceptable here — opt-in via duration.
  const toasts = createNotifier();
  const showToast = () =>
    toasts.show({
      status: "info",
      title: "New message from Ada",
      text: "“The report is ready for review.”",
      duration: 6000,
    });
</script>

<div style="display: grid; gap: 1.5rem;">
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <Button onpress={showSnack}>Delete file (snack)</Button>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <strong>Snack</strong> — high contrast (<code>inverted</code>), <code>bottom-center</code>:
      the outcome of the user's own action sits near their attention. Persistent (no
      <code>duration</code>): closed by the user, or by Undo.
    </figcaption>
  </figure>

  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <Button onpress={showToast}>Incoming message (toast)</Button>
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <strong>Toast</strong> — peripheral <code>top-end</code>: fine for background information
      only. Auto-dismiss opted in (<code>duration</code>) because nothing requires reading or
      acting.
    </figcaption>
  </figure>
</div>

<NotificationRegion notifier={snacks} placement="bottom-center" />
<NotificationRegion notifier={toasts} placement="top-end" />
