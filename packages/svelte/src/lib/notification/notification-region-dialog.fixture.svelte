<script lang="ts">
  import { flushSync } from "svelte";
  import Dialog from "../dialog/Dialog.svelte";
  import NotificationRegion from "./NotificationRegion.svelte";
  import type { Notifier } from "./create-notifier";

  interface Props {
    notifier: Notifier;
    /** Place the region inside the dialog's body instead of beside it. */
    inside?: boolean;
  }

  let { notifier, inside = false }: Props = $props();

  let open = $state(false);

  export const setOpen = (next: boolean) => {
    open = next;
    flushSync();
  };
</script>

<Dialog bind:open title="Upload">
  {#snippet trigger()}Open{/snippet}
  <p>Body</p>
  {#if inside}
    <NotificationRegion {notifier} duration={0} />
  {/if}
</Dialog>
{#if !inside}
  <NotificationRegion {notifier} duration={0} />
{/if}
