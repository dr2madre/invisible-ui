import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  // Only the script (TS) needs preprocessing; our component CSS is plain and is
  // scoped by the Svelte compiler. Disabling the style step avoids a
  // vitePreprocess failure when compiling components under Vitest.
  preprocess: vitePreprocess({ style: false }),
};
