import { describeAdapterVisuals } from "./visual-shared";

// The part of the Svelte visual set the React adapter has, rendered on
// examples/vue/visual-react.html. Baselines live in
// visual-react.spec.ts-snapshots/, made in the pinned container like the
// Svelte ones (docs/visual-testing.md).
describeAdapterVisuals("react", "visual-react.html", [
  "button",
  "checkbox",
  "switch",
  "text-field",
  "select",
]);
