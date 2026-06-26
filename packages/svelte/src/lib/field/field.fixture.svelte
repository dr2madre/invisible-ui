<script lang="ts">
  import Field from "./Field.svelte";

  export let description: string | undefined = "We'll never share it.";
  export let error: string | undefined = undefined;
  export let required = false;
</script>

<Field label="Email" {description} {error} {required} let:controlProps>
  <input type="email" {...controlProps} />
</Field>
