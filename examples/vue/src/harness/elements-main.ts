// End-to-end harness for the custom elements adapter, served by the same
// Vite app as the Vue harness. Everything here is post-mount wiring: the
// element upgrades from the declarative light-DOM markup.
import "@design-system/elements/styles.css";
import "@design-system/elements/define";
import type { DsMultiSelect } from "@design-system/elements";

const host = document.querySelector("ds-multi-select") as DsMultiSelect;
const form = document.querySelector("form") as HTMLFormElement;
const valuesReadout = document.querySelector("[data-testid='values-readout']")!;
const eventsReadout = document.querySelector("[data-testid='events-readout']")!;
const submittedReadout = document.querySelector("[data-testid='skills-readout']")!;

const renderValues = () => {
  valuesReadout.textContent = `Values: ${host.values.join(", ") || "none"}`;
};

host.addEventListener("change", (event) => {
  const detail = (event as CustomEvent<{ values: string[] }>).detail;
  eventsReadout.textContent = `Events: ${Array.isArray(detail.values) ? detail.values.join(", ") || "empty" : "not-an-array"}`;
  renderValues();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submittedReadout.textContent = `Submitted: ${new FormData(form).getAll("skills").join(", ") || "none"}`;
});

// Post-mount property assignment: a controlled reflection, no event expected.
document.querySelector("[data-testid='reflect']")!.addEventListener("click", () => {
  host.values = ["elements", "svelte"];
  renderValues();
});
