<script>
  import PinInput from "@design-system/svelte/PinInput.svelte";
  let value = "";

  const labelStyle = "font-size: 0.875rem; font-weight: 600;";
  const helpStyle =
    "margin: 0; font-size: 0.8125rem; color: var(--ds-color-text-secondary, #64748b);";
  const okStyle = "margin: 0; font-size: 0.8125rem; color: var(--ds-color-success, #16a34a);";
  const errStyle = "margin: 0; font-size: 0.8125rem; color: var(--ds-color-danger, #dc2626);";
</script>

<div style="display: flex; flex-direction: column; gap: 1.5rem;">
  <!-- Default: label above, help message below. -->
  <div style="display: grid; gap: 0.375rem;">
    <span style={labelStyle} id="pin-default-label">Verification code</span>
    <PinInput {value} length={4} label="Verification code" onValueChange={(v) => (value = v)} />
    <p style={helpStyle}>Enter the 4-digit code we sent to your phone.</p>
  </div>

  <!-- Validated (success) variant: green cells + green confirmation. -->
  <div style="display: grid; gap: 0.375rem;">
    <span style={labelStyle}>Verification code</span>
    <PinInput value="1234" length={4} success label="Verified code" />
    <p style={okStyle}>Code verified.</p>
  </div>

  <!-- Invalid variant: red cells + error help. -->
  <div style="display: grid; gap: 0.375rem;">
    <span style={labelStyle}>Verification code</span>
    <PinInput value="0000" length={4} invalid label="Invalid code" />
    <p style={errStyle}>That code isn't right. Check it and try again.</p>
  </div>
</div>
