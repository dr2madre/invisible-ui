<script>
  import Field from "@design-system/svelte/Field.svelte";
</script>

<Field label="Email" description="We'll never share it." let:controlProps>
  <input
    {...controlProps}
    type="email"
    placeholder="you@example.com"
    style="width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--ds-color-border, #cbd5e1); border-radius: 0.5rem; font: inherit;"
  />
</Field>
