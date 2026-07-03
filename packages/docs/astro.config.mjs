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
      title: "Invisible UI",
      description:
        "A headless, accessible, multi-framework component library — docs and live demos.",
      logo: {
        light: "./src/assets/logo.svg",
        dark: "./src/assets/logo-white.svg",
        alt: "Invisible UI",
      },
      favicon: "/favicon.svg",
      // Design tokens + demo framing. Tokens key off [data-theme] (set by
      // Starlight) and prefers-color-scheme, so the theme toggle drives demos.
      customCss: ["./src/styles/site.css"],
      sidebar: [
        { label: "Overview", link: "/" },
        { label: "Foundations", link: "/foundations/" },
        { label: "API", link: "/api/" },
        { label: "Components", link: "/components/" },
        { label: "Forms & inputs",     autogenerate: { directory: "components/forms" } },
        { label: "Date & time",        autogenerate: { directory: "components/date-time" } },
        { label: "Overlays",           autogenerate: { directory: "components/overlays" } },
        { label: "Feedback",           autogenerate: { directory: "components/feedback" } },
        { label: "Navigation",         autogenerate: { directory: "components/navigation" } },
        { label: "Data & layout",      autogenerate: { directory: "components/data-layout" } },
        { label: "Typography & media", autogenerate: { directory: "components/typography" } },
        { label: "Patterns",           autogenerate: { directory: "components/patterns" } },
        { label: "Localization",       autogenerate: { directory: "components/localization" } },
        { label: "Roadmap", link: "/roadmap/" },
        { label: "Decisions", autogenerate: { directory: "adr" } },
      ],
    }),
    svelte(),
  ],
  vite: {
    // In dev, Vite would externalize the workspace core package in SSR and let
    // Node load its dist directly — which fails, because the unbundled dist
    // uses extensionless relative imports (`./types`) that Node ESM can't
    // resolve. Forcing it through Vite's pipeline (as `astro build` already
    // does) keeps `pnpm dev` working.
    ssr: { noExternal: ["@design-system/core"] },
  },
});
