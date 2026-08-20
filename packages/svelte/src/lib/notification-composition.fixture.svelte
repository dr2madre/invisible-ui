<script lang="ts">
  import ErrorState from "./error-state/ErrorState.svelte";
  import InlineNotification from "./inline-notification/InlineNotification.svelte";
  import NotificationRegion from "./notification/NotificationRegion.svelte";
  import { createNotifier, type Notifier } from "./notification/create-notifier";

  export let notifier: Notifier = createNotifier();
  /** The application routes one event to one channel: local text or a toast. */
  export let channel: "none" | "local" | "toast" = "none";
  export let message = "Saving failed";
</script>

<div>
  {#if channel === "local"}
    <InlineNotification
      status="danger"
      role="alert"
      title={message}
      description="Try again in a moment."
    />
  {:else if channel === "none"}
    <ErrorState title="Nothing loaded" description="No request has run yet." />
  {/if}
  <NotificationRegion {notifier} duration={0} />
</div>
