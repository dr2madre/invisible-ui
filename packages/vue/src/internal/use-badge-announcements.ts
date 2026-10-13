import { navigationBar } from "@design-system/core";
import { onBeforeUnmount, onMounted, ref, shallowRef, watchEffect, type Ref } from "vue";
import type { TranslateFn } from "../i18n/i18n";
import { hasOpenModal, onModalChange } from "./modal-stack";

/**
 * The polite live region of a navigation, Navigation Bar or Sidebar: a badge
 * that appears or changes is announced once, never on mount, and while a
 * modal dialog outside the navigation is open the latest one per destination
 * waits for it to close (ADR 0016). `spoken` is what the region says; `live`
 * is the template ref for the region itself.
 */
export function useBadgeAnnouncements(
  targets: () => readonly navigationBar.NavigationTarget[],
  translate: () => TranslateFn,
): { spoken: Ref<navigationBar.BadgeAnnouncement[]>; live: Ref<HTMLElement | undefined> } {
  const announcer = navigationBar.createBadgeAnnouncer();
  const spoken = shallowRef<navigationBar.BadgeAnnouncement[]>([]);
  const live = ref<HTMLElement>();
  const blocked = () => !!live.value && hasOpenModal(live.value.ownerDocument, live.value);

  // The first run records the badges on screen; later ones announce changes.
  watchEffect(() => {
    const said = announcer.update(targets(), blocked, { translate: translate() });
    if (said.length > 0) spoken.value = said;
  });

  let stop: (() => void) | undefined;
  onMounted(() => {
    stop = onModalChange(document, () => {
      const said = announcer.release(blocked());
      if (said.length > 0) spoken.value = said;
    });
  });
  onBeforeUnmount(() => stop?.());

  return { spoken, live };
}
