<script lang="ts">
  import { createTextField } from "./create-text-field";

  export let disabled = false;
  export let invalid = false;
  export let description: string | undefined = undefined;
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const field = createTextField({
    disabled,
    invalid,
    hasDescription: !!description,
    onValueChange,
  });
  const { labelAction, controlAction, descriptionAction, errorAction, setValue } = field;

  $: field.setFlags({ disabled, invalid, hasDescription: !!description });
</script>

<label use:labelAction>Name</label>
<input use:controlAction on:input={(e) => setValue(e.currentTarget.value)} />
{#if description}
  <p use:descriptionAction>{description}</p>
{/if}
{#if invalid}
  <p use:errorAction>Something is wrong</p>
{/if}
