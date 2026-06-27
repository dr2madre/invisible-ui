<script>
  import ButtonGroup from "@design-system/svelte/ButtonGroup.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Select from "@design-system/svelte/Select.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
</script>

<div class="demos">
  <!-- Independent actions joined into one attached bar. `label` names the group
       for assistive tech (announced as "Document actions, group"). -->
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

  <!-- A toolbar of independent record actions, right-aligned, ending in a Select
       for the overflow ("More…"). Spaced (attached={false}) because these are
       distinct actions, not a single segmented choice. -->
  <div class="bar">
    <ButtonGroup label="Record actions" attached={false}>
      <Button variant="default">
        <Icon slot="left">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </Icon>
        Export
      </Button>
      <Button variant="default">
        <Icon slot="left">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </Icon>
        Duplicate
      </Button>
      <Button variant="danger">
        <Icon slot="left">
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
        </Icon>
        Delete
      </Button>
      <Select
        label="More actions"
        hideLabel
        placeholder="More…"
        items={[
          { value: "archive", label: "Archive" },
          { value: "move", label: "Move to…" },
          { value: "tag", label: "Add tag" },
        ]}
      />
    </ButtonGroup>
  </div>
</div>

<style>
  .demos {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  /* Push the action toolbar to the right, like a list/table header. */
  .bar {
    display: flex;
    justify-content: flex-end;
  }
</style>
