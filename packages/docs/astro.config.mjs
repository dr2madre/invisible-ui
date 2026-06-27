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
        {
          label: "Actions",
          items: [
            { label: "Button", link: "/components/button/" },
            { label: "Button Group", link: "/components/button-group/" },
            { label: "Toggle Button", link: "/components/toggle-button/" },
            { label: "Toggle Group", link: "/components/toggle-group/" },
            { label: "Close Button", link: "/components/close-button/" },
          ],
        },
        {
          label: "Forms & inputs",
          items: [
            { label: "Text Field", link: "/components/text-field/" },
            { label: "Textarea", link: "/components/textarea/" },
            { label: "Select", link: "/components/select/" },
            { label: "Combobox", link: "/components/combobox/" },
            { label: "Checkbox", link: "/components/checkbox/" },
            { label: "Checkbox Group", link: "/components/checkbox-group/" },
            { label: "Radio", link: "/components/radio/" },
            { label: "Radio Group", link: "/components/radio-group/" },
            { label: "Switch", link: "/components/switch/" },
            { label: "Segmented Control", link: "/components/segmented-control/" },
            { label: "Slider", link: "/components/slider/" },
            { label: "Rating Group", link: "/components/rating-group/" },
            { label: "PIN Input", link: "/components/pin-input/" },
            { label: "Field", link: "/components/field/" },
            { label: "Label", link: "/components/label/" },
          ],
        },
        {
          label: "Date & time",
          items: [
            { label: "Calendar", link: "/components/calendar/" },
            { label: "Date Picker", link: "/components/date-picker/" },
            { label: "Date Range Picker", link: "/components/date-range-picker/" },
            { label: "Time Field", link: "/components/time-field/" },
          ],
        },
        {
          label: "Overlays",
          items: [
            { label: "Dialog", link: "/components/dialog/" },
            { label: "Alert Dialog", link: "/components/alert-dialog/" },
            { label: "Sheet", link: "/components/sheet/" },
            { label: "Drawer", link: "/components/drawer/" },
            { label: "Popover", link: "/components/popover/" },
            { label: "Tooltip", link: "/components/tooltip/" },
            { label: "Hover Card", link: "/components/hover-card/" },
            { label: "Dropdown Menu", link: "/components/dropdown-menu/" },
            { label: "Context Menu", link: "/components/context-menu/" },
            { label: "Menubar", link: "/components/menubar/" },
            { label: "Navigation Menu", link: "/components/navigation-menu/" },
            { label: "Command", link: "/components/command/" },
          ],
        },
        {
          label: "Feedback",
          items: [
            { label: "Alert", link: "/components/alert/" },
            { label: "Notice", link: "/components/notice/" },
            { label: "Notice Region", link: "/components/notice-region/" },
            { label: "Feedback Icon", link: "/components/feedback-icon/" },
            { label: "Progress", link: "/components/progress/" },
            { label: "Meter", link: "/components/meter/" },
            { label: "Skeleton", link: "/components/skeleton/" },
            { label: "Count", link: "/components/count/" },
            { label: "Tag", link: "/components/tag/" },
          ],
        },
        {
          label: "Navigation",
          items: [
            { label: "Tabs", link: "/components/tabs/" },
            { label: "Pagination", link: "/components/pagination/" },
            { label: "Toolbar", link: "/components/toolbar/" },
            { label: "Tree View", link: "/components/tree-view/" },
            { label: "Stepper", link: "/components/stepper/" },
          ],
        },
        {
          label: "Data & layout",
          items: [
            { label: "Table", link: "/components/table/" },
            { label: "Table Set", link: "/components/table-set/" },
            { label: "Card", link: "/components/card/" },
            { label: "Avatar", link: "/components/avatar/" },
            { label: "Avatar Group", link: "/components/avatar-group/" },
            { label: "Carousel", link: "/components/carousel/" },
            { label: "Accordion", link: "/components/accordion/" },
            { label: "Collapsible", link: "/components/collapsible/" },
            { label: "Scroll Area", link: "/components/scroll-area/" },
            { label: "Aspect Ratio", link: "/components/aspect-ratio/" },
            { label: "Separator", link: "/components/separator/" },
          ],
        },
        {
          label: "Typography & media",
          items: [
            { label: "Blockquote", link: "/components/blockquote/" },
            { label: "Code", link: "/components/code/" },
            { label: "Code Block", link: "/components/code-block/" },
            { label: "Icon", link: "/components/icon/" },
          ],
        },
        {
          label: "Localization",
          items: [{ label: "Locale Provider", link: "/components/locale-provider/" }],
        },
        { label: "Roadmap", link: "/roadmap/" },
        { label: "Decisions", autogenerate: { directory: "adr" } },
      ],
    }),
    svelte(),
  ],
});
