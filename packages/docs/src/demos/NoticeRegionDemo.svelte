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
</script>

<Button onpress={show}>Show toast</Button>
<NoticeRegion {notifier} placement="bottom-end" />
