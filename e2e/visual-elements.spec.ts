import { describeAdapterVisuals, VISUAL_COMPONENTS } from "./visual-shared";

// The Svelte visual set, rendered by the custom elements on
// examples/vue/visual-elements.html. Baselines live in
// visual-elements.spec.ts-snapshots/, made in the pinned container like the
// Svelte ones (docs/visual-testing.md).
describeAdapterVisuals("elements", "visual-elements.html", VISUAL_COMPONENTS);
