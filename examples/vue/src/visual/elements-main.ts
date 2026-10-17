// The Elements visual page: the markup is in visual-elements.html. Only what
// HTML cannot say is set here, once, before the first screenshot.
import "./theme";
import "@invisible-ui/elements/styles.css";
import "./visual.css";
import "@invisible-ui/elements/define";
import type { DsRangeSlider, DsSegmentedControl } from "@invisible-ui/elements";
import { navIcons } from "./icons";
import portrait from "./portrait.svg";

for (const host of document.querySelectorAll<DsSegmentedControl>("[data-visual-nav]")) {
  host.items = navIcons.map(({ value, label, path }) => ({ value, label, icon: path }));
}

for (const host of document.querySelectorAll<DsRangeSlider>("[data-visual-degrees]")) {
  host.format = (value) => `${value}°`;
}

document.querySelector("[data-visual-portrait]")?.setAttribute("src", portrait);
