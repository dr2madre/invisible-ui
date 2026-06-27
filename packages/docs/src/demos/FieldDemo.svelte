<script>
  import Field from "@design-system/svelte/Field.svelte";

  const inputStyle =
    "width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--ds-color-border, #cbd5e1); border-radius: 0.5rem; font: inherit; background: var(--ds-color-background, #fff); color: inherit; box-sizing: border-box;";
</script>

<div style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 22rem;">
  <!-- Field is the generic wrapper: it wires label + description + error +
       required onto ANY control you put in the slot (here a native input). -->
  <Field label="Email" description="We'll never share it." let:controlProps>
    <input {...controlProps} type="email" placeholder="you@example.com" style={inputStyle} />
  </Field>

  <!-- Required + error state (the message is announced; control gets aria-invalid). -->
  <Field label="Username" required error="That name is taken." let:controlProps>
    <input {...controlProps} type="text" value="admin" style={inputStyle} />
  </Field>

  <!-- The control can be anything — e.g. a native <select>… -->
  <Field label="Country" description="Where you're based." let:controlProps>
    <select {...controlProps} style={inputStyle}>
      <option>Italy</option>
      <option>France</option>
      <option>Spain</option>
    </select>
  </Field>

  <!-- …or a range, a textarea, a custom widget — Field doesn't care. -->
  <Field label="Volume" let:controlProps>
    <input {...controlProps} type="range" min="0" max="100" value="40" style="width: 100%;" />
  </Field>
</div>
