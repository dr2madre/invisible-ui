<script>
  import Count from "@design-system/svelte/Count.svelte";
</script>

<div style="display: flex; gap: 1.5rem; align-items: center;">
  <Count count={5} label="unread messages" />
  <Count count={128} max={99} label="notifications" />
  <Count count={3} status="info" label="updates" />
  <Count dot status="success" label="online" />
</div>
