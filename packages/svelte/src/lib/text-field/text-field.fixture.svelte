<script lang="ts">
  import { untrack } from "svelte";
  import { createTextField } from "./create-text-field";

  interface Props {
    disabled?: boolean;
    invalid?: boolean;
    description?: string;
    onValueChange?: (value: string) => void;
  }

  let { disabled = false, invalid = false, description, onValueChange }: Props = $props();

  // Seeded once from the first props; the effect below follows later ones.
  const field = untrack(() =>
    createTextField({
      disabled,
      invalid,
      hasDescription: !!description,
      onValueChange,
    }),
  );
  const { labelAction, controlAction, descriptionAction, errorAction, setValue } = field;

  $effect.pre(() => {
    field.setFlags({ disabled, invalid, hasDescription: !!description });
  });
</script>

<!-- labelAction applies the `for` attribute at runtime. -->
<!-- svelte-ignore a11y_label_has_associated_control -->
<label use:labelAction>Name</label>
<input use:controlAction oninput={(e) => setValue(e.currentTarget.value)} />
{#if description}
  <p use:descriptionAction>{description}</p>
{/if}
{#if invalid}
  <p use:errorAction>Something is wrong</p>
{/if}
