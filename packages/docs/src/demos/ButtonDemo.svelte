<script>
  import Button from "@design-system/svelte/Button.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <!-- Variants -->
  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
    <Button>Default</Button>
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Delete</Button>
    <Button disabled>Disabled</Button>
  </div>

  <!-- Icon-only buttons (the CloseButton is just a preset of this: iconOnly + a
       glyph + an ariaLabel). -->
  <div style="display: flex; gap: 0.5rem; align-items: center;">
    <Button iconOnly ariaLabel="Close">
      <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
    </Button>
    <Button iconOnly variant="ghost" ariaLabel="Add">
      <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
    </Button>
    <Button iconOnly variant="danger" ariaLabel="Delete">
      <Icon>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </Icon>
    </Button>
  </div>
</div>
