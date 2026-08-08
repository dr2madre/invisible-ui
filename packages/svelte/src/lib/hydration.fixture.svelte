<script lang="ts">
  import Popover from "./popover/Popover.svelte";
  import Select from "./select/Select.svelte";
  import Tabs from "./tabs/Tabs.svelte";
  import TextField from "./text-field/TextField.svelte";

  const tabItems = [
    { value: "account", label: "Account", content: "Account settings." },
    { value: "team", label: "Team", content: "Team settings." },
  ];
  const fruit = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];
</script>

<!-- Representative field, collection and overlay components: their generated
     ids wire labels, descriptions, panels and triggers. -->
<main>
  <TextField label="Full name" description="Shown on the profile." />
  <Select label="Fruit" items={fruit} value="apple" />
  <Tabs label="Settings" items={tabItems} value="account" />
  <Popover>
    <span slot="trigger">Open details</span>
    <p>Details panel.</p>
  </Popover>
</main>
