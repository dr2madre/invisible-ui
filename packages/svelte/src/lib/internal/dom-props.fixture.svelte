<script lang="ts">
  import type { DomProps } from "@design-system/core";
  import { domProps } from "./dom-props";

  interface Props {
    // Named `bag`, not `props`: Testing Library reads a top-level `props` key as
    // the deprecated `rerender({ props })` wrapper and would never update it.
    bag?: DomProps;
  }

  let { bag = {} }: Props = $props();
</script>

<input type="checkbox" aria-label="probe" use:domProps={bag} />
