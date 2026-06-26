<script lang="ts">
  import { createSegmentedControl, type SegmentItem } from "./create-segmented-control";

  export let value: string | null = null;
  export let items: SegmentItem[] = [{ value: "list" }, { value: "board" }, { value: "calendar" }];

  const { state: segmentState, setValue, name } = createSegmentedControl({ value, items });
</script>

<div role="radiogroup" aria-label="View" aria-orientation="horizontal">
  {#each items as item (item.value)}
    <label>
      <input
        type="radio"
        {name}
        value={item.value}
        checked={$segmentState.value === item.value}
        on:change={() => setValue(item.value)}
      />
      {item.value}
    </label>
  {/each}
</div>
