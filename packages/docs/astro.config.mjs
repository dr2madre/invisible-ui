// @ts-check
import { defineConfig, passthroughImageService } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";

// Deployed to GitHub Pages as a project site, served under /invisible-ui/.
export default defineConfig({
  site: "https://dr2madre.github.io",
  base: "/invisible-ui/",
  // Serve images as-is (no build-time optimization). Avoids the native `sharp`
  // dependency — the only raster asset is the home hero cover, already export-
  // sized — so the docs build stays deterministic across local and CI.
  image: { service: passthroughImageService() },
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
        {
          label: "Components",
          items: [
            { label: "Overview", link: "/components/" },
            // Date & time components live under Forms & inputs. Pages are
            // listed by slug — add new ones here, keeping the list
            // alphabetical; radio-behavior controls nest under their group.
            {
              label: "Forms & inputs",
              items: [
                {
                  label: "Buttons",
                  items: [
                    "components/forms/button",
                    "components/forms/button-group",
                    "components/forms/icon-button",
                    "components/forms/loading-button",
                  ],
                },
                {
                  label: "Check controls",
                  items: [
                    "components/forms/checkbox",
                    "components/forms/checkbox-group",
                    "components/forms/switch",
                    "components/forms/toggle-button",
                    "components/forms/toggle-group",
                  ],
                },
                "components/forms/field",
                "components/forms/label",
                "components/forms/pin-input",
                {
                  label: "Radio controls",
                  items: [
                    "components/forms/radio",
                    "components/forms/radio-group",
                    "components/forms/rating-group",
                    "components/forms/segmented-control",
                  ],
                },
                {
                  label: "Select controls",
                  items: ["components/forms/combobox", "components/forms/select"],
                },
                "components/forms/slider",
                "components/forms/text-area",
                "components/forms/text-field",
                {
                  label: "Time",
                  items: [
                    "components/forms/calendar",
                    "components/forms/date-picker",
                    "components/forms/date-range-picker",
                    "components/forms/time-field",
                  ],
                },
                "components/forms/upload-drop-area",
              ],
            },
            {
              label: "Feedback",
              // The dialog family (ADR 0005) nests under its own group; the other
              // feedback pages are listed by slug — add new ones here, keeping the
              // list alphabetical.
              items: [
                "components/feedback/count",
                {
                  label: "Dialog and modals",
                  items: [{ autogenerate: { directory: "components/feedback/dialog" } }],
                },
                "components/feedback/error-state",
                "components/feedback/feedback-icon",
                {
                  label: "Loading",
                  items: [
                    "components/feedback/loading-generation-area",
                    "components/feedback/loading-progress",
                    "components/feedback/loading",
                    "components/feedback/skeleton",
                  ],
                },
                {
                  label: "Notification",
                  items: [
                    "components/feedback/notification",
                    "components/feedback/inline-notification",
                    "components/feedback/notification-region",
                  ],
                },
                "components/feedback/tag",
              ],
            },
            {
              label: "Data",
              // Listed by label alphabetically; behavior groups nest.
              items: [
                "components/data-layout/avatar",
                "components/data-layout/avatar-group",
                "components/data-layout/card",
                "components/data-layout/carousel",
                {
                  label: "Collapsible items",
                  items: ["components/data-layout/accordion", "components/data-layout/collapsible"],
                },
                {
                  label: "Floating",
                  items: [
                    "components/data-layout/context-menu",
                    "components/data-layout/dropdown-menu",
                    "components/data-layout/popover",
                    "components/data-layout/tooltip",
                  ],
                },
                "components/data-layout/meter",
                "components/data-layout/progress",
              ],
            },
            {
              label: "Navigation",
              items: [{ autogenerate: { directory: "components/navigation" } }],
            },
            {
              label: "Formatting & display",
              items: [{ autogenerate: { directory: "components/formatting-display" } }],
            },
          ],
        },
        {
          // Composed patterns, not base components — their own top-level section.
          // Listed alphabetically; Tables nests its two views.
          label: "Patterns",
          items: [
            "components/patterns/breadcrumb",
            "components/patterns/login-form",
            "components/patterns/menu",
            "components/patterns/menubar",
            "components/patterns/navigation-menu",
            "components/patterns/notification-center",
            "components/patterns/stepper",
            {
              label: "Tables",
              items: ["components/patterns/table", "components/patterns/table-set"],
            },
            "components/patterns/toolbar",
            "components/patterns/tree-view",
          ],
        },
        {
          // Localization is its own concern, not a component.
          label: "Localization",
          items: [{ autogenerate: { directory: "components/localization" } }],
        },
        {
          // The optional presentation layer: design tokens and layout.
          label: "Presentation",
          items: [
            { label: "Color palette", link: "/presentation/color-palette/" },
            { label: "Tokens", link: "/presentation/tokens/" },
            { label: "Layout", link: "/presentation/layout/" },
          ],
        },
        // API reference sits at the bottom. Roadmap and Decisions (ADRs) are
        // kept as internal Markdown under the repo's `docs/`, not published here.
        { label: "API", link: "/api/" },
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
