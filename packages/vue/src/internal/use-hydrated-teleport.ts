import { onMounted, ref, type Ref } from "vue";

/**
 * Keep Teleport content in place for SSR and the first client render. Vue
 * cannot hydrate a Teleport whose target is `<body>` reliably because the body
 * also contains the application root. Moving the content only after mount
 * gives hydration identical trees, then restores the viewport-level layer.
 */
export function useHydratedTeleport(): Ref<boolean> {
  const disabled = ref(true);
  onMounted(() => {
    disabled.value = false;
  });
  return disabled;
}
