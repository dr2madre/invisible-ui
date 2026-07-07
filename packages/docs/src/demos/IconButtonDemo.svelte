<script>
  import Button from "@design-system/svelte/Button.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <!-- Icon-only buttons (a dismiss "×" is just this preset: iconOnly + a glyph
       + an ariaLabel). -->
  <div style="display: flex; gap: 0.5rem; align-items: center;">
    <Button iconOnly ariaLabel="Close">
      <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
    </Button>
    <Button iconOnly variant="primary" ariaLabel="Add">
      <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
    </Button>
    <Button iconOnly variant="secondary" ariaLabel="Download">
      <Icon>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </Icon>
    </Button>
    <Button iconOnly variant="danger" ariaLabel="Delete">
      <Icon>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </Icon>
    </Button>
    <Button iconOnly variant="ghost" ariaLabel="Search">
      <Icon><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
    </Button>
    <Button iconOnly disabled ariaLabel="Add">
      <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
    </Button>
  </div>
</div>
