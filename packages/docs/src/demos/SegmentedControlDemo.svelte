<script>
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
  import HomeIcon from "./icons/HomeIcon.svelte";
  import SearchIcon from "./icons/SearchIcon.svelte";
  import BellIcon from "./icons/BellIcon.svelte";
  import UserIcon from "./icons/UserIcon.svelte";

  const nav = [
    { value: "home", label: "Home", icon: HomeIcon },
    { value: "search", label: "Search", icon: SearchIcon },
    { value: "alerts", label: "Alerts", icon: BellIcon },
    { value: "profile", label: "Profile", icon: UserIcon },
  ];
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
    <p class="cap">Vertical — compact (label under icon)</p>
    <SegmentedControl label="Sections" orientation="vertical" stacked value="home" items={nav} />
  </section>

  <section>
    <p class="cap">Vertical — icons only</p>
    <SegmentedControl label="Sections" orientation="vertical" iconOnly value="home" items={nav} />
  </section>
</div>

<!-- The full desktop sidebar (logo + dividers + several nav groups) is an
     organism, not a segmented control — see the Menu component. -->

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
</style>
