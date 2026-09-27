<script lang="ts">
  import CheckboxGroup from "./checkbox-group/CheckboxGroup.svelte";
  import Select from "./select/Select.svelte";
  import Textarea from "./text-field/Textarea.svelte";

  // A runes parent that binds: its state proxies what the controls write, so
  // the controls must still tell their own writes from the parent's.
  let fruit: string | null = $state("pear");
  let note = $state("Ada");
  let boxes: string[] = $state(["a"]);

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
  const ab = [{ value: "a" }, { value: "b" }];
</script>

<form data-testid="bound-form">
  <Select label="Fruit" name="fruit" items={fruits} bind:value={fruit} />
  <Textarea label="Note" name="note" bind:value={note} />
  <CheckboxGroup label="Boxes" name="boxes" items={ab} bind:value={boxes} />
</form>
<output data-testid="fruit">{fruit}</output>
<output data-testid="note">{note}</output>
<output data-testid="boxes">{boxes.join(",")}</output>
<button type="button" onclick={() => (boxes = ["b"])}>Pick b</button>
