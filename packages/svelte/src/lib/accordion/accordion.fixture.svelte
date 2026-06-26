<script lang="ts">
  import { createAccordion, type AccordionItem, type AccordionType } from "./create-accordion";

  export let type: AccordionType = "single";
  export let value: string[] = [];
  export let items: AccordionItem[] = [{ value: "one" }, { value: "two" }, { value: "three" }];

  const { rootAction, itemAction, triggerAction, panelAction } = createAccordion({
    id: "acc",
    items,
    type,
    value,
  });
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
