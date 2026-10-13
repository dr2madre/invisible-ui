<script lang="ts">
  /** Five sections, a link, a badge and an unavailable destination, for the tests. */
  import NavigationBar from "./NavigationBar.svelte";
  import Dot from "../sidebar/sidebar-icon.fixture.svelte";
  import type { NavigationDestination } from "./types";

  interface Props {
    value?: string | null;
    onSelect?: (value: string) => void;
    destinations?: NavigationDestination[];
  }

  const sections: NavigationDestination[] = [
    { value: "home", label: "Home", href: "/home", icon: Dot },
    { value: "clients", label: "Clients", icon: Dot },
    {
      value: "projects",
      label: "Projects",
      icon: Dot,
      unavailable: { reason: "Available online only" },
    },
    { value: "hours", label: "Hours", icon: Dot },
    { value: "profile", label: "Profile", icon: Dot, badge: { label: "Needs attention" } },
  ];

  let { value = "hours", onSelect, destinations = sections }: Props = $props();
</script>

<p><a href="#before">Before</a></p>
<NavigationBar {destinations} {value} {onSelect} />
<p><a href="#after">After</a></p>
