<script lang="ts">
  /**
   * DialogStatus (internal) — the status area of the dialog family (ADR 0016):
   * notices about the dialog's own task, placed between the body and the
   * footer. Each notice is an Inline Notification with `role="group"`, named
   * by its title, so it is never a live region of its own and never takes
   * focus. One persistent polite live region reads each notice once, when it
   * is added; it stays in the panel, visually hidden, so it is never created
   * at the moment it speaks. The area is hidden while it holds no notice.
   */
  import InlineNotification from "../inline-notification/InlineNotification.svelte";
  import type { CreateDialog } from "./create-dialog";

  interface Props {
    /** The dialog whose status area this is. */
    dialog: Pick<CreateDialog, "notices" | "announcement" | "dismissNotice">;
  }

  let { dialog }: Props = $props();

  const notices = $derived(dialog.notices);
  const announcement = $derived(dialog.announcement);
</script>

<div class="dialog-status" hidden={$notices.length === 0}>
  {#each $notices as notice (notice.id)}
    <InlineNotification
      role="group"
      status={notice.status}
      title={notice.title}
      description={notice.description ?? ""}
      closable={notice.dismissible !== false}
      actions={notice.action
        ? [
            {
              label: notice.action.label,
              // Ghost, as in a notification: the action must not outweigh the message.
              variant: "ghost",
              onClick: () => {
                notice.action?.onAction();
                dialog.dismissNotice(notice.id);
              },
            },
          ]
        : undefined}
      onclose={() => dialog.dismissNotice(notice.id)}
    />
  {/each}
</div>
<div class="dialog-status__live" role="status" aria-atomic="true">
  <!-- Each line ends in a space, so the lines are read as separate words. -->
  {#each $announcement as line (line.id)}<p>{`${line.text} `}</p>{/each}
</div>

<style>
  .dialog-status {
    display: grid;
    gap: 0.5rem;
    margin-block-start: 1rem;
  }
  .dialog-status[hidden] {
    display: none;
  }
  /* The persistent live region: read by screen readers, never shown. Absolute,
     so it takes no row in the panel's grid or flex layout. */
  .dialog-status__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
