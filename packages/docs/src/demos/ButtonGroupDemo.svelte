<script>
  import ButtonGroup from "@design-system/svelte/ButtonGroup.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div class="demos">
  <ButtonGroup label="Text alignment">
    <Button>Left</Button>
    <Button>Center</Button>
    <Button>Right</Button>
  </ButtonGroup>

  <!-- Grouped buttons with an icon (icon in the Button's `left` slot + label). -->
  <ButtonGroup label="Document actions">
    <Button>
      <Icon slot="left">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </Icon>
      New
    </Button>
    <Button>
      <Icon slot="left">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </Icon>
      Save
    </Button>
    <Button>
      <Icon slot="left">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </Icon>
      Share
    </Button>
  </ButtonGroup>
</div>

<style>
  .demos {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
  }
</style>
