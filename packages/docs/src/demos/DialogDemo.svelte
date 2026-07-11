<script>
  import Dialog from "@design-system/svelte/Dialog.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import FeedbackIcon from "@design-system/svelte/FeedbackIcon.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<Dialog title="Advanced options" description="Notifications set to all new posts" footerClose>
  <FeedbackIcon slot="icon" status="neutral" box="tint">
    <Icon>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Icon>
  </FeedbackIcon>
  <span slot="trigger">Open dialog</span>
  <p class="dialog-demo__body">Your dialog body content goes here.</p>
  <svelte:fragment slot="footer">
    <Button variant="secondary">Reset</Button>
    <Button variant="primary">Save changes</Button>
  </svelte:fragment>
</Dialog>

<style>
  .dialog-demo__body {
    margin: 0;
  }
</style>
