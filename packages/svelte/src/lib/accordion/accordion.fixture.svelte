<script lang="ts">
  import { untrack } from "svelte";
  import { createAccordion, type AccordionItem, type AccordionType } from "./create-accordion";

  interface Props {
    type?: AccordionType;
    value?: string[];
    items?: AccordionItem[];
  }

  let {
    type = "single",
    value = [],
    items = [{ value: "one" }, { value: "two" }, { value: "three" }],
  }: Props = $props();

  const { rootAction, itemAction, triggerAction, panelAction } = untrack(() =>
    createAccordion({
      id: "acc",
      items,
      type,
      value,
    }),
  );
</script>

<div use:rootAction>
  {#each items as item (item.value)}
    <div use:itemAction={item.value}>
      <h3>
        <button use:triggerAction={item.value}>{item.value}</button>
      </h3>
      <div use:panelAction={item.value}>Panel {item.value}</div>
    </div>
  {/each}
</div>
