<script lang="ts">
  import { flushSync } from "svelte";
  import Dialog from "./Dialog.svelte";
  import SheetDialog from "../sheet-dialog/SheetDialog.svelte";
  import AlertDialog from "../alert-dialog/AlertDialog.svelte";
  import ConfirmDialog from "../confirm-dialog/ConfirmDialog.svelte";
  import PromptDialog from "../prompt-dialog/PromptDialog.svelte";
  import SearchDialog from "../search-dialog/SearchDialog.svelte";
  import type { DialogNoticeOptions } from "./create-dialog";

  interface NoticeHost {
    notify(options: DialogNoticeOptions): string;
    dismissNotice(id: string): void;
    clearNotices(): void;
  }

  interface Props {
    kind?: "dialog" | "sheet" | "alert" | "confirm" | "prompt" | "search";
  }

  let { kind = "dialog" }: Props = $props();

  let open = $state(false);
  let host = $state<NoticeHost>();

  export const isOpen = () => open;
  export const setOpen = (next: boolean) => {
    open = next;
    flushSync();
  };
  export const notify = (options: DialogNoticeOptions) => host!.notify(options);
  export const dismissNotice = (id: string) => host!.dismissNotice(id);
  export const clearNotices = () => host!.clearNotices();
</script>

{#if kind === "dialog"}
  <Dialog bind:this={host} bind:open title="Share this file">
    {#snippet trigger()}Share{/snippet}
    <label>Link <input value="https://example.com/f/1" /></label>
    <span data-emitter>Status</span>
    {#snippet footer()}<button type="button">Done</button>{/snippet}
  </Dialog>
{:else if kind === "sheet"}
  <SheetDialog bind:this={host} bind:open title="Filters">
    {#snippet trigger()}Open{/snippet}
    <p data-emitter>Body</p>
    {#snippet footer()}<button type="button">Apply</button>{/snippet}
  </SheetDialog>
{:else if kind === "alert"}
  <AlertDialog bind:this={host} bind:open title="Session expired" description="Sign in again."
    >Open</AlertDialog
  >
{:else if kind === "confirm"}
  <ConfirmDialog bind:this={host} bind:open title="Delete file?">Open</ConfirmDialog>
{:else if kind === "prompt"}
  <PromptDialog bind:this={host} bind:open title="Rename" label="Name">Open</PromptDialog>
{:else}
  <SearchDialog bind:this={host} bind:open items={[]}>
    {#snippet trigger()}Open{/snippet}
  </SearchDialog>
{/if}
