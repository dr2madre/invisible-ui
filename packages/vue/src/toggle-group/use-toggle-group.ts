import { toggleGroup as core } from "@design-system/core";
import { onBeforeUnmount, onMounted, type Ref } from "vue";

export interface UseToggleGroupOptions {
  /** The group container. */
  root: Ref<HTMLElement | null>;
  /** Layout axis, read when a key arrives. */
  orientation: () => "horizontal" | "vertical";
}

/**
 * The toggle group's keyboard rule (`core.toggleGroup.manage`) applied to the
 * container once it is mounted: one tab stop with arrow keys from three
 * toggles up, outside a toolbar, followed as toggles come and go. Client-only:
 * the server renders no tabindex.
 */
export function useToggleGroup({ root, orientation }: UseToggleGroupOptions): void {
  let teardown: (() => void) | undefined;
  onMounted(() => {
    if (root.value) teardown = core.manage(root.value, { orientation });
  });
  onBeforeUnmount(() => teardown?.());
}
