<script>
  import NotificationRegion from "@design-system/svelte/NotificationRegion.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import { createNotifier } from "@design-system/svelte";

  const notifier = createNotifier();
  const statuses = ["info", "success", "warning", "danger"];
  let persistent = 0;
  let timed = 0;

  // Persistent: stays until the user closes it (Undo also dismisses).
  const showPersistent = () =>
    notifier.show({
      status: statuses[persistent++ % statuses.length],
      title: `Persistent #${persistent}`,
      text: "Stays until you close it.",
      actions: [{ label: "Undo" }],
    });

  // Auto-dismiss: background info, expires by itself.
  const showTimed = () =>
    notifier.show({
      status: statuses[timed++ % statuses.length],
      title: `Auto #${timed}`,
      text: "Goes away by itself in 5s.",
      duration: 5000,
    });
</script>

<div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
  <Button onpress={showPersistent}>Show persistent</Button>
  <Button onpress={showTimed}>Show auto-dismiss</Button>
</div>

<!-- No limit: the buttons can be pressed any number of times, and a new
     notification must always enter the stack. -->
<NotificationRegion {notifier} placement="bottom-end" maxVisible={0} />
