<script>
  import Field from "@design-system/svelte/Field.svelte";
  import Slider from "@design-system/svelte/Slider.svelte";

  const inputStyle =
    "width: 100%; padding: 0.5rem 0.6rem; border: 1px solid var(--ds-color-border, #cbd5e1); border-radius: 0.5rem; font: inherit; background: var(--ds-color-background, #fff); color: inherit; box-sizing: border-box;";

  let budget = 60;
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

  <!-- …or a multi-line native textarea — Field doesn't care what the control is. -->
  <Field label="Notes" description="Optional." let:controlProps>
    <textarea {...controlProps} rows="3" style={inputStyle}></textarea>
  </Field>

  <!-- …or a real Slider — the control is a full component, not just an input. -->
  <Field label="Monthly budget" description="Drag to set your limit.">
    <Slider
      bind:value={budget}
      label="Monthly budget"
      showValue
      showRange
      format={(v) => `€${v}`}
    />
  </Field>
</div>
