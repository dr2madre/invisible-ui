// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";

// Deployed to GitHub Pages as a project site, served under /invisible-ui/.
export default defineConfig({
  site: "https://dr2madre.github.io",
  base: "/invisible-ui/",
  integrations: [
    starlight({
      title: "Nozca-ui",
      description:
        "A headless, accessible, multi-framework component library — docs and live demos.",
      // Design tokens + demo framing. Tokens key off [data-theme] (set by
      // Starlight) and prefers-color-scheme, so the theme toggle drives demos.
      customCss: ["./src/styles/site.css"],
      sidebar: [
        { label: "Overview", link: "/" },
        { label: "Foundations", link: "/foundations/" },
        { label: "API", link: "/api/" },
        { label: "Components", autogenerate: { directory: "components" } },
        { label: "Roadmap", link: "/roadmap/" },
        { label: "Decisions", autogenerate: { directory: "adr" } },
      ],
    }),
    svelte(),
  ],
});
