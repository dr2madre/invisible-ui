<script lang="ts">
  import Field from "./Field.svelte";

  interface Props {
    description?: string;
    error?: string;
    required?: boolean;
  }

  let { description = "We'll never share it.", error, required = false }: Props = $props();
</script>

<Field label="Email" {description} {error} {required}>
  {#snippet children({ controlProps })}
    <input type="email" {...controlProps} />
  {/snippet}
</Field>
