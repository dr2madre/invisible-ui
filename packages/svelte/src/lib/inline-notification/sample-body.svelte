<script lang="ts">
  // A tiny component used only to exercise InlineNotification's `component` slot.
  let { name = "there" }: { name?: string } = $props();
</script>

<span data-testid="rich-body">Hello {name}</span>
