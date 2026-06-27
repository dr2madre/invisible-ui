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

  <!-- Leading icon (e.g. a mail glyph) -->
  <TextField label="Email" type="email" placeholder="you@example.com">
    <Icon slot="left">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </Icon>
  </TextField>

  <!-- Trailing icon (e.g. a search glyph) -->
  <TextField label="Search" type="search" placeholder="Search…">
    <Icon slot="right">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  </TextField>

  <!-- Both -->
  <TextField label="Amount" type="text" placeholder="0.00">
    <Icon slot="left"
      ><line x1="12" y1="1" x2="12" y2="23" /><path
        d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
      /></Icon
    >
    <Icon slot="right"><polyline points="20 6 9 17 4 12" /></Icon>
  </TextField>
</div>
