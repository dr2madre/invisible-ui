<script>
  import Radio from "@design-system/svelte/Radio.svelte";
  let plan = "pro";
</script>

<div style="display: flex; flex-direction: column; gap: 0.5rem;">
  {#each [["free", "Free"], ["pro", "Pro"], ["team", "Team"]] as [value, label] (value)}
    <Radio {value} {label} name="plan" checked={plan === value} onChange={(v) => (plan = v)} />
  {/each}
</div>
