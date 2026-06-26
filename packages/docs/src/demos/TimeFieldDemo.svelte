<script>
  import TimeField from "@design-system/svelte/TimeField.svelte";

  let value = "09:30";
</script>

<div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center;">
  <label style="display: flex; flex-direction: column; gap: 0.35rem;">
    <span>24-hour</span>
    <TimeField {value} label="Start time" onValueChange={(v) => (value = v)} />
  </label>

  <label style="display: flex; flex-direction: column; gap: 0.35rem;">
    <span>12-hour, with seconds</span>
    <TimeField value="14:05:30" hourCycle={12} withSeconds label="Meeting time" />
  </label>
</div>
