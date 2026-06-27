<script>
  import Sheet from "@design-system/svelte/Sheet.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Field from "@design-system/svelte/Field.svelte";

  const inputStyle =
    "width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--ds-color-border, #cbd5e1); border-radius: 0.5rem; font: inherit; background: var(--ds-color-background, #fff); color: inherit; box-sizing: border-box;";
</script>

<!-- A form sheet: focus lands on the first field (not the close button), with a
     pinned actions zone at the bottom. -->
<Sheet
  side="right"
  title="Edit profile"
  description="Update your details and save when you're done."
  initialFocus="input"
>
  <span slot="trigger">Edit profile</span>

  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <Field label="Full name" let:controlProps>
      <input {...controlProps} type="text" value="Ada Lovelace" style={inputStyle} />
    </Field>
    <Field label="Email" description="We'll never share it." let:controlProps>
      <input {...controlProps} type="email" value="ada@example.com" style={inputStyle} />
    </Field>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save changes</Button>
  </svelte:fragment>
</Sheet>
