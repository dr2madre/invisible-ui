<script>
  import NotificationRegion from "@design-system/svelte/NotificationRegion.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import { createNotifier } from "@design-system/svelte";

  const notifier = createNotifier();
  const statuses = ["info", "success", "warning", "danger"];
  let n = 0;
  const show = () => {
    const status = statuses[n % statuses.length];
    n += 1;
    // Background info: opted into auto-dismiss, so the stack drains by itself
    // (notifications are persistent by default; maxVisible queues the rest).
    notifier.show({
      status,
      title: `Toast #${n}`,
      text: `A ${status} notification.`,
      duration: 5000,
    });
  };
  const showUndo = () =>
    notifier.show({
      status: "info",
      title: "File deleted",
      text: "report-january.pdf was moved to trash.",
      actions: [
        {
          label: "Undo",
          variant: "primary",
          onClick: () => notifier.show({ status: "success", title: "Restored", duration: 4000 }),
        },
      ],
    });
</script>

<div style="display: flex; gap: 0.5rem; align-items: center;">
  <Button onpress={show}>Show toast</Button>
  <Button onpress={showUndo}>With undo action</Button>
</div>
<NotificationRegion {notifier} placement="bottom-end" />
