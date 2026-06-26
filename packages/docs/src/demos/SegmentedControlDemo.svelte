<script>
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
  import Separator from "@design-system/svelte/Separator.svelte";
  import Logo from "./Logo.svelte";
  import HomeIcon from "./icons/HomeIcon.svelte";
  import SearchIcon from "./icons/SearchIcon.svelte";
  import BellIcon from "./icons/BellIcon.svelte";
  import UserIcon from "./icons/UserIcon.svelte";
  import SettingsIcon from "./icons/SettingsIcon.svelte";

  const nav = [
    { value: "home", label: "Home", icon: HomeIcon },
    { value: "search", label: "Search", icon: SearchIcon },
    { value: "alerts", label: "Alerts", icon: BellIcon },
    { value: "profile", label: "Profile", icon: UserIcon },
  ];
  const more = [{ value: "settings", label: "Settings", icon: SettingsIcon }];
</script>

<div class="demos">
  <section>
    <p class="cap">Bar (text)</p>
    <SegmentedControl
      label="View"
      value="list"
      items={[
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
        { value: "calendar", label: "Calendar" },
      ]}
    />
  </section>

  <section>
    <p class="cap">Toolbar — icons only</p>
    <SegmentedControl label="Tools" iconOnly value="home" items={nav} />
  </section>

  <section>
    <p class="cap">Bottom bar (mobile)</p>
    <div class="bottombar">
      <SegmentedControl label="Sections" stacked value="home" items={nav} />
    </div>
  </section>

  <section>
    <p class="cap">Sidebar (desktop / tablet)</p>
    <aside class="sidebar">
      <div class="sidebar__logo"><Logo /></div>
      <Separator />
      <SegmentedControl label="Main" orientation="vertical" value="home" items={nav} />
      <Separator />
      <SegmentedControl label="More" orientation="vertical" value={null} items={more} />
    </aside>
  </section>

  <section>
    <p class="cap">Sidebar — compact (label under icon)</p>
    <SegmentedControl label="Sections" orientation="vertical" stacked value="home" items={nav} />
  </section>

  <section>
    <p class="cap">Sidebar — icons only</p>
    <SegmentedControl label="Sections" orientation="vertical" iconOnly value="home" items={nav} />
  </section>
</div>

<style>
  .demos {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: flex-start;
  }
  .cap {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ds-color-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .bottombar {
    inline-size: 22rem;
    max-inline-size: 100%;
  }

  /* Desktop / tablet sidebar shell: logo, dividers, full-width nav groups. */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    inline-size: 14rem;
    padding: 0.75rem;
    border: 1px solid var(--ds-color-border, #cbd5e1);
    border-radius: var(--ds-radius-surface, 0.75rem);
  }
  .sidebar__logo {
    padding: 0.25rem 0.25rem 0.25rem 0.5rem;
  }
  .sidebar :global(.segmented-field),
  .sidebar :global(.segmented) {
    inline-size: 100%;
  }
</style>
