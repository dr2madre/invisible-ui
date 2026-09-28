import { describeAdapterVisuals, VISUAL_COMPONENTS } from "./visual-shared";

// The Svelte visual set, rendered by the Vue adapter on
// examples/vue/visual-vue.html. Baselines live in visual-vue.spec.ts-snapshots/,
// made in the pinned container like the Svelte ones (docs/visual-testing.md).
describeAdapterVisuals("vue", "visual-vue.html", VISUAL_COMPONENTS);
