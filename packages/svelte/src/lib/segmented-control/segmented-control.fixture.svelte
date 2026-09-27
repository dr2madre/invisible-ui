<script lang="ts">
  import { untrack } from "svelte";
  import { createSegmentedControl, type SegmentItem } from "./create-segmented-control";

  interface Props {
    value?: string | null;
    items?: SegmentItem[];
  }

  let {
    value = null,
    items = [{ value: "list" }, { value: "board" }, { value: "calendar" }],
  }: Props = $props();

  const {
    state: segmentState,
    setValue,
    name,
  } = untrack(() => createSegmentedControl({ value, items }));
</script>

<div role="radiogroup" aria-label="View" aria-orientation="horizontal">
  {#each items as item (item.value)}
    <label>
      <input
        type="radio"
        {name}
        value={item.value}
        checked={$segmentState.value === item.value}
        onchange={() => setValue(item.value)}
      />
      {item.value}
    </label>
  {/each}
</div>
