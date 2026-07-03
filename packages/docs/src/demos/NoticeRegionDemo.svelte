<script>
  import NoticeRegion from "@design-system/svelte/NoticeRegion.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import { createNotifier } from "@design-system/svelte";

  const notifier = createNotifier();
  const statuses = ["info", "success", "warning", "danger"];
  let n = 0;
  const show = () => {
    const status = statuses[n % statuses.length];
    n += 1;
    notifier.show({ status, title: `Toast #${n}`, text: `A ${status} notification.` });
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
          onClick: () => notifier.show({ status: "success", title: "Restored" }),
        },
      ],
    });
</script>

<div style="display: flex; gap: 0.5rem; align-items: center;">
  <Button onpress={show}>Show toast</Button>
  <Button onpress={showUndo}>With undo action</Button>
</div>
<NoticeRegion {notifier} placement="bottom-end" />
