<script>
  import FeedbackIcon from "@design-system/svelte/FeedbackIcon.svelte";

  const statuses = ["info", "success", "warning", "danger", "neutral"];
</script>

<div style="display: flex; flex-direction: column; gap: 1.25rem;">
  <!-- Default: soft tinted, rounded-square boxes. -->
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    {#each statuses as status (status)}
      <FeedbackIcon {status} label={status} />
    {/each}
  </div>

  <!-- Fully-round boxes. -->
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    {#each statuses as status (status)}
      <FeedbackIcon {status} shape="round" label={status} />
    {/each}
  </div>

  <!-- Solid boxes with a contrasting glyph. -->
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    {#each statuses as status (status)}
      <FeedbackIcon {status} box="solid" shape="round" label={status} />
    {/each}
  </div>

  <!-- Transparent (no box) — just the colored glyph, for tinted surfaces. -->
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    {#each statuses as status (status)}
      <FeedbackIcon {status} box="transparent" label={status} />
    {/each}
  </div>
</div>
