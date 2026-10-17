<script>
  import Dialog from "@invisible-ui/svelte/Dialog.svelte";
  import Button from "@invisible-ui/svelte/Button.svelte";
  import FeedbackIcon from "@invisible-ui/svelte/FeedbackIcon.svelte";
  import Icon from "@invisible-ui/svelte/Icon.svelte";
</script>

<Dialog title="Advanced options" description="Notifications set to all new posts" footerClose>
  {#snippet icon()}
    <FeedbackIcon status="neutral" box="tint">
      <Icon>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Icon>
    </FeedbackIcon>
  {/snippet}
  {#snippet trigger()}<span>Open dialog</span>{/snippet}
  <p class="dialog-demo__body">Your dialog body content goes here.</p>
  {#snippet footer()}
    <Button variant="secondary">Reset</Button>
    <Button variant="primary">Save changes</Button>
  {/snippet}
</Dialog>

<style>
  .dialog-demo__body {
    margin: 0;
  }
</style>
