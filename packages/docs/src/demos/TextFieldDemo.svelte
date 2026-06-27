<script>
  import TextField from "@design-system/svelte/TextField.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <!-- Plain field -->
  <TextField
    label="Email"
    type="email"
    placeholder="you@example.com"
    description="We'll never share it."
  />

  <!-- Leading icon (decorative label, always on the left) -->
  <TextField label="Email" type="email" placeholder="you@example.com">
    <Icon slot="left">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </Icon>
  </TextField>

  <!-- Search: the glyph is a label, so it sits on the left (not a submit). -->
  <TextField label="Search" type="search" placeholder="Search…">
    <Icon slot="left">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  </TextField>

  <!-- Error: red ring + triangle + message. -->
  <TextField label="Email" type="email" value="not-an-email" error="Enter a valid email address." />

  <!-- Validated: green check (right) + confirming caption. -->
  <TextField
    label="Username"
    type="text"
    value="ada_lovelace"
    success="This username is available."
  />
</div>
