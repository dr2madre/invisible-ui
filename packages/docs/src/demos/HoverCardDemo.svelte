<script>
  import HoverCard from "@design-system/svelte/HoverCard.svelte";
  import Avatar from "@design-system/svelte/Avatar.svelte";
</script>

<p style="margin:0;">
  Follow
  <HoverCard>
    <a slot="trigger" href="#ada">@ada</a>
    <div style="display:flex; gap:0.75rem;">
      <Avatar name="Ada Lovelace" />
      <div>
        <strong>Ada Lovelace</strong>
        <p style="margin:0.25rem 0 0; color:var(--ds-color-text-secondary, #64748b);">
          The first programmer.
        </p>
      </div>
    </div>
  </HoverCard>
  for updates.
</p>
