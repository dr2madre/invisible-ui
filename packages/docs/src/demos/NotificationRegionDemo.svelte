<script>
  import NotificationRegion from "@design-system/svelte/NotificationRegion.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import { createNotifier } from "@design-system/svelte";
  import RichToastBody from "./RichToastBody.svelte";

  const notifier = createNotifier();
  let files = ["report-q3.pdf", "budget.xlsx", "notes.md"];
  let n = 0;

  // Canonical delete + Undo: the notification auto-dismisses; onDismiss tells
  // us HOW it closed. Undo (action) cancels; timeout/user/api finalizes.
  const deleteFile = () => {
    const file = files[n % files.length];
    n += 1;
    const snapshot = [...files];
    files = files.filter((f) => f !== file);
    notifier.show({
      status: "neutral",
      inverted: true,
      snack: true,
      duration: 6000,
      closable: false,
      title: `Deleted “${file}”`,
      actions: [{ label: "Undo", onClick: () => (files = snapshot) }],
      onDismiss: (reason) => {
        // The action already restored the file; any other close finalizes.
        if (reason !== "action")
          notifier.success(`“${file}” permanently deleted`, { duration: 3000 });
      },
    });
  };

  // Replace-by-id: one toast that mutates in place, "Saving…" → "Saved".
  const save = () => {
    notifier.show({ id: "save", status: "info", title: "Saving…" });
    setTimeout(() => notifier.success("Saved", { id: "save", duration: 3000 }), 900);
  };

  // Rich content: a Svelte component as the body (avatar + message).
  const showRich = () =>
    notifier.show({
      title: "New activity",
      duration: 6000,
      component: RichToastBody,
      componentProps: { name: "Ada Lovelace", message: "commented on your pull request" },
    });
</script>

<div style="display: grid; gap: 0.75rem;">
  <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
    <Button variant="danger" onpress={deleteFile} disabled={files.length === 0}
      >Delete a file</Button
    >
    <Button onpress={save}>Save (replace by id)</Button>
    <Button onpress={showRich}>Rich content</Button>
  </div>
  <p style="margin: 0; font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
    Files: {files.length ? files.join(", ") : "none"}. Delete one, then Undo before the toast fades
    — or let it finalize.
  </p>
</div>

<NotificationRegion {notifier} placement="bottom-end" />
